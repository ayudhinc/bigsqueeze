import { z } from "zod";
import type { Treatment, ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";

interface RawShot {
  description: string;
  durationSec: number;
  camera: string;
  mood: string;
}

const CAMERAS = [
  "wide establishing",
  "slow push-in",
  "low-angle tracking",
  "intimate close-up",
  "overhead",
  "handheld follow",
];
const MOODS = ["serene", "tense", "wondrous", "melancholic", "triumphant", "eerie"];

function parseTargetLength(val: string): number {
  const m = val.match(/^(\d+)(?:s|min)?$/);
  if (!m) return 30;
  const n = parseInt(m[1], 10);
  return val.includes("min") ? n * 60 : n;
}

function idealShotCount(totalSec: number): { min: number; max: number } {
  if (totalSec <= 10) return { min: 1, max: 2 };
  if (totalSec <= 30) return { min: 2, max: 4 };
  if (totalSec <= 60) return { min: 3, max: 6 };
  return { min: 4, max: 8 };
}

/** Shot Designer agent: treatment → ordered, filmable shot list. */
export async function breakIntoShots(treatment: Treatment, targetLength = "30s"): Promise<ShotSpec[]> {
  const totalTarget = parseTargetLength(targetLength);
  const countRange = idealShotCount(totalTarget);
  let raw: RawShot[];

  if (hasLLM()) {
    const schema = z.object({
      shots: z.array(z.object({
        description: z.string(),
        durationSec: z.number().min(2).max(10),
        camera: z.string(),
        mood: z.string(),
      })).min(countRange.min).max(countRange.max),
    });
    const out = await genObject(
      schema,
      `Break this treatment into ${countRange.min}-${countRange.max} filmable shots for an AI video model.\nEach shot: a vivid one-sentence visual description, a duration (2-10s), a camera move, and a mood.\n\nTotal target runtime is ~${totalTarget}s, so make sure the sum of shot durations stays close to that.\n\nLogline: ${treatment.logline}\nSynopsis: ${treatment.synopsis}\nBeats:\n${treatment.beats.map((b, i) => `${i + 1}. ${b}`).join("\n")}`,
      "You are a cinematographer planning coverage. Each shot must be self-contained and visual.",
      "director",
    );
    raw = out.shots;
  } else {
    const beats = treatment.beats;
    const n = Math.min(beats.length, countRange.max);
    const step = Math.max(1, Math.floor(beats.length / n));
    raw = [];
    for (let i = 0; i < n; i++) {
      const beat = beats[Math.min(i * step, beats.length - 1)];
      raw.push({
        description: beat,
        durationSec: 5,
        camera: CAMERAS[i % CAMERAS.length],
        mood: MOODS[i % MOODS.length],
      });
    }
  }

  const totalRaw = raw.reduce((s, x) => s + x.durationSec, 0);
  const factor = totalTarget / totalRaw;

  return raw.map((s, i) => ({
    id: `shot-${i + 1}`,
    index: i,
    description: s.description,
    durationSec: Math.max(2, Math.min(60, Math.round(s.durationSec * factor))),
    camera: s.camera,
    mood: s.mood,
  }));
}
