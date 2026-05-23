"use client";

import { Studio } from "@/components/studio";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function StudioPage() {
  return (
    <>
      <Nav />
      <main style={{ padding: "32px 0 24px" }}>
        <div className="shell">
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow">
              <span className="dot" />
              Agent-swarm filmmaker
            </div>
            <h1 style={{ marginTop: 12, fontSize: "clamp(28px, 3vw, 40px)" }}>
              Studio
            </h1>
          </div>
          <Studio tweaks={{
            accent: "#f0a04c",
            headline_lead: "",
            headline_emph: "",
            subhead: "",
            projectName: "Untitled",
            showGrain: false,
          }} />
        </div>
      </main>
      <Footer />
    </>
  );
}
