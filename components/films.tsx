import type { CSSProperties, ReactNode } from "react";
import { FILMS } from "@/lib/filmwrite-data";

const POSTERS: Record<number, { bg: string; fg: ReactNode }> = {
  1: {
    bg: "radial-gradient(ellipse at 50% 80%, oklch(60% 0.16 35 / 0.7), transparent 60%), linear-gradient(180deg, oklch(30% 0.05 25) 0%, oklch(10% 0.02 25) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "35%", top: "45%", width: "30%", height: "45%", background: "oklch(10% 0.01 30)", clipPath: "polygon(20% 100%, 25% 30%, 50% 0, 75% 30%, 80% 100%)" }} />
        <div style={{ position: "absolute", left: "45%", top: "32%", width: "10%", height: "10%", borderRadius: "50%", background: "oklch(85% 0.1 70)", filter: "blur(2px)" }} />
      </>
    ),
  },
  2: {
    bg: "linear-gradient(180deg, oklch(20% 0.04 220) 0%, oklch(10% 0.02 240) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "40%", top: "30%", width: "20%", height: "40%", border: "1px solid oklch(70% 0.15 200 / 0.7)", borderRadius: "50%", filter: "drop-shadow(0 0 16px oklch(70% 0.15 200))" }} />
        <div style={{ position: "absolute", left: "10%", right: "10%", top: "75%", height: "1px", background: "oklch(70% 0.15 200 / 0.5)" }} />
      </>
    ),
  },
  3: {
    bg: "radial-gradient(ellipse at 50% 60%, oklch(60% 0.15 25 / 0.5), transparent 70%), linear-gradient(180deg, oklch(18% 0.03 35) 0%, oklch(8% 0.01 30) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "30%", top: "55%", width: "40%", height: "5%", background: "oklch(70% 0.16 40)", filter: "blur(3px) drop-shadow(0 0 10px oklch(70% 0.16 40))" }} />
        <div style={{ position: "absolute", left: "38%", top: "40%", width: "24%", height: "28%", border: "1px solid oklch(40% 0.05 30)", borderRadius: "4px" }} />
      </>
    ),
  },
  4: {
    bg: "linear-gradient(180deg, oklch(8% 0.01 250) 0%, oklch(15% 0.02 250) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "42%", top: "32%", width: "16%", height: "50%", background: "oklch(75% 0.05 60 / 0.6)", filter: "blur(1px)" }} />
        <div style={{ position: "absolute", left: "44%", top: "32%", width: "12%", height: "50%", background: "oklch(0% 0 0 / 0.6)" }} />
      </>
    ),
  },
  5: {
    bg: "linear-gradient(180deg, oklch(40% 0.08 25) 0%, oklch(70% 0.16 50) 60%, oklch(35% 0.06 30) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "30%", top: "55%", width: "40%", height: "6%", background: "oklch(8% 0.01 30)" }} />
        <div style={{ position: "absolute", left: "48%", top: "40%", width: "4%", height: "22%", background: "oklch(8% 0.01 30)" }} />
      </>
    ),
  },
  6: {
    bg: "radial-gradient(ellipse at 70% 30%, oklch(40% 0.15 280 / 0.8) 0%, transparent 60%), linear-gradient(180deg, oklch(8% 0.02 250) 0%, oklch(2% 0.01 250) 100%)",
    fg: (
      <>
        <div style={{ position: "absolute", left: "20%", top: "40%", width: "60%", height: "20%", border: "1px solid oklch(50% 0.1 280 / 0.7)", borderRadius: "50%", transform: "rotate(-12deg)" }} />
        <div style={{ position: "absolute", left: "30%", top: "30%", width: "3px", height: "3px", borderRadius: "50%", background: "oklch(90% 0.1 70)", filter: "blur(0.5px)" }} />
        <div style={{ position: "absolute", left: "70%", top: "60%", width: "2px", height: "2px", borderRadius: "50%", background: "oklch(90% 0.05 200)", filter: "blur(0.5px)" }} />
        <div style={{ position: "absolute", left: "55%", top: "20%", width: "2px", height: "2px", borderRadius: "50%", background: "oklch(95% 0 0)" }} />
      </>
    ),
  },
};

function FilmPoster({ seed }: { seed: number }) {
  const p = POSTERS[seed] ?? POSTERS[1];
  return (
    <div style={{ position: "absolute", inset: 0, background: p.bg } as CSSProperties}>{p.fg}</div>
  );
}

export function Films() {
  return (
    <section className="section" id="films" style={{ paddingBottom: 80 }}>
      <div className="shell">
        <div className="section__head">
          <div>
            <div className="eyebrow">
              <span className="dot" />
              Generated this week
            </div>
            <h2 style={{ marginTop: 18 }}>Films made in FilmWrite</h2>
          </div>
          <p className="lede">
            Six recent shorts produced by the swarm. Each card opens the full
            timeline, agent transcripts, and source logline. None of these were
            storyboarded by a human.
          </p>
        </div>
        <div className="films">
          {FILMS.map((f) => (
            <div key={f.title} className={`film-card ${f.size}`}>
              <div className="thumb">
                <FilmPoster seed={f.seed} />
                <div className="badge">
                  {f.aspect} · {f.genre}
                </div>
              </div>
              <div className="ttl">{f.title}</div>
              <div className="log">{f.log}</div>
              <div className="meta">
                <span>
                  <b>{f.runtime}</b> runtime
                </span>
                <span>
                  <b>{f.shots}</b> shots
                </span>
                <span>
                  <b>7</b> agents
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
