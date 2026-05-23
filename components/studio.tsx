"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AGENTS, PRESETS } from "@/lib/filmwrite-data";
import type { Tweaks } from "@/components/tweaks-panel";

/* ────────────────────────────────────────────────────────────────────────────
   STUDIO — the live "control room" (DAW-inspired), matched to the landing-page
   design system and fully responsive from 1440px down to 360px.
   ──────────────────────────────────────────────────────────────────────────── */

type Phase = "idle" | "planning" | "producing" | "mixing" | "editing" | "done";

type Shot = {
  id: string;
  code: string;
  name: string;
  desc: string;
  duration: number;
  bg: string;
  elements: ReactNode;
};

type NoteState = {
  from: { id: string; name: string; role: string; color: string };
  body: string;
  target?: string;
  time: string;
  typing: boolean;
} | null;

const SHOTS: Shot[] = [
  {
    id: "s1", code: "01A", name: "EXT. NEON ALLEY — NIGHT",
    desc: "Wide shot. Rain. Reflections in puddles. Distant siren.",
    duration: 4.2,
    bg: "radial-gradient(ellipse at 30% 70%, oklch(45% 0.2 30 / 0.9) 0%, transparent 50%), radial-gradient(ellipse at 70% 40%, oklch(55% 0.2 280 / 0.6) 0%, transparent 60%), linear-gradient(180deg, oklch(12% 0.04 280) 0%, oklch(8% 0.02 250) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 60%, oklch(0% 0 0 / 0.5))" }} />
        <div style={{ position: "absolute", left: "8%", top: "30%", bottom: "0%", width: "3px", background: "oklch(78% 0.18 45 / 0.7)", filter: "blur(0.5px) drop-shadow(0 0 12px oklch(78% 0.18 45 / 0.6))" }} />
        <div style={{ position: "absolute", right: "14%", top: "40%", bottom: "0%", width: "2px", background: "oklch(75% 0.18 280 / 0.7)", filter: "blur(0.5px) drop-shadow(0 0 12px oklch(75% 0.18 280 / 0.6))" }} />
        <div style={{ position: "absolute", left: "30%", top: "38%", bottom: "0%", width: "1px", background: "oklch(70% 0.18 30 / 0.5)" }} />
        <div style={{ position: "absolute", left: "45%", top: "50%", width: "40px", height: "60px", background: "oklch(15% 0.02 250)", opacity: 0.9 }} />
      </>
    ),
  },
  {
    id: "s2", code: "02A", name: "INT. APARTMENT — CLOSE ON HANDS",
    desc: "Close-up. Hands trembling. Cigarette ember pulses.",
    duration: 3.0,
    bg: "radial-gradient(ellipse at 50% 50%, oklch(35% 0.08 50 / 0.8) 0%, transparent 60%), linear-gradient(180deg, oklch(15% 0.03 35) 0%, oklch(8% 0.02 30) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", left: "58%", top: "42%", width: "8px", height: "8px", borderRadius: "50%", background: "oklch(75% 0.2 35)", filter: "drop-shadow(0 0 16px oklch(75% 0.2 35 / 0.9))" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 30%, oklch(0% 0 0 / 0.75) 80%)" }} />
      </>
    ),
  },
  {
    id: "s3", code: "03A", name: "EXT. ROOFTOP — DAWN",
    desc: "Silhouette against rising sun. Wide. Slow push-in.",
    duration: 5.4,
    bg: "linear-gradient(180deg, oklch(45% 0.08 25) 0%, oklch(60% 0.15 50) 35%, oklch(75% 0.18 70) 50%, oklch(30% 0.05 35) 75%, oklch(12% 0.02 30) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", left: "42%", top: "38%", width: "60px", height: "60px", borderRadius: "50%", background: "oklch(95% 0.1 80)", filter: "blur(4px) drop-shadow(0 0 30px oklch(85% 0.18 70))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "38%", background: "oklch(8% 0.01 30)", clipPath: "polygon(0 100%, 0 60%, 12% 55%, 25% 65%, 40% 50%, 45% 0%, 55% 0%, 58% 55%, 75% 50%, 100% 70%, 100% 100%)" }} />
      </>
    ),
  },
  {
    id: "s4", code: "04A", name: "INT. CAR — MOVING",
    desc: "Two-shot. Headlights sweep across faces. Tracking.",
    duration: 3.8,
    bg: "linear-gradient(180deg, oklch(10% 0.01 250) 0%, oklch(18% 0.03 240) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", left: "-20%", top: "30%", width: "40%", height: "3px", background: "oklch(85% 0.15 85 / 0.8)", filter: "blur(2px)", animation: "sweep 3s linear infinite" }} />
        <div style={{ position: "absolute", left: "25%", top: "35%", width: "22%", height: "50%", borderRadius: "40% 50% 30% 35%", background: "oklch(30% 0.04 30)", filter: "blur(1px)" }} />
        <div style={{ position: "absolute", right: "25%", top: "38%", width: "22%", height: "48%", borderRadius: "45% 35% 50% 40%", background: "oklch(28% 0.04 30)", filter: "blur(1px)" }} />
      </>
    ),
  },
  {
    id: "s5", code: "05A", name: "EXT. BEACH — GOLDEN HOUR",
    desc: "Lone figure walks toward camera. Long lens. Heat shimmer.",
    duration: 4.6,
    bg: "linear-gradient(180deg, oklch(70% 0.14 60) 0%, oklch(78% 0.18 50) 40%, oklch(55% 0.15 35) 70%, oklch(35% 0.08 25) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", left: "48%", top: "55%", width: "10px", height: "30px", background: "oklch(15% 0.01 30)", borderRadius: "40% 40% 20% 20% / 60% 60% 20% 20%" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: "oklch(40% 0.05 30 / 0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, oklch(0% 0 0 / 0.4) 0%, transparent 60%)" }} />
      </>
    ),
  },
  {
    id: "s6", code: "06A", name: "INT. SUBWAY — UNDERGROUND",
    desc: "Wide. Empty platform. Fluorescent flicker. Distant rumble.",
    duration: 4.0,
    bg: "linear-gradient(180deg, oklch(20% 0.02 200) 0%, oklch(12% 0.01 220) 100%)",
    elements: (
      <>
        <div style={{ position: "absolute", left: "20%", right: "20%", top: "30%", height: "3px", background: "oklch(85% 0.05 200)", filter: "blur(1px) drop-shadow(0 0 8px oklch(85% 0.1 200 / 0.8))", animation: "flicker 2s ease-in-out infinite" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "20%", height: "1px", background: "oklch(40% 0.04 200)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "15%", height: "1px", background: "oklch(40% 0.04 200)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, transparent 0%, oklch(0% 0 0 / 0.6) 80%)" }} />
      </>
    ),
  },
];

