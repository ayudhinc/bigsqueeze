"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AGENTS, getPresets } from "@/lib/bigsqueeze-data";
import type { Tweaks } from "@/components/tweaks-panel";
import type { PipelineEvent, ShotSpec, ShotRender } from "@/lib/pipeline/types";

/* ────────────────────────────────────────────────────────────────────────────
   STUDIO — live "control room" (DAW-inspired).
   mode="demo"  → scripted simulation (landing page eye candy).
   mode="live"  → real pipeline via POST /api/direct SSE stream.
   ──────────────────────────────────────────────────────────────────────────── */

type Phase = "idle" | "planning" | "producing" | "mixing" | "editing" | "done" | "running";

type DemoShot = {
  id: string;
  code: string;
  name: string;
  desc: string;
  duration: number;
  bg: string;
  elements: ReactNode;
};

type LiveShot = {
  spec: ShotSpec;
  status: "queued" | "rendering" | "ready" | "failed";
  render?: ShotRender;
};

type LogEntry = {
  id: number;
  time: string;
  agent: { id: string; name: string; role: string; init: string; color: string };
  message: string;
  kind: "agent_start" | "agent_done" | "note" | "error" | "system";
};

const DEMO_SHOTS: DemoShot[] = [
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

const AGENT_MAP: Record<string, string> = {
  Screenwriter: "writer",
  Director: "director",
  Cinematographer: "dp",
  "Sound Designer": "sound",
  Composer: "score",
  Colorist: "color",
  Editor: "editor",
};

/* ── Shared sub-components ─────────────────────────────────────────────── */

function DemoShotFrame({ shot, scrub: _scrub = 0 }: { shot: DemoShot | null; scrub?: number }) {
  if (!shot) return null;
  return (
    <div
      className="preview__frame"
      style={{
        background: shot.bg,
      }}
    >
      {shot.elements}
    </div>
  );
}

function LiveShotFrame({ url, alt, kind }: { url: string; alt: string; kind: string }) {
  return (
    <div className="preview__frame" style={{ display: "grid", placeItems: "center", background: "#000" }}>
      {kind === "video" ? (
        <video src={url} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );
}

/* ── Main Studio ───────────────────────────────────────────────────────── */

export function Studio({ tweaks, mode = "demo" }: { tweaks: Tweaks; mode?: "demo" | "live" | "preview" }) {
  const isPreview = mode === "preview";
  const isDemo = mode === "demo";

  const [phase, setPhase] = useState<Phase>("idle");
  const [logline, setLogline] = useState("");

  /* demo-mode state */
  const [activeShotIdx, setActiveShotIdx] = useState(0);
  const [completedShots, setCompletedShots] = useState<string[]>([]);
  const [renderPct, setRenderPct] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [activeAgents, setActiveAgents] = useState<Record<string, boolean>>({});
  const [doneAgents, setDoneAgents] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tc, setTc] = useState("00:00:00:00");

  /* live-mode state */
  const [liveShots, setLiveShots] = useState<LiveShot[]>([]);
  const liveShotsRef = useRef(liveShots);
  liveShotsRef.current = liveShots;
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [filmUrl, setFilmUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState("simulated");
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("720p");
  const [targetLength, setTargetLength] = useState("5s");
  const [renders, setRenders] = useState<Array<{ file: string; url: string; size: number }>>([]);
  const [presets] = useState(() => getPresets());

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogline((l) => l || presets[0]);
    fetch("/api/renders").then((r) => r.json()).then(setRenders).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* helpers */
  function schedule(fn: () => void, ms: number) {
    timerRef.current.push(setTimeout(fn, ms));
  }

  function clearAll() {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setActiveShotIdx(0);
    setCompletedShots([]);
    setRenderPct(0);
    setPlayhead(0);
    setActiveAgents({});
    setDoneAgents({});
    setPipelineError(null);
    setLog([]);
    setFilmUrl(null);
    setLiveShots([]);
  }

  /* ── DEMO: scripted simulation ─────────────────────────────────────── */
  const startDemo = useCallback(() => {
    clearAll();
    setPhase("planning");
  }, []);

  const reset = useCallback(() => {
    clearAll();
    setPhase("idle");
  }, []);

  const addLog = useCallback((agentId: string, message: string, kind: LogEntry["kind"] = "note") => {
    const agent = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const id = ++logIdRef.current;
    setLog((prev) => [...prev, { id, time, agent, message, kind }]);
  }, []);

  /* auto-scroll log to bottom */
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  /* unmount safety: clear all timers and abort in-flight requests */
  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    };
  }, []);

  /* demo phase machine */
  useEffect(() => {
    if (isPreview || !isDemo || phase === "idle") return;

    if (phase === "planning") {
      setActiveAgents({ writer: true, director: true });
      addLog("writer", "Beat sheet drafted. 3-act structure. 6 scenes, 27 shots. Establishing character through silence in cold open.");
      schedule(() => addLog("director", "Cold open: wide on alley. Push to close on hands. Cut on movement, not action. Lens choice: 35mm anamorphic."), 2200);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, writer: true }));
        setActiveAgents((a) => ({ ...a, writer: false }));
      }, 3800);
      schedule(() => setPhase("producing"), 4800);
    }

    if (phase === "producing") {
      setActiveAgents((a) => ({ ...a, director: true, dp: true }));
      addLog("director", "Starting shot production — 9 shots planned.");
      const shotMs = 2800;
      DEMO_SHOTS.forEach((shot, i) => {
        const base = i * shotMs;
        schedule(() => {
          setActiveShotIdx(i);
          setRenderPct(0);
          addLog("dp", `Rendering ${shot.code} — ${shot.name}. ${shot.desc}`);
        }, base);
        [10, 20, 35, 50, 65, 80, 100].forEach((p, k) => {
          schedule(() => setRenderPct(p), base + 300 + k * 320);
        });
        schedule(() => {
          setCompletedShots((c) => [...c, shot.id]);
          setPlayhead(Math.min(100, ((i + 1) / DEMO_SHOTS.length) * 60));
        }, base + 2300);
      });
      const total = DEMO_SHOTS.length * shotMs;
      schedule(() => {
        setDoneAgents((d) => ({ ...d, director: true, dp: true }));
        setActiveAgents((a) => ({ ...a, director: false, dp: false }));
        setPhase("mixing");
      }, total + 400);
    }

    if (phase === "mixing") {
      setActiveAgents((a) => ({ ...a, sound: true, score: true, color: true }));
      addLog("sound", "Foley pass 1: footsteps, fabric, rain. Atmos: 6.2 stems. ADR matched to lip movement on shots 02A, 04A.");
      schedule(() => addLog("score", "Theme A in C minor. Solo cello for cold open, full strings on rooftop. 84 bpm."), 2200);
      schedule(() => setPlayhead(80), 1000);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, sound: true, score: true, color: true }));
        setActiveAgents((a) => ({ ...a, sound: false, score: false, color: false }));
        setPhase("editing");
      }, 6000);
    }

    if (phase === "editing") {
      setActiveAgents((a) => ({ ...a, editor: true }));
      addLog("editor", "Locking cut. Color grade: cool shadows, warm midtones, lifted blacks. Delivered MP4 + H.264.");
      schedule(() => setPlayhead(100), 1200);
      schedule(() => {
        setDoneAgents((d) => ({ ...d, editor: true }));
        setActiveAgents((a) => ({ ...a, editor: false }));
        setPhase("done");
      }, 4000);
    }
  }, [phase, isDemo, addLog, isPreview]);

  /* ── LIVE: real pipeline via SSE ────────────────────────────────────── */
  const startLive = useCallback(async () => {
    clearAll();
    setPhase("running");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: logline, provider, aspect, resolution, targetLength }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(trimmed.slice(6)) as PipelineEvent;
            handleEvent(event);
          } catch { /* skip malformed */ }
        }
      }
      setPhase("done");
      setActiveAgents({});
      setDoneAgents({});
    } catch (err: unknown) {
      if (ac.signal.aborted) return;
      const msg = (err as Error).message;
      setPipelineError(msg);
      setPhase("done");
      setActiveAgents({});
      setDoneAgents({});
    }
  }, [logline, provider, aspect, resolution, targetLength]);

  /* pipeline event → Studio state */
  function handleEvent(event: PipelineEvent) {
    switch (event.type) {
      case "agent": {
        const agentId = AGENT_MAP[event.agent];
        if (!agentId) break;
        if (event.status === "start") {
          setActiveAgents((a) => ({ ...a, [agentId]: true }));
          if (event.message) addLog(agentId, event.message, "agent_start");
        } else {
          setDoneAgents((d) => ({ ...d, [agentId]: true }));
          setActiveAgents((a) => ({ ...a, [agentId]: false }));
          if (event.message) addLog(agentId, event.message, "agent_done");
        }
        break;
      }
      case "treatment":
        addLog("writer", `Treatment drafted: ${event.treatment.synopsis.slice(0, 120)}`);
        break;
      case "shots":
        setLiveShots(event.shots.map((s: ShotSpec) => ({ spec: s, status: "queued" as const })));
        addLog("director", `${event.shots.length} shots planned for this treatment.`);
        break;
      case "shot": {
        setLiveShots((prev) =>
          prev.map((ls) =>
            ls.spec.id === event.shotId
              ? { ...ls, status: event.status, render: event.render ?? ls.render }
              : ls,
          ),
        );
        if (event.status === "rendering") {
          const idx = liveShotsRef.current.findIndex((ls) => ls.spec.id === event.shotId);
          if (idx >= 0) setActiveShotIdx(idx);
        }
        if (event.status === "ready") {
          setCompletedShots((c) => [...c, event.shotId]);
          setPlayhead((prev) => Math.min(100, prev + 10));
        }
        break;
      }
      case "film":
        setPhase("done");
        setFilmUrl(event.url ?? null);
        addLog("editor", "All shots complete. Master assembled.");
        setPlayhead(100);
        break;
      case "error":
        addLog("editor", `Error: ${event.message}`);
        setPipelineError(event.message);
        break;
    }
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    if (isDemo) startDemo();
    else startLive();
  }, [isPreview, isDemo, startDemo, startLive]);

  /* ── TC ticker ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isPreview) return;
    let id: ReturnType<typeof setInterval> | undefined;
    if (phase !== "idle" && phase !== "done") {
      const t0 = Date.now();
      id = setInterval(() => {
        const t = (Date.now() - t0) / 1000;
        const pad = (n: number) => String(n).padStart(2, "0");
        setTc(`${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 24))}`);
      }, 41);
    } else {
      setTc("00:00:00:00");
    }
    return () => { if (id) clearInterval(id); };
  }, [phase, isPreview]);

  /* ── derived display values ─────────────────────────────────────────── */
  const stripCells = useMemo(() => {
    if (isPreview) return [];
    if (isDemo) {
      return DEMO_SHOTS.slice(0, 8).map((s, i) => ({
        id: s.id,
        code: s.code,
        bg: s.bg,
        done: completedShots.includes(s.id),
        isCurrent: phase === "producing" && i === activeShotIdx,
        isEmpty: false,
      }));
    }
    return liveShots.map((ls, i) => ({
      id: ls.spec.id,
      code: String(i + 1).padStart(2, "0"),
      bg: "",
      done: ls.status === "ready" || ls.status === "failed",
      isCurrent: ls.status === "rendering",
      isEmpty: ls.status === "queued",
    }));
  }, [isDemo, completedShots, activeShotIdx, phase, liveShots, isPreview]);

  const shotCount = isDemo ? DEMO_SHOTS.length : liveShots.length;

  /* current preview shot */
  const demoCurrentShot = phase === "idle" ? null : DEMO_SHOTS[Math.min(activeShotIdx, DEMO_SHOTS.length - 1)];
  const liveCurrentShot = liveShots[Math.min(activeShotIdx, liveShots.length - 1)];
  const getActiveAgentName = () => {
    const id = Object.entries(activeAgents).find(([, v]) => v)?.[0];
    if (!id) return "";
    const a = AGENTS.find((x) => x.id === id);
    return a ? `${a.role} · ${a.name}` : "";
  };

  const phaseLabel = phase === "running" ? "RUNNING" : phase === "idle" ? "READY" : phase.toUpperCase();

  const stageOrder = ["planning", "producing", "mixing", "editing"] as const;
  const stageNames: Record<string, string> = {
    planning: "Story",
    producing: "Shots",
    mixing: "Mix",
    editing: "Edit",
    done: "Done",
  };
  const currentStage = stageNames[phase] || "";
  const stageIdx = stageOrder.indexOf(phase as typeof stageOrder[number]);

  return (
    <div className="studio">
      {/* CHROME */}
      <div className="studio__chrome">
          <div className="lights"><b /><b /><b /></div>
          <div className="studio__path">
            <b>Big Squeeze</b>
            <span style={{ color: "var(--text-dim)" }}>/</span>
            <em>{tweaks.projectName?.toLowerCase().replace(/\s+/g, "_") || "untitled"}</em>
            <span style={{ color: "var(--text-dim)" }}>/</span>
            <span>cut_v04.fwf</span>
          </div>
          <div className="studio__right">
            <span>{completedShots.length}/{shotCount} shots</span>
            <span>·</span>
            <span>24 fps</span>
            <select
              className="provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={phase !== "idle" && phase !== "done"}
            >
              <option value="simulated">Simulated</option>
              <option value="fal/seedance-2.0">Seedance 2.0</option>
              <option value="fal/ltx-2">LTX-2</option>
            </select>
            <span className="live-chip"><i />{currentStage || phaseLabel}
              {stageIdx >= 0 && (
                <span className="stage-dots">
                  {stageOrder.map((s, i) => (
                    <span key={s} className={`stage-dot ${i < stageIdx ? "is-past" : ""} ${i === stageIdx ? "is-current" : ""}`} />
                  ))}
                </span>
              )}
            </span>
          </div>
        </div>

      {/* TOOLBAR */}
      <div className="studio__bar">
        <div className="bar-block">
          <span className="label">Project</span>
          <div className="value"><b>{tweaks.projectName || "Untitled"}</b> · {aspect} · {resolution} · 24p</div>
          <div className="value" style={{ color: "var(--text-dim)", marginTop: 4 }}>
            Target runtime · {targetLength}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <select
              className="provider-select"
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              disabled={phase !== "idle" && phase !== "done"}
              style={{ width: "auto" }}
            >
              <option value="16:9">16:9</option>
              <option value="2.39:1">2.39:1</option>
              <option value="1.85:1">1.85:1</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="9:16">9:16</option>
            </select>
            <select
              className="provider-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              disabled={phase !== "idle" && phase !== "done"}
              style={{ width: "auto" }}
            >
              <option value="360p">360p</option>
              <option value="540p">540p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <select
              className="provider-select"
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value)}
              disabled={phase !== "idle" && phase !== "done"}
              style={{ width: "auto" }}
            >
              <option value="5s">5s</option>
              <option value="10s">10s</option>
              <option value="15s">15s</option>
              <option value="20s">20s</option>
              <option value="30s">30s</option>
              <option value="60s">60s</option>
              <option value="2min">2 min</option>
              <option value="3min">3 min</option>
              <option value="5min">5 min</option>
              <option value="10min">10 min</option>
            </select>
          </div>
        </div>
        <div className="bar-block">
          <span className="label">Logline</span>
          <form className="logline-input" onSubmit={handleSubmit}>
            <input
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="A getaway driver gets one last job — but the cargo is alive."
            />
            <button type="submit" disabled={isPreview || !logline.trim() || (phase !== "idle" && phase !== "done")}>
              {phase === "idle" || phase === "done" ? "GENERATE" : "RUNNING\u2026"}
            </button>
          </form>
          <div className="suggest">
            {presets.map((p, i) => (
              <button key={i} type="button" onClick={() => !isPreview && setLogline(p)}>
                {p.slice(0, 48)}{p.length > 48 ? "\u2026" : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="bar-block">
          <span className="label">Transport</span>
          <div className="transport">
            <span className="tc">{tc} <b>·</b> 24</span>
            <button title="Reset" type="button" onClick={reset} disabled={isPreview}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3 1L0 5l3 4V6h7V4H3z" /></svg>
            </button>
            <button className="play" title="Generate" type="button" onClick={() => isDemo ? startDemo() : startLive()} disabled={isPreview || (phase !== "idle" && phase !== "done")}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 0v10l8-5z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="studio__body">
        {/* AGENTS */}
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Agents <span className="num">{AGENTS.length}</span></span>
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
            <span className="label">
              {isDemo
                ? demoCurrentShot ? `${demoCurrentShot.code} · ${demoCurrentShot.duration}s` : "Awaiting input"
                : liveCurrentShot ? `Shot ${liveCurrentShot.spec.index + 1} · ${liveCurrentShot.spec.durationSec}s` : "Awaiting input"}
            </span>
          </div>
          <div className="preview__viewport cinebars">
            {(renderPct > 0 && renderPct < 100) && <div className="preview__sweep" style={{ clipPath: `inset(0 ${100 - renderPct}% 0 0)` }} />}
            {isDemo && demoCurrentShot && <DemoShotFrame shot={demoCurrentShot} scrub={renderPct / 100} />}
            {!isDemo && liveCurrentShot?.render && <LiveShotFrame url={liveCurrentShot.render.url} alt={liveCurrentShot.spec.description} kind={liveCurrentShot.render.kind} />}
            {!demoCurrentShot && !liveCurrentShot && (
              <div className="preview__placeholder">
                {pipelineError ? `Error: ${pipelineError}` : phase === "running" ? "— Pipeline running · waiting for first shot —" : "— No signal · paste a logline to begin —"}
              </div>
            )}
            <div className="preview__overlay">
              <div className="corners">
                <div>● REC <b>·</b> {isDemo ? (demoCurrentShot?.code || "—") : (liveCurrentShot ? String(liveCurrentShot.spec.index + 1).padStart(2, "0") : phase === "running" ? "—" : "—")}</div>
                <div>{tc}<br /><span style={{ color: "oklch(100% 0 0 / 0.5)" }}>24.000 fps</span></div>
              </div>
              <div className="bottom">
                <div>
                  <b>{isDemo ? (demoCurrentShot?.name || "—") : (liveCurrentShot?.spec.description || phase === "running" ? "Awaiting shots from director..." : "—")}</b>
                  <div style={{ opacity: 0.7, marginTop: 2 }}>
                    {isDemo ? (demoCurrentShot?.desc || "") : (liveCurrentShot ? [liveCurrentShot.spec.camera, liveCurrentShot.spec.mood].filter(Boolean).join(" · ") : phase === "running" ? getActiveAgentName() : "")}
                  </div>
                </div>
                <div className="right">
                  {(phase === "producing" || phase === "running") && (
                    <><div>render · {renderPct}%</div>
                      <div className="progress"><i style={{ width: `${renderPct}%` }} /></div>
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
                className={`cell ${c.isCurrent ? "is-current" : ""} ${c.isEmpty ? "empty" : ""} ${c.done ? "is-done" : !c.isCurrent && !c.isEmpty ? "is-pending" : ""}`}
                style={c.bg && (c.done || c.isCurrent) ? { background: c.bg } : {}}
              >
                <span className="num">{c.code}</span>
                {c.isEmpty && "—"}
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
            <div className="notes" ref={logRef}>
              {log.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                  Notes from the agent swarm will stream in here as the film is produced.
                </div>
              ) : (
                log.map((entry) => (
                  <div key={entry.id} className={`note note--${entry.kind}`} style={{ "--c": entry.agent.color } as CSSProperties}>
                    <div className="from">
                      {entry.agent.role.toUpperCase()} · {entry.agent.name}
                      <time>{entry.time}</time>
                    </div>
                    <div className="body">{entry.message}</div>
                  </div>
                ))
              )}
              {phase === "done" && (
                <div style={{ marginTop: 8 }}>
                  {pipelineError ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", letterSpacing: "0.06em" }}>
                      {'\u2717'} Pipeline error: {pipelineError}
                    </span>
                  ) : filmUrl ? (
                    <div className="film-player">
                      <video
                        src={filmUrl}
                        controls
                        style={{ width: "100%", borderRadius: 6, maxHeight: 320 }}
                      />
                      <a
                        href={filmUrl}
                        download
                        className="dl-btn"
                      >
                        {'\u2B07'} Download MP4
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--live)", letterSpacing: "0.06em" }}>
                      {'\u2713'} Master delivered · all shots complete
                    </span>
                  )}
                </div>
              )}
              {renders.length > 0 && !filmUrl && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <span className="label" style={{ display: "block", marginBottom: 6 }}>Previous renders</span>
                  {renders.slice(0, 5).map((r) => (
                    <div key={r.file} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {r.file.replace(/^film-/, "").replace(/\.mp4$/, "").slice(0, 40)}
                      </span>
                      <a href={r.url} download style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--c-shot)", textDecoration: "none" }}>
                        {'\u2B07'}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <Timeline
        isDemo={isDemo}
        phase={phase}
        completedShots={completedShots}
        activeShotIdx={activeShotIdx}
        playhead={playhead}
        shotIds={liveShots.map((ls) => ls.spec.id)}
        shotCount={shotCount}
        onSelectShot={setActiveShotIdx}
      />
    </div>
  );
}

/* ── Timeline ──────────────────────────────────────────────────────────── */

const TIMELINE_TRACKS = [
  { id: "story", name: "Story", c: "var(--c-story)" },
  { id: "v1", name: "V1 \u00B7 Shots", c: "var(--c-shot)" },
  { id: "v2", name: "V2 \u00B7 B-Roll", c: "var(--c-shot)" },
  { id: "a1", name: "A1 \u00B7 Dialogue", c: "var(--c-sound)" },
  { id: "a2", name: "A2 \u00B7 Foley", c: "var(--c-sound)" },
  { id: "a3", name: "A3 \u00B7 Score", c: "var(--c-music)" },
];

function Timeline({
  isDemo,
  phase,
  completedShots,
  activeShotIdx,
  playhead,
  shotIds,
  shotCount,
  onSelectShot,
}: {
  isDemo: boolean;
  phase: Phase;
  completedShots: string[];
  activeShotIdx: number;
  playhead: number;
  shotIds: string[];
  shotCount: number;
  onSelectShot?: (index: number) => void;
}) {
  const shotWidth = 100 / shotCount;
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
            <span className="controls"><b>M</b><b>S</b><b>R</b></span>
          </div>
          <div className="track__lane">
            {renderClips(track.id, { isDemo, phase, completedShots, activeShotIdx, shotWidth, shotCount, shotIds, onSelectShot })}
            <div className="playhead" style={{ left: `${playhead}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderClips(
  trackId: string,
  ctx: { isDemo: boolean; phase: Phase; completedShots: string[]; activeShotIdx: number; shotWidth: number; shotCount: number; shotIds: string[]; onSelectShot?: (index: number) => void },
): ReactNode[] {
  const { isDemo, phase, completedShots, activeShotIdx, shotWidth, shotCount, shotIds, onSelectShot } = ctx;
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
    const shots = isDemo
      ? DEMO_SHOTS.map((s) => ({ id: s.id, code: s.code }))
      : Array.from({ length: shotCount }, (_, i) => ({ id: shotIds[i] || `s${i}`, code: String(i + 1).padStart(2, "0") }));
    shots.forEach((s, i) => {
      const isDone = completedShots.includes(s.id);
      const isCurr = (isDemo ? phase === "producing" : phase === "running") && i === activeShotIdx;
      items.push(
        <div key={s.id} className={`clip ${isDone ? "" : isCurr ? "is-rendering" : "is-pending"}`} style={{ left: `${i * shotWidth + 0.3}%`, width: `${shotWidth - 0.6}%`, "--c": "var(--c-shot)" } as CSSProperties} onClick={() => onSelectShot?.(i)}>
          {s.code}
        </div>,
      );
    });
  }
  if (trackId === "v2") {
    const ready = phase === "mixing" || phase === "editing" || phase === "done";
    ([[12, 8], [45, 6], [70, 10], [88, 7]] as const).forEach(([l, w], i) => {
      items.push(
        <div key={i} className={`clip ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-shot)" } as CSSProperties}>B{i + 1}</div>,
      );
    });
  }
  if (trackId === "a1") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    ([[5, 14, "Dialogue 1A"], [28, 18, "Dialogue 2A"], [60, 16, "Dialogue 4A"]] as const).forEach(([l, w, n], i) => {
      items.push(
        <div key={i} className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-sound)" } as CSSProperties}>{n}</div>,
      );
    });
  }
  if (trackId === "a2") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    items.push(
      <div key="amb" className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: "0%", width: "100%", "--c": "var(--c-sound)" } as CSSProperties}>Atmos · rain · room tone</div>,
    );
  }
  if (trackId === "a3") {
    const ready = ["mixing", "editing", "done"].includes(phase);
    ([[8, 38, "Theme A · cello"], [55, 42, "Theme B · strings"]] as const).forEach(([l, w, n], i) => {
      items.push(
        <div key={i} className={`clip wave ${ready ? "" : "is-pending"}`} style={{ left: `${l}%`, width: `${w}%`, "--c": "var(--c-music)" } as CSSProperties}>{n}</div>,
      );
    });
  }
  return items;
}
