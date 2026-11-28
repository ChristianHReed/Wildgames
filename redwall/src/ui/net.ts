/**
 * Direct device-to-device connections (WebRTC), set up the same way as in Wildgames.
 * Two devices swap an invite code and a reply code, either by copy and paste (works with
 * no internet when both are on one network) or through a quick word that both type,
 * which uses the free public relay ntfy.sh only to pass the two codes across.
 */
export type Link = {
  send: (msg: unknown) => void;
  /** bytes still waiting to go out */
  backlog: () => number;
  onMessage: (msg: any) => void;
  onClose: () => void;
  close: () => void;
};

const CHUNK = 12000;
const MAX_MESSAGE = 4_000_000;
const STUN = [{ urls: "stun:stun.l.google.com:19302" }];

export const canConnect = () => typeof RTCPeerConnection !== "undefined";

function b64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}

export async function packCode(kind: "offer" | "answer", sdp: string) {
  const text = JSON.stringify({ g: "redwall", k: kind, s: sdp });
  if (typeof CompressionStream !== "undefined") {
    try {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      return "Z" + b64(new Uint8Array(await new Response(stream).arrayBuffer()));
    } catch {
      /* send it uncompressed */
    }
  }
  return "P" + b64(new TextEncoder().encode(text));
}

export async function unpackCode(kind: "offer" | "answer", code: string): Promise<string> {
  const clean = String(code).replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(clean.slice(1)), (c) => c.charCodeAt(0));
  const text =
    clean[0] === "Z"
      ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text()
      : new TextDecoder().decode(bytes);
  const o = JSON.parse(text);
  if (o.g !== "redwall" || o.k !== kind || typeof o.s !== "string") throw new Error(`not a RedWall ${kind === "offer" ? "invite" : "reply"} code`);
  return o.s;
}

/** Wait until the connection has listed the ways it can be reached. */
function gathered(pc: RTCPeerConnection) {
  return new Promise<void>((done) => {
    if (pc.iceGatheringState === "complete") return done();
    const timer = setTimeout(done, 4000);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer);
        done();
      }
    });
  });
}

/** Turns an open data channel into a link carrying whole messages of any size. */
function wrap(pc: RTCPeerConnection, dc: RTCDataChannel): Link {
  let parts: string[] = [];
  let size = 0;
  let closed = false;
  const link: Link = {
    send(msg) {
      if (dc.readyState !== "open") return;
      const text = JSON.stringify(msg);
      try {
        for (let i = 0; i < text.length; i += CHUNK) dc.send((i + CHUNK < text.length ? "+" : ".") + text.slice(i, i + CHUNK));
      } catch {
        drop();
      }
    },
    backlog: () => dc.bufferedAmount,
    onMessage: () => {},
    onClose: () => {},
    close() {
      closed = true;
      try { dc.close(); pc.close(); } catch { /* already gone */ }
    },
  };
  const drop = () => {
    if (closed) return;
    link.close();
    link.onClose();
  };
  dc.onmessage = (e) => {
    const data = String(e.data);
    parts.push(data.slice(1));
    size += data.length;
    if (size > MAX_MESSAGE) return drop();
    if (data[0] === "+") return;
    const text = parts.join("");
    parts = [];
    size = 0;
    let msg: unknown;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg && typeof msg === "object") link.onMessage(msg);
  };
  dc.onclose = drop;
  // a device that vanishes without saying goodbye shows up as "disconnected": give it a while to come back
  let lost: ReturnType<typeof setTimeout> | undefined;
  pc.addEventListener("connectionstatechange", () => {
    clearTimeout(lost);
    if (pc.connectionState === "failed" || pc.connectionState === "closed") drop();
    else if (pc.connectionState === "disconnected") lost = setTimeout(drop, 12000);
  });
  // closing the page tells the other side straight away
  addEventListener("pagehide", () => link.close());
  return link;
}

/** Host side: an invite code, then the friend's reply code completes the connection. */
export async function invite(internet: boolean, onLink: (link: Link) => void) {
  const pc = new RTCPeerConnection({ iceServers: internet ? STUN : [] });
  const dc = pc.createDataChannel("redwall", { ordered: true });
  dc.onopen = () => onLink(wrap(pc, dc));
  await pc.setLocalDescription(await pc.createOffer());
  await gathered(pc);
  return {
    code: await packCode("offer", pc.localDescription!.sdp),
    accept: async (reply: string) => pc.setRemoteDescription({ type: "answer", sdp: await unpackCode("answer", reply) }),
    cancel: () => pc.close(),
  };
}

/** Friend side: turns an invite code into a reply code. */
export async function join(code: string, internet: boolean, onLink: (link: Link) => void) {
  const sdp = await unpackCode("offer", code);
  const pc = new RTCPeerConnection({ iceServers: internet ? STUN : [] });
  pc.ondatachannel = (e) => {
    const ready = () => onLink(wrap(pc, e.channel));
    if (e.channel.readyState === "open") ready();
    else e.channel.onopen = ready;
  };
  await pc.setRemoteDescription({ type: "offer", sdp });
  await pc.setLocalDescription(await pc.createAnswer());
  await gathered(pc);
  return { reply: await packCode("answer", pc.localDescription!.sdp), cancel: () => pc.close() };
}

const RELAY = "https://ntfy.sh/";

export function topicFor(word: string) {
  const w = word.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return w.length >= 4 ? `redwall-${w}` : null;
}

export async function relayPost(topic: string, title: "offer" | "answer", body: string): Promise<{ time?: number }> {
  if (body.length > 3900) throw new Error("the code is too long for a quick word; use the long code instead");
  const r = await fetch(RELAY + topic, { method: "POST", body, headers: { Title: title } });
  if (!r.ok) throw new Error(`the relay answered ${r.status}`);
  return r.json();
}

export async function relayRead(topic: string, title: "offer" | "answer"): Promise<{ time: number; message: string }[]> {
  const r = await fetch(`${RELAY}${topic}/json?poll=1&since=10m`);
  if (!r.ok) throw new Error(`the relay answered ${r.status}`);
  const out: { time: number; message: string }[] = [];
  for (const line of (await r.text()).split("\n")) {
    try {
      const m = JSON.parse(line);
      if (m.event === "message" && m.title === title) out.push(m);
    } catch {
      /* blank line */
    }
  }
  return out;
}
