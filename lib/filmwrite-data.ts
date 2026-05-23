// Static design data ported verbatim from the FilmWrite design bundle (data.jsx).
// SHOTS live in components/studio.tsx because they carry JSX art.

export type Agent = {
  id: string;
  name: string;
  role: string;
  init: string;
  color: string;
};

export const AGENTS: Agent[] = [
  { id: "writer", name: "Mara Vex", role: "Screenwriter", init: "MV", color: "var(--c-story)" },
  { id: "director", name: "Ito Kishida", role: "Director", init: "IK", color: "var(--c-shot)" },
  { id: "dp", name: "Léa Roussel", role: "Cinematographer", init: "LR", color: "var(--c-shot)" },
  { id: "color", name: "Noor Asad", role: "Colorist", init: "NA", color: "var(--c-color)" },
  { id: "sound", name: "Tomek Bauer", role: "Sound Designer", init: "TB", color: "var(--c-sound)" },
  { id: "score", name: "Reva Okafor", role: "Composer", init: "RO", color: "var(--c-music)" },
  { id: "editor", name: "Jun Park", role: "Editor", init: "JP", color: "var(--c-edit)" },
];

export const PRESETS: string[] = [
  "A getaway driver gets one last job — but the cargo is alive.",
  "On the longest night of the year, a lighthouse keeper hears something that isn't the sea.",
  "Two strangers share a 14-hour layover and decide to invent each other.",
  "A retired magician is hired by a child to make her brother reappear.",
];

export type PipelineStep = { i: string; t: string; d: string; c: string; who: string };

export const PIPELINE: PipelineStep[] = [
  { i: "01", t: "Story", d: "Logline expands into a beat sheet, scenes, dialogue. World rules established.", c: "var(--c-story)", who: "Screenwriter" },
  { i: "02", t: "Boards", d: "Director and DP block coverage. Shot list with lens, lighting, blocking, lens.", c: "var(--c-shot)", who: "Director · DP" },
  { i: "03", t: "Generation", d: "Shots produced one at a time. Continuity passed between frames, characters, locations.", c: "var(--c-shot)", who: "Shot engine" },
  { i: "04", t: "Sound", d: "Foley, atmos, voice acting. ADR matched to mouth movement. Stems mixed.", c: "var(--c-sound)", who: "Sound Designer" },
  { i: "05", t: "Score", d: "Composer scores to picture. Theme variations per character. Stems exported.", c: "var(--c-music)", who: "Composer" },
  { i: "06", t: "Edit", d: "Editor assembles, color-grades, masters. Delivers ProRes, H.264, captions.", c: "var(--c-edit)", who: "Editor · Colorist" },
];

export type Film = {
  title: string;
  log: string;
  runtime: string;
  aspect: string;
  genre: string;
  shots: number;
  seed: number;
  size: "lg" | "sm";
};

export const FILMS: Film[] = [
  { title: "Costa, In Three Acts", log: "An estranged father teaches his daughter to drive on the day she leaves him.", runtime: "6:42", aspect: "2.39:1", genre: "Drama", shots: 38, seed: 1, size: "lg" },
  { title: "Telegraph Bay", log: "A radio operator in 1962 receives a message from a future ship.", runtime: "4:18", aspect: "1.85:1", genre: "Sci-Fi", shots: 24, seed: 2, size: "sm" },
  { title: "Halal Cart Diary", log: "Two cart vendors fall in love over six Tuesday evenings.", runtime: "5:01", aspect: "1.85:1", genre: "Romance", shots: 29, seed: 3, size: "sm" },
  { title: "The Tenant Below", log: "A new homeowner hears piano music from an apartment that doesn't exist.", runtime: "7:55", aspect: "2.39:1", genre: "Horror", shots: 41, seed: 4, size: "sm" },
  { title: "Routine, In B-Flat", log: "A jazz pianist's daily walk to work — every step scored to her own life.", runtime: "3:30", aspect: "1.66:1", genre: "Music · Vignette", shots: 21, seed: 5, size: "sm" },
  { title: "Vela", log: "A space welder, alone for 200 days, talks to her drone like it's her brother.", runtime: "8:12", aspect: "2.39:1", genre: "Sci-Fi · Drama", shots: 47, seed: 6, size: "lg" },
];
