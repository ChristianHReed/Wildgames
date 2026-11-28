/** The screens for playing from separate devices: hosting, joining and picking sides. */
import { LEVELS, MAX_SEATS, SEATS, STYLES } from "../game/content";
import type { PlayerId } from "../game/sim";
import { canConnect, invite, join, relayPost, relayRead, topicFor, type Link } from "./net";
import { VERSION } from "./sync";
import { chips, stylePicker, type Button } from "./widgets";

export type Guest = { link: Link; style: number };
export type HostPlan = { guests: Guest[]; computers: number; level: number; style: number };

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const node = document.createElement(tag);
  node.className = cls;
  node.textContent = text;
  return node;
};

function codeBox(label: string, readonly: boolean) {
  const t = el("textarea");
  t.rows = 3;
  t.readOnly = readonly;
  t.placeholder = label;
  t.setAttribute("aria-label", label);
  t.autocapitalize = "off";
  t.spellcheck = false;
  return t;
}

function wordBox(label: string) {
  const t = el("input");
  t.type = "text";
  t.placeholder = label;
  t.setAttribute("aria-label", label);
  t.autocapitalize = "off";
  t.autocomplete = "off";
  t.spellcheck = false;
  t.maxLength = 24;
  return t;
}

function copy(box: HTMLTextAreaElement, say: (s: string) => void) {
  box.select();
  const done = () => say("Copied. Send it to your friend.");
  const older = () => { try { document.execCommand("copy"); done(); } catch { say("Select the code and copy it."); } };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(box.value).then(done, older);
  else older();
}

const why = (e: unknown) => {
  const text = e instanceof Error ? e.message : String(e);
  return /fetch|network|load failed/i.test(text) ? "no connection to the relay. Are you online? The copy-and-paste codes work without it" : text;
};

/** Runs `check` every few seconds until it returns true or is stopped. */
function poll(check: () => Promise<boolean>) {
  let stopped = false;
  let busy = false;
  const timer = setInterval(async () => {
    if (busy || stopped) return;
    busy = true;
    try { if (await check()) clearInterval(timer); } catch { /* try again next time */ }
    busy = false;
  }, 2500);
  return () => { stopped = true; clearInterval(timer); };
}

export function hostLobby(button: Button, begin: (plan: HostPlan) => void, back: () => void) {
  const root = el("div", "card");
  const plan: HostPlan = { guests: [], computers: 1, level: 1, style: 0 };
  let pending: Awaited<ReturnType<typeof invite>> | null = null;
  let stopPolling = () => {};
  let word: string | null = null;
  let closed = false;

  const roster = el("div", "roster");
  const picks = el("div", "picks");
  const status = el("p", "status");
  const say = (s: string) => (status.textContent = s);
  const room = () => MAX_SEATS - 1 - plan.guests.length;
  const total = () => 1 + plan.guests.length + plan.computers;

  /** computers take the peoples nobody else chose, then repeat */
  const rows = () => {
    const out = [{ who: "You (host)", style: plan.style }, ...plan.guests.map((g, i) => ({ who: `Friend ${i + 1}`, style: g.style }))];
    const spare = [0, 1, 2, 3].filter((s) => !out.some((r) => r.style === s));
    for (let i = 0; i < plan.computers; i++) out.push({ who: "Computer", style: spare[i] ?? i % 4 });
    return out;
  };

  const startBtn = button("Start the game", () => {
    if (total() < 2) return;
    stopPolling();
    pending?.cancel();
    closed = true;
    begin(plan);
  }, "", "go");

  function refresh() {
    plan.computers = Math.max(0, Math.min(plan.computers, room()));
    const list = rows();
    roster.replaceChildren(...list.map((r, i) => {
      const line = el("div");
      line.style.borderColor = SEATS[i]!.main;
      line.textContent = `${SEATS[i]!.name}: ${r.who} · ${STYLES[r.style]!.name}`;
      return line;
    }));
    picks.replaceChildren(
      stylePicker(button, plan.style, (s) => { plan.style = s; refresh(); }),
      chips(button, "Computers", Array.from({ length: room() + 1 }, (_, i) => String(i)), plan.computers, (i) => { plan.computers = i; refresh(); }),
      chips(button, "Computer difficulty", [...LEVELS], plan.level, (i) => { plan.level = i; refresh(); }),
    );
    startBtn.classList.toggle("poor", total() < 2);
    plan.guests.forEach((g, i) => g.link.send({ t: "lobby", you: i + 1, rows: list, level: plan.level }));
  }

  function connected(link: Link) {
    if (closed || plan.guests.length >= MAX_SEATS - 1) return link.close();
    const guest: Guest = { link, style: (plan.guests.length + 1) % 4 };
    let joined = false;
    link.onMessage = (m) => {
      if (m.t === "hello" && !joined) {
        if (m.v !== VERSION) {
          link.send({ t: "nope", why: "The two devices have different versions of the game. Reload the page on both." });
          return;
        }
        joined = true;
        guest.style = (Number(m.style) | 0) & 3;
        plan.guests.push(guest);
        say("A friend joined.");
        refresh();
        // with a quick word, be ready for the next friend straight away
        if (word && room() > 0) void share(word);
      } else if (m.t === "style" && joined) {
        guest.style = (Number(m.style) | 0) & 3;
        refresh();
      }
    };
    link.onClose = () => {
      const i = plan.guests.indexOf(guest);
      if (i >= 0) {
        plan.guests.splice(i, 1);
        say("A friend left.");
        refresh();
      }
    };
    pending = null;
    codes.replaceChildren();
    say("Connecting…");
  }

  async function share(w: string) {
    const topic = topicFor(w);
    if (!topic) return say("Type a word of at least 4 letters or numbers.");
    word = w;
    stopPolling();
    pending?.cancel();
    try {
      say("Making the invite…");
      const made = (pending = await invite(true, connected));
      const posted = await relayPost(topic, "offer", made.code);
      if (closed || pending !== made) return;
      say(`"${topic.slice(10)}" is ready. Your friend types it under Join a game.`);
      stopPolling = poll(async () => {
        const answers = await relayRead(topic, "answer");
        const reply = answers.filter((a) => a.time >= (posted.time ?? 0)).pop();
        if (!reply || pending !== made) return false;
        try { await made.accept(reply.message); say("Friend found. Connecting…"); }
        catch { return false; }
        return true;
      });
    } catch (e) {
      say(`Quick word failed: ${why(e)}.`);
    }
  }

  const codes = el("div", "codes");
  async function offline() {
    word = null;
    stopPolling();
    pending?.cancel();
    if (!room()) return say("The game is full.");
    try {
      say("Making an invite code…");
      const made = (pending = await invite(false, connected));
      const mine = codeBox("Invite code", true);
      mine.value = made.code;
      const theirs = codeBox("Paste your friend's reply code here", false);
      codes.replaceChildren(
        mine,
        button("Copy invite code", () => copy(mine, say)),
        theirs,
        button("Connect", async () => {
          try { await made.accept(theirs.value); say("Connecting…"); }
          catch { say("That reply code did not work. Check that all of it was copied."); }
        }),
      );
      say("1. Send this invite code. 2. Paste the reply you get back. 3. Press Connect.");
    } catch (e) {
      say(`Could not make an invite: ${why(e)}.`);
    }
  }

  const input = wordBox("Make up a quick word");
  root.append(el("h2", "", "Host a game"), roster, picks, el("h3", "", "Invite a friend"));
  if (canConnect()) {
    root.append(input, button("Share this word", () => void share(input.value), "needs internet"),
      button("Use copy-and-paste codes", () => void offline(), "works with no internet on the same Wi-Fi"), codes, status);
  } else root.append(el("p", "", "This browser cannot connect devices directly."));
  root.append(startBtn, button("Back", () => {
    closed = true;
    stopPolling();
    pending?.cancel();
    for (const g of plan.guests) { g.link.onClose = () => {}; g.link.close(); }
    back();
  }));
  refresh();
  return root;
}

