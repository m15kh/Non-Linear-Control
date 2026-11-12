// Chapter 12: feedback control. Stabilizing an inverted pendulum by linearization; integral control.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const PI = Math.PI, b = 0.1;
  const sat = (v, m) => Math.max(-m, Math.min(m, v));
  // theta measured from upright:  theta'' = sin(theta) - b theta' + u
  const uLin = (x, P) => sat(-P.k1 * x[0] - P.k2 * x[1], P.umax);
  const roots = (a1, a0) => { const d = a1 * a1 - 4 * a0; return d >= 0 ? [(-a1 + Math.sqrt(d)) / 2, (-a1 - Math.sqrt(d)) / 2].map(v => v.toFixed(2)).join(", ") : `${(-a1 / 2).toFixed(2)} ± ${(Math.sqrt(-d) / 2).toFixed(2)}j`; };

  const lin = {
    lim: [-4.5, 4.5, -4, 4],
    axes: { x: "θ", y: "ω", pi: true },
    params: { k1: 3, k2: 1.5, umax: 1.5 },
    controls: [
      { type: "slider", key: "k1", label: "k₁", min: 0, max: 6, step: 0.05 },
      { type: "slider", key: "k2", label: "k₂", min: 0, max: 4, step: 0.05 },
      { type: "slider", key: "umax", label: { en: "actuator limit |u| ≤", fa: "حد عملگر |u| ≤" }, min: 0.3, max: 8, step: 0.05 }
    ],
    starts: [[0.6, 0], [-1.2, 1.5], [1.8, -0.5]],
    f: (x, P) => [x[1], Math.sin(x[0]) - b * x[1] + uLin(x, P)],
    equilibria: P => [[0, 0, P.k1 > 1 && P.k2 + b > 0 ? "stable" : "saddle"]],
    shades: P => [{ when: x => Math.abs(P.k1 * x[0] + P.k2 * x[1]) > P.umax, color: "--shade2" }],
    side: "pendulum",
    sideOpts: (P, lab) => ({ inverted: true, u: lab.trajs[0] ? uLin(lab.trajs[0].x, P) : 0, angleLabel: { en: "tilt θ", fa: "زاویه θ" }[LANG], speedLabel: "ω" }),
    series: [{ f: x => x[0], label: "θ(t)" }],
    tlim: [-PI, PI],
    timeTitle: { en: "θ(t): 0 is upright", fa: "θ(t): صفر یعنی ایستاده" },
    sideTitle: { en: "Inverted pendulum with torque u", fa: "آونگ معکوس با گشتاور u" },
    phaseTitle: { en: "Shaded: the actuator is saturated there", fa: "سایه: جایی که عملگر اشباع است" },
    eq: P => `θ̈ = sin θ − 0.1·θ̇ + u                 (θ = 0 is upright, unstable when u = 0)
linearize at 0:  A = [[0, 1], [1, −0.1]],  B = [0, 1]ᵀ
u = sat(−k1·θ − k2·θ̇),  |u| ≤ ${P.umax.toFixed(2)}         k1 = ${P.k1.toFixed(2)}, k2 = ${P.k2.toFixed(2)}
closed-loop eigenvalues (linear, unsaturated):  λ² + (0.1 + k2)λ + (k1 − 1) = 0   ⇒   λ = ${roots(0.1 + P.k2, P.k1 - 1)}`,
    caption: P => {
      if (P.k1 <= 1) return T("k₁ ≤ 1: the controller is weaker than gravity, so even the linearization is unstable. Increase k₁ above 1.", "k₁ ≤ ۱: کنترلر از گرانش ضعیف‌تر است، پس حتی خطی‌سازی هم ناپایدار است. k₁ را از ۱ بیشتر کن.");
      if (P.umax < 1) return T("|u| ≤ " + P.umax.toFixed(2) + " < 1 is less than the largest gravity torque, so beyond a certain tilt no allowed torque can lift the pendulum back. The linear design works only in a small region around the origin.", "|u| ≤ " + P.umax.toFixed(2) + " < ۱ از بیشترین گشتاور گرانش کمتر است، پس از یک زاویه به بعد هیچ گشتاور مجازی نمی‌تواند آونگ را برگرداند. طراحی خطی فقط در ناحیه‌ی کوچکی دور مبدأ کار می‌کند.");
      return T("The linearization is stable, so the nonlinear closed loop is locally exponentially stable (Theorem 4.7). How far \"locally\" goes depends on the saturation: click points far from the origin and watch which ones get caught.", "خطی‌سازی پایدار است، پس حلقه‌ی بسته‌ی غیرخطی به‌طور محلی پایدار نمایی است (قضیه‌ی ۴.۷). اینکه «محلی» تا کجاست به اشباع بستگی دارد: روی نقاط دور از مبدأ کلیک کن و ببین کدام‌ها گرفته می‌شوند.");
    }
  };

  // ------------------------------------------------ integral control (Section 12.3)
  const uInt = (x, P) => -Math.sin(P.r) - P.k1 * (x[0] - P.r) - P.k2 * x[1] - (P.int ? P.ki * x[2] : 0);
  const integ = {
    mode: "time",
    dim: 3, // θ, ω, σ = ∫(θ − r)
    params: { r: 0.5, d: 0.3, int: true, k1: 4, k2: 3, ki: 2 },
    controls: [
      { type: "slider", key: "r", label: { en: "set point r", fa: "مقدار مطلوب r" }, min: -1, max: 1, step: 0.05 },
      { type: "slider", key: "d", label: { en: "unknown disturbance d", fa: "اغتشاش ناشناخته d" }, min: -1, max: 1, step: 0.05 },
      { type: "toggle", key: "int", labelOn: { en: "integral action: ON", fa: "عمل انتگرالی: روشن" }, labelOff: { en: "integral action: OFF", fa: "عمل انتگرالی: خاموش" }, reset: true }
    ],
    starts: [[0, 0, 0]],
    f: (x, P) => [x[1], Math.sin(x[0]) - b * x[1] + uInt(x, P) + P.d, x[0] - P.r],
    tWindow: 30,
    series: [
      { f: x => x[0], label: "θ(t)", color: "--accent" },
      { f: (x, P) => P.r, label: { en: "set point r", fa: "مقدار مطلوب r" }, color: "--ok", dash: [6, 4] }
    ],
    tlim: [-1.4, 1.4],
    side: "pendulum",
    sideOpts: (P, lab) => ({ inverted: true, u: lab.trajs[0] ? uInt(lab.trajs[0].x, P) : 0, angleLabel: "θ", speedLabel: "ω" }),
    sideTitle: { en: "Hold the pendulum at angle r against an unknown torque d", fa: "نگه داشتن آونگ در زاویه‌ی r در برابر گشتاور ناشناخته‌ی d" },
    timeTitle: { en: "θ(t) and the set point", fa: "θ(t) و مقدار مطلوب" },
    readout: (t, P) => `θ − r = ${(t.x[0] - P.r).toFixed(4)}   σ = ∫(θ − r)dt = ${t.x[2].toFixed(3)}`,
    eq: P => `θ̈ = sin θ − 0.1·θ̇ + u + d          d = ${P.d.toFixed(2)} unknown to the controller
σ̇ = θ − r                           r = ${P.r.toFixed(2)}
u = −sin r − k1(θ − r) − k2·θ̇${P.int ? " − ki·σ" : ""}        k1 = ${P.k1}, k2 = ${P.k2}${P.int ? ", ki = " + P.ki : ""}`,
    caption: P => P.int
      ? T("With integral action the error goes to exactly zero, whatever d is. At the new equilibrium σ̇ = θ − r must be 0, so the integrator state σ settles at the value that cancels the disturbance. Change d or r while it runs.", "با عمل انتگرالی خطا دقیقاً صفر می‌شود، d هر چه باشد. در نقطه‌ی تعادل جدید σ̇ = θ − r باید صفر باشد، پس حالت انتگرال‌گیر σ در مقداری می‌نشیند که اغتشاش را خنثی می‌کند. وقتی شبیه‌سازی می‌چرخد d یا r را تغییر بده.")
      : T("Without integral action the pendulum settles at the wrong angle: the steady-state error is proportional to d. Turn integral action on.", "بدون عمل انتگرالی آونگ در زاویه‌ی اشتباه می‌نشیند: خطای حالت ماندگار با d متناسب است. عمل انتگرالی را روشن کن.")
  };

  register({ "ch12-lin": lin, "ch12-int": integ });
})();
