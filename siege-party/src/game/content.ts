export const TILE = 32;
export const SIZE = { minW: 32, maxW: 256, minH: 48, maxH: 384, w: 64, h: 96 };

/** Current map size in tiles. Change it only through setSize, then load a map of that size. */
export let COLS = SIZE.w;
export let ROWS = SIZE.h;

/** Keeps a size even (the two halves must match) and inside the limits. */
export function fitSize(w: number, h: number) {
  const fit = (v: number, lo: number, hi: number, or: number) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v / 2) * 2)) : or);
  return { w: fit(w, SIZE.minW, SIZE.maxW, SIZE.w), h: fit(h, SIZE.minH, SIZE.maxH, SIZE.h) };
}

export function setSize(w: number, h: number) {
  const s = fitSize(w, h);
  COLS = s.w;
  ROWS = s.h;
}
export const MAX_POP = 60;

export const MAX_SEATS = 5;

/** Seats 1, 2 and 4 start at the top of the map; 0 and 3 at the bottom. Seats 0 and 2 start on the left. */
export const isNorth = (p: number) => p === 1 || p === 2 || p === 4;
export const isLeft = (p: number) => p === 0 || p === 2;
export const SEATS = [
  { name: "Blue", main: "#2f9fb0", dark: "#17606c", light: "#8fe0ea" },
  { name: "Red", main: "#d4503f", dark: "#852c21", light: "#ffab9c" },
  { name: "Green", main: "#5aa83c", dark: "#33671f", light: "#b4ee94" },
  { name: "Gold", main: "#d29a1e", dark: "#855d0a", light: "#ffdc82" },
  { name: "Purple", main: "#9a5fd0", dark: "#5c3485", light: "#d9b8f7" },
] as const;

/** The four peoples a player can choose between. Each has its own look and strengths. */
export const STYLES = [
  { name: "Forest Folk", bonus: "chop wood 20% faster · ships cost 20% less" },
  { name: "Stone Holds", bonus: "buildings 20% tougher · mine stone 25% faster" },
  { name: "Horse Clans", bonus: "Folk and Riders 12% faster · Riders cost 20% less" },
  { name: "Sun Harbor", bonus: "farm and fish 20% faster · mine gold 15% faster" },
] as const;
export const STYLE = { forest: 0, stone: 1, horse: 2, sun: 3 } as const;

export const LEVELS = ["Easy", "Normal", "Hard"] as const;
/** how many places each unit takes on a transport (everyone else takes one) */
export const HOLD = 10;
export const berth = (k: string) => (k === "ram" ? 3 : 1);

export const UNIT_KINDS = ["villager", "militia", "archer", "rider", "ram", "fisher", "transport", "galley", "bombard"] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const BUILD_KINDS = ["town", "house", "farm", "barracks", "range", "tower", "palisade", "wall", "gate", "store", "stable", "workshop", "smithy", "dock"] as const;
export type BuildingKind = (typeof BUILD_KINDS)[number];

export type Res = "food" | "wood" | "gold" | "stone";
export type Cost = Partial<Record<Res, number>>;

export type UnitSpec = {
  name: string;
  cost: Cost;
  train: number;
  hp: number;
  speed: number;
  dmg: number;
  range: number;
  cd: number;
  vision: number;
  siege: number;
  carry: number;
  /** the age needed to train it: 1 Village, 2 Town, 3 Castle */
  age: number;
  /** moves on water only */
  naval?: boolean;
};

export type BuildSpec = {
  name: string;
  cost: Cost;
  build: number;
  hp: number;
  w: number;
  h: number;
  pop: number;
  vision: number;
  attack?: { dmg: number; range: number; cd: number };
  trains?: UnitKind[];
  place?: boolean;
  need?: BuildingKind;
  wall?: boolean;
  age: number;
  /** must touch water */
  shore?: boolean;
};

export const AGES = ["", "Village", "Town", "Castle"] as const;

export type TechSpec = {
  name: string;
  effect: string;
  cost: Cost;
  time: number;
  /** the building that researches it */
  at: BuildingKind;
  /** the age needed before it can be researched */
  age: number;
  /** an earlier upgrade that must come first */
  after?: TechKind;
  /** at least one of these must be finished */
  needs?: BuildingKind[];
};

export type TechKind =
  | "age2" | "age3"
  | "tools" | "cart"
  | "blades" | "blades2" | "armor" | "armor2"
  | "swords" | "longbow" | "lances"
  | "nets" | "hulls" | "fireshot";

