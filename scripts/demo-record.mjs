/**
 * Golden-path demo recorder.
 *
 * Launches the Studio UI, enters a logline, runs the pipeline at human
 * speed, and records the entire interaction as a WebM screencast.
 *
 * Usage:
 *   1. Start the dev server:  pnpm dev   (requires CRUSOE_API_KEY in env)
 *   2. Run this script:        node scripts/demo-record.mjs
 *
 * Requires:  npx playwright install chromium
 */

import { chromium } from "playwright";
import { readdirSync, renameSync } from "fs";

const OUT_DIR = "/tmp";
const VIDEO_PATH = `${OUT_DIR}/devnet-demo-${Date.now()}`;

const LOGLINE = "A lone astronaut discovers a bioluminescent forest on a dead moon.";
const STUDIO_URL = "http://localhost:3005/studio";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n  Recording demo to: ${VIDEO_PATH}.webm\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--window-size=1600,1000"],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    recordVideo: { dir: OUT_DIR, size: { width: 1600, height: 1000 } },
  });

  const page = await context.newPage();

  // ── 1. Navigate to Studio ──────────────────────────────────────────────
  console.log("  [1/8]  Navigating to Studio …");
  await page.goto(STUDIO_URL, { waitUntil: "networkidle" });
  await sleep(2000);

  // ── 2. Set provider to LTX-2 ───────────────────────────────────────────
  console.log("  [2/8]  Selecting LTX-2 provider …");
  const providerSelect = page.locator('select.provider-select').nth(0);
  await sleep(200);
  await providerSelect.focus();
  await sleep(200);
  await providerSelect.selectOption("fal/ltx-2");
  await sleep(600);

  // ── 3. Set duration to 15s ─────────────────────────────────────────────
  console.log("  [3/8]  Setting target duration to 15s …");
  const durationSelect = page.locator('select.provider-select').nth(3);
  await sleep(300);
  await durationSelect.focus();
  await sleep(200);
  await durationSelect.selectOption("15s");
  await sleep(600);

  // ── 4. Select all existing text in the logline input, then type ────────
  console.log("  [4/8]  Typing logline …");
  const input = page.locator('input[placeholder*="getaway driver"]');
  await input.click();
  await sleep(200);
  // Select all existing text
  await page.keyboard.press("Meta+a");
  await sleep(200);
  // Delete it
  await page.keyboard.press("Backspace");
  await sleep(300);
  // Type new logline character by character
  for (const char of LOGLINE) {
    await page.keyboard.type(char, { delay: 30 + Math.random() * 25 });
  }
  await sleep(800);

  // ── 5. Click GENERATE ──────────────────────────────────────────────────
  console.log("  [5/8]  Clicking GENERATE …");
  const genBtn = page.locator('button:has-text("GENERATE")');
  await genBtn.click();

  // ── 6. Watch pipeline live ─────────────────────────────────────────────
  console.log("  [6/8]  Pipeline running …");

  // Wait for first agent to turn WORKING
  await page.waitForSelector('.agents .status:has-text("WORKING")', { timeout: 30000 });
  await sleep(3000);

  // Wait for pipeline to finish — film player video element
  try {
    await page.waitForSelector('.film-player video', { timeout: 300_000 });
    console.log("  [7/8]  Pipeline complete — film player visible");
  } catch {
    console.log("  [7/8]  Trying download button instead …");
    await page.waitForSelector('.dl-btn', { timeout: 300_000 });
  }
  await sleep(3000);

  // ── 7. Click download ──────────────────────────────────────────────────
  console.log("  [8/8]  Clicking download …");
  const dlBtn = page.locator('.dl-btn');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await sleep(1500);
  }

  // ── 7. Close — Playwright finalises the video ──────────────────────────
  await context.close();
  await browser.close();

  // Wait for video file to be written
  await sleep(2000);

  // Rename the auto-generated video to our predictable name
  const files = readdirSync(OUT_DIR).filter((f) => f.startsWith("page@") && f.endsWith(".webm"));
  if (files.length) {
    const src = `${OUT_DIR}/${files[0]}`;
    const dst = VIDEO_PATH + ".webm";
    // Remove any 0-byte residual from a prior run
    try { renameSync(dst, dst); } catch {}
    renameSync(src, dst);
    console.log(`\n  Done — demo saved to: ${dst}\n`);
  } else {
    console.log(`\n  Done — video file not found in ${OUT_DIR}.\n    Expected a file named page@....webm\n`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
