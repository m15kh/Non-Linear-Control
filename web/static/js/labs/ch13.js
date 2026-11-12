// Chapter 13: feedback linearization of the inverted pendulum, compared with a linear design.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const PI = Math.PI, b = 0.1;
  // plant: theta'' = a sin(theta) - b theta' + u, true a = 1. Controller believes a = aHat.
  const u = (x, P) => P.ctrl === "fl"
    ? -P.aHat * Math.sin(x[0]) + b * x[1] - P.k1 * x[0] - P.k2 * x[1]
    : -P.k1 * x[0] - P.k2 * x[1];
  // Lyapunov function of the target linear system  theta'' = -k1 theta - k2 theta'
  const Pm = P => { const p2 = 1 / (2 * P.k1), p3 = (1 + P.k1) / (2 * P.k1 * P.k2), p1 = P.k2 / (2 * P.k1) + (1 + P.k1) / (2 * P.k2); return [p1, p2, p3]; };
  const Vq = (x, P) => { const [p1, p2, p3] = Pm(P); return p1 * x[0] * x[0] + 2 * p2 * x[0] * x[1] + p3 * x[1] * x[1]; };

  const fl = {
    lim: [-3.2, 3.2, -4, 4],
    axes: { x: "θ", y: "ω" },
    params: { ctrl: "fl", k1: 1.3, k2: 1.2, aHat: 1 },
    controls: [
      { type: "select", key: "ctrl", label: { en: "controller", fa: "کنترلر" }, options: [
        { value: "fl", label: { en: "feedback linearization", fa: "خطی‌سازی فیدبکی" } },
        { value: "lin", label: { en: "linear (Chapter 12)", fa: "خطی (فصل ۱۲)" } }
      ] },
      { type: "slider", key: "k1", label: "k₁", min: 1.05, max: 4, step: 0.05 },
      { type: "slider", key: "k2", label: "k₂", min: 0.3, max: 4, step: 0.05 },
      { type: "slider", key: "aHat", label: { en: "model â (true a = 1)", fa: "مدل â (a واقعی = ۱)" }, min: 0, max: 2, step: 0.05 }
    ],
    starts: [[2.8, 0], [-2, 2.5], [1, -3.5]],
    f: (x, P) => [x[1], Math.sin(x[0]) - b * x[1] + u(x, P)],
    V: Vq,
    vmax: 12,
    levels: [0.5, 2, 5, 10, 20],
    equilibria: () => [[0, 0, "stable"]],
    shades: P => [{ when: x => {
      const [p1, p2, p3] = Pm(P), g0 = 2 * p1 * x[0] + 2 * p2 * x[1], g1 = 2 * p2 * x[0] + 2 * p3 * x[1];
      return g0 * x[1] + g1 * (Math.sin(x[0]) - b * x[1] + u(x, P)) > 1e-9;
    }, color: "--bad", alpha: 0.45, N: 240 }],
    side: "pendulum",
    sideOpts: (P, lab) => ({ inverted: true, u: lab.trajs[0] ? u(lab.trajs[0].x, P) : 0, angleLabel: "θ", speedLabel: "ω" }),
    sideTitle: { en: "Inverted pendulum", fa: "آونگ معکوس" },
    phaseTitle: { en: "Yellow: V of the target linear system increases there. Dashed: its level sets", fa: "زرد: جایی که V سیستم خطی هدف زیاد می‌شود. خط‌چین: سطوح تراز آن" },
    eq: P => `plant:   θ̈ = a·sin θ − 0.1·θ̇ + u,    a = 1  (controller assumes â = ${P.aHat.toFixed(2)})
` + (P.ctrl === "fl"
      ? `u = −â·sin θ + 0.1·θ̇ − k1·θ − k2·θ̇        (cancel, then place poles)
closed loop:  θ̈ = −k1·θ − k2·θ̇ + (a − â)·sin θ      → exactly linear when â = a`
      : `u = −k1·θ − k2·θ̇                           (designed on the linearization)
closed loop:  θ̈ = sin θ − k1·θ − (0.1 + k2)·θ̇        → linear only near θ = 0`) + `
target:  θ̈ = −k1·θ − k2·θ̇,   V = xᵀPx with AᵀP + PA = −I`,
    caption: P => {
      if (P.ctrl === "fl" && Math.abs(P.aHat - 1) < 1e-9) return T("Exact cancellation: the closed loop is the linear system θ̈ = −k₁θ − k₂θ̇ everywhere, not just near 0. No yellow region: V decreases along every trajectory, and the response from a large angle is the same shape as from a small one.",
        "حذف دقیق: حلقه‌ی بسته همه‌جا همان سیستم خطی θ̈ = −k₁θ − k₂θ̇ است، نه فقط نزدیک صفر. ناحیه‌ی زردی وجود ندارد: V در طول هر مسیر کم می‌شود و پاسخ از زاویه‌ی بزرگ همان شکل پاسخ از زاویه‌ی کوچک را دارد.");
      if (P.ctrl === "fl") return T("The model is wrong (â ≠ a), so the cancellation leaves a residual term (a − â)·sin θ and a yellow region appears. Feedback linearization needs an accurate model; robustness to this error is what Chapter 14's tools add.",
        "مدل اشتباه است (â ≠ a)، پس حذف یک جمله‌ی باقی‌مانده‌ی (a − â)·sin θ به جا می‌گذارد و ناحیه‌ی زرد ظاهر می‌شود. خطی‌سازی فیدبکی مدل دقیق می‌خواهد؛ مقاوم‌سازی در برابر این خطا کاری است که ابزارهای فصل ۱۴ اضافه می‌کنند.");
      return T("The linear controller only matches the target near θ = 0. With a weak k₁ the restoring torque k₁θ − sin θ is small at large angles, the response is sluggish there, and V of the target system increases in the yellow region.",
        "کنترلر خطی فقط نزدیک θ = 0 با سیستم هدف یکی است. با k₁ ضعیف، گشتاور برگرداننده‌ی k₁θ − sin θ در زاویه‌های بزرگ کوچک است، پاسخ آنجا کند است و V سیستم هدف در ناحیه‌ی زرد زیاد می‌شود.");
    }
  };

  register({ "ch13-fl": fl });
})();
