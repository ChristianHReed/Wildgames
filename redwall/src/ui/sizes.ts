type Size = { w: number; h: number };
type Ui = {
  button: (label: string, fn: () => void, sub?: string, cls?: string) => HTMLButtonElement;
  limits: { minW: number; maxW: number; minH: number; maxH: number };
  current: () => Size;
  choose: (w: number, h: number) => void;
};

const PRESETS: [string, number, number][] = [
  ["Tiny", 32, 48],
  ["Small", 48, 72],
  ["Large", 64, 96],
  ["Huge", 96, 144],
  ["Giant", 128, 192],
  ["Vast", 192, 288],
  ["Colossal", 256, 384],
];

/** Map size controls for the home page: presets, or any width and height. */
export function sizePicker({ button, limits, current, choose }: Ui) {
  const root = document.createElement("div");
  root.className = "sizes";
  const title = document.createElement("h3");
  const presets = document.createElement("div");
  presets.className = "presets";
  const note = document.createElement("p");
  const rows: (() => void)[] = [];

  const refresh = () => {
    const s = current();
    title.textContent = `Map size: ${s.w} wide × ${s.h} long`;
    PRESETS.forEach(([, w, h], i) => presets.children[i]!.classList.toggle("on", w === s.w && h === s.h));
    const times = (s.w * s.h) / (64 * 96);
    note.textContent = `${(s.w * s.h).toLocaleString()} tiles${times === 1 ? "" : ` (${+times.toFixed(times < 1 ? 2 : 1)}× Large)`}. Length is the distance between the two ends.${s.w * s.h > 128 * 192 ? " Sizes past Giant are meant for newer tablets and computers." : ""}`;
    for (const r of rows) r();
  };
  const set = (w: number, h: number) => {
    choose(w, h);
    refresh();
  };

  for (const [name, w, h] of PRESETS) presets.append(button(name, () => set(w, h), `${w}×${h}`));
  root.append(title, presets);

  for (const [name, key, lo, hi] of [
    ["Width", "w", limits.minW, limits.maxW],
    ["Length", "h", limits.minH, limits.maxH],
  ] as const) {
    const row = document.createElement("div");
    row.className = "dim";
    const label = document.createElement("span");
    label.textContent = name;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(lo);
    slider.max = String(hi);
    slider.step = "2";
    slider.setAttribute("aria-label", `Map ${name.toLowerCase()}`);
    const value = document.createElement("output");
    const to = (v: number) => {
      const s = { ...current(), [key]: v };
      set(s.w, s.h);
    };
    // show the number while sliding; rebuild the map when the finger lifts
    slider.addEventListener("input", () => (value.textContent = slider.value));
    slider.addEventListener("change", () => to(Number(slider.value)));
    row.append(label, button("−", () => to(current()[key] - 2)), slider, button("+", () => to(current()[key] + 2)), value);
    rows.push(() => {
      slider.value = String(current()[key]);
      value.textContent = slider.value;
    });
    root.append(row);
  }
  root.append(note);
  refresh();
  return root;
}
