"use client";

import { useState } from "react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="waitlist" id="waitlist">
      <div className="shell waitlist__inner">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          <span className="dot" />
          Closed beta · 2026
        </div>
        <h2>
          Direct the swarm.
          <br />
          <em style={{ fontStyle: "italic", color: "var(--c-shot)" }}>Get on the list.</em>
        </h2>
        <p className="lede">
          A few hundred filmmakers per month. We&apos;re letting in directors with one
          short, one feature, or one very stubborn idea.
        </p>
        <form
          className="waitlist__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) setSent(true);
          }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="director@studio.com"
            type="email"
          />
          <button type="submit">{sent ? "✓ ON THE LIST" : "JOIN WAITLIST"}</button>
        </form>
        <div className="waitlist__strip">
          <div>
            <b>2,412</b>directors waiting
          </div>
          <div>
            <b>148</b>films delivered
          </div>
          <div>
            <b>11,302</b>shots generated
          </div>
          <div>
            <b>7</b>agents on your crew
          </div>
        </div>
      </div>
    </section>
  );
}
