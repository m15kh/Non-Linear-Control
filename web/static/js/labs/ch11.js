// Chapter 11: singular perturbations. x' = -x + z (slow), eps z' = -z + x^2 (fast).
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;

  const sp = {
    lim: [-1.6, 1.6, -1.2, 2.4],
    axes: { x: "x (slow)", y: "z (fast)" },
    params: { eps: 0.05 },
    controls: [{ type: "slider", key: "eps", label: "ε", min: 0.01, max: 1, step: 0.01, digits: 2 }],
    starts: [[0.8, 2.2], [-1.2, -1], [0.5, -1], [-0.9, 2.2]],
    f: (x, P) => [-x[0] + x[1], (-x[1] + x[0] * x[0]) / P.eps],
    dt: 0.002, substeps: 6,
    fieldN: 13,
    equilibria: () => [[0, 0, "stable"], [1, 1, "saddle"]],
    curves: () => {
      const pts = []; for (let i = 0; i <= 200; i++) { const x = -1.6 + 3.2 * i / 200; pts.push([x, x * x]); }
      return [{ pts, color: "--warn", width: 2.8, label: { en: "slow manifold z = h(x) = x²", fa: "خمینه‌ی کند z = h(x) = x²" }, labelAt: [-1.55, 2.1] }];
    },
    series: [{ f: x => x[1] - x[0] * x[0], label: "z − h(x)" }],
    tlim: [-1.5, 2.5],
    tWindow: 8,
    timeTitle: { en: "Boundary layer: z − h(x) dies out on the fast time scale t/ε", fa: "لایه‌ی مرزی: z − h(x) در مقیاس زمانی تند t/ε از بین می‌رود" },
    phaseTitle: { en: "Trajectories jump to the slow manifold, then slide along it", fa: "مسیرها به خمینه‌ی کند می‌پرند و بعد روی آن می‌لغزند" },
    eq: P => `ẋ = −x + z                (slow)
ε·ż = −z + x²             (fast)        ε = ${P.eps.toFixed(2)}
ε = 0:  z = h(x) = x²   ⇒   reduced model  ẋ = −x + x²
boundary layer: dy/dτ = −y,  y = z − h(x),  τ = t/ε   (exponentially stable)`,
    caption: P => P.eps <= 0.1
      ? T("Small ε: each trajectory first drops almost vertically onto the orange curve (the boundary layer, lasting a few ε), then moves along it as the reduced model ẋ = −x + x² dictates. Tikhonov's theorem: the full solution stays O(ε)-close to that two-stage picture.",
        "ε کوچک: هر مسیر ابتدا تقریباً عمودی روی منحنی نارنجی می‌افتد (لایه‌ی مرزی، به مدت چند ε)، بعد همان‌طور که مدل کاهش‌یافته‌ی ẋ = −x + x² می‌گوید روی آن حرکت می‌کند. قضیه‌ی تیخونوف: جواب کامل در فاصله‌ی O(ε) از این تصویر دومرحله‌ای می‌ماند.")
      : T("Larger ε: the two time scales are no longer separated; trajectories cut corners and the reduced model becomes a rough approximation.",
        "ε بزرگ‌تر: دو مقیاس زمانی دیگر از هم جدا نیستند؛ مسیرها گوشه‌ها را میان‌بر می‌زنند و مدل کاهش‌یافته تقریب ضعیفی می‌شود.")
  };

  register({ "ch11-sp": sp });
})();
