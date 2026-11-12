// Chapter 4: Lyapunov stability. Examples follow Khalil, Nonlinear Systems (3rd ed.), Section 4.1-4.2.
(() => {
  "use strict";
  const { register, text, contour, makeMap, FONT, C, drawGauge } = NL;
  const S5 = Math.sqrt(5), S3 = Math.sqrt(3), PI = Math.PI;
  const pendEq = () => [[0, 0, "stable"], [PI, 0, "saddle"], [-PI, 0, "saddle"]];
  const energy = x => (1 - Math.cos(x[0])) + 0.5 * x[1] * x[1];

  // ------------------------------------------------ Example 4.1 (static): sign definiteness of x'Px
  const ex41 = {
    static: true,
    params: { a: 3 },
    controls: [
      { type: "slider", key: "a", label: "a", min: -4, max: 4, step: 0.01 },
      { type: "button", label: "a = √5", action: P => { P.a = S5; } },
      { type: "button", label: "a = −√5", action: P => { P.a = -S5; } }
    ],
    sideTitle: { en: "Eigenvalues and leading minors of P", fa: "مقادیر ویژه و minorهای پیشرو P" },
    phaseTitle: { en: "V on the plane of two eigenvectors: bowl or saddle?", fa: "شکل V روی صفحه‌ی دو بردار ویژه: کاسه یا زین؟" },
    eq: P => `V(x) = a·x1² + 2·x1·x3 + a·x2² + 4·x2·x3 + a·x3² = xᵀPx

      [ a  0  1 ]
  P = [ 0  a  2 ]        a = ${P.a.toFixed(3)}
      [ 1  2  a ]

leading minors:  a = ${P.a.toFixed(2)},   a² = ${(P.a * P.a).toFixed(2)},   a(a² − 5) = ${(P.a * (P.a * P.a - 5)).toFixed(2)}
eigenvalues:     a − √5 = ${(P.a - S5).toFixed(2)},   a = ${P.a.toFixed(2)},   a + √5 = ${(P.a + S5).toFixed(2)}`,
    caption: P => {
      const e = 1e-6;
      if (P.a > S5 + e) return { en: "a > √5: all three eigenvalues are positive, so V is positive definite (a full bowl). This V can serve as a Lyapunov function.", fa: "a > √5: هر سه مقدار ویژه مثبت‌اند، پس V مثبت معین است (یک کاسه‌ی کامل). این V می‌تواند تابع لیاپانوف باشد." };
      if (Math.abs(P.a - S5) <= e) return { en: "a = √5: one eigenvalue is zero, so V is only positive semidefinite (a bowl with a flat valley). Not enough for Theorem 4.1.", fa: "a = √5: یک مقدار ویژه صفر است، پس V فقط مثبت نیمه‌معین است (کاسه با یک «دره‌ی صاف»). برای قضیه‌ی ۴.۱ کافی نیست." };
      if (P.a < -S5 - e) return { en: "a < −√5: all eigenvalues are negative, so V is negative definite (an upside-down bowl).", fa: "a < −√5: همه‌ی مقادیر ویژه منفی‌اند، پس V منفی معین است (کاسه‌ی وارونه)." };
      if (Math.abs(P.a + S5) <= e) return { en: "a = −√5: one eigenvalue is zero, so V is negative semidefinite.", fa: "a = −√5: یک مقدار ویژه صفر است، پس V منفی نیمه‌معین است." };
      return { en: "−√5 < a < √5: the eigenvalues have mixed signs, so V is indefinite (a saddle). It goes up in some directions and down in others, so it cannot be a Lyapunov function.", fa: "−√5 < a < √5: مقادیر ویژه علامت مخالف دارند، پس V بی‌علامت است (زین). در بعضی جهت‌ها بالا و در بعضی پایین می‌رود و نمی‌تواند تابع لیاپانوف باشد." };
    },
    side(ctx, W, H, lab) {
      const P = lab.P, lams = [P.a - S5, P.a, P.a + S5], names = ["a − √5", "a", "a + √5"];
      const base = H / 2 + 10, scale = (H / 2 - 50) / (4 + S5), bw = Math.min(70, W / 5), gap = (W - 3 * bw) / 4;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, base); ctx.lineTo(W - 10, base); ctx.stroke();
      lams.forEach((l, i) => {
        const x = gap + i * (bw + gap), h = l * scale;
        ctx.fillStyle = l > 1e-6 ? C.accent : (l < -1e-6 ? C.warn : C.muted);
        ctx.fillRect(x, h > 0 ? base - h : base, bw, Math.max(Math.abs(h), 2));
        text(ctx, "λ = " + names[i], x + bw / 2, H - 14, { align: "center", color: "--ink" });
        text(ctx, l.toFixed(2), x + bw / 2, h > 0 ? base - h - 8 : base - h + 18, { align: "center", color: "--ink" });
      });
      const m = [P.a, P.a * P.a, P.a * (P.a * P.a - 5)];
      text(ctx, "leading minors: " + m.map(v => v.toFixed(2)).join(",  "), 12, 22);
    },
    drawPhase(ctx, map, lab) {
      const W = map.W, H = map.H, P = lab.P, lmin = P.a - S5, lmax = P.a + S5, R = 2, N = 90;
      const F = x => lmin * x[0] * x[0] + lmax * x[1] * x[1];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const s = -R + (i + 0.5) * 2 * R / N, t = R - (j + 0.5) * 2 * R / N, v = F([s, t]);
        ctx.globalAlpha = Math.min(Math.abs(v) / 12, 0.55);
        ctx.fillStyle = v >= 0 ? C.accent : C.warn;
        const d = window.devicePixelRatio || 1, px = k => Math.round(k * W * d / N) / d, py = k => Math.round(k * H * d / N) / d;
        ctx.fillRect(px(i), py(j), px(i + 1) - px(i), py(j + 1) - py(j));
      }
      ctx.globalAlpha = 1;
      const m = makeMap([-R, R, -R, R], W, H);
      for (const c of [-6, -3, -1, 1, 3, 6]) contour(ctx, F, c, m, c > 0 ? C.accent : C.warn, 1.5, c > 0 ? [] : [5, 4], 110);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      text(ctx, "s: eigenvector of λ = a − √5", 8, H / 2 - 8);
      text(ctx, "t: eigenvector of λ = a + √5", W / 2 + 8, 16);
      text(ctx, { en: "blue = V > 0,  orange = V < 0", fa: "آبی = V > 0،  نارنجی = V < 0" }, 8, H - 10);
    }
  };

  // ------------------------------------------------ Example 4.2: x' = -g(x)
  const ex42 = {
    mode: "line",
    lim: [-PI, PI, -1.3, 1.3],
    vmax: 2.2,
    starts: [[2.9], [-2.5], [1.2], [-0.7]],
    f: x => [-Math.sin(x[0])],
    V: x => 1 - Math.cos(x[0]),
    side: "bowl1d",
    bowlLabel: "V(x) = ∫₀ˣ g(y) dy = 1 − cos x",
    fLabel: "ẋ = −g(x) = −sin x",
    sideTitle: { en: "The bowl V(x) = ∫g: the balls only go downhill", fa: "کاسه‌ی V(x) = ∫g: توپ‌ها فقط پایین می‌آیند" },
    phaseTitle: { en: "ẋ = −g(x) and the direction of motion (Fig. 4.3 of the book)", fa: "ẋ = −g(x) و جهت حرکت (شکل ۴.۳ کتاب)" },
    eq: () => `ẋ = −g(x),   g(x) = sin(x),   D = (−π, π)
V(x) = ∫₀ˣ g(y) dy = 1 − cos(x)        > 0 for x ≠ 0
V̇(x) = g(x)·ẋ = −g(x)² = −sin²(x)     < 0 for x ≠ 0   ⇒ asymptotically stable`,
    caption: { en: "V̇ = −g² is negative everywhere except at 0, so by Theorem 4.1 the origin is asymptotically stable. On the left, every ball only rolls down the bowl.",
      fa: "V̇ = −g² همه‌جا (به‌جز صفر) منفی است، پس طبق قضیه‌ی ۴.۱ مبدأ پایدار مجانبی است. در پنل کناری هر توپ فقط روی کاسه پایین می‌آید." }
  };

  // ------------------------------------------------ Example 4.3: frictionless pendulum
  const ex43 = {
    lim: [-4, 4, -3, 3],
    vmax: 2.5,
    levels: [0.2, 0.5, 1, 1.5, 2],
    starts: [[1.2, 0], [-0.5, 1.2], [2.2, 0], [0, -0.6]],
    f: x => [x[1], -Math.sin(x[0])],
    V: energy,
    equilibria: pendEq,
    side: "pendulum",
    sideTitle: { en: "Pendulum (angle = x₁)", fa: "آونگ (زاویه = x₁)" },
    eq: () => `ẋ1 = x2
ẋ2 = −a·sin(x1)                      (a = 1)
V(x) = a(1 − cos x1) + ½·x2²         positive definite on −2π < x1 < 2π
V̇(x) = a·x2·sin(x1) − a·x2·sin(x1) = 0   ⇒ stable, NOT asymptotically stable`,
    caption: { en: "V̇ ≡ 0, so condition (4.3) holds and the origin is stable. But V stays constant, so trajectories stay on their level set V = c and never reach the origin: not asymptotically stable. The V(t) plot is perfectly flat.",
      fa: "V̇ ≡ 0، پس شرط (۴.۳) برقرار است و مبدأ پایدار است. ولی چون V ثابت می‌ماند، مسیرها روی سطح V = c می‌مانند و هیچ‌وقت به مبدأ نمی‌رسند: پایدار مجانبی نیست. نمودار V(t) کاملاً صاف است." }
  };

  // ------------------------------------------------ Example 4.4: pendulum with friction, two Lyapunov functions
  const ex44 = {
    lim: [-4, 4, -3, 3],
    vmax: 2.5,
    levels: [0.2, 0.5, 1, 1.5, 2],
    starts: [[2.2, 0], [-1.5, 1.5], [0.8, -2]],
    params: { b: 0.5, newV: false },
    controls: [
      { type: "slider", key: "b", label: { en: "friction b", fa: "اصطکاک b" }, min: 0.05, max: 1.5, step: 0.01 },
      { type: "toggle", key: "newV", labelOn: { en: "V = Khalil's new V", fa: "V = تابع جدید خلیل" }, labelOff: { en: "V = energy", fa: "V = انرژی" } }
    ],
    equilibria: pendEq,
    f: (x, P) => [x[1], -Math.sin(x[0]) - P.b * x[1]],
    V: (x, P) => {
      if (!P.newV) return energy(x);
      const p11 = P.b * P.b / 2, p12 = P.b / 2;
      return 0.5 * (p11 * x[0] * x[0] + 2 * p12 * x[0] * x[1] + x[1] * x[1]) + (1 - Math.cos(x[0]));
    },
    domainLines: [-PI, PI],
    side: "pendulum",
    sideTitle: { en: "Pendulum (angle = x₁)", fa: "آونگ (زاویه = x₁)" },
    eq: P => P.newV
      ? `ẋ1 = x2,   ẋ2 = −sin(x1) − b·x2              (b = ${P.b.toFixed(2)})
V(x) = ½ xᵀPx + (1 − cos x1),   P = [[b²/2, b/2], [b/2, 1]]
p11 = b·p12,  p22 = 1,  p12 = b/2   (cancels the sign-indefinite cross terms)
V̇(x) = −½·b·x1·sin(x1) − ½·b·x2²   negative definite on |x1| < π  ⇒ asymptotically stable`
      : `ẋ1 = x2,   ẋ2 = −sin(x1) − b·x2              (b = ${P.b.toFixed(2)})
V(x) = (1 − cos x1) + ½·x2²            (energy)
V̇(x) = −b·x2²   ≤ 0, but = 0 on the whole x1-axis   ⇒ only "stable" from Theorem 4.1`,
    caption: P => P.newV
      ? { en: "With the new V, V̇ is negative definite (the vertical lines mark the edge of D, |x₁| < π). Theorem 4.1 gives asymptotic stability. The theorem's conditions are only sufficient: the energy V failed, but the system was the same all along.",
        fa: "با V جدید، V̇ منفی معین است (خطوط عمودی = مرز D یعنی |x₁| < π). طبق قضیه‌ی ۴.۱ مبدأ پایدار مجانبی است. شرط‌های قضیه فقط کافی‌اند: V انرژی شکست خورد ولی سیستم فرقی نکرده بود." }
      : { en: "With the energy V, V̇ = −b·x₂² is only semidefinite: look for the flat steps in V(t) whenever x₂ = 0. So only \"stable\" is proved, although the trajectories clearly reach the origin. Press the button for Khalil's new V, or see LaSalle below.",
        fa: "با V انرژی، V̇ = −b·x₂² فقط نیمه‌معین است: در نمودار V(t) «پله‌های صاف» را ببین (لحظه‌هایی که x₂ = 0). پس فقط «پایدار» ثابت می‌شود، در حالی که مسیرها آشکارا به مبدأ می‌رسند. دکمه را بزن تا V جدید خلیل را ببینی، یا اصل لاسال را در پایین ببین." }
  };

  // ------------------------------------------------ Examples 4.5 / 4.6: variable gradient method
  const springSys = (h, H) => ({
    f: (x, P) => [x[1], -h(x[0]) - P.a * x[1]],
    V: (x, P) => { const ka = P.k * P.a; return 0.5 * (ka * P.a * x[0] * x[0] + 2 * ka * x[0] * x[1] + x[1] * x[1]) + H(x[0]); }
  });
  const ak = [
    { type: "slider", key: "a", label: { en: "damping a", fa: "میرایی a" }, min: 0.2, max: 2, step: 0.01 },
    { type: "slider", key: "k", label: "k", min: 0.05, max: 0.95, step: 0.01 }
  ];

  const s45 = springSys(y => y - y * y * y / 3, y => y * y / 2 - y * y * y * y / 12);
  const ex45 = {
    ...s45,
    lim: [-3, 3, -3, 3],
    vmax: 2,
    levels: [0.1, 0.25, 0.5, 0.75],
    starts: [[1.4, 0.6], [-1.2, -0.8], [0.5, 1.4], [2.2, 1.2]],
    params: { a: 1, k: 0.5 },
    controls: ak,
    equilibria: () => [[0, 0, "stable"], [S3, 0, "saddle"], [-S3, 0, "saddle"]],
    domainLines: [-S3, S3],
    side: "spring",
    sideTitle: { en: "Mass with nonlinear spring h(x₁) and damping a", fa: "جرم با فنر غیرخطی h(x₁) و میرایی a" },
    phaseTitle: { en: "Phase plane: thick curve = region-of-attraction estimate Ω_c", fa: "صفحه‌ی فاز: خط ضخیم = تخمین ناحیه‌ی جذب Ω_c" },
    // largest c with {V <= c} inside D = {|x1| < sqrt(3)}
    onParams(P, lab) {
      let m = Infinity;
      for (const s of [S3, -S3]) for (let x2 = -6; x2 <= 6; x2 += 0.005) m = Math.min(m, s45.V([s, x2], P));
      lab.roa = m * 0.999;
    },
    shades: (P, lab) => [{ when: x => Math.abs(x[0]) < S3 && s45.V(x, P) <= lab.roa, color: "--shade" }],
    contours: (P, lab) => [{ F: x => Math.abs(x[0]) < S3 ? s45.V(x, P) : 99, c: lab.roa, color: "--accent", width: 2.6 }],
    eq: P => `ẋ1 = x2,   ẋ2 = −h(x1) − a·x2,   h(y) = y − y³/3      (a = ${P.a.toFixed(2)}, k = ${P.k.toFixed(2)})
g(x) = ∇V = [ k a² x1 + h(x1) + k a x2 ,  k a x1 + x2 ]      (Jacobian of g is symmetric)
V(x) = ½ xᵀ [[k a², k a],[k a, 1]] x + ∫₀^x1 h(y) dy
V̇(x) = −a(1 − k)·x2² − a·k·x1·h(x1)   negative definite on D = {−√3 < x1 < √3}`,
    caption: { en: "Trajectories that start inside Ω_c (thick curve) all reach the origin. A trajectory that starts outside D may pass a saddle point and leave: the result is only local. Ω_c is a conservative estimate; the true region of attraction is larger.",
      fa: "مسیرهایی که داخل Ω_c (خط ضخیم) شروع می‌شوند همگی به مبدأ می‌رسند. مسیری که بیرون D شروع شود ممکن است از نقطه‌ی زین رد شود و دور شود: نتیجه فقط محلی است. Ω_c تخمینی محافظه‌کارانه است؛ ناحیه‌ی جذب واقعی بزرگ‌تر است." }
  };

  const ex46 = {
    ...springSys(y => y + y * y * y, y => y * y / 2 + y * y * y * y / 4),
    lim: [-4, 4, -4, 4],
    vmax: 30,
    levels: [0.5, 2, 5, 10, 20, 40],
    starts: [[3.8, 3.5], [-3.8, 2], [3, -3.8], [-2, -3.8]],
    params: { a: 1, k: 0.5 },
    controls: ak,
    equilibria: () => [[0, 0, "stable"]],
    side: "spring",
    sideTitle: { en: "Mass with spring h(x₁) = x₁ + x₁³", fa: "جرم با فنر h(x₁) = x₁ + x₁³" },
    phaseTitle: { en: "Phase plane: every level set of V is closed", fa: "صفحه‌ی فاز: همه‌ی سطوح تراز V بسته‌اند" },
    eq: P => `ẋ1 = x2,   ẋ2 = −h(x1) − a·x2,   h(y) = y + y³          (a = ${P.a.toFixed(2)}, k = ${P.k.toFixed(2)})
V(x) = ½ xᵀ [[k a², k a],[k a, 1]] x + ∫₀^x1 h(y) dy     → ∞ as ‖x‖ → ∞
V̇(x) = −a(1 − k)·x2² − a·k·x1·h(x1)   < 0 for all x ≠ 0 in R²
⇒ Theorem 4.2: the origin is globally asymptotically stable`,
    caption: { en: "Click anywhere on the phase plane, even the corners: every trajectory reaches the origin. Note that global stability needs a unique equilibrium, which is why it is not even asked for the pendulum.",
      fa: "روی صفحه‌ی فاز هر جا کلیک کن، حتی گوشه‌ها: همه‌ی مسیرها به مبدأ می‌رسند. نکته: پایداری سراسری یعنی سیستم فقط یک نقطه‌ی تعادل دارد؛ برای همین برای آونگ (که چند نقطه‌ی تعادل دارد) مطرح نیست." }
  };

  // ------------------------------------------------ Figure 4.4: radial unboundedness (static)
  const Vr = x => x[0] * x[0] / (1 + x[0] * x[0]) + x[1] * x[1];
  const fig44 = {
    static: true,
    lim: [-6, 6, -2, 2],
    aspect: 1.5,
    V: Vr,
    levels: [0.2, 0.5, 0.8, 1, 1.3, 1.8],
    params: { c: 0.6 },
    controls: [{ type: "slider", key: "c", label: "c", min: 0.05, max: 2, step: 0.01 }],
    shades: P => [{ when: x => Vr(x) <= P.c, color: "--shade" }],
    contours: P => [{ F: Vr, c: P.c, color: "--accent", width: 2.6 }],
    sideTitle: { en: "V along the x₁-axis (x₂ = 0): it never exceeds 1", fa: "V روی محور x₁ (x₂ = 0): هرگز از ۱ بیشتر نمی‌شود" },
    phaseTitle: { en: "Level sets V(x) = c and the set Ω_c (shaded)", fa: "سطوح تراز V(x) = c و مجموعه‌ی Ω_c (سایه)" },
    eq: P => `V(x) = x1²/(1 + x1²) + x2²
lim inf over ‖x‖ ≥ r, r → ∞  =  1        ⇒ Ω_c bounded only for c < 1
c = ${P.c.toFixed(2)}  →  Ω_c is ${P.c < 1 ? "BOUNDED (closed curve)" : "UNBOUNDED (open, extends to infinity)"}`,
    caption: P => P.c < 1
      ? { en: "c < 1: the level set V = c is a closed curve and Ω_c (shaded) fits inside a ball. Drag c past 1.", fa: "c < 1: سطح V = c یک منحنی بسته است و Ω_c (سایه) داخل یک گوی قرار دارد. اسلایدر c را از ۱ رد کن." }
      : { en: "c ≥ 1: the level set V = c is no longer closed and Ω_c runs off to infinity along x₁. This is why Theorem 4.2 asks for radial unboundedness (4.6).", fa: "c ≥ 1: سطح V = c دیگر بسته نیست و Ω_c تا بی‌نهایت (در جهت x₁) ادامه دارد. برای همین قضیه‌ی ۴.۲ شرط بی‌کرانی شعاعی (۴.۶) را می‌خواهد." },
    side(ctx, W, H, lab) {
      const P = lab.P, xm = 6, toP = (x, y) => [(x + xm) / (2 * xm) * (W - 20) + 10, H - 36 - y / 1.4 * (H - 76)];
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.warn; ctx.lineWidth = 1.5;
      const [p0x, p0y] = toP(-xm, 1), [p1x] = toP(xm, 1);
      ctx.beginPath(); ctx.moveTo(p0x, p0y); ctx.lineTo(p1x, p0y); ctx.stroke(); ctx.restore();
      text(ctx, { en: "limit = 1", fa: "حد = ۱" }, p1x - 6, p0y - 6, { align: "right", color: "--warn" });
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = -xm + 2 * xm * i / 300, [px, py] = toP(x, x * x / (1 + x * x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      const [cx0, cy0] = toP(-xm, P.c), [cx1] = toP(xm, P.c);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx1, cy0); ctx.stroke();
      text(ctx, "c = " + P.c.toFixed(2), cx0 + 4, cy0 - 6, { color: "--ink" });
      text(ctx, "V(x₁, 0) = x₁²/(1 + x₁²)", 12, 20);
    }
  };

  // ------------------------------------------------ Example 4.7: Chetaev instability
  const Vch = x => 0.5 * (x[0] * x[0] - x[1] * x[1]);
  const ex47 = {
    lim: [-2, 2, -2, 2],
    vmax: 1.5,
    levels: [-0.3, -0.1, 0.1, 0.3],
    starts: [[0.08, 0.02], [-0.08, -0.03], [0.05, -0.04], [-0.06, 0.05]],
    params: { r: 0.9 },
    equilibria: () => [[0, 0, "unstable"]],
    f: x => [x[0] + 0.5 * x[0] * x[1], -x[1] + 0.5 * x[0] * x[0]],
    V: Vch,
    series: [{ f: x => Math.hypot(x[0], x[1]), label: "‖x(t)‖" }],
    timeTitle: { en: "‖x(t)‖: every trajectory leaves the ball (dashed line = r)", fa: "‖x(t)‖: همه‌ی مسیرها از گوی خارج می‌شوند (خط‌چین = r)" },
    timeRefs: P => [{ y: P.r, label: "r", color: "--warn" }],
    tlim: [0, 2.5],
    shades: P => [{ when: x => Vch(x) > 0 && Math.hypot(x[0], x[1]) < P.r, color: "--shade2" }],
    drawBg(ctx, map, lab) {
      const r = lab.P.r, cx = map.X(0), cy = map.Y(0), rx = map.X(r) - cx, ry = cy - map.Y(r);
      ctx.save(); ctx.strokeStyle = C.warn; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      text(ctx, "B_r", cx + rx * 0.74, cy - ry * 0.74, { color: "--warn" });
      text(ctx, "U (V > 0)", cx + rx * 0.3, cy + 4, { color: "--warn" });
    },
    side(ctx, W, H, lab) {
      const t = lab.trajs[0], P = lab.P, n = Math.hypot(t.x[0], t.x[1]);
      text(ctx, `x₁ = ${t.x[0].toFixed(3)},  x₂ = ${t.x[1].toFixed(3)}`, 14, 26, { color: "--ink", font: `14px ${FONT}` });
      text(ctx, `‖x‖ = ${n.toFixed(3)}   (r = ${P.r})`, 14, 48, { color: "--ink", font: `14px ${FONT}` });
      const inU = Vch(t.x) > 0 && n < P.r;
      const s = inU ? { en: "inside U: V̇ > 0, V rising", fa: "داخل U: V̇ > 0 و V بالا می‌رود" } : (n >= P.r ? { en: "LEFT the ball B_r", fa: "از گوی B_r خارج شد" } : { en: "outside U", fa: "بیرون U" });
      text(ctx, s, 14, 82, { color: inU ? "--warn" : "--ok", font: `bold 16px ${FONT}` });
      drawGauge(ctx, W, H, lab);
    },
    sideTitle: { en: "V(x(t)) for the thick trajectory: inside U it only rises", fa: "V(x(t)) برای مسیر ضخیم: داخل U فقط بالا می‌رود" },
    phaseTitle: { en: "Phase plane: shaded = the set U = {V > 0} inside the ball B_r", fa: "صفحه‌ی فاز: سایه = مجموعه‌ی U = {V > 0} داخل گوی B_r" },
    eq: () => `ẋ1 =  x1 + g1(x),   g1 = 0.5·x1·x2
ẋ2 = −x2 + g2(x),   g2 = 0.5·x1²          |gi(x)| ≤ k‖x‖²,  k = 0.5
V(x) = ½(x1² − x2²)                  U = {x in B_r : V(x) > 0},  r < 1/(2k) = 1
V̇(x) = x1² + x2² + x1·g1 − x2·g2  ≥  ‖x‖²(1 − 2k‖x‖)  > 0 in U   ⇒ origin unstable`,
    caption: { en: "Trajectories start very close to the origin inside U (shaded) and every one of them leaves the ball B_r, however close it starts. That breaks the definition of stability: the origin is unstable.",
      fa: "مسیرها از نقطه‌ای بسیار نزدیک به مبدأ داخل U (سایه) شروع می‌شوند و همگی از دایره‌ی B_r خارج می‌شوند، هر قدر هم نزدیک شروع کنند. این یعنی تعریف پایداری نقض شده: مبدأ ناپایدار است." }
  };

  // ------------------------------------------------ Application: robot dog
  const dog = {
    lim: [-4, 4, -4, 4],
    vmax: 4,
    levels: [0.25, 0.5, 1, 2, 3],
    starts: [[0.35, 0.6], [2.5, 0.5], [-2, 1.8]],
    params: { b: 0.3, on: true },
    controls: [
      { type: "toggle", key: "on", labelOn: { en: "Controller: ON", fa: "کنترلر: روشن" }, labelOff: { en: "Controller: OFF", fa: "کنترلر: خاموش" } },
      { type: "button", label: { en: "Push the dog", fa: "هل دادن ربات" }, action: (P, lab) => { const d = lab.trajs[0]; if (d && !d.fallen) d.x[1] += (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.6); } },
      { type: "button", label: { en: "Reset dog", fa: "بلند کردن ربات" }, action: (P, lab) => { lab.trajs[0] = lab.makeTraj([0.35, 0.6]); } },
      { type: "slider", key: "b", label: { en: "damping b", fa: "میرایی b" }, min: 0, max: 1, step: 0.01 }
    ],
    equilibria: P => [[0, 0, P.on ? "stable" : "saddle"]],
    f: (x, P) => P.on ? [x[1], -Math.sin(x[0]) - P.b * x[1]] : [x[1], Math.sin(x[0])],
    V: energy,
    fallAngle: PI / 2,
    onStep(t) { if (Math.abs(t.x[0]) >= PI / 2) { t.x = [Math.sign(t.x[0]) * PI / 2, 0]; t.fallen = true; } },
    domainLines: [-PI / 2, PI / 2],
    domainLabel: { en: "fallen", fa: "افتادن" },
    side: "dog",
    sideTitle: { en: "Robot dog (front view): tilt = x₁", fa: "سگ ربات (نمای جلو): کج شدن = x₁" },
    phaseTitle: { en: "Phase plane: red dashed lines = falling over", fa: "صفحه‌ی فاز: خط‌چین قرمز = افتادن" },
    eq: P => P.on
      ? `Controller ON:  u = −2·sin(x1) − b·x2           (b = ${P.b.toFixed(2)})
ẋ1 = x2,   ẋ2 = −sin(x1) − b·x2          (a bowl: upright is the bottom)
V(x) = (1 − cos x1) + ½·x2²               (distance from standing)
V̇ = −b·x2²  ≤ 0`
      : `Controller OFF:  u = 0
ẋ1 = x2,   ẋ2 = +sin(x1)                  (a hill: upright is the top)
V(x) = (1 − cos x1) + ½·x2²
V̇ = 2·x2·sin(x1)                         (can be positive: V can go UP)`,
    caption: (P, lab) => {
      const d = lab.trajs[0];
      if (d && d.fallen) return { en: "The dog fell: V rose until it hit the ground. Turn the controller on and press Reset dog.", fa: "ربات افتاد: V بالا رفت تا به زمین رسید. کنترلر را روشن کن و «بلند کردن ربات» را بزن." };
      if (!P.on) return { en: "Controller off: standing is the top of a hill (a saddle). One small push and V goes up: the robot falls.", fa: "کنترلر خاموش: ایستادن قله‌ی تپه (زین) است. یک هل کوچک و V بالا می‌رود: ربات می‌افتد." };
      if (P.b === 0) return { en: "Controller on but b = 0: the bowl is there but energy never drains, so the robot sways forever. Stable, not asymptotically stable (like Example 4.3).", fa: "کنترلر روشن ولی b = 0: کاسه ساخته شده ولی انرژی کم نمی‌شود، پس ربات تا ابد تاب می‌خورد. پایدار است ولی پایدار مجانبی نیست (مثل مثال ۴.۳)." };
      return { en: "Controller on: V̇ = −b·x₂² ≤ 0, so the distance from standing never grows and the robot always comes back (like Example 4.4). Press Push the dog.", fa: "کنترلر روشن: V̇ = −b·x₂² ≤ 0، پس فاصله از ایستادن هیچ‌وقت زیاد نمی‌شود و ربات همیشه برمی‌گردد (مثل مثال ۴.۴). دکمه‌ی «هل دادن ربات» را بزن." };
    }
  };

  // ------------------------------------------------ Section 4.2: LaSalle's invariance principle
  const lasalle = {
    lim: [-4, 4, -3, 3],
    vmax: 2.5,
    levels: [0.2, 0.5, 1, 1.5, 2],
    starts: [[2.4, 0], [-1, 2]],
    params: { b: 0.4 },
    controls: [{ type: "slider", key: "b", label: { en: "friction b", fa: "اصطکاک b" }, min: 0.05, max: 1.5, step: 0.01 }],
    f: (x, P) => [x[1], -Math.sin(x[0]) - P.b * x[1]],
    V: energy,
    equilibria: pendEq,
    curves: () => [{ pts: [[-4, 0], [4, 0]], color: "--warn", width: 3, label: "E = {V̇ = 0} = {x₂ = 0}", labelAt: [-3.9, 0.05] }],
    side: "pendulum",
    sideTitle: { en: "Pendulum: each time it stops at a turning point, x₂ = 0", fa: "آونگ: هر بار که در نقطه‌ی برگشت می‌ایستد، x₂ = 0" },
    phaseTitle: { en: "Thick orange line: the set E where V̇ = 0", fa: "خط نارنجی ضخیم: مجموعه‌ی E که در آن V̇ = 0" },
    eq: P => `ẋ1 = x2,   ẋ2 = −sin(x1) − b·x2      (b = ${P.b.toFixed(2)})
V = (1 − cos x1) + ½x2²,    V̇ = −b·x2² ≤ 0
E = {x : V̇ = 0} = {x2 = 0}
on E:  x2 ≡ 0  ⇒  ẋ2 = −sin x1 ≡ 0  ⇒  x1 = 0   (inside |x1| < π)
largest invariant set in E = {0}   ⇒  asymptotically stable (Corollary 4.1)`,
    caption: { en: "Trajectories cross the orange line E but cannot stay on it, except at the origin: a state with x₂ = 0 and x₁ ≠ 0 has ẋ₂ = −sin x₁ ≠ 0, so it leaves E at once. LaSalle then proves convergence with the same energy V that failed in Example 4.4.",
      fa: "مسیرها خط نارنجی E را قطع می‌کنند ولی نمی‌توانند روی آن بمانند، مگر در مبدأ: حالتی با x₂ = 0 و x₁ ≠ 0 دارای ẋ₂ = −sin x₁ ≠ 0 است و فوراً از E خارج می‌شود. پس لاسال با همان V انرژی که در مثال ۴.۴ شکست خورد، همگرایی را ثابت می‌کند." }
  };

  register({ "ch4-ex41": ex41, "ch4-ex42": ex42, "ch4-ex43": ex43, "ch4-ex44": ex44, "ch4-ex45": ex45, "ch4-ex46": ex46, "ch4-fig44": fig44, "ch4-ex47": ex47, "ch4-dog": dog, "ch4-lasalle": lasalle });
})();
