// Chapter 14: sliding mode control of an uncertain inverted pendulum.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const PI = Math.PI;
  const sgn = v => v > 0 ? 1 : (v < 0 ? -1 : 0);
  const sat = v => Math.max(-1, Math.min(1, v));
  const s = (x, P) => x[1] + P.lam * x[0];
  // the controller knows nothing about a and b except bounds; it only uses lambda, k, eps
  const u = (x, P) => -P.lam * x[1] - P.k * (P.smooth ? sat(s(x, P) / P.eps) : sgn(s(x, P)));

  const smc = {
    lim: [-PI, PI, -4, 4],
    axes: { x: "θ", y: "ω", pi: true },
    params: { lam: 1.5, k: 2.5, a: 1, smooth: false, eps: 0.1 },
    controls: [
      { type: "slider", key: "lam", label: "λ", min: 0.3, max: 4, step: 0.05 },
      { type: "slider", key: "k", label: { en: "gain k", fa: "بهره‌ی k" }, min: 0.2, max: 6, step: 0.05 },
      { type: "slider", key: "a", label: { en: "true a (unknown)", fa: "a واقعی (ناشناخته)" }, min: 0, max: 3, step: 0.05 },
      { type: "toggle", key: "smooth", labelOn: { en: "sat(s/ε): smooth", fa: "sat(s/ε): نرم" }, labelOff: { en: "sign(s): discontinuous", fa: "sign(s): ناپیوسته" } },
      { type: "slider", key: "eps", label: "ε", min: 0.01, max: 0.5, step: 0.01 }
    ],
    starts: [[2.4, 0], [-1.8, 2.5]],
    f: (x, P) => [x[1], P.a * Math.sin(x[0]) - 0.1 * x[1] + u(x, P)],
    dt: 0.002, substeps: 8,
    equilibria: () => [[0, 0, "stable"]],
    curves: P => [{ pts: [[-PI, P.lam * PI], [PI, -P.lam * PI]], color: "--warn", width: 2.6, label: { en: "sliding surface s = ω + λθ = 0", fa: "سطح لغزش s = ω + λθ = 0" }, labelAt: [-PI + 0.1, Math.min(3.6, P.lam * PI - 0.4)] }],
    shades: P => P.smooth ? [{ when: x => Math.abs(s(x, P)) < P.eps, color: "--shade" }] : [],
    side: "pendulum",
    sideOpts: (P, lab) => ({ inverted: true, u: lab.trajs[0] ? u(lab.trajs[0].x, P) : 0, angleLabel: "θ", speedLabel: "ω" }),
    series: [
      { f: (x, P) => s(x, P), label: "s(t)", color: "--accent" },
      { f: (x, P) => u(x, P) / P.k, label: "u(t)/k", color: "--warn", dash: [4, 3] }
    ],
    tlim: [-2, 2],
    tWindow: 12,
    sideTitle: { en: "Inverted pendulum with uncertain gravity term", fa: "آونگ معکوس با جمله‌ی گرانش نامعلوم" },
    timeTitle: { en: "s(t) and the control u(t)/k: look for chattering", fa: "s(t) و کنترل u(t)/k: لرزش (chattering) را ببین" },
    phaseTitle: { en: "Reaching phase, then sliding along s = 0", fa: "فاز رسیدن، بعد لغزش روی s = 0" },
    eq: P => `θ̈ = a·sin θ − 0.1·θ̇ + u,     a = ${P.a.toFixed(2)} unknown, only |a·sin θ − 0.1θ̇| ≤ ρ is assumed
s = θ̇ + λθ   (λ = ${P.lam.toFixed(2)}):   on s = 0,  θ̇ = −λθ  ⇒  θ → 0 regardless of a
u = −λ·θ̇ − k·${P.smooth ? "sat(s/ε)" : "sign(s)"}      k = ${P.k.toFixed(2)}${P.smooth ? ", ε = " + P.eps.toFixed(2) : ""}
ṡ = a·sin θ − 0.1θ̇ − k·${P.smooth ? "sat(s/ε)" : "sign(s)"}   ⇒   s·ṡ ≤ −(k − ρ)|s|   reaching condition if k > ρ`,
    caption: P => {
      if (P.k <= P.a) return T("k is not larger than the uncertainty bound (here roughly a), so the reaching condition can fail: near θ = ±π/2 gravity beats the controller and the state may never reach the surface.",
        "k از کران عدم قطعیت (اینجا تقریباً a) بزرگ‌تر نیست، پس شرط رسیدن ممکن است برقرار نباشد: نزدیک θ = ±π/2 گرانش بر کنترلر غلبه می‌کند و حالت ممکن است هرگز به سطح نرسد.");
      return P.smooth
        ? T("With sat(s/ε) the control is continuous: inside the thin band |s| < ε (shaded) it acts like high-gain linear feedback. Chattering disappears; the price is that θ converges to a small neighborhood of 0 instead of exactly 0 when a ≠ 0.",
          "با sat(s/ε) کنترل پیوسته است: داخل نوار باریک |s| < ε (سایه) مثل فیدبک خطی با بهره‌ی بالا عمل می‌کند. لرزش از بین می‌رود؛ بهایش این است که وقتی a ≠ 0، θ به یک همسایگی کوچک صفر همگرا می‌شود نه دقیقاً صفر.")
        : T("The state reaches the orange line in finite time and then slides along it to the origin, for any a below k. On the surface, u switches sign at the simulation rate: that rapid switching is chattering, visible in the dashed u(t)/k curve. Switch to sat(s/ε).",
          "حالت در زمان محدود به خط نارنجی می‌رسد و بعد روی آن تا مبدأ می‌لغزد، برای هر a کمتر از k. روی سطح، u با سرعت شبیه‌سازی علامت عوض می‌کند: همین سوییچ سریع لرزش (chattering) است که در منحنی خط‌چین u(t)/k دیده می‌شود. به sat(s/ε) تغییر بده.");
    }
  };

  register({ "ch14-smc": smc });
})();