export function joinLobby(button: Button, begin: (link: Link, start: any) => void, back: () => void) {
  const root = el("div", "card");
  const status = el("p", "status");
  const say = (s: string) => (status.textContent = s);
  const roster = el("div", "roster");
  const picks = el("div", "picks");
  const codes = el("div", "codes");
  let style = 1;
  let host: Link | null = null;
  let attempt: { cancel: () => void } | null = null;
  let you: PlayerId = 1;

  const showStyle = () => picks.replaceChildren(stylePicker(button, style, (s) => {
    style = s;
    host?.send({ t: "style", style });
    showStyle();
  }));

  function connected(link: Link) {
    host = link;
    attempt = null;
    codes.replaceChildren();
    form.remove();
    say("Connected. Waiting for the host to start…");
    link.onClose = () => { host = null; roster.replaceChildren(); say("The connection to the host closed. Press Back to try again."); };
    link.onMessage = (m) => {
      if (m.t === "lobby") {
        you = m.you;
        roster.replaceChildren(...m.rows.map((r: { who: string; style: number }, i: number) => {
          const line = el("div");
          line.style.borderColor = SEATS[i]!.main;
          const who = i === you ? "You" : i === 0 ? "Host" : r.who;
          line.textContent = `${SEATS[i]!.name}: ${who} · ${STYLES[r.style]!.name}`;
          return line;
        }));
      } else if (m.t === "nope") {
        say(String(m.why));
        link.onClose = () => {};
        link.close();
      } else if (m.t === "start") begin(link, m);
    };
    link.send({ t: "hello", v: VERSION, style });
  }

  async function answer(code: string, topic: string | null) {
    attempt?.cancel();
    try {
      const made = (attempt = await join(code, !!topic, connected));
      if (topic) {
        await relayPost(topic, "answer", made.reply);
        say("Found the host. Connecting…");
        setTimeout(() => { if (!host && attempt === made) say("Still not connected. Both devices should be on the same Wi-Fi. Press Join to try again."); }, 15000);
      } else {
        const mine = codeBox("Your reply code", true);
        mine.value = made.reply;
        codes.replaceChildren(mine, button("Copy reply code", () => copy(mine, say)));
        say("Send this reply code back to the host.");
      }
    } catch (e) {
      say(topic ? `Quick word failed: ${why(e)}.` : "That invite code did not work. Check that all of it was copied.");
    }
  }

  const input = wordBox("The host's quick word");
  const paste = codeBox("Or paste an invite code here", false);
  const form = el("div", "codes");
  form.append(
    input,
    button("Join with the word", async () => {
      const topic = topicFor(input.value);
      if (!topic) return say("Type the word your host gave you.");
      try {
        say("Looking for the host…");
        const offer = (await relayRead(topic, "offer")).pop();
        if (!offer) return say("Nobody is sharing that word. Check it, and that the host pressed Share.");
        await answer(offer.message, topic);
      } catch (e) {
        say(`Quick word failed: ${why(e)}.`);
      }
    }, "needs internet", "go"),
    paste,
    button("Make a reply code", () => void answer(paste.value, null), "for copy-and-paste invites"),
  );
  root.append(el("h2", "", "Join a game"), picks, roster);
  if (canConnect()) root.append(form, codes, status);
  else root.append(el("p", "", "This browser cannot connect devices directly."));
  root.append(button("Back", () => {
    attempt?.cancel();
    if (host) { host.onClose = () => {}; host.close(); }
    back();
  }));
  showStyle();
  return root;
}
