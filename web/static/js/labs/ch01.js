// Chapter 1: introduction. Tunnel diode circuit (multiple equilibria) and the failure of superposition.
(() => {
  "use strict";
  const { register, text, FONT, C, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;

  // ------------------------------------------------ tunnel diode circuit (Khalil Section 1.2.2)
  const h = v => 17.76 * v - 103.79 * v * v + 229.62 * v ** 3 - 226.31 * v ** 4 + 83.72 * v ** 5;
  const dh = v => 17.76 - 2 * 103.79 * v + 3 * 229.62 * v * v - 4 * 226.31 * v ** 3 + 5 * 83.72 * v ** 4;
  const R = 1.5;
  function equilibria(u) {
    const g = v => h(v) - (u - v) / R, out = [];
    let a = -0.4, ga = g(a);
    for (let i = 1; i <= 2000; i++) {
      const b = -0.4 + 2 * i / 2000, gb = g(b);
      if (ga * gb <= 0) {
        let lo = a, hi = b;
        for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; (g(lo) * g(m) <= 0) ? hi = m : lo = m; }
        const v = (lo + hi) / 2;
        if (!out.length || Math.abs(out[out.length - 1][0] - v) > 1e-4) {
          const J = [[-0.5 * dh(v), 0.5], [-0.2, -0.2 * R]], tr = J[0][0] + J[1][1], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
          out.push([v, h(v), det < 0 ? "saddle" : (tr < 0 ? "stable" : "unstable")]);
        }
      }
      a = b; ga = gb;
    }
    return out;
  }
  const tunnel = {
    lim: [-0.4, 1.6, -0.4, 1.6],
    axes: { x: "x₁ = v_C", y: "x₂ = i_L" },
    params: { u: 1.2 },
    controls: [{ type: "slider", key: "u", label: { en: "input voltage u", fa: "ولتاژ ورودی u" }, min: 0.4, max: 2.2, step: 0.01 }],
    starts: [[0.1, 1.2], [1.2, 0.0], [0.4, 1.5], [0.6, -0.2]],
    f: (x, P) => [0.5 * (-h(x[0]) + x[1]), 0.2 * (-x[0] - R * x[1] + P.u)],
    equilibria: P => equilibria(P.u),
    fieldN: 13,
    series: [{ f: x => x[0], label: "v_C(t)" }],
    tlim: [-0.2, 1.4],
    tWindow: 40,
    dt: 0.02,
    timeTitle: { en: "Capacitor voltage v_C(t): where it settles depends on where it starts", fa: "ولتاژ خازن v_C(t): جایی که می‌نشیند به نقطه‌ی شروع بستگی دارد" },
    phaseTitle: { en: "Phase plane of the circuit", fa: "صفحه‌ی فاز مدار" },
    sideTitle: { en: "Diode curve i = h(v) and the load line i = (u − v)/R", fa: "منحنی دیود i = h(v) و خط بار i = (u − v)/R" },
    side(ctx, W, H, lab) {
      const P = lab.P, X = v => 34 + (v + 0.1) / 1.4 * (W - 48), Y = i => H - 30 - (i + 0.1) / 1.5 * (H - 50);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(-0.1), Y(0)); ctx.lineTo(X(1.3), Y(0)); ctx.moveTo(X(0), Y(-0.1)); ctx.lineTo(X(0), Y(1.4)); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let k = 0; k <= 300; k++) { const v = -0.05 + 1.3 * k / 300, i = h(v); k ? ctx.lineTo(X(v), Y(i)) : ctx.moveTo(X(v), Y(i)); }
      ctx.stroke();
      ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(-0.1), Y((P.u + 0.1) / R)); ctx.lineTo(X(1.3), Y((P.u - 1.3) / R)); ctx.stroke();
      for (const [v, i, type] of equilibria(P.u)) {
        ctx.beginPath(); ctx.arc(X(v), Y(i), 6, 0, 2 * Math.PI);
        ctx.fillStyle = type === "stable" ? C.accent : C.panel; ctx.fill(); ctx.strokeStyle = type === "stable" ? C.accent : C.warn; ctx.lineWidth = 2; ctx.stroke();
      }
      const t = lab.trajs[0];
      if (t) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(t.x[0]), Y(t.x[1]), 4.5, 0, 2 * Math.PI); ctx.fill(); }
      text(ctx, "i = h(v)", X(0.12), Y(1.12), { color: "--accent" });
      text(ctx, { en: "load line", fa: "خط بار" }, X(1.0), Y((P.u - 1.0) / R) - 8, { color: "--warn" });
      text(ctx, "v", X(1.3), Y(0) + 16, { align: "right", font: `italic 13px ${FONT}` });
      text(ctx, "i", X(0) - 12, Y(1.35), { font: `italic 13px ${FONT}` });
    },
    eq: P => `ẋ1 = 0.5·[ −h(x1) + x2 ]
ẋ2 = 0.2·[ −x1 − 1.5·x2 + u ]            u = ${P.u.toFixed(2)} V
h(v) = 17.76v − 103.79v² + 229.62v³ − 226.31v⁴ + 83.72v⁵
equilibria: h(x1) = (u − x1)/R   →   ${equilibria(P.u).length} of them`,
    caption: P => {
      const n = equilibria(P.u).length;
      if (n === 3) return T("Three equilibria: two stable nodes (filled) and a saddle (diamond) between them. The circuit is a memory: which stable state it ends in depends on where it starts. This is how tunnel-diode flip-flops work.",
        "سه نقطه‌ی تعادل: دو گره‌ی پایدار (پر) و یک زین (لوزی) بین آن‌ها. مدار یک حافظه است: اینکه در کدام حالت پایدار بنشیند به نقطه‌ی شروع بستگی دارد. فلیپ‌فلاپ‌های دیود تونلی همین‌طور کار می‌کنند.");
      return T("Only one equilibrium for this input voltage: the load line cuts the diode curve once, and every trajectory goes to the same state. Move u back toward 1.2 V to get three equilibria.",
        "برای این ولتاژ ورودی فقط یک نقطه‌ی تعادل داریم: خط بار منحنی دیود را یک بار قطع می‌کند و همه‌ی مسیرها به یک حالت می‌روند. u را به حدود ۱٫۲ ولت برگردان تا سه نقطه‌ی تعادل ببینی.");
    }
  };

  // ------------------------------------------------ superposition: double the input, double the output?
  function twoPendulums(ctx, W, H, lab) {
    const t = lab.trajs[0];
    if (!t) return;
    const cx = W / 2, cy = 40, L = Math.min(W * 0.36, H * 0.62);
    ctx.fillStyle = C.muted; ctx.fillRect(cx - 60, cy - 8, 120, 6);
    ctx.setLineDash([4, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + L + 20); ctx.stroke(); ctx.setLineDash([]);
    [[t.x[2], C.warn], [t.x[0], C.accent]].forEach(([th, c]) => {
      const bx = cx + L * Math.sin(th), by = cy + L * Math.cos(th);
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, 13, 0, 2 * Math.PI); ctx.fill();
    });
    text(ctx, { en: "blue: starts at x₀", fa: "آبی: شروع از x₀" }, 12, H - 30, { color: "--accent" });
    text(ctx, { en: "orange: starts at 2x₀", fa: "نارنجی: شروع از 2x₀" }, 12, H - 12, { color: "--warn" });
  }
  const superpos = {
    mode: "time",
    dim: 4,
    params: { A: 1.2, nl: true },
    controls: [
      { type: "slider", key: "A", label: { en: "initial angle x₀ (rad)", fa: "زاویه‌ی اولیه‌ی x₀ (رادیان)" }, min: 0.1, max: 1.5, step: 0.05, reset: true },
      { type: "toggle", key: "nl", labelOn: { en: "model: nonlinear sin θ", fa: "مدل: غیرخطی sin θ" }, labelOff: { en: "model: linearized θ", fa: "مدل: خطی‌شده θ" }, reset: true }
    ],
    starts: P => [[P.A, 0, 2 * P.A, 0]],
    f: (x, P) => {
      const s = P.nl ? Math.sin : (v => v);
      return [x[1], -s(x[0]) - 0.08 * x[1], x[3], -s(x[2]) - 0.08 * x[3]];
    },
    series: [
      { f: x => x[0], label: { en: "θ(t) from x₀", fa: "θ(t) از x₀" }, color: "--accent" },
      { f: x => x[2] / 2, label: { en: "½·θ(t) from 2x₀", fa: "½·θ(t) از 2x₀" }, color: "--warn", dash: [7, 5] }
    ],
    tlim: P => [-P.A * 1.25, P.A * 1.25],
    tWindow: 30,
    side: twoPendulums,
    sideTitle: { en: "Two copies of the pendulum", fa: "دو نسخه از آونگ" },
    timeTitle: { en: "If superposition held, the two curves would lie on top of each other", fa: "اگر جمع آثار برقرار بود، دو منحنی روی هم می‌افتادند" },
    eq: P => P.nl
      ? `θ̈ = −sin θ − 0.08·θ̇          (nonlinear pendulum)
x(0) = x₀ = ${P.A.toFixed(2)}   and   x(0) = 2x₀ = ${(2 * P.A).toFixed(2)}
compare θ(t; x₀) with ½·θ(t; 2x₀)`
      : `θ̈ = −θ − 0.08·θ̇              (linearized pendulum)
x(0) = x₀ = ${P.A.toFixed(2)}   and   x(0) = 2x₀ = ${(2 * P.A).toFixed(2)}
linear  ⇒  θ(t; 2x₀) = 2·θ(t; x₀)   exactly`,
    caption: P => P.nl
      ? T("Nonlinear model: the swing from 2x₀ is slower (a big swing has a longer period), so the dashed curve drifts away from the solid one. Doubling the start did not double the response. Make x₀ small and the drift almost disappears: near the equilibrium the system behaves linearly.",
        "مدل غیرخطی: نوسان از 2x₀ کندتر است (نوسان بزرگ دوره‌ی تناوب بلندتری دارد)، پس منحنی خط‌چین از منحنی پر جدا می‌شود. دو برابر کردن نقطه‌ی شروع پاسخ را دو برابر نکرد. x₀ را کوچک کن تا این جدایی تقریباً از بین برود: نزدیک نقطه‌ی تعادل سیستم مثل یک سیستم خطی رفتار می‌کند.")
      : T("Linearized model: the two curves coincide exactly, for every x₀. That is superposition (homogeneity), and it is exactly what nonlinear systems lose.",
        "مدل خطی‌شده: دو منحنی برای هر x₀ دقیقاً روی هم می‌افتند. این همان جمع آثار (همگنی) است و دقیقاً همان چیزی است که سیستم‌های غیرخطی از دست می‌دهند.")
  };

  register({ "ch1-tunnel": tunnel, "ch1-superpos": superpos });
})();
