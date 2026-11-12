# Nonlinear Control, Visualized

An interactive, bilingual (Persian / English) companion to
**H. K. Khalil, *Nonlinear Systems*, 3rd edition**: one page per chapter, each with live
simulations you can click and tune (phase planes, Lyapunov level sets, regions of attraction,
sliding surfaces, …).

Made by [m15kh](https://github.com/m15kh) · <https://m15kh.github.io/>

## Run

Requires Go 1.22 or newer.

```bash
go run .                    # http://localhost:8080
go run . -addr :3000        # another port (or set PORT=3000)
go test ./...
```

Build a single self-contained binary (templates, pages, CSS and JS are embedded):

```bash
go build -o nonlinear-control .
./nonlinear-control
```

Or with Docker:

```bash
docker build -t nonlinear-control .
docker run -p 8080:8080 nonlinear-control
```

## Routes

| Path | Page |
| --- | --- |
| `/` | redirects to `/fa/` or `/en/` (cookie, then `Accept-Language`, default Persian) |
| `/fa/`, `/en/` | home page with all chapters |
| `/fa/chapter/{n}`, `/en/chapter/{n}` | chapter `n` (1–14) |
| `/static/…` | CSS, JavaScript, icons |
| `/healthz` | health check |

## Layout

```
main.go                     HTTP server, routing, templates, security headers
chapters.go                 chapter titles and summaries (fa + en)
i18n.go                     interface strings and language helpers
content/{fa,en}/chNN.html   chapter text (HTML + MathJax)
web/templates/              layout, home, chapter, 404
web/static/css/site.css     styles (light/dark, RTL/LTR)
web/static/js/lab.js        the simulation engine shared by every figure
web/static/js/labs/chNN.js  the simulations of chapter NN
```

## Adding a figure

1. Put a placeholder in the chapter text, in both languages:

   ```html
   <figure>
     <div class="lab" data-lab="ch4-my-example"></div>
     <figcaption>…</figcaption>
   </figure>
   ```

2. Register a config with the same id in `web/static/js/labs/ch04.js`:

   ```js
   NL.register({
     "ch4-my-example": {
       lim: [-3, 3, -3, 3],                       // x1 range, x2 range
       params: { b: 0.5 },
       controls: [{ type: "slider", key: "b", label: { en: "damping b", fa: "میرایی b" }, min: 0, max: 2, step: 0.05 }],
       f: (x, P) => [x[1], -Math.sin(x[0]) - P.b * x[1]],
       V: x => 1 - Math.cos(x[0]) + 0.5 * x[1] * x[1],
       levels: [0.5, 1, 1.5],
       side: "pendulum",
       caption: P => ({ en: "…", fa: "…" })
     }
   });
   ```

   The full list of options is documented at the top of `web/static/js/lab.js`.
   `go test` checks that every `data-lab` id on every page is registered.
