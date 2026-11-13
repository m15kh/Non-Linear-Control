<div align="center">

# Nonlinear Control, Visualized

**An interactive, bilingual (Persian / English) companion to H. K. Khalil's *Nonlinear Systems* (3rd edition).**
One page per chapter, with live simulations you can click and tune.

![Go](https://img.shields.io/badge/Go-1.22%2B-00ADD8?logo=go&logoColor=white)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20Persian-1f6f8b)
![Chapters](https://img.shields.io/badge/chapters-14-3f7d2c)
![Interactive figures](https://img.shields.io/badge/interactive%20figures-37-b5532c)
![Dependencies](https://img.shields.io/badge/Go%20dependencies-none-555)

<img src="docs/gifs/robot-dog.gif" alt="Robot dog demo: pushing a balancing robot, turning its controller off so it falls, and resetting it" width="760">

*A balancing robot whose controller is designed with a Lyapunov function (Chapter 4). Push it, switch the controller off, and watch V rise until it falls.*

Made by **[m15kh](https://github.com/m15kh)** · [m15kh.github.io](https://m15kh.github.io/)

</div>

---

## Contents

- [What is this?](#what-is-this)
- [Features](#features)
- [Screenshots](#screenshots)
- [Animated demos](#animated-demos)
- [Chapters and interactive figures](#chapters-and-interactive-figures)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [The lab engine](#the-lab-engine)
- [Adding and editing content](#adding-and-editing-content)
- [Testing](#testing)
- [Regenerating the screenshots and GIFs](#regenerating-the-screenshots-and-gifs)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [Author](#author)

---

## What is this?

Khalil's *Nonlinear Systems* is the standard graduate text on nonlinear control, and it is hard to read without pictures: phase portraits, level sets of Lyapunov functions, regions of attraction and sliding surfaces are all geometric ideas.

This site puts those pictures next to the text, and makes them **live**. Every chapter page explains the main ideas in plain language, and every important example comes with an interactive figure:

- click the phase plane to start a trajectory from that point,
- move a slider and watch an equilibrium change type, or disappear,
- toggle between two Lyapunov functions, or two controllers, and compare.

The site is written for Persian-speaking students first (Persian is the default language), with a complete English version one click away.

> The site is an independent study resource. It follows the book's chapter order and example numbering, but it is not affiliated with the author or the publisher, and it is meant to be read **alongside** the book, not instead of it.

---

## Features

| | |
| --- | --- |
| 📖 **All 14 chapters** | From the introduction to sliding mode control, backstepping and high-gain observers. |
| 🧪 **37 interactive figures** | Phase planes, Lyapunov level sets, V(t) plots, physical animations (pendulum, mass–spring–damper, robot), Nyquist plots. |
| 🌐 **Persian and English** | Every page exists in both languages. The switch keeps you on the same page; the choice is remembered. Right-to-left layout and Persian digits for Persian. |
| 🧮 **Real math** | Formulas typeset with MathJax; the equations in each figure update as you move the sliders. |
| 🌗 **Light and dark themes** | Follows the operating system, with a manual toggle. Figures redraw in the new colors. |
| 📱 **Works on phones** | Responsive layout; figures stack vertically on narrow screens. |
| ♿ **Accessible** | Respects *reduced motion* (simulations are pre-computed instead of animated), keyboard focus styles, skip link, semantic headings. |
| ⚡ **One binary** | The Go server embeds every template, page, stylesheet and script. Copy one file and run it. No database, no Node build step, no Go dependencies outside the standard library. |
| 🔒 **Safe defaults** | Content-Security-Policy, `nosniff`, timeouts, graceful shutdown, no directory listings. |
| ✅ **Tested** | Go tests render every page in both languages and check that every figure on every page is wired to a simulation. |

---

## Screenshots

### Home page

| Light theme | Dark theme |
| :---: | :---: |
| <img src="docs/screenshots/home-en.png" alt="Home page with the chapter grid" width="420"> | <img src="docs/screenshots/home-dark.png" alt="Home page in the dark theme" width="420"> |

### A chapter page

<img src="docs/screenshots/chapter-en.png" alt="Chapter 4, with the table of contents and reading progress on the side" width="820">

*Chapter 4 (Lyapunov stability): table of contents and reading progress on the side, chapter text with MathJax formulas, and figures inline.*

### On a phone

<img src="docs/screenshots/mobile-en.png" alt="Chapter 2 on a phone: the linear systems figure stacked vertically" width="260">

### Interactive figures

| | |
| :---: | :---: |
| <img src="docs/screenshots/lab-ch4-lyapunov.png" alt="Example 4.4: pendulum with friction and two Lyapunov functions" width="420"><br>**Example 4.4** – the pendulum with friction and two candidate Lyapunov functions. With the energy, V̇ is only semidefinite: see the flat steps in V(t). | <img src="docs/screenshots/lab-ch4-roa-estimate.png" alt="Example 4.5: variable gradient method and region of attraction estimate" width="420"><br>**Example 4.5** – the variable gradient method. The thick curve is the largest level set inside D, a safe estimate of the region of attraction. |
| <img src="docs/screenshots/lab-ch2-pendulum.png" alt="Chapter 2: pendulum with input torque" width="420"><br>**Chapter 2** – the pendulum with friction and input torque. Each equilibrium is classified from its Jacobian; raising the torque makes two equilibria merge and vanish. | <img src="docs/screenshots/lab-ch1-tunnel-diode.png" alt="Chapter 1: tunnel diode circuit with three equilibria" width="420"><br>**Chapter 1** – the tunnel-diode circuit. The load line cuts the diode curve three times: two stable states and a saddle, a one-bit memory. |
| <img src="docs/screenshots/lab-ch8-region-of-attraction.png" alt="Chapter 8: estimating the region of attraction of the reversed Van der Pol oscillator" width="420"><br>**Chapter 8** – estimating the region of attraction. The level set must avoid the yellow region where V̇ > 0; the dashed curve is the true boundary. | <img src="docs/screenshots/lab-ch7-circle-criterion.png" alt="Chapter 7: circle criterion with Nyquist plot and sector" width="420"><br>**Chapter 7** – the circle criterion. The Nyquist plot of G(jω) must avoid the forbidden half-plane or disk for the sector [α, β]. |
| <img src="docs/screenshots/lab-ch4-robot-dog.png" alt="Robot dog balanced by a Lyapunov-designed controller" width="420"><br>**Application** – a balancing robot. The controller turns the hilltop into a bowl; the Lyapunov function proves it stays upright. | <img src="docs/screenshots/lab-ch14-sliding-mode-dark.png" alt="Chapter 14: sliding mode control in the dark theme" width="420"><br>**Chapter 14** – sliding mode control (dark theme). The state reaches the sliding surface in finite time; the dashed u(t)/k shows the chattering. |

---

## Animated demos

<table>
<tr>
<td width="50%" align="center">
<img src="docs/gifs/pendulum-bifurcation.gif" alt="Pendulum bifurcation demo" width="380"><br>
<b>Saddle-node bifurcation.</b> Two trajectories are started by clicking, then the input torque T is raised past a: the stable equilibrium and the saddle merge and vanish, and the pendulum spins forever.
</td>
<td width="50%" align="center">
<img src="docs/gifs/region-of-attraction.gif" alt="Region of attraction demo" width="380"><br>
<b>Region of attraction.</b> The level c is raised until the set V ≤ c touches the region where V̇ > 0; its boundary turns from green to red. That touching value is c*.
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/gifs/sliding-mode-dark.gif" alt="Sliding mode control demo" width="380"><br>
<b>Sliding mode control.</b> First with sign(s): the state slides to the origin and the control chatters. Then with sat(s/ε): smooth control, no chattering.
</td>
<td width="50%" align="center">
<img src="docs/gifs/robot-dog.gif" alt="Robot dog demo" width="380"><br>
<b>Robot dog.</b> Pushes are absorbed while the controller is on. With the controller off, standing is the top of a hill: V goes up and the robot falls.
</td>
</tr>
</table>

---

## Chapters and interactive figures

| # | Chapter | Interactive figures |
| :-: | --- | --- |
| 1 | Introduction | superposition test (nonlinear vs. linearized pendulum) · tunnel-diode circuit with load line, multiple equilibria and hysteresis |
| 2 | Second-Order Systems | the six linear phase portraits · mass–spring–damper with eigenvalues on the complex plane · pendulum with torque (equilibrium classification, saddle-node bifurcation) · Van der Pol limit cycle |
| 3 | Fundamental Properties | finite escape time (ẋ = x², ẋ = x, ẋ = −x³) · non-uniqueness of ẋ = x^(1/3) and the missing Lipschitz constant · Gronwall bound vs. the actual distance between two solutions |
| 4 | Lyapunov Stability | Ex. 4.1 sign definiteness · Ex. 4.2 first-order system · Ex. 4.3 frictionless pendulum · Ex. 4.4 two Lyapunov functions · Ex. 4.5 variable gradient method · Ex. 4.6 global stability · Fig. 4.4 radial unboundedness · Ex. 4.7 Chetaev's theorem · LaSalle's invariance principle · robot dog |
| 5 | Input–Output Stability | measuring the L∞ gain of a Duffing oscillator, linear vs. hardening spring |
| 6 | Passivity | energy balance of a mass–spring–damper: stored ≤ supplied, with output feedback |
| 7 | Frequency Domain Analysis | circle criterion (Nyquist plot, sector, disk) · describing-function prediction of the Van der Pol limit cycle |
| 8 | Advanced Stability Analysis | center manifold and the reduced system · region-of-attraction estimates with Lyapunov level sets |
| 9 | Stability of Perturbed Systems | vanishing vs. nonvanishing perturbations and the guaranteed ultimate bound |
| 10 | Perturbation Theory and Averaging | a periodically forced system against its average |
| 11 | Singular Perturbations | slow manifold, boundary layer and the reduced model |
| 12 | Feedback Control | stabilizing an inverted pendulum by linearization, with actuator saturation · integral control against an unknown disturbance |
| 13 | Feedback Linearization | exact cancellation vs. linear design, and the effect of model error |
| 14 | Nonlinear Design Tools | sliding mode control with sign(s) and sat(s/ε) |

Each chapter page also covers the sections that have no figure (for example ISS in Chapter 4, the small-gain theorem in Chapter 5, backstepping in Chapter 14), with the key definitions and theorems.

---

## Quick start

### Requirements

- **Go 1.22 or newer** ([download](https://go.dev/dl/)). Nothing else is needed to run the site.
- A modern browser (Chrome, Firefox, Safari, Edge).
- An internet connection in the browser, for the Vazirmatn font (Google Fonts) and MathJax (jsDelivr). The simulations themselves work offline.

### Run

```bash
cd Non_Linear_Control        # the project folder
go run .
```

Open **<http://localhost:8080>**.

The terminal shows a line like `level=INFO msg=listening addr=:8080` and then stays busy: that is normal, the server is running. Each page you open is logged. Press **Ctrl+C** to stop it.

- `/` redirects to the Persian site (`/fa/`) unless your browser prefers English.
- Use the **English / فارسی** button at the top to switch language on any page.

### Build a binary

```bash
go build -o nonlinear-control .
./nonlinear-control                 # http://localhost:8080
```

The binary contains the whole site. Cross-compile for a server:

```bash
GOOS=linux  GOARCH=amd64 go build -o nonlinear-control-linux .
GOOS=windows GOARCH=amd64 go build -o nonlinear-control.exe .
GOOS=darwin GOARCH=arm64 go build -o nonlinear-control-mac .
```

### Docker

```bash
docker build -t nonlinear-control .
docker run --rm -p 8080:8080 nonlinear-control
```

The image is a two-stage build: a Go builder and a tiny `distroless` runtime running as a non-root user.

---

## Configuration

| Setting | How | Default |
| --- | --- | --- |
| Listen address | `-addr :3000` flag | `:8080` |
| Port only | `PORT=3000` environment variable (used by most hosting platforms) | `8080` |

```bash
go run . -addr 127.0.0.1:9000     # only reachable from this machine
PORT=3000 go run .
```

### Routes

| Path | What it serves |
| --- | --- |
| `/` | redirect to `/fa/` or `/en/`: the `lang` cookie first, then the browser's `Accept-Language`, else Persian |
| `/fa/`, `/en/` | home page: hero, how-to, chapter cards |
| `/fa/chapter/{n}`, `/en/chapter/{n}` | chapter `n`, 1 to 14 |
| `/fa`, `/en` | permanent redirect to the version with a trailing slash |
| `/static/…` | CSS, JavaScript, favicon (cached for a day; URLs carry a content hash) |
| `/healthz` | plain `ok`, for load balancers and uptime checks |
| anything else | localized 404 page |

---

## Deployment

The server is a single static binary with no state, so it runs anywhere.

> **GitHub Pages** only serves static files and cannot run the Go server. Use any host that can run a binary or a container (a VPS, Fly.io, Render, Railway, Google Cloud Run, …).

### systemd (Linux server)

```ini
# /etc/systemd/system/nonlinear-control.service
[Unit]
Description=Nonlinear Control, Visualized
After=network.target

[Service]
ExecStart=/opt/nonlinear-control/nonlinear-control -addr 127.0.0.1:8080
Restart=on-failure
DynamicUser=yes

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nonlinear-control
```

### nginx in front (HTTPS)

```nginx
server {
    server_name nonlinear.example.com;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    # add certificates with: sudo certbot --nginx -d nonlinear.example.com
}
```

The server shuts down gracefully on `SIGINT` / `SIGTERM`, so restarts do not cut requests in half.

---

## Project structure

```
.
├── main.go                  HTTP server: routing, templates, language redirect, security headers, logging
├── chapters.go              the 14 chapters: number, title and summary in both languages
├── i18n.go                  interface strings (fa / en), Persian digits, Accept-Language parsing
├── main_test.go             tests for every route, page, language and figure
├── go.mod                   no external dependencies
├── Dockerfile
│
├── content/
│   ├── fa/ch01.html … ch14.html     chapter text in Persian (HTML + MathJax)
│   └── en/ch01.html … ch14.html     chapter text in English
│
├── web/
│   ├── templates/
│   │   ├── layout.html      page shell: header, language switch, theme button, footer
│   │   ├── home.html        hero, how-to, chapter cards
│   │   ├── chapter.html     sidebar table of contents, chapter body, previous / next
│   │   └── notfound.html
│   └── static/
│       ├── css/site.css     design tokens, light / dark themes, RTL-safe layout
│       ├── favicon.svg
│       └── js/
│           ├── lab.js           the simulation engine shared by every figure
│           ├── labs/ch01.js …   the figures of each chapter (configs for lab.js)
│           ├── site.js          theme toggle, table of contents, reading progress
│           ├── hero.js          animated phase-portrait background on the home page
│           ├── theme-init.js    applies the saved theme before the first paint
│           └── mathjax-config.js
│
├── scripts/
│   ├── screenshots.mjs      regenerates docs/screenshots/*.png
│   └── gifs.mjs             regenerates docs/gifs/*.gif
│
└── docs/
    ├── screenshots/         images used in this README
    └── gifs/                animations used in this README
```

---

## How it works

### Server

- **Everything is embedded** with `//go:embed`: templates, the 28 chapter pages and the static files. At startup the server parses the templates, loads every chapter in both languages and fails fast if one is missing, so a broken build never starts.
- **Templates**: `layout.html` is the shell; each page template (`home`, `chapter`, `notfound`) is parsed into its own clone of it.
- **Languages**: the language is the first path segment (`/fa/…`, `/en/…`). The page gets `lang` and `dir` (`rtl` / `ltr`) attributes, translated interface strings from `i18n.go`, and a link to the same page in the other language. Visiting a language sets a `lang` cookie, which `/` uses next time.
- **Cache busting**: at startup the server hashes all static files; every `<script>` and `<link>` URL carries `?v=<hash>`, so browsers can cache them for a day and still get new versions after a deploy.
- **Security headers**: a Content-Security-Policy that only allows the site itself, Google Fonts and jsDelivr (MathJax); `X-Content-Type-Options: nosniff`; `frame-ancestors 'none'`; a strict referrer policy. Server timeouts protect against slow clients.

### Front end

- **No framework and no build step.** Plain HTML, CSS and JavaScript.
- **CSS** uses design tokens (`--bg`, `--ink`, `--accent`, …) redefined for dark mode, and logical properties (`margin-inline-start`, `border-inline-start`) so one stylesheet serves both RTL and LTR.
- **MathJax 3** renders `\( … \)` and `\[ … \]` in the chapter text.
- **The lab engine** (`lab.js`) turns every `<div class="lab" data-lab="…">` into a live figure, using the config registered by that chapter's script.

---

## The lab engine

`web/static/js/lab.js` is about 850 lines of dependency-free JavaScript. A figure is a **configuration object**; the engine builds the controls and canvases, integrates the system and draws it.

### What it does

- Integrates **ẋ = f(x, P, t)** with a 4th-order **Runge–Kutta** step (any state dimension, time-varying systems allowed).
- Draws three panels:
  - an optional **physical view** (pendulum, inverted pendulum, mass–spring, mass–spring–damper, robot, a ball on a bowl, or a custom drawing);
  - the **phase plane** (or a 1-D plot of f(x), or a custom drawing);
  - a **time plot** of V(x(t)), x₁(t) or any list of series.
- Phase plane extras: vector field, level sets of V (marching squares), shaded regions, extra contours and curves, domain boundaries, equilibria marked by type (filled = stable, hollow = unstable, diamond = saddle).
- Click the phase plane to start a trajectory; the newest one is drawn thick and drives the physical view.
- Sliders, toggles, buttons and selects, all bilingual. Equation box and caption update live.
- Performance: static layers (field, level sets, shading) are cached in an off-screen canvas and only redrawn when a parameter changes; figures that are scrolled off screen are paused.
- HiDPI canvases, light/dark redraw, and *prefers-reduced-motion* support (the simulation is computed ahead and shown still).
- A broken figure shows an error message in place, without breaking the rest of the page.

### Configuration reference

Any text can be a plain string or `{ en: "…", fa: "…" }`. Any value marked *(P)* can also be a function of the parameters `P`.

| Option | Meaning |
| --- | --- |
| `mode` | `"plane"` (default), `"line"` (1-D system: plots f(x)), `"time"` (time plot only) |
| `static` | `true` for a figure without simulation (e.g. Example 4.1, Figure 4.4) |
| `dim` | state dimension (default 2, or 1 in `"line"` mode) |
| `f(x, P, t)` | vector field; returns an array |
| `V(x, P)` | Lyapunov / energy function: enables level sets, the V gauge, V(t), and V̇ in the readout |
| `lim` *(P)* | `[x1min, x1max, x2min, x2max]`; in `"line"` mode `[xmin, xmax, fmin, fmax]` |
| `params` | initial parameters, e.g. `{ b: 0.5, on: true }` |
| `controls` | list of `slider` / `toggle` / `button` / `select` (see below) |
| `starts` *(P)* | initial states of the first trajectories |
| `levels` *(P)* | values c for the dashed level sets V = c |
| `shades` *(P)* | `[{ when: (x, P) => bool, color, alpha }]` regions to fill |
| `contours` *(P)* | `[{ F: (x, P) => number, c, color, width, dash }]` extra level curves |
| `curves` *(P)* | `[{ pts: [[x1, x2], …], color, width, dash, label }]` |
| `domainLines` *(P)* | x₁ values of dashed vertical lines (domain D), with `domainLabel` |
| `equilibria` *(P)* | `[[x1, x2, "stable" \| "unstable" \| "saddle" \| "center"], …]` |
| `side` | `"pendulum"`, `"spring"`, `"msd"`, `"dog"`, `"bowl1d"`, or `function (ctx, W, H, lab)` |
| `sideOpts` *(P)* | options for the side view (`inverted`, `u`, labels, colors, …) |
| `series` | time-plot series: a function, or `[{ f: (x, P, t) => v, label, color, dash }]` |
| `tlim` *(P)*, `tWindow` | time-plot y range (auto if omitted) and visible window in seconds |
| `timeRefs` *(P)* | horizontal `{ y }` or vertical `{ t }` dashed reference lines |
| `eq` *(P)* | text of the monospaced equation box |
| `caption` *(P, lab)* | the explanation box, usually depending on the parameters |
| `sideTitle`, `phaseTitle`, `timeTitle`, `hint` | panel titles and the hint line |
| `wrap` | `{ period, max }` to wrap an angle (e.g. pendulums that spin) |
| `dt`, `substeps` | integration step and steps per frame (default 0.01 × 3) |
| `axes` | `{ x: "θ", y: "ω", pi: true }` axis names, π tick marks |
| `onParams(P, lab)`, `onStep(tr, lab)`, `onReset(lab)` | hooks |
| `drawBg`, `drawTop`, `drawPhase(ctx, map, lab)` | custom drawing (cached layer, top layer, full replacement) |
| `makeStart(p, P)` | turn a clicked point into a full initial state (for dim > 2) |
| `maxTrajs`, `fieldN`, `aspect`, `vmax`, `readout` | limits and display details |

**Controls**

```js
{ type: "slider", key: "b", label: { en: "damping b", fa: "میرایی b" }, min: 0, max: 2, step: 0.05, digits: 2, reset: false }
{ type: "toggle", key: "on", labelOn: "Controller: ON", labelOff: "Controller: OFF" }
{ type: "button", label: "Push", action: (P, lab) => { lab.trajs[0].x[1] += 1; } }
{ type: "select", key: "sys", label: "system", options: [{ value: "a", label: "…" }, { value: "b", label: "…" }] }
```

Helpers are available to chapter scripts as `NL.*`: `register`, `text`, `arrow`, `contour`, `shade`, `makeMap`, `rk4`, `drawGauge`, `tr`, `C` (current theme colors), `LANG`.

---

## Adding and editing content

### Edit chapter text

Chapter bodies are plain HTML files in `content/fa/` and `content/en/`. Use:

- `<h2 id="…">` for sections (they appear in the sidebar automatically),
- `\( … \)` and `\[ … \]` for math (inside `<div class="eq">` for display equations),
- `<div class="box thm">` for a theorem, `<div class="box warn">` for a warning, `<div class="box">` for a summary,
- `<div class="try"><h4>Try this</h4><ul>…</ul></div>` for exercises,
- `<span class="en">(English term)</span>` to show the English name of a term in the Persian text.

Restart the server after editing (the files are embedded at build time).

### Add an interactive figure

1. Add the placeholder to the chapter text, **in both languages**:

   ```html
   <figure>
     <div class="lab" data-lab="ch4-my-example"></div>
     <figcaption><b>Figure 4.x</b> What the reader should look at.</figcaption>
   </figure>
   ```

2. Register a config with the same id in `web/static/js/labs/ch04.js`:

   ```js
   NL.register({
     "ch4-my-example": {
       lim: [-4, 4, -3, 3],
       params: { b: 0.5 },
       controls: [{ type: "slider", key: "b", label: { en: "friction b", fa: "اصطکاک b" }, min: 0, max: 2, step: 0.05 }],
       starts: [[2.5, 0]],
       f: (x, P) => [x[1], -Math.sin(x[0]) - P.b * x[1]],
       V: x => 1 - Math.cos(x[0]) + 0.5 * x[1] * x[1],
       levels: [0.5, 1, 1.5],
       equilibria: () => [[0, 0, "stable"], [Math.PI, 0, "saddle"], [-Math.PI, 0, "saddle"]],
       side: "pendulum",
       eq: P => `ẋ1 = x2,  ẋ2 = −sin x1 − b·x2   (b = ${P.b.toFixed(2)})`,
       caption: P => P.b > 0
         ? { en: "Energy decreases: the pendulum comes to rest.", fa: "انرژی کم می‌شود: آونگ می‌ایستد." }
         : { en: "No friction: energy is conserved.", fa: "بدون اصطکاک: انرژی پایسته است." }
     }
   });
   ```

3. Run `go test ./...`. It fails if a page uses a figure id that no script registers.

A chapter that gets its first figure only needs the new file `web/static/js/labs/chNN.js`; the server notices it and adds the script tags automatically.

### Change interface text or chapter titles

- Header, footer and home-page strings: `i18n.go` (the `ui` map, one entry per language).
- Chapter titles and summaries: `chapters.go`.

### Add another language

Add the code to `languages` and `ui` in `i18n.go`, a translation to every `Text` in `chapters.go` (extend the struct), and `content/<code>/ch01.html … ch14.html`. Figure strings take an extra key in their `{ en, fa }` objects.

---

## Testing

```bash
go vet ./...
go test ./...
```

The tests check that:

- `/` redirects by cookie and `Accept-Language`;
- every chapter renders in both languages, with the right `lang` / `dir`, the title, the footer links and a working language-switch link;
- every `data-lab` figure on every page is registered in that chapter's script;
- unknown chapters, unknown languages and directory URLs return 404;
- static files and `/healthz` are served.

---

## Regenerating the screenshots and GIFs

The images in this README are produced by two scripts that drive headless Chrome through the DevTools protocol. They need **Node.js 22+**, **Google Chrome or Chromium**, and, for the GIFs, **ffmpeg**.

```bash
go run . -addr 127.0.0.1:8099 &          # start the site
node scripts/screenshots.mjs              # → docs/screenshots/*.png
node scripts/gifs.mjs                     # → docs/gifs/*.gif
kill %1
```

Environment variables: `SITE` (default `http://127.0.0.1:8099`), `CHROME` (browser binary, default `google-chrome`), `FFMPEG`.

- Screenshots are taken with *reduced motion* emulated, so each figure runs its simulation ahead and shows full trajectories.
- GIFs record in real time while a short script clicks the phase plane, presses buttons and moves sliders. Edit the `DEMOS` list in `scripts/gifs.mjs` to record other figures.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The terminal "hangs" after `go run .` | That is the server running. Open <http://localhost:8080> in a browser; stop it with Ctrl+C. |
| `bind: address already in use` | Another program (or another copy of the site) uses port 8080. Stop it, or run `go run . -addr :3000`. |
| My edits do not show up | Files are embedded when the program starts: stop it (Ctrl+C) and run `go run .` again, then reload the page. |
| Formulas show as raw `\( … \)` | MathJax is loaded from jsDelivr; check the browser's internet connection or content blockers. |
| The font looks different | Vazirmatn comes from Google Fonts; without internet the browser uses Tahoma or the system font. |
| `go: go.mod requires go >= 1.22` | Update Go from <https://go.dev/dl/>. |

---

## Contributing

Corrections and new figures are welcome.

- Keep both languages in sync: every text change and every figure goes into `content/fa` **and** `content/en`.
- Check equations, theorem numbers and example numbers against the book.
- Run `gofmt`, `go vet ./...` and `go test ./...` before submitting.
- For new figures, prefer a config for the existing engine over a custom page.

---

## Acknowledgements

- **Hassan K. Khalil**, *Nonlinear Systems*, 3rd edition, Prentice Hall, 2002. The structure and examples of this site follow the book.
- [MathJax](https://www.mathjax.org/) for typesetting.
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) by Saber Rastikerdar, the Persian typeface.

This project is not affiliated with or endorsed by the author or the publisher of the book. No license file has been added yet, so all rights are reserved by the author of the site until one is chosen.

---

## Author

**m15kh**

- GitHub: [github.com/m15kh](https://github.com/m15kh)
- Website: [m15kh.github.io](https://m15kh.github.io/)
