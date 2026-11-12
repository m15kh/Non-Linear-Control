// Chapter 8: advanced stability analysis. Center manifold and region-of-attraction estimates.
(() => {
  "use strict";
  const { register, LANG, rk4 } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const PI = Math.PI;

  // ------------------------------------------------ center manifold: y' = yz, z' = -z + a y^2
  const cm = {
    lim: [-2, 2, -2, 2],
    axes: { x: "y", y: "z" },
    params: { a: -1 },
    controls: [{ type: "slider", key: "a", label: "a", min: -1.5, max: 1.5, step: 0.05 }],
    starts: [[1.2, 1.6], [-1.4, -1.5], [0.8, -1.8], [-0.6, 1.8]],
    f: (x, P) => [x[0] * x[1], -x[1] + P.a * x[0] * x[0]],
    equilibria: P => P.a === 0 ? [] : [[0, 0, P.a < 0 ? "stable" : "unstable"]],
    curves: P => {
      const pts = []; for (let i = 0; i <= 200; i++) { const y = -2 + 4 * i / 200; pts.push([y, P.a * y * y]); }
      return [{ pts, color: "--warn", width: 2.6, label: "z = h(y) ≈ a·y²", labelAt: [0.9, P.a * 0.81 + (P.a < 0 ? -0.35 : 0.15)] }];
    },
    tWindow: 30,
    series: [{ f: x => x[0], label: "y(t)" }],
    tlim: [-2, 2],
    timeTitle: { en: "y(t): slow motion along the center manifold", fa: "y(t): حرکت کند روی خمینه‌ی مرکزی" },
    phaseTitle: { en: "Trajectories fall fast onto the center manifold (orange), then crawl along it", fa: "مسیرها سریع روی خمینه‌ی مرکزی (نارنجی) می‌افتند، بعد آهسته روی آن می‌خزند" },
    eq: P => `ẏ = y·z
ż = −z + a·y²          a = ${P.a.toFixed(2)}
linearization: eigenvalues 0 and −1  ⇒  linearization is inconclusive
center manifold z = h(y) = a·y² + O(|y|⁴),   reduced system  ẏ = y·h(y) = a·y³ + …`,
    caption: P => P.a < 0
      ? T("a < 0: the reduced system ẏ = a·y³ is asymptotically stable, so by the reduction principle (Theorem 8.2) the origin of the full system is asymptotically stable. Convergence along the manifold is slow (like 1/√t), not exponential.",
        "a < 0: سیستم کاهش‌یافته‌ی ẏ = a·y³ پایدار مجانبی است، پس طبق اصل کاهش (قضیه‌ی ۸.۲) مبدأ سیستم کامل هم پایدار مجانبی است. همگرایی روی خمینه کند است (مثل 1/√t)، نه نمایی.")
      : (P.a > 0
        ? T("a > 0: the reduced system ẏ = a·y³ is unstable, so the origin is unstable: trajectories reach the manifold and then slide away from 0.", "a > 0: سیستم کاهش‌یافته‌ی ẏ = a·y³ ناپایدار است، پس مبدأ ناپایدار است: مسیرها به خمینه می‌رسند و بعد از صفر دور می‌شوند.")
        : T("a = 0: the whole y-axis is made of equilibria; each trajectory stops wherever it lands. Stable, but not asymptotically stable.", "a = 0: کل محور y از نقاط تعادل تشکیل شده؛ هر مسیر هر جا فرود بیاید همان‌جا می‌ایستد. پایدار است ولی پایدار مجانبی نیست."))
  };

  // ------------------------------------------------ region of attraction estimate with Lyapunov level sets
  const SYS = {
    rvdp: {
      f: x => [-x[1], x[0] + (x[0] * x[0] - 1) * x[1]],
      V: x => 1.5 * x[0] * x[0] - x[0] * x[1] + x[1] * x[1],
      g: x => [3 * x[0] - x[1], -x[0] + 2 * x[1]],
      eq: [[0, 0, "stable"]]
    },
    pend: {
      f: x => [x[1], -Math.sin(x[0]) - 0.5 * x[1]],
      V: x => 1 - Math.cos(x[0]) + 0.5 * x[1] * x[1],
      g: x => [Math.sin(x[0]), x[1]],
      eq: [[-PI, 0, "saddle"], [0, 0, "stable"], [PI, 0, "saddle"]],
      cstar: 2
    }
  };
  const vdot = (s, x) => { const g = s.g(x), f = s.f(x); return g[0] * f[0] + g[1] * f[1]; };
  const cache = {};
  function prepare(key) {
    if (cache[key]) return cache[key];
    const s = SYS[key], out = { cstar: s.cstar, roa: null };
    if (out.cstar === undefined) {
      // c* = min of V over the set where V-dot > 0
      let m = Infinity; const n = 500;
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
        const x = [-4.4 + 8.8 * i / n, -3.3 + 6.6 * j / n];
        if (x[0] * x[0] + x[1] * x[1] > 1e-4 && vdot(s, x) > 1e-9) m = Math.min(m, s.V(x));
      }
      out.cstar = m;
      // the true boundary is the unstable limit cycle = the Van der Pol limit cycle traced in forward time
      const v = x => [x[1], -x[0] + (1 - x[0] * x[0]) * x[1]];
      let x = [2, 0]; for (let k = 0; k < 4000; k++) x = rk4((y) => v(y), x, 0, 0.01);
      out.roa = []; for (let k = 0; k < 700; k++) { x = rk4((y) => v(y), x, 0, 0.01); out.roa.push(x); }
    }
    return (cache[key] = out);
  }
  const roa = {
    lim: [-4.4, 4.4, -3.3, 3.3],
    params: { sys: "rvdp", c: 0.6 },
    controls: [
      { type: "select", key: "sys", label: { en: "system", fa: "سیستم" }, options: [
        { value: "rvdp", label: { en: "reversed Van der Pol", fa: "ون‌در‌پول معکوس" } },
        { value: "pend", label: { en: "damped pendulum, V = energy", fa: "آونگ میرا، V = انرژی" } }
      ] },
      { type: "slider", key: "c", label: "c", min: 0.05, max: 3, step: 0.01 }
    ],
    starts: P => P.sys === "rvdp" ? [[0.8, 0.6]] : [[1.6, 1.2]],
    maxTrajs: 6,
    f: (x, P) => SYS[P.sys].f(x),
    V: (x, P) => SYS[P.sys].V(x),
    vmax: 3,
    onParams(P, lab) { lab.pre = prepare(P.sys); },
    equilibria: P => SYS[P.sys].eq,
    shades: (P) => [
      { when: x => vdot(SYS[P.sys], x) > 1e-9, color: "--bad", alpha: 0.5, N: 240 },
      { when: x => SYS[P.sys].V(x) <= P.c, color: "--shade" }
    ],
    levels: [0.25, 0.75, 1.25, 1.75, 2.25, 2.75],
    contours: (P, lab) => [{ F: x => SYS[P.sys].V(x), c: P.c, color: P.c <= lab.pre.cstar + 1e-9 ? "--ok" : "--warn", width: 2.8 }],
    curves: (P, lab) => lab.pre.roa ? [{ pts: lab.pre.roa, color: "--ink", width: 1.6, dash: [6, 5] }] : [],
    timeRefs: (P, lab) => [{ y: lab.pre.cstar, label: "c*", color: "--ok" }],
    phaseTitle: { en: "Yellow: V̇ > 0.  Shaded: V ≤ c.  Dashed: true boundary of the region of attraction", fa: "زرد: V̇ > 0.  سایه: V ≤ c.  خط‌چین: مرز واقعی ناحیه‌ی جذب" },
    eq: (P, lab) => P.sys === "rvdp"
      ? `ẋ1 = −x2,   ẋ2 = x1 + (x1² − 1)·x2            (Van der Pol in reverse time)
V(x) = xᵀPx = 1.5x1² − x1x2 + x2²              (from AᵀP + PA = −I)
Ω_c = {V ≤ c} is a safe estimate if  c < c* = min{ V(x) : V̇(x) = 0, x ≠ 0 } ≈ ${lab.pre.cstar.toFixed(3)}      c = ${P.c.toFixed(2)}`
      : `ẋ1 = x2,   ẋ2 = −sin x1 − 0.5·x2
V(x) = (1 − cos x1) + ½x2²,    V̇ = −0.5·x2² ≤ 0 everywhere
Ω_c is bounded and contains only the origin as equilibrium while c < c* = V(π, 0) = 2      c = ${P.c.toFixed(2)}`,
    caption: (P, lab) => {
      const ok = P.c <= lab.pre.cstar + 1e-9;
      if (ok) return T("The whole set V ≤ c lies where V can only decrease, so a trajectory that starts inside can never leave, and it ends at the origin: a valid estimate of the region of attraction. Click inside the shaded set to check.",
        "کل مجموعه‌ی V ≤ c جایی است که V فقط کم می‌شود، پس مسیری که داخلش شروع شود هرگز خارج نمی‌شود و به مبدأ می‌رسد: تخمینی معتبر از ناحیه‌ی جذب. داخل ناحیه‌ی سایه کلیک کن تا امتحان کنی.");
      return P.sys === "pend"
        ? T("For c ≥ 2 the set V ≤ c is no longer a closed region around the origin (it reaches the saddle points), so it guarantees nothing.", "برای c ≥ 2 مجموعه‌ی V ≤ c دیگر یک ناحیه‌ی بسته دور مبدأ نیست (به نقاط زین می‌رسد)، پس تضمینی نمی‌دهد.")
        : T("The boundary of this set enters the yellow region, where V increases, so the theorem gives no guarantee for this c. Note how much smaller the best estimate is than the true region (dashed): Lyapunov estimates are conservative.", "مرز این مجموعه وارد ناحیه‌ی زرد می‌شود، جایی که V زیاد می‌شود، پس قضیه برای این c تضمینی نمی‌دهد. ببین بهترین تخمین چقدر از ناحیه‌ی واقعی (خط‌چین) کوچک‌تر است: تخمین‌های لیاپانوف محافظه‌کارانه‌اند.");
    }
  };

  register({ "ch8-cm": cm, "ch8-roa": roa });
})();