export const TECHS: Record<TechKind, TechSpec> = {
  age2: { name: "Town age", effect: "unlocks archers, riders, galleys, stone walls", cost: { food: 300, wood: 100 }, time: 35, at: "town", age: 1, needs: ["barracks", "dock"] },
  age3: { name: "Castle age", effect: "unlocks rams, bombard ships, top upgrades", cost: { food: 450, gold: 200 }, time: 50, at: "town", age: 2, after: "age2", needs: ["smithy"] },
  tools: { name: "Tools", effect: "+30% gathering", cost: { food: 80, wood: 120 }, time: 25, at: "store", age: 1 },
  cart: { name: "Handcart", effect: "folk carry +5, walk faster", cost: { food: 120, wood: 150 }, time: 30, at: "store", age: 2, after: "tools" },
  blades: { name: "Blades", effect: "soldiers +20% attack", cost: { food: 100, gold: 80 }, time: 30, at: "smithy", age: 2 },
  blades2: { name: "Blades II", effect: "soldiers +20% more attack", cost: { food: 200, gold: 150 }, time: 40, at: "smithy", age: 3, after: "blades" },
  armor: { name: "Armor", effect: "soldiers take 20% less", cost: { food: 100, gold: 80 }, time: 30, at: "smithy", age: 2 },
  armor2: { name: "Armor II", effect: "soldiers take 20% less again", cost: { food: 200, gold: 150 }, time: 40, at: "smithy", age: 3, after: "armor" },
  swords: { name: "Swordsmen", effect: "levies +30 health, +3 attack", cost: { food: 150, gold: 100 }, time: 30, at: "barracks", age: 2 },
  longbow: { name: "Longbows", effect: "archers +1 reach, +2 attack", cost: { wood: 180, gold: 120 }, time: 35, at: "range", age: 3 },
  lances: { name: "Lancers", effect: "riders +40 health, +2 attack", cost: { food: 220, gold: 120 }, time: 35, at: "stable", age: 3 },
  nets: { name: "Big nets", effect: "boats fish 40% faster, carry +8", cost: { wood: 100, food: 50 }, time: 20, at: "dock", age: 1 },
  hulls: { name: "Oak hulls", effect: "ships +30% health", cost: { wood: 200, food: 100 }, time: 30, at: "dock", age: 2 },
  fireshot: { name: "Fire shot", effect: "warships +30% attack", cost: { wood: 150, gold: 150 }, time: 35, at: "dock", age: 3 },
};

export const UNITS: Record<UnitKind, UnitSpec> = {
  villager: {
    name: "Folk",
    cost: { food: 50 },
    train: 9,
    hp: 40,
    speed: 2.2,
    dmg: 3,
    range: 0.42,
    cd: 1.05,
    vision: 4.6,
    siege: 1,
    carry: 10,
    age: 1,
  },
  militia: {
    name: "Levy",
    cost: { food: 60, gold: 20 },
    train: 11,
    hp: 100,
    speed: 1.95,
    dmg: 9,
    range: 0.48,
    cd: 0.95,
    vision: 5.4,
    siege: 1.55,
    carry: 0,
    age: 1,
  },
  archer: {
    name: "Archer",
    cost: { food: 40, gold: 45 },
    train: 13,
    hp: 52,
    speed: 1.85,
    dmg: 8,
    range: 4.35,
    cd: 1.3,
    vision: 6.4,
    siege: 0.7,
    carry: 0,
    age: 2,
  },
  rider: {
    name: "Rider",
    cost: { food: 80, gold: 40 },
    train: 14,
    hp: 130,
    speed: 3.5,
    dmg: 10,
    range: 0.55,
    cd: 1.0,
    vision: 6.5,
    siege: 0.8,
    carry: 0,
    age: 2,
  },
  ram: {
    name: "Ram",
    cost: { wood: 160, gold: 60 },
    train: 20,
    hp: 300,
    speed: 1.25,
    dmg: 9,
    range: 0.7,
    cd: 2.0,
    vision: 4,
    siege: 9,
    carry: 0,
    age: 3,
  },
  fisher: { name: "Fishing boat", cost: { wood: 70 }, train: 10, hp: 80, speed: 2.3, dmg: 0, range: 0.5, cd: 1, vision: 5, siege: 0, carry: 15, age: 1, naval: true },
  transport: { name: "Transport", cost: { wood: 120 }, train: 14, hp: 240, speed: 2.5, dmg: 0, range: 0.5, cd: 1, vision: 5.5, siege: 0, carry: 0, age: 1, naval: true },
  galley: { name: "Galley", cost: { wood: 100, gold: 40 }, train: 14, hp: 180, speed: 2.6, dmg: 9, range: 4.5, cd: 1.2, vision: 6.8, siege: 0.7, carry: 0, age: 2, naval: true },
  bombard: { name: "Bombard ship", cost: { wood: 160, gold: 110 }, train: 22, hp: 220, speed: 1.7, dmg: 13, range: 6, cd: 2.8, vision: 6.8, siege: 5.5, carry: 0, age: 3, naval: true },
};