const TIMELINE_TRACKS = [
  { id: "story", name: "Story", c: "var(--c-story)" },
  { id: "v1", name: "V1 \u00B7 Shots", c: "var(--c-shot)" },
  { id: "v2", name: "V2 \u00B7 B-Roll", c: "var(--c-shot)" },
  { id: "a1", name: "A1 \u00B7 Dialogue", c: "var(--c-sound)" },
  { id: "a2", name: "A2 \u00B7 Foley", c: "var(--c-sound)" },
  { id: "a3", name: "A3 \u00B7 Score", c: "var(--c-music)" },
];

function ShotFrame({ shot, scrub = 0 }: { shot: Shot | null; scrub?: number }) {
  if (!shot) return null;
  return (
    <div
      className="preview__frame"
      style={{
        background: shot.bg,
        transform: `scale(${1 + scrub * 0.04})`,
        transformOrigin: "55% 50%",
        transition: "transform 0.8s ease",
      }}
    >
      {shot.elements}
    </div>
  );
}

export function Studio({ tweaks }: { tweaks: Tweaks }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [logline, setLogline] = useState("");
  const [activeShotIdx, setActiveShotIdx] = useState(0);
  const [completedShots, setCompletedShots] = useState<string[]>([]);
  const [renderPct, setRenderPct] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [activeAgents, setActiveAgents] = useState<Record<string, boolean>>({});
  const [doneAgents, setDoneAgents] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<NoteState>(null);
  const [tc, setTc] = useState("00:00:00:00");

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLogline((l) => l || PRESETS[0]);
  }, []);

  function schedule(fn: () => void, ms: number) {
    timerRef.current.push(setTimeout(fn, ms));
  }

  function clearAll() {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (typeRef.current) clearInterval(typeRef.current);
    setActiveShotIdx(0);
    setCompletedShots([]);
    setRenderPct(0);
    setPlayhead(0);
    setActiveAgents({});
    setDoneAgents({});
    setNote(null);
  }

  function start() {
    clearAll();
    setPhase("planning");
  }

  function reset() {
    clearAll();
    setPhase("idle");
  }

  function streamNote(fromId: string, body: string, delay = 0) {
    if (typeRef.current) clearInterval(typeRef.current);
    schedule(() => {
      const agent = AGENTS.find((a) => a.id === fromId) ?? AGENTS[0];
      const tStamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
      setNote({ from: agent, body: "", target: body, time: tStamp, typing: true });
      let i = 0;
      typeRef.current = setInterval(() => {
        i += Math.max(1, Math.floor(body.length / 60));
        if (i >= body.length) {
          setNote((n) => (n ? { ...n, body, typing: false } : null));
          if (typeRef.current) clearInterval(typeRef.current);
        } else {
          setNote((n) => (n ? { ...n, body: body.slice(0, i) } : null));
        }
      }, 22);
    }, delay);
  }

  useEffect(() => {
    if (phase === "idle") return;

    if (phase === "planning") {
      setActiveAgents({ writer: true, director: true });
      streamNote("writer", "Beat sheet drafted. 3-act structure. 6 scenes, 27 shots. Establishing character through silence in cold open.", 0);
      schedule(() => streamNote("director", "Cold open: wide on alley. Push to close on hands. Cut on movement, not action. Lens choice: 35mm anamorphic.", 2200), 0);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, writer: true }));
        setActiveAgents((a) => ({ ...a, writer: false }));
      }, 3800);
      schedule(() => setPhase("producing"), 4800);
    }

    if (phase === "producing") {
      setActiveAgents((a) => ({ ...a, director: true, dp: true }));
      SHOTS.forEach((shot, i) => {
        const base = i * 1900;
        schedule(() => {
          setActiveShotIdx(i);
          setRenderPct(0);
          streamNote("dp", `Rendering ${shot.code} — ${shot.name}. ${shot.desc}`, 0);
        }, base);
        [10, 25, 40, 55, 70, 85, 100].forEach((p, k) => {
          schedule(() => setRenderPct(p), base + 200 + k * 180);
        });
        schedule(() => {
          setCompletedShots((c) => [...c, shot.id]);
          setPlayhead(Math.min(100, ((i + 1) / SHOTS.length) * 60));
        }, base + 1700);
      });
      const total = SHOTS.length * 1900;
      schedule(() => {
        setDoneAgents((d) => ({ ...d, director: true, dp: true }));
        setActiveAgents((a) => ({ ...a, director: false, dp: false }));
        setPhase("mixing");
      }, total + 200);
    }

    if (phase === "mixing") {
      setActiveAgents((a) => ({ ...a, sound: true, score: true, color: true }));
      streamNote("sound", "Foley pass 1: footsteps, fabric, rain. Atmos: 6.2 stems. ADR matched to lip movement on shots 02A, 04A.", 0);
      schedule(() => streamNote("score", "Theme A in C minor. Solo cello for cold open, full strings on rooftop. 84 bpm.", 2200), 0);
      schedule(() => setPlayhead(80), 1000);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, sound: true, score: true, color: true }));
        setActiveAgents((a) => ({ ...a, sound: false, score: false, color: false }));
        setPhase("editing");
      }, 4800);
    }

    if (phase === "editing") {
      setActiveAgents((a) => ({ ...a, editor: true }));
      streamNote("editor", "Locking cut. Color grade: cool shadows, warm midtones, lifted blacks. Delivered ProRes 422 HQ + H.264.", 0);
      schedule(() => setPlayhead(100), 1200);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, editor: true }));
        setActiveAgents((a) => ({ ...a, editor: false }));
        setPhase("done");
      }, 3200);
    }
  }, [phase]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (phase !== "idle") {
      const t0 = Date.now();
      id = setInterval(() => {
        const t = (Date.now() - t0) / 1000;
        const pad = (n: number) => String(n).padStart(2, "0");
        setTc(`${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 24))}`);
      }, 41);
    } else {
      setTc("00:00:00:00");
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [phase]);

  const stripCells = useMemo(
    () =>
      SHOTS.slice(0, 8).map((s, i) => ({
        ...s,
        done: completedShots.includes(s.id),
        isCurrent: phase === "producing" && i === activeShotIdx,
      })),
    [completedShots, activeShotIdx, phase],
  );

  const currentShot = phase === "idle" ? null : SHOTS[Math.min(activeShotIdx, SHOTS.length - 1)];

  return (
    <div className="studio">
      {/* CHROME */}
      <div className="studio__chrome">
        <div className="lights">
          <b />
          <b />
          <b />
        </div>
        <div className="studio__path">
          <b>FilmWrite</b>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <em>{tweaks.projectName?.toLowerCase().replace(/\s+/g, "_") || "untitled"}</em>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span>cut_v04.fwf</span>
        </div>
        <div className="studio__right">
          <span>
            {stripCells.filter((c) => c.done).length}/{SHOTS.length} shots
          </span>
          <span>·</span>
          <span>24 fps</span>
          <span className="live-chip">
            <i />
            {phase === "idle" ? "READY" : phase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="studio__bar">
        <div className="bar-block">
          <span className="label">Project</span>
          <div className="value">
            <b>{tweaks.projectName || "Untitled"}</b> · 16:9 · 24p
          </div>
          <div className="value" style={{ color: "var(--text-dim)", marginTop: 4 }}>
            Target runtime · 4–6 min
          </div>
        </div>
        <div className="bar-block">
          <span className="label">Logline</span>
          <form
            className="logline-input"
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <input
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="A getaway driver gets one last job — but the cargo is alive."
            />
            <button type="submit" disabled={!logline.trim() || (phase !== "idle" && phase !== "done")}>
              {phase === "idle" || phase === "done" ? "GENERATE" : "RUNNING\u2026"}
            </button>
          </form>
          <div className="suggest">
            {PRESETS.map((p, i) => (
              <button key={i} type="button" onClick={() => setLogline(p)}>
                {p.slice(0, 48)}
                {p.length > 48 ? "\u2026" : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="bar-block">
          <span className="label">Transport</span>
          <div className="transport">
            <span className="tc">
              {tc} <b>·</b> 24
            </span>
            <button title="Reset" type="button" onClick={reset}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M3 1L0 5l3 4V6h7V4H3z" />
              </svg>
            </button>
            <button className="play" title="Generate" type="button" onClick={start} disabled={phase !== "idle" && phase !== "done"}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 0v10l8-5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="studio__body">
        {/* AGENTS */}
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">
              Agents <span className="num">{AGENTS.length}</span>
            </span>
            <span className="label">Swarm</span>
          </div>
          <div className="panel__body">
            <div className="agents">
              {AGENTS.map((a) => {
                const isActive = !!activeAgents[a.id];
                const isDone = !!doneAgents[a.id];
                return (
                  <div
                    key={a.id}
                    className={`agent ${isActive ? "is-active" : ""} ${isDone && !isActive ? "is-done" : ""}`}
                    style={{ "--c": a.color } as CSSProperties}
                  >
                    <div className="avatar">{a.init}</div>
                    <div>
                      <div className="name">{a.name}</div>
                      <div className="role">{a.role}</div>
                    </div>
                    <div className="status">{isActive ? "WORKING" : isDone ? "DONE" : "IDLE"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="panel preview">
          <div className="panel__head" style={{ background: "oklch(10% 0.01 250)" }}>
            <span className="panel__title">Preview · Program</span>
            <span className="label">{currentShot ? `${currentShot.code} · ${currentShot.duration}s` : "Awaiting input"}</span>
          </div>
          <div className="preview__viewport cinebars">
            {currentShot && <ShotFrame shot={currentShot} scrub={renderPct / 100} />}
            {!currentShot && <div className="preview__placeholder">— No signal · paste a logline to begin —</div>}
            <div className="preview__overlay">
              <div className="corners">
                <div>
                  ● REC <b>·</b> {currentShot ? currentShot.code : "—"}
                </div>
                <div>
                  {tc}
                  <br />
                  <span style={{ color: "oklch(100% 0 0 / 0.5)" }}>24.000 fps</span>
                </div>
              </div>
              <div className="bottom">
                <div>
                  <b>{currentShot ? currentShot.name : "—"}</b>
                  <div style={{ opacity: 0.7, marginTop: 2 }}>{currentShot ? currentShot.desc : ""}</div>
                </div>
                <div className="right">
                  {phase === "producing" && (
                    <>
                      <div>render · {renderPct}%</div>
                      <div className="progress">
                        <i style={{ width: `${renderPct}%` }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="preview__strip">
            {stripCells.map((c) => (
              <div
                key={c.id}
                className={`cell ${c.isCurrent ? "is-current" : ""} ${!c.done && !c.isCurrent ? "empty" : ""}`}
                style={c.done || c.isCurrent ? { background: c.bg } : {}}
              >
                <span className="num">{c.code}</span>
                {!c.done && !c.isCurrent && "—"}
              </div>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Director&apos;s Notes</span>
            <span className="label">Live</span>
          </div>
          <div className="panel__body">
            <div className="notes">
              {!note && (
                <div style={{ color: "var(--text-dim)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                  Notes from the agent swarm will stream in here as the film is produced.
                </div>
              )}
              {note && (
                <div className="note" style={{ "--c": note.from.color } as CSSProperties}>
                  <div className="from">
                    {note.from.role.toUpperCase()} · {note.from.name}
                    <time>{note.time}</time>
                  </div>
                  <div className="body">
                    {note.body}
                    {note.typing && <span className="cursor" />}
                  </div>
                </div>
              )}
              {phase === "done" && (
                <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--live)", letterSpacing: "0.06em" }}>
                  ✓ Master delivered · cut_v04.mp4 · 432 MB · 5:08
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <Timeline phase={phase} completedShots={completedShots} activeShotIdx={activeShotIdx} playhead={playhead} />
    </div>
  );
}

function Timeline({
  phase,
  completedShots,
  activeShotIdx,
  playhead,
}: {
  phase: Phase;
  completedShots: string[];
  activeShotIdx: number;
  playhead: number;
}) {
  const shotWidth = 100 / SHOTS.length;
  const ticks = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="timeline">
      <div className="timeline__ruler">
        <div className="gutter">00:00:00 — 00:05:08</div>
        <div className="ticks">
          {ticks.map((i) => (
            <span key={i} style={{ left: `${i * 10}%` }}>
              {`${String(Math.floor((i * 30.8) / 60)).padStart(2, "0")}:${String(Math.floor((i * 30.8) % 60)).padStart(2, "0")}`}
            </span>
          ))}
        </div>
      </div>
      {TIMELINE_TRACKS.map((track) => (
        <div className="track" key={track.id}>
          <div className="track__head" style={{ "--c": track.c } as CSSProperties}>
            <span className="swatch" />
            <span className="name">{track.name}</span>
            <span className="controls">
              <b>M</b>
              <b>S</b>
              <b>R</b>
            </span>
          </div>
          <div className="track__lane">
            {renderClips(track.id, { phase, completedShots, activeShotIdx, shotWidth })}
            <div className="playhead" style={{ left: `${playhead}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderClips(
  trackId: string,
  ctx: { phase: Phase; completedShots: string[]; activeShotIdx: number; shotWidth: number },
): ReactNode[] {
  const { phase, completedShots, activeShotIdx, shotWidth } = ctx;
  const items: ReactNode[] = [];

  if (trackId === "story") {
    if (phase !== "idle") {
      items.push(
        <div key="ss" className="clip" style={{ left: "0%", width: "33%", "--c": "var(--c-story)" } as CSSProperties}>Act I · Cold Open</div>,
        <div key="sm" className="clip" style={{ left: "33%", width: "34%", "--c": "var(--c-story)" } as CSSProperties}>Act II · Pursuit</div>,
        <div key="se" className="clip" style={{ left: "67%", width: "33%", "--c": "var(--c-story)" } as CSSProperties}>Act III · Resolution</div>,
      );
    }
  }
  if (trackId === "v1") {
    SHOTS.forEach((s, i) => {
      const isDone = completedShots.includes(s.id);
      const isCurr = phase === "producing" && i === activeShotIdx;
      items.push(
        <div key={s.id} className={`clip ${isDone ? "" : isCurr ? "is-rendering" : "is-pending"}`} style={{ left: `${i * shotWidth + 0.3}%`, width: `${shotWidth - 0.6}%`, "--c": "var(--c-shot)" } as CSSProperties}>
          {s.code}
        </div>,
      );
    });
  }
  if (trackId === "v2") {
    const ready = phase === "mixing" || phase === "editing" || phase === "done";
    ([[12, 8], [45, 6], [70, 10], [88, 7]] as const).forEach(([l, w], i) => {
      items.push(
        <div key={i} className={`clip ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-shot)" } as CSSProperties}>
          B{i + 1}
        </div>,
      );
    });
  }
  if (trackId === "a1") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    ([[5, 14, "Dialogue 1A"], [28, 18, "Dialogue 2A"], [60, 16, "Dialogue 4A"]] as const).forEach(([l, w, n], i) => {
      items.push(
        <div key={i} className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-sound)" } as CSSProperties}>
          {n}
        </div>,
      );
    });
  }
  if (trackId === "a2") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    items.push(
      <div key="amb" className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: "0%", width: "100%", "--c": "var(--c-sound)" } as CSSProperties}>
        Atmos · rain · room tone
      </div>,
    );
  }
  if (trackId === "a3") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    ([[8, 38, "Theme A · cello"], [55, 42, "Theme B · strings"]] as const).forEach(([l, w, n], i) => {
      items.push(
        <div key={i} className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-music)" } as CSSProperties}>
          {n}
        </div>,
      );
    });
  }
  return items;
}
