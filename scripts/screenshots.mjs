#!/usr/bin/env node
// Regenerates the README screenshots in docs/screenshots/.
//
//   go run . -addr 127.0.0.1:8099 &          # start the site
//   node scripts/screenshots.mjs              # needs Node 22+ and Google Chrome / Chromium
//
// Environment: SITE (default http://127.0.0.1:8099), CHROME (path to the browser binary).
// The page is rendered with "prefers-reduced-motion: reduce", which makes every lab run its
// simulation forward before drawing, so the screenshots show complete trajectories.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.SITE || "http://127.0.0.1:8099";
const CHROME = process.env.CHROME || "google-chrome";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "screenshots");
const PORT = 9333;

// name, path, viewport [w, h], optional: selector to clip to, dark theme
const SHOTS = [
  { name: "home-en", path: "/en/", vp: [1400, 900], full: 1700 },
  { name: "chapter-en", path: "/en/chapter/4", vp: [1400, 900] },
  { name: "lab-ch4-lyapunov", path: "/en/chapter/4", vp: [1400, 900], sel: '[data-lab="ch4-ex44"]' },
  { name: "lab-ch4-roa-estimate", path: "/en/chapter/4", vp: [1400, 900], sel: '[data-lab="ch4-ex45"]' },
  { name: "lab-ch4-robot-dog", path: "/en/chapter/4", vp: [1400, 900], sel: '[data-lab="ch4-dog"]' },
  { name: "lab-ch2-pendulum", path: "/en/chapter/2", vp: [1400, 900], sel: '[data-lab="ch2-pend"]' },
  { name: "lab-ch1-tunnel-diode", path: "/en/chapter/1", vp: [1400, 900], sel: '[data-lab="ch1-tunnel"]' },
  { name: "lab-ch7-circle-criterion", path: "/en/chapter/7", vp: [1400, 900], sel: '[data-lab="ch7-circle"]' },
  { name: "lab-ch8-region-of-attraction", path: "/en/chapter/8", vp: [1400, 900], sel: '[data-lab="ch8-roa"]' },
  { name: "lab-ch14-sliding-mode-dark", path: "/en/chapter/14", vp: [1400, 900], sel: '[data-lab="ch14-smc"]', dark: true },
  { name: "home-dark", path: "/en/", vp: [1400, 900], dark: true },
  { name: "mobile-en", path: "/en/chapter/2", vp: [390, 844], mobile: true, scrollTo: '[data-lab="ch2-linear"]' }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), "nlc-shots-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === "page"); }
      catch { await sleep(200); }
    }
    if (!target) throw new Error("could not connect to Chrome on port " + PORT);
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0;
    const pending = new Map();
    const events = [];
    ws.onmessage = m => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); }
      else if (msg.method) events.push(msg.method);
    };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

    await send("Page.enable");
    await send("Runtime.enable");

    for (const s of SHOTS) {
      const [w, h] = s.vp;
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: s.mobile ? 2 : 1.5, mobile: !!s.mobile });
      await send("Emulation.setEmulatedMedia", { features: [
        { name: "prefers-color-scheme", value: s.dark ? "dark" : "light" },
        { name: "prefers-reduced-motion", value: "reduce" }
      ] });
      events.length = 0;
      await send("Page.navigate", { url: SITE + s.path });
      for (let i = 0; i < 100 && !events.includes("Page.loadEventFired"); i++) await sleep(100);
      // wait for web fonts and MathJax typesetting, then let the labs resize and redraw
      await evaluate(`(async () => { await document.fonts.ready; if (window.MathJax && MathJax.startup) await MathJax.startup.promise; })()`);
      await sleep(1200);

      let clip;
      if (s.sel) {
        clip = await evaluate(`(() => {
          const el = document.querySelector('${s.sel}').closest('figure') || document.querySelector('${s.sel}');
          el.scrollIntoView({ block: 'start' });
          const r = el.getBoundingClientRect();
          return { x: r.left + scrollX - 12, y: r.top + scrollY - 12, width: r.width + 24, height: r.height + 24, scale: 1 };
        })()`);
      } else if (s.scrollTo) {
        clip = await evaluate(`(() => {
          const r = document.querySelector('${s.scrollTo}').closest('figure').getBoundingClientRect();
          return { x: 0, y: r.top + scrollY - 140, width: ${w}, height: ${h}, scale: 1 };
        })()`);
      } else {
        clip = { x: 0, y: 0, width: w, height: s.full || h, scale: 1 };
      }
      await sleep(400);
      const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
      writeFileSync(join(OUT, s.name + ".png"), Buffer.from(shot.data, "base64"));
      console.log("saved", s.name + ".png");
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
