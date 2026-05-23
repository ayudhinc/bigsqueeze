import type { Tweaks } from "@/components/tweaks-panel";

export function Hero({ tweaks }: { tweaks: Tweaks }) {
  return (
    <section className="hero" id="studio">
      <div className="shell">
        <div className="hero__head">
          <div>
            <div className="eyebrow">
              <span className="dot" />
              The agent-swarm filmmaker
            </div>
            <h1 style={{ marginTop: 18 }}>
              {tweaks.headline_lead || "A logline goes in."}
              <br />
              <strong
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(180deg, var(--c-shot) 0%, oklch(58% 0.18 35) 100%)",
                  color: "transparent",
                  fontStyle: "italic",
                }}
              >
                {tweaks.headline_emph || "A short film comes out."}
              </strong>
            </h1>
            <p className="hero__sub">
              {tweaks.subhead ||
                "Big Squeeze is a writers' room, camera crew, sound stage, and edit bay — staffed by autonomous agents. You watch them work on a live timeline. They watch you direct."}
            </p>
          </div>
          <div className="hero__meta">
            <div className="row">
              <span>Input</span>
              <span>Logline · treatment · screenplay (.fdx, .fountain)</span>
            </div>
            <div className="row">
              <span>Output</span>
              <span>ProRes 422 HQ · H.264 · SRT · stems</span>
            </div>
            <div className="row">
              <span>Runtime</span>
              <span>1–10 min · 24p · up to 2.39:1</span>
            </div>
            <div className="row">
              <span>Crew</span>
              <span>7 agents · 1 director (you)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
