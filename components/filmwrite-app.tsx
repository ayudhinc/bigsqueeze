"use client";

import { useEffect } from "react";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Studio } from "@/components/studio";
import { HowItWorks } from "@/components/how-it-works";
import { Films } from "@/components/films";
import { Waitlist } from "@/components/waitlist";
import { Footer } from "@/components/footer";
import {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakColor,
  TweakText,
  TweakToggle,
  type Tweaks,
} from "@/components/tweaks-panel";

const TWEAK_DEFAULTS: Tweaks = {
  accent: "#f0a04c",
  headline_lead: "A logline goes in.",
  headline_emph: "A short film comes out.",
  subhead:
    "FilmWrite is a writers' room, camera crew, sound stage, and edit bay — staffed by autonomous agents. You watch them work on a live timeline. They watch you direct.",
  projectName: "Untitled",
  showGrain: true,
};

export function FilmWriteApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty("--c-shot", tweaks.accent || "#f0a04c");
    document.documentElement.dataset.grain = tweaks.showGrain ? "on" : "off";
  }, [tweaks.accent, tweaks.showGrain]);

  return (
    <>
      <Nav />
      <Hero tweaks={tweaks} />
      <Studio tweaks={tweaks} mode="preview" />
      <HowItWorks />
      <Films />
      <Waitlist />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand">
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#f0a04c", "#e85d3c", "#7cd4c6", "#c084fc", "#fbbf24", "#f5f5f5"]}
          />
          <TweakText label="Project name" value={tweaks.projectName} onChange={(v) => setTweak("projectName", v)} />
        </TweakSection>
        <TweakSection label="Copy">
          <TweakText label="Headline · 1" value={tweaks.headline_lead} onChange={(v) => setTweak("headline_lead", v)} />
          <TweakText label="Headline · 2" value={tweaks.headline_emph} onChange={(v) => setTweak("headline_emph", v)} />
          <TweakText label="Subhead" value={tweaks.subhead} onChange={(v) => setTweak("subhead", v)} />
        </TweakSection>
        <TweakSection label="Texture">
          <TweakToggle label="Film grain" value={tweaks.showGrain} onChange={(v) => setTweak("showGrain", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}
