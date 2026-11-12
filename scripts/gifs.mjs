#!/usr/bin/env node
// Records the animated README demos in docs/gifs/.
//
//   go run . -addr 127.0.0.1:8099 &
//   node scripts/gifs.mjs                    # needs Node 22+, Google Chrome / Chromium and ffmpeg
//
// Each demo opens a chapter page, scrolls to one lab, then plays a short script of
// clicks and slider moves while frames are captured in real time.
// Environment: SITE (default http://127.0.0.1:8099), CHROME (browser binary), FFMPEG.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.SITE || "http://127.0.0.1:8099";
const CHROME = process.env.CHROME || "google-chrome";
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "gifs");
const PORT = 9334;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Actions run inside the page. `lab` is the lab element.
const clickPhase = (fx, fy) => `(() => { const c = lab.querySelector('.p-phase canvas'), r = c.getBoundingClientRect();
  c.dispatchEvent(new MouseEvent('click', { clientX: r.left + ${fx} * r.width, clientY: r.top + ${fy} * r.height, bubbles: true })); })()`;
const clickButton = text => `(() => { [...lab.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(${JSON.stringify(text)})).click(); })()`;
const setSlider = (i, v) => `(() => { const s = lab.querySelectorAll('.lab-controls input[type=range]')[${i}]; s.value = ${v}; s.dispatchEvent(new Event('input', { bubbles: true })); })()`;

const DEMOS = [
  {
    name: "pendulum-bifurcation-fa", path: "/fa/chapter/2", lab: "ch2-pend", seconds: 10,
    actions: [
      [1.2, clickPhase(0.62, 0.12)],
      [2.6, clickPhase(0.3, 0.85)],
      // sweep the torque T up past a: the equilibria merge and vanish
      ...Array.from({ length: 16 }, (_, k) => [4 + k * 0.25, setSlider(2, (0.1 * (k + 1)).toFixed(2))])
    ]
  },
  {
    name: "robot-dog", path: "/en/chapter/4", lab: "ch4-dog", seconds: 12,
    actions: [
      [1.5, clickButton("Push the dog")],
      [3.5, clickButton("Push the dog")],
      [6.0, clickButton("Controller: ON")],
      [6.2, clickButton("Push the dog")],
      [9.0, clickButton("Controller: OFF")],
      [9.2, clickButton("Reset dog")]
    ]
  },
  {
    name: "region-of-attraction", path: "/en/chapter/8", lab: "ch8-roa", seconds: 9,
    actions: [
      [0.8, clickPhase(0.62, 0.33)],
      ...Array.from({ length: 22 }, (_, k) => [2 + k * 0.2, setSlider(0, (0.4 + k * 0.1).toFixed(2))]),
      [7.0, clickPhase(0.3, 0.7)]
    ]
  },
  {
    name: "sliding-mode-dark", path: "/en/chapter/14", lab: "ch14-smc", seconds: 11, dark: true,
    actions: [
      [5.5, clickButton("sign(s)")],
      [5.6, clickButton("Reset")]
    ]
  }
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), "nlc-gif-"));
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
    if (!target) throw new Error("could not connect to Chrome");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0;
    const pending = new Map(), events = [];
    ws.onmessage = m => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); }
      else if (msg.method) events.push(msg.method);
    };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async expr => {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    await send("Page.enable");

    for (const d of DEMOS) {
      await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1300, deviceScaleFactor: 1, mobile: false });
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: d.dark ? "dark" : "light" }] });
      events.length = 0;
      await send("Page.navigate", { url: SITE + d.path });
      for (let i = 0; i < 100 && !events.includes("Page.loadEventFired"); i++) await sleep(100);
      await evaluate(`(async () => { await document.fonts.ready; if (window.MathJax && MathJax.startup) await MathJax.startup.promise; })()`);
      // scroll the lab to the top, then restart it so the recording begins at t = 0
      await evaluate(`(() => { window.lab = document.querySelector('[data-lab="${d.lab}"]'); document.documentElement.style.scrollBehavior = 'auto'; lab.scrollIntoView({ block: 'start' }); scrollBy(0, -10); })()`);
      await sleep(800);
      await evaluate(clickButton(d.dark ? "Reset" : (d.path.startsWith("/fa") ? "شروع دوباره" : "Reset")));
      const clip = await evaluate(`(() => { const r = lab.getBoundingClientRect(); return { x: r.left + scrollX - 8, y: r.top + scrollY - 8, width: r.width + 16, height: Math.min(r.height + 16, innerHeight - 10), scale: 1 }; })()`);

      const dir = mkdtempSync(join(tmpdir(), "nlc-frames-"));
      const start = Date.now(), frames = [];
      let next = 0;
      while ((Date.now() - start) / 1000 < d.seconds) {
        const t = (Date.now() - start) / 1000;
        while (next < d.actions.length && d.actions[next][0] <= t) await evaluate(d.actions[next++][1]);
        const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
        const file = join(dir, `f${String(frames.length).padStart(4, "0")}.png`);
        writeFileSync(file, Buffer.from(shot.data, "base64"));
        frames.push({ file, t: (Date.now() - start) / 1000 });
      }
      // concat list with real frame durations, then a two-pass palette GIF
      let list = "ffconcat version 1.0\n";
      frames.forEach((f, i) => { list += `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + 0.08) - f.t).toFixed(3)}\n`; });
      list += `file '${frames[frames.length - 1].file}'\n`;
      writeFileSync(join(dir, "list.txt"), list);
      const out = join(OUT, d.name + ".gif");
      const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
        "-vf", "fps=12,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
        "-loop", "0", out], { stdio: "inherit" });
      rmSync(dir, { recursive: true, force: true });
      if (r.status !== 0) throw new Error("ffmpeg failed for " + d.name);
      console.log(`saved ${d.name}.gif (${frames.length} frames over ${d.seconds}s)`);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
