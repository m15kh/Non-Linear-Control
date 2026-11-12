// Chapter 10: averaging. x' = eps (x sin^2 t - x^2/2) against its average x' = eps (x/2 - x^2/2).
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;

  const avg = {
    mode: "time",
    dim: 2, // [actual, averaged]
    params: { eps: 0.3, x0: 0.3 },
    controls: [
      { type: "slider", key: "eps", label: "ε", min: 0.02, max: 1.5, step: 0.01, reset: true },
      { type: "slider", key: "x0", label: "x(0)", min: 0.05, max: 2, step: 0.05, reset: true }
    ],
    starts: P => [[P.x0, P.x0]],
    f: (x, P, t) => [P.eps * (x[0] * Math.sin(t) ** 2 - 0.5 * x[0] * x[0]), P.eps * (0.5 * x[1] - 0.5 * x[1] * x[1])],
    dt: 0.02, substeps: 4,
    tWindow: 60,
    series: [
      { f: x => x[0], label: { en: "actual x(t)", fa: "x(t) واقعی" }, color: "--accent" },
      { f: x => x[1], label: { en: "averaged x̄(t)", fa: "x̄(t) میانگین" }, color: "--warn", dash: [7, 5] }
    ],
    tlim: [0, 2.2],
    timeRefs: [{ y: 1, label: "x̄* = 1", color: "--ok" }],
    timeTitle: { en: "The actual solution wiggles around the averaged one", fa: "جواب واقعی دور جواب میانگین نوسان می‌کند" },
    readout: t => `x = ${t.x[0].toFixed(4)}   x̄ = ${t.x[1].toFixed(4)}   |x − x̄| = ${Math.abs(t.x[0] - t.x[1]).toFixed(4)}`,
    eq: P => `ẋ = ε·(x·sin²t − ½x²),   period T = π                ε = ${P.eps.toFixed(2)}
average over one period:   sin²t → ½
averaged system:  ẋ̄ = ε·(½x̄ − ½x̄²)      equilibrium x̄* = 1, exponentially stable (slope −ε/2)
Theorem 10.4:  x(t) − x̄(t) = O(ε)  for all t ≥ 0, and a T-periodic orbit exists near x = 1`,
    caption: P => P.eps <= 0.4
      ? T("Small ε: the state moves slowly compared with the forcing, so it only feels the average of sin²t. The two curves stay within O(ε) of each other forever, and the actual one ends on a small periodic ripple around x = 1.",
        "ε کوچک: حالت نسبت به تحریک آهسته حرکت می‌کند، پس فقط میانگین sin²t را حس می‌کند. دو منحنی برای همیشه در فاصله‌ی O(ε) از هم می‌مانند و جواب واقعی روی یک موج‌دار کوچک متناوب دور x = 1 می‌نشیند.")
      : T("Large ε: the state now moves on the same time scale as the forcing, and the ripple grows. Averaging is an asymptotic result: it is guaranteed only for ε small enough.",
        "ε بزرگ: حالت حالا هم‌مقیاس با تحریک حرکت می‌کند و موج‌دار بزرگ می‌شود. میانگین‌گیری یک نتیجه‌ی مجانبی است: فقط برای ε به اندازه‌ی کافی کوچک تضمین شده است.")
  };

  register({ "ch10-avg": avg });
})();
