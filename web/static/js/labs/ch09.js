// Chapter 9: stability of perturbed systems. Vanishing vs nonvanishing perturbations and ultimate boundedness.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  // nominal system x' = Ax, A = [[0,1],[-1,-1]];  P solves PA + A'P = -I:  P = [[1.5, .5], [.5, 1]]
  const lmax = (2.5 + Math.sqrt(1.25)) / 2, lmin = (2.5 - Math.sqrt(1.25)) / 2, theta = 0.9;
  const bound = d => 2 * lmax * Math.sqrt(lmax / lmin) * d / theta; // Lemma 9.2 with c3 = 1, c4 = 2 lambda_max(P)
  const g = (x, P, t) => P.kind === "van" ? P.d * x[0] * Math.cos(P.w * t) : P.d * Math.sin(P.w * t);

  const pert = {
    lim: [-3, 3, -3, 3],
    params: { kind: "non", d: 0.3, w: 1.5 },
    controls: [
      { type: "select", key: "kind", label: { en: "perturbation", fa: "اغتشاش" }, options: [
        { value: "non", label: { en: "nonvanishing  g = δ·sin(ωt)", fa: "محونشونده  g = δ·sin(ωt)" } },
        { value: "van", label: { en: "vanishing  g = δ·x₁·cos(ωt)", fa: "محوشونده  g = δ·x₁·cos(ωt)" } }
      ] },
      { type: "slider", key: "d", label: "δ", min: 0, max: 1.2, step: 0.01 },
      { type: "slider", key: "w", label: "ω", min: 0.2, max: 3, step: 0.05 }
    ],
    starts: [[2.5, 1.5], [-2.2, -2]],
    f: (x, P, t) => [x[1], -x[0] - x[1] + g(x, P, t)],
    V: x => 1.5 * x[0] * x[0] + x[0] * x[1] + x[1] * x[1],
    vmax: 12,
    levels: [0.5, 2, 5, 10],
    field: false,
    equilibria: P => P.kind === "van" || P.d === 0 ? [[0, 0, "stable"]] : [],
    curves: P => {
      if (P.kind !== "non" || P.d === 0) return [];
      const r = bound(P.d), pts = [];
      for (let i = 0; i <= 200; i++) { const a = 2 * Math.PI * i / 200; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
      return [{ pts, color: "--warn", width: 2, dash: [7, 5], label: { en: "guaranteed ultimate bound", fa: "کران نهایی تضمینی" }, labelAt: [r * 0.72, r * 0.72] }];
    },
    onStep(t) { if (t.t > 20) t.ub = Math.max(t.ub || 0, Math.hypot(t.x[0], t.x[1])); },
    series: [{ f: x => Math.hypot(x[0], x[1]), label: "‖x(t)‖" }],
    tlim: [0, 3.5],
    tWindow: 40,
    timeTitle: { en: "‖x(t)‖ (dashed: the bound from Lemma 9.2)", fa: "‖x(t)‖ (خط‌چین: کران لم ۹.۲)" },
    timeRefs: P => P.kind === "non" && P.d > 0 ? [{ y: bound(P.d), label: "b", color: "--warn" }] : [],
    eq: P => `ẋ1 = x2,   ẋ2 = −x1 − x2 + g(t, x)        nominal part: A = [[0, 1], [−1, −1]], Hurwitz
g = ${P.kind === "van" ? "δ·x1·cos(ωt)    |g| ≤ δ‖x‖   (vanishing: g(t, 0) = 0)" : "δ·sin(ωt)       |g| ≤ δ      (nonvanishing)"}          δ = ${P.d.toFixed(2)},  ω = ${P.w.toFixed(2)}
V = xᵀPx,  P = [[1.5, 0.5], [0.5, 1]],  λmin = ${lmin.toFixed(3)},  λmax = ${lmax.toFixed(3)}
${P.kind === "van" ? "V̇ ≤ −‖x‖² + 2λmax·δ‖x‖²  <  0   if  δ < 1/(2λmax) = " + (1 / (2 * lmax)).toFixed(3) + "   ⇒ origin stays exponentially stable" : "ultimate bound  b = (c4/c3)·√(c2/c1)·δ/θ = " + bound(P.d).toFixed(3) + "    (θ = 0.9)"}`,
    caption: (P, lab) => {
      if (P.kind === "van") return P.d < 1 / (2 * lmax)
        ? T("The perturbation vanishes at the origin and δ is below the guaranteed margin 1/(2λmax), so the origin remains exponentially stable. The margin is conservative: push δ past it and the trajectories still converge for a while longer.",
          "اغتشاش در مبدأ صفر می‌شود و δ از حاشیه‌ی تضمینی 1/(2λmax) کمتر است، پس مبدأ همچنان پایدار نمایی است. این حاشیه محافظه‌کارانه است: δ را از آن رد کن و مسیرها هنوز تا مدتی همگرا می‌شوند.")
        : T("δ is above the guaranteed margin, so Lemma 9.1 is silent. The origin may still be stable (the lemma is only sufficient), but we have no proof.", "δ از حاشیه‌ی تضمینی بیشتر است، پس لم ۹.۱ چیزی نمی‌گوید. مبدأ ممکن است هنوز پایدار باشد (لم فقط کافی است) ولی اثباتی نداریم.");
      if (P.d === 0) return T("δ = 0: the nominal system, exponentially stable.", "δ = 0: سیستم اسمی، پایدار نمایی.");
      const t = lab.trajs[0];
      const meas = t && t.ub ? t.ub.toFixed(3) : "…";
      return T(`The origin is not even an equilibrium any more, so trajectories cannot converge to it. They are ultimately bounded instead: measured ultimate size ${meas}, guaranteed bound b = ${bound(P.d).toFixed(3)} (dashed). The bound scales with δ, and like every Lyapunov bound it is generous.`,
        `مبدأ دیگر حتی نقطه‌ی تعادل نیست، پس مسیرها نمی‌توانند به آن همگرا شوند. در عوض به‌طور نهایی کران‌دارند: اندازه‌ی نهایی اندازه‌گیری‌شده ${meas}، کران تضمینی b = ${bound(P.d).toFixed(3)} (خط‌چین). کران با δ متناسب است و مثل هر کران لیاپانوفی دست‌ودل‌باز است.`);
    }
  };

  register({ "ch9-pert": pert });
})();
