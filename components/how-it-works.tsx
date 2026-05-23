import type { CSSProperties } from "react";
import { PIPELINE } from "@/lib/filmwrite-data";

export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="shell">
        <div className="section__head">
          <div>
            <div className="eyebrow">
              <span className="dot" />
              The pipeline
            </div>
            <h2 style={{ marginTop: 18 }}>
              One logline.
              <br />
              Six departments.
              <br />
              One short film.
            </h2>
          </div>
          <p className="lede">
            Each department is a small team of agents with a specific craft:
            screenwriting, blocking, generation, sound, score, and assembly. They
            hand off work between each other the way a real crew does — through
            notes, takes, and a shared timeline. You can pause and direct anywhere.
          </p>
        </div>
        <div className="pipeline">
          {PIPELINE.map((step) => (
            <div className="pipe-step" key={step.i} style={{ "--c": step.c } as CSSProperties}>
              <div className="idx">{step.i}</div>
              <div className="ttl">{step.t}</div>
              <div className="desc">{step.d}</div>
              <div className="who">{step.who}</div>
              <div className="arrow" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
