// Chapter 5: input-output stability. Measuring an L-infinity gain.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const u = (P, t) => P.A * Math.sin(P.w * t);

  const gain = {
    mode: "time",
    dim: 2,
    params: { A: 1, w: 1, cubic: true },
    controls: [
      { type: "slider", key: "A", label: { en: "input amplitude A", fa: "دامنه‌ی ورودی A" }, min: 0.1, max: 4, step: 0.05, reset: true },
      { type: "slider", key: "w", label: { en: "frequency ω", fa: "فرکانس ω" }, min: 0.2, max: 3, step: 0.05, reset: true },
      { type: "toggle", key: "cubic", labelOn: { en: "spring: k(y) = y + y³", fa: "فنر: k(y) = y + y³" }, labelOff: { en: "spring: linear k(y) = y", fa: "فنر: خطی k(y) = y" }, reset: true }
    ],
    starts: [[0, 0]],
    f: (x, P, t) => [x[1], -x[0] - (P.cubic ? x[0] ** 3 : 0) - 0.5 * x[1] + u(P, t)],
    onStep(tr, lab) { if (tr.t > 25) tr.supY = Math.max(tr.supY || 0, Math.abs(tr.x[0])); },
    tWindow: 40,
    dt: 0.01, substeps: 4,
    series: [
      { f: (x, P, t) => u(P, t), label: { en: "input u(t)", fa: "ورودی u(t)" }, color: "--muted", dash: [5, 4] },
      { f: x => x[0], label: { en: "output y(t)", fa: "خروجی y(t)" }, color: "--accent" }
    ],
    tlim: P => [-Math.max(P.A, 2) * 1.1, Math.max(P.A, 2) * 1.1],
    timeTitle: { en: "Input and output; the gain is measured after the transient (t > 25)", fa: "ورودی و خروجی؛ بهره بعد از گذرا (t > 25) اندازه‌گیری می‌شود" },
    eq: P => `ÿ + 0.5·ẏ + k(y) = u,    u(t) = A·sin(ωt)        A = ${P.A.toFixed(2)},  ω = ${P.w.toFixed(2)}
k(y) = ${P.cubic ? "y + y³  (hardening spring)" : "y  (linear)"}
linear part:  G(s) = 1/(s² + 0.5s + 1),   |G(jω)| = ${(1 / Math.hypot(1 - P.w * P.w, 0.5 * P.w)).toFixed(3)},   ‖G‖∞ = sup_ω |G(jω)| ≈ 2.065`,
    caption: (P, lab) => {
      const t = lab.trajs[0], g = t && t.supY ? t.supY / P.A : null;
      if (g === null) return T("Wait for the transient to die out (t > 25)…", "صبر کن تا گذرا از بین برود (t > 25)…");
      const lin = 1 / Math.hypot(1 - P.w * P.w, 0.5 * P.w);
      return P.cubic
        ? T(`Measured ‖y‖∞ / ‖u‖∞ ≈ ${g.toFixed(3)} (the linear spring would give ${lin.toFixed(3)}). With the hardening spring the ratio depends on the amplitude A: a nonlinear system has no single "gain per frequency". Its L∞ gain is the worst ratio over all inputs, and here it is still finite: the system is L∞ stable.`,
          `نسبت اندازه‌گیری‌شده‌ی ‖y‖∞ / ‖u‖∞ ≈ ${g.toFixed(3)} (فنر خطی ${lin.toFixed(3)} می‌داد). با فنر سخت‌شونده این نسبت به دامنه‌ی A بستگی دارد: سیستم غیرخطی «یک بهره برای هر فرکانس» ندارد. بهره‌ی L∞ آن بدترین نسبت روی همه‌ی ورودی‌هاست و اینجا هنوز محدود است: سیستم پایدار L∞ است.`)
        : T(`Measured ‖y‖∞ / ‖u‖∞ ≈ ${g.toFixed(3)}, which matches |G(jω)| = ${lin.toFixed(3)} for every A. For a linear system the gain does not depend on the input size; sweep ω to find the worst case ‖G‖∞ ≈ 2.07 near ω ≈ 0.94.`,
          `نسبت اندازه‌گیری‌شده‌ی ‖y‖∞ / ‖u‖∞ ≈ ${g.toFixed(3)} که برای هر A با |G(jω)| = ${lin.toFixed(3)} برابر است. در سیستم خطی بهره به اندازه‌ی ورودی بستگی ندارد؛ ω را تغییر بده تا بدترین حالت ‖G‖∞ ≈ ۲٫۰۷ را نزدیک ω ≈ ۰٫۹۴ پیدا کنی.`);
    }
  };

  register({ "ch5-gain": gain });
})();
