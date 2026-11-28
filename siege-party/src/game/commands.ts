/**
 * Everything a player can do, as plain data. The same list is used by a player at this
 * screen and by one playing from another device, whose requests are checked here.
 */
import { BUILDINGS, BUILD_KINDS, SEATS, TECHS, UNIT_KINDS, AGES, type BuildingKind, type TechKind, type UnitKind } from "./content";
import {
  IDS, ageOf, commandTap, demolish, diplomacy, enlarge, research, selectGroup, setPlace, toggleHunt, toggleSentry, trainUnit, unloadSelected,
  type PlayerId, type Sim,
} from "./sim";

const GROUPS = ["folk", "host", "idle", "fleet"] as const;
export type Group = (typeof GROUPS)[number];

export type Cmd =
  | { t: "tap"; x: number; y: number }
  | { t: "build"; kind: BuildingKind | null }
  | { t: "locked"; kind: BuildingKind }
  | { t: "newline" }
  | { t: "group"; which: Group }
  | { t: "hunt" }
  | { t: "demolish" }
  | { t: "sentry" }
  | { t: "enlarge" }
  | { t: "research"; tech: TechKind }
  | { t: "train"; kind: UnitKind }
  | { t: "hall" }
  | { t: "clear" }
  | { t: "unload" }
  | { t: "ally"; who: number };

export function act(sim: Sim, p: PlayerId, c: Cmd) {
  if (sim.phase !== "play" || sim.out[p] || p >= sim.count || !c) return;
  const isBuilding = (k: unknown): k is BuildingKind => BUILD_KINDS.includes(k as BuildingKind) && !!BUILDINGS[k as BuildingKind].place;
  switch (c.t) {
    case "tap":
      if (Number.isFinite(c.x) && Number.isFinite(c.y)) commandTap(sim, p, c.x, c.y);
      break;
    case "build":
      if (c.kind === null || isBuilding(c.kind)) setPlace(sim, p, c.kind);
      break;
    case "locked": {
      if (!isBuilding(c.kind)) break;
      const spec = BUILDINGS[c.kind];
      const text = spec.age > ageOf(sim, p) ? `Reach the ${AGES[spec.age]} age at your Hall first` : spec.need ? `Build a ${BUILDINGS[spec.need].name} first` : "";
      sim.note[p] = { text, t: 2.4 };
      break;
    }
    case "newline":
      sim.anchor[p] = null;
      break;
    case "group":
      if (!GROUPS.includes(c.which)) break;
      setPlace(sim, p, null);
      selectGroup(sim, p, c.which);
      break;
    case "hunt":
      toggleHunt(sim, p);
      break;
    case "sentry":
      toggleSentry(sim, p);
      break;
    case "enlarge":
      enlarge(sim, p);
      break;
    case "demolish":
      demolish(sim, p);
      break;
    case "research":
      if (Object.hasOwn(TECHS, c.tech)) research(sim, p, c.tech);
      break;
    case "train":
      if (UNIT_KINDS.includes(c.kind)) trainUnit(sim, p, c.kind);
      break;
    case "hall": {
      const hall = sim.buildings.find((o) => o.owner === p && o.kind === "town");
      if (hall && !sim.place[p]) sim.sel[p] = { units: [], building: hall.id };
      break;
    }
    case "clear":
      setPlace(sim, p, null);
      sim.sel[p] = { units: [], building: null };
      break;
    case "unload":
      unloadSelected(sim, p);
      break;
    case "ally":
      if (IDS.includes(c.who as PlayerId) && SEATS[c.who]) diplomacy(sim, p, c.who as PlayerId);
      break;
  }
  sim.uiDirty = true;
}