export const BUILDINGS: Record<BuildingKind, BuildSpec> = {
  town: {
    age: 1,
    name: "Hall",
    cost: {},
    build: 1,
    hp: 1700,
    w: 3,
    h: 3,
    pop: 5,
    vision: 8,
    attack: { dmg: 7, range: 5.1, cd: 1.05 },
    trains: ["villager"],
  },
  house: {
    age: 1,
    name: "Cottage",
    cost: { wood: 50 },
    build: 8,
    hp: 420,
    w: 2,
    h: 2,
    pop: 5,
    vision: 4,
    place: true,
  },
  farm: {
    age: 1,
    name: "Field",
    cost: { wood: 60 },
    build: 9,
    hp: 260,
    w: 2,
    h: 2,
    pop: 0,
    vision: 3.5,
    place: true,
  },
  barracks: {
    age: 1,
    name: "Barracks",
    cost: { wood: 170 },
    build: 18,
    hp: 980,
    w: 3,
    h: 2,
    pop: 0,
    vision: 5,
    place: true,
    trains: ["militia"],
  },
  range: {
    age: 2,
    name: "Range",
    cost: { wood: 150 },
    build: 18,
    hp: 860,
    w: 3,
    h: 2,
    pop: 0,
    vision: 5,
    place: true,
    need: "barracks",
    trains: ["archer"],
  },
  tower: {
    age: 2,
    name: "Tower",
    cost: { wood: 80, stone: 80 },
    build: 20,
    hp: 680,
    w: 2,
    h: 2,
    pop: 0,
    vision: 6.2,
    place: true,
    attack: { dmg: 12, range: 4.7, cd: 0.88 },
  },
  palisade: {
    age: 1,
    name: "Palisade",
    cost: { wood: 6 },
    build: 3,
    hp: 240,
    w: 1,
    h: 1,
    pop: 0,
    vision: 2.5,
    place: true,
    wall: true,
  },
  wall: {
    age: 2,
    name: "Stone wall",
    cost: { stone: 8 },
    build: 5,
    hp: 700,
    w: 1,
    h: 1,
    pop: 0,
    vision: 2.5,
    place: true,
    wall: true,
  },
  gate: {
    age: 1,
    name: "Gate",
    cost: { wood: 30 },
    build: 7,
    hp: 600,
    w: 1,
    h: 1,
    pop: 0,
    vision: 3,
    place: true,
    wall: true,
  },
  store: {
    age: 1,
    name: "Storehouse",
    cost: { wood: 80 },
    build: 10,
    hp: 500,
    w: 2,
    h: 2,
    pop: 0,
    vision: 5,
    place: true,
  },
  stable: {
    age: 2,
    name: "Stable",
    cost: { wood: 180 },
    build: 20,
    hp: 860,
    w: 3,
    h: 2,
    pop: 0,
    vision: 5,
    place: true,
    need: "barracks",
    trains: ["rider"],
  },
  workshop: {
    age: 3,
    name: "Workshop",
    cost: { wood: 200, stone: 50 },
    build: 22,
    hp: 900,
    w: 3,
    h: 2,
    pop: 0,
    vision: 5,
    place: true,
    need: "barracks",
    trains: ["ram"],
  },
  smithy: {
    age: 2,
    name: "Smithy",
    cost: { wood: 120 },
    build: 15,
    hp: 620,
    w: 2,
    h: 2,
    pop: 0,
    vision: 4,
    place: true,
  },
  dock: { age: 1, name: "Dock", cost: { wood: 120 }, build: 14, hp: 650, w: 2, h: 2, pop: 0, vision: 6, place: true, shore: true, trains: ["fisher", "transport", "galley", "bombard"] },
};

export const BUILD_MENU: { name: string; hint: string; kinds: BuildingKind[] }[] = [
  { name: "Town", hint: "homes, food, upgrades", kinds: ["house", "farm", "store", "dock", "smithy"] },
  { name: "Military", hint: "train an army", kinds: ["barracks", "range", "stable", "workshop"] },
  { name: "Defence", hint: "walls, gates, towers", kinds: ["palisade", "wall", "gate", "tower"] },
];

export const GATHER: Record<"wood" | "food" | "gold" | "stone", number> = {
  wood: 6.5,
  food: 7.5,
  gold: 5.5,
  stone: 5.5,
};

export const FARM_RATE = 4.6;
export const FISH_RATE = 6;

export const START_RES: Record<Res, number> = {
  food: 200,
  wood: 220,
  gold: 80,
  stone: 60,
};

export function costLabel(cost: Cost): string {
  const bits: string[] = [];
  if (cost.food) bits.push(`${cost.food}f`);
  if (cost.wood) bits.push(`${cost.wood}w`);
  if (cost.gold) bits.push(`${cost.gold}g`);
  if (cost.stone) bits.push(`${cost.stone}s`);
  return bits.join(" ") || "—";
}

export function canAfford(stock: Record<Res, number>, cost: Cost): boolean {
  return (Object.keys(cost) as Res[]).every((k) => stock[k] >= (cost[k] ?? 0));
}

export function pay(stock: Record<Res, number>, cost: Cost) {
  (Object.keys(cost) as Res[]).forEach((k) => {
    stock[k] -= cost[k] ?? 0;
  });
}

export function refund(stock: Record<Res, number>, cost: Cost) {
  (Object.keys(cost) as Res[]).forEach((k) => {
    stock[k] += cost[k] ?? 0;
  });
}
