/** Small pieces shared by the home page and the lobby. */
import { STYLES } from "../game/content";

export type Button = (label: string, fn: () => void, sub?: string, cls?: string) => HTMLButtonElement;

/** A labelled row where exactly one choice is lit. */
export function chips(button: Button, label: string, names: string[], on: number, pick: (i: number) => void) {
  const box = document.createElement("div");
  box.className = "chips";
  const title = document.createElement("h3");
  title.textContent = label;
  const row = document.createElement("div");
  // many choices wrap onto two rows
  if (names.length > 6) row.className = "wrap";
  row.append(...names.map((n, i) => button(n, () => pick(i), "", i === on ? "on" : "")));
  box.append(title, row);
  return box;
}

export function stylePicker(button: Button, on: number, pick: (i: number) => void, label = "Your people") {
  const box = document.createElement("div");
  box.className = "styles";
  const title = document.createElement("h3");
  title.textContent = label;
  const grid = document.createElement("div");
  grid.append(...STYLES.map((s, i) => button(s.name, () => pick(i), "", i === on ? "on" : "")));
  const bonus = document.createElement("p");
  bonus.textContent = STYLES[on]!.bonus;
  box.append(title, grid, bonus);
  return box;
}
