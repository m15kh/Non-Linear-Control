// Chapter 2: second-order systems. Pendulum with torque, mass-spring-damper, Van der Pol.
(() => {
  "use strict";
  const { register, text, FONT, C, LANG } = NL;
  const PI = Math.PI;
  const wrapPi = t => ((t + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;

  // equilibrium type from the trace and determinant of the Jacobian
  function classify(tr, det) {
    const e = 1e-9;
    if (det < -e) return { en: "saddle", fa: "زین", kind: "saddle" };
    if (Math.abs(det) <= e) return { en: "degenerate (non-isolated)", fa: "تبهگن (غیرمنزوی)", kind: "unstable" };
    if (Math.abs(tr) <= e) return { en: "center", fa: "مرکز", kind: "center" };
    const st = tr < 0, disc = tr * tr - 4 * det;
    if (disc < 0) return st ? { en: "stable focus", fa: "کانون پایدار", kind: "stable" } : { en: "unstable focus", fa: "کانون ناپایدار", kind: "unstable" };
    return st ? { en: "stable node", fa: "گره پایدار", kind: "stable" } : { en: "unstable node", fa: "گره ناپایدار", kind: "unstable" };
  }
  function eigs(tr, det) {
    const d = tr * tr - 4 * det;
    if (d >= 0) { const s = Math.sqrt(d); return [[(tr + s) / 2, 0], [(tr - s) / 2, 0]]; }
    const s = Math.sqrt(-d) / 2; return [[tr / 2, s], [tr / 2, -s]];
  }
  const fx = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−");
  const fmtC = ([re, im]) => Math.abs(im) < 1e-9 ? fx(re) : fx(re) + (im > 0 ? " + " : " − ") + Math.abs(im).toFixed(2) + "j";
  const T = (en, fa) => LANG === "fa" ? fa : en;

  // ------------------------------------------------ pendulum with friction and input torque
  function pendEquilibria(P) {
    if (Math.abs(P.T) > P.a + 1e-9) return [];
    const t1 = Math.asin(P.T / P.a), t2 = wrapPi(PI - t1);
    const list = Math.abs(t1 - t2) < 1e-6 ? [t1] : [t1, t2];
    return list.map(t => { const det = P.a * Math.cos(t), tr = -P.b; return { t, cl: classify(tr, det), ev: eigs(tr, det) }; });
  }
  const pend = {
    lim: [-7.6, 7.6, -3.6, 3.6],
    aspect: 1.3,
    axes: { x: "θ", y: "ω", pi: true },
    params: { b: 0.25, a: 1, T: 0 },
    controls: [
      { type: "slider", key: "b", label: { en: "damping b", fa: "میرایی b" }, min: 0, max: 1.5, step: 0.05 },
      { type: "slider", key: "a", label: { en: "a = g/l", fa: "a = g/l" }, min: 0.5, max: 3, step: 0.1 },
      { type: "slider", key: "T", label: { en: "input torque T", fa: "گشتاور ورودی T" }, min: -2, max: 2, step: 0.05 }
    ],
    starts: [[2.5, 0]],
    f: (x, P) => [x[1], -P.a * Math.sin(x[0]) - P.b * x[1] + P.T],
    V: (x, P) => P.a * (1 - Math.cos(x[0])) + 0.5 * x[1] * x[1],
    vmax: P => 3 * P.a,
    wrap: { period: 2 * PI, max: 2 * PI + 1.1 },
    series: [{ f: x => wrapPi(x[0]), label: "θ(t)" }],
    tlim: [-PI, PI],
    timeTitle: { en: "Angle θ(t), wrapped to (−π, π]", fa: "زاویه‌ی θ(t)، در بازه‌ی (−π, π]" },
    equilibria: P => {
      const out = [];
      for (const e of pendEquilibria(P)) for (let k = -1; k <= 1; k++) out.push([e.t + 2 * k * PI, 0, e.cl.kind]);
      return out;
    },
    side: "pendulum",
    sideOpts: (P, lab) => ({ u: P.T, uLabel: "T" }),
    sideTitle: { en: "Pendulum (bar on the right = energy V)", fa: "آونگ (نوار سمت راست = انرژی V)" },
    phaseTitle: { en: "Phase plane: angle θ and angular velocity ω", fa: "صفحه‌ی فاز: زاویه‌ی θ و سرعت زاویه‌ای ω" },
    eq: P => `θ̈ = −a·sin θ − b·θ̇ + T        a = ${P.a.toFixed(2)},  b = ${P.b.toFixed(2)},  T = ${P.T.toFixed(2)}
x1 = θ,  x2 = ω:     ẋ1 = x2,   ẋ2 = −a·sin x1 − b·x2 + T
equilibria:  sin θ* = T/a   (exist only while |T| ≤ a)`,
    caption: P => {
      const eqs = pendEquilibria(P);
      if (!eqs.length) return T("No equilibrium at all, because |T| > a: the input torque is larger than anything gravity can push back with, so the pendulum keeps spinning. Two equilibria met and disappeared: a saddle-node bifurcation.",
        "هیچ نقطه‌ی تعادلی وجود ندارد چون |T| > a: گشتاور ورودی از بیشترین گشتاوری که گرانش می‌تواند بدهد بیشتر است، پس آونگ مدام می‌چرخد. دو نقطه‌ی تعادل به هم رسیدند و از بین رفتند: دوشاخگی زین-گره.");
      let s = eqs.map(e => `${NL.tr(e.cl)} ${T("at", "در")} θ* = ${fx(e.t)} (${Math.round(e.t * 180 / PI)}°), λ = ${fmtC(e.ev[0])}, ${fmtC(e.ev[1])}`).join("   ·   ");
      if (P.b === 0) s += T(".  With b = 0 linearization says \"center\", which is not conclusive for a nonlinear system; here the energy is conserved, so the orbits really are closed.",
        ".  با b = 0 خطی‌سازی «مرکز» می‌دهد که برای سیستم غیرخطی کافی نیست؛ اینجا چون انرژی ثابت می‌ماند، مسیرها واقعاً بسته‌اند.");
      else if (Math.abs(P.T) > 0.85 * P.a) s += T(".  The two equilibria are close: a little more torque and they merge and vanish.", ".  دو نقطه‌ی تعادل به هم نزدیک شده‌اند: کمی دیگر T را زیاد کنی، به هم می‌رسند و از بین می‌روند.");
      return s;
    }
  };

  // ------------------------------------------------ mass-spring-damper: every linear equilibrium type
  const msd = {
    lim: [-3, 3, -3, 3],
    params: { k: 2, c: 0.5 },
    controls: [
      { type: "slider", key: "k", label: { en: "spring k", fa: "سختی فنر k" }, min: -1, max: 4, step: 0.1 },
      { type: "slider", key: "c", label: { en: "damping c", fa: "میرایی c" }, min: 0, max: 4, step: 0.05 }
    ],
    starts: [[2, 0]],
    f: (x, P) => [x[1], -P.k * x[0] - P.c * x[1]],
    V: (x, P) => 0.5 * P.k * x[0] * x[0] + 0.5 * x[1] * x[1],
    vmax: P => Math.max(2, 4.5 * Math.abs(P.k) + 2),
    series: [{ f: x => x[0], label: "x(t)" }],
    tlim: [-3, 3],
    timeTitle: { en: "Position x(t)", fa: "مکان x(t)" },
    axes: { x: "x", y: "v" },
    equilibria: P => [[0, 0, classify(-P.c, P.k).kind]],
    side: "msd",
    sideOpts: P => ({
      xmax: 3,
      springColor: P.k < 0 ? "--warn" : "--ink",
      springText: P.k < 0 ? { en: "negative spring: pushes the mass away", fa: "فنر منفی: جرم را دور می‌کند" } : "",
      dampColor: P.c > 0 ? "--accent" : "--muted",
      dampText: P.c > 0 ? "" : { en: "no damping", fa: "بدون میرایی" },
      inset(ctx, W, H) {
        // eigenvalues on the complex plane
        const w = 132, h = 92, x0 = W - w - 8, y0 = 8, ev = eigs(-P.c, P.k);
        const m = Math.max(2.5, 1.2 * Math.max(...ev.map(e => Math.max(Math.abs(e[0]), Math.abs(e[1])))));
        const X = v => x0 + w / 2 + v / m * (w / 2 - 8), Y = v => y0 + h / 2 - v / m * (h / 2 - 8);
        ctx.fillStyle = C.bg; ctx.fillRect(x0, y0, w, h);
        ctx.globalAlpha = 0.14; ctx.fillStyle = C.ok; ctx.fillRect(x0, y0, w / 2, h); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y0 + h / 2); ctx.lineTo(x0 + w, y0 + h / 2); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h); ctx.stroke();
        ctx.strokeStyle = C.traj; ctx.lineWidth = 2.4;
        ev.forEach(([re, im]) => { const x = X(re), y = Y(im); ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); });
        text(ctx, "Re", x0 + w - 4, y0 + h / 2 - 4, { align: "right", font: `italic 11px ${FONT}` });
        text(ctx, "Im", x0 + w / 2 + 4, y0 + 12, { font: `italic 11px ${FONT}` });
      }
    }),
    sideTitle: { en: "Mass, spring and damper (inset: eigenvalues; green = stable half-plane)", fa: "جرم، فنر و دمپر (کادر کوچک: مقادیر ویژه؛ سبز = نیم‌صفحه‌ی پایدار)" },
    phaseTitle: { en: "Phase plane: position x and velocity v", fa: "صفحه‌ی فاز: مکان x و سرعت v" },
    eq: P => `ẍ + c·ẋ + k·x = 0          k = ${P.k.toFixed(2)},  c = ${P.c.toFixed(2)}
A = [[0, 1], [−k, −c]],   tr A = −c,   det A = k
λ1,2 = (−c ± √(c² − 4k)) / 2  =  ${fmtC(eigs(-P.c, P.k)[0])},  ${fmtC(eigs(-P.c, P.k)[1])}`,
    caption: P => {
      const cl = classify(-P.c, P.k);
      let phys;
      if (P.k < 0) phys = T("The spring pushes instead of pulling back: one stable and one unstable direction, and almost every trajectory escapes.", "فنر به‌جای برگرداندن جرم آن را هل می‌دهد: یک جهت پایدار و یک جهت ناپایدار داریم و تقریباً هر مسیری فرار می‌کند.");
      else if (P.k === 0) phys = T("No spring: wherever the mass stops is an equilibrium.", "فنری نیست: جرم هر جا بایستد همان‌جا تعادل است.");
      else if (P.c === 0) phys = T("No damping: energy is conserved and the mass oscillates forever.", "بدون میرایی: انرژی ثابت می‌ماند و جرم تا ابد نوسان می‌کند.");
      else if (Math.abs(P.c * P.c - 4 * P.k) < 1e-6) phys = T("Critically damped: the fastest return without oscillation.", "میرایی بحرانی: سریع‌ترین برگشت بدون نوسان.");
      else if (P.c * P.c < 4 * P.k) phys = T("Underdamped: it oscillates and the amplitude shrinks.", "زیرمیرا: نوسان می‌کند و دامنه کم‌کم کوچک می‌شود.");
      else phys = T("Overdamped: it creeps back without oscillating.", "فرامیرا: بدون نوسان و آهسته به تعادل برمی‌گردد.");
      return `${NL.tr(cl)}.  ${phys}`;
    }
  };

  // ------------------------------------------------ Van der Pol oscillator
  const vdp = {
    lim: [-4.5, 4.5, -4.5, 4.5],
    params: { mu: 1 },
    controls: [{ type: "slider", key: "mu", label: "μ (ε)", min: 0, max: 3, step: 0.1 }],
    starts: [[0.3, 0], [3.8, 3]],
    f: (x, P) => [x[1], -x[0] + P.mu * (1 - x[0] * x[0]) * x[1]],
    equilibria: P => [[0, 0, P.mu === 0 ? "center" : "unstable"]],
    series: [{ f: x => x[0], label: "x(t)" }],
    tlim: [-3, 3],
    timeTitle: { en: "x(t): both start points end on the same amplitude ≈ 2", fa: "x(t): هر دو نقطه‌ی شروع به یک دامنه‌ی ≈ ۲ می‌رسند" },
    axes: { x: "x", y: "v" },
    side: "msd",
    sideOpts: (P, lab) => {
      const x = lab.trajs[0] ? lab.trajs[0].x[0] : 0, ce = -P.mu * (1 - x * x);
      if (P.mu === 0) return { xmax: 3, dampColor: "--muted", dampText: { en: "no damper", fa: "بدون دمپر" } };
      return ce < 0
        ? { xmax: 3, dampColor: "--warn", dampText: { en: "|x| < 1: negative damping, energy is pumped in", fa: "|x| < 1: میرایی منفی، انرژی اضافه می‌شود" } }
        : { xmax: 3, dampColor: "--accent", dampText: { en: "|x| > 1: positive damping, energy is drained", fa: "|x| > 1: میرایی مثبت، انرژی گرفته می‌شود" } };
    },
    sideTitle: { en: "Mass and spring with a nonlinear damper", fa: "جرم و فنر با دمپر غیرخطی" },
    phaseTitle: { en: "Phase plane: click inside and outside the loop", fa: "صفحه‌ی فاز: داخل و بیرون حلقه کلیک کن" },
    eq: P => `ẍ − μ(1 − x²)ẋ + x = 0          μ = ${P.mu.toFixed(2)}
ẋ1 = x2,   ẋ2 = −x1 + μ(1 − x1²)x2
origin: tr A = μ, det A = 1  ⇒  ${P.mu === 0 ? "center" : (P.mu < 2 ? "unstable focus" : "unstable node")}`,
    caption: P => P.mu === 0
      ? T("μ = 0 removes the damper: a plain linear oscillator, and the amplitude depends on where you start.", "μ = 0 دمپر را حذف می‌کند: یک نوسان‌ساز خطی ساده که دامنه‌اش به نقطه‌ی شروع بستگی دارد.")
      : (P.mu > 2
        ? T("Large μ: a relaxation oscillation. The state creeps along slowly and then jumps. Still the same limit cycle for every start point.", "μ بزرگ: نوسان آرام-ناگهانی. حالت مدتی آهسته حرکت می‌کند و بعد یک‌دفعه می‌پرد. باز هم همه‌ی نقاط شروع به همان چرخه‌ی حدی می‌رسند.")
        : T("The origin is unstable, yet nothing escapes: from inside and outside, every trajectory winds onto the same closed orbit, the limit cycle. A linear system cannot do this.", "مبدأ ناپایدار است ولی هیچ مسیری فرار نمی‌کند: از داخل و بیرون، همه‌ی مسیرها روی یک مدار بسته می‌پیچند، یعنی چرخه‌ی حدی. سیستم خطی نمی‌تواند چنین کاری بکند."))
  };

  // ------------------------------------------------ linear systems: pick a Jordan form
  const linCases = {
    node: { A: [[-1, 0], [0, -2.5]], name: { en: "stable node", fa: "گره پایدار" } },
    unode: { A: [[1, 0], [0, 2.5]], name: { en: "unstable node", fa: "گره ناپایدار" } },
    saddle: { A: [[1, 0], [0, -1.5]], name: { en: "saddle", fa: "زین" } },
    focus: { A: [[-0.3, 1.5], [-1.5, -0.3]], name: { en: "stable focus", fa: "کانون پایدار" } },
    ufocus: { A: [[0.25, 1.5], [-1.5, 0.25]], name: { en: "unstable focus", fa: "کانون ناپایدار" } },
    center: { A: [[0, 1.5], [-1.5, 0]], name: { en: "center", fa: "مرکز" } }
  };
  const linear = {
    lim: [-3, 3, -3, 3],
    params: { c: "focus" },
    controls: [{ type: "select", key: "c", label: { en: "case", fa: "حالت" }, options: Object.entries(linCases).map(([value, v]) => ({ value, label: v.name })) }],
    starts: P => P.c === "saddle" ? [[2.8, 2.5], [-2.8, 2.5], [2.8, -2.5], [-2.8, -2.5], [0.05, 2.8], [-0.05, -2.8]]
      : (P.c.startsWith("u") ? [[0.2, 0.1], [-0.15, 0.2], [0.1, -0.25]] : [[2.5, 2], [-2.5, 1], [1, -2.6], [-2, -2.4]]),
    f: (x, P) => { const A = linCases[P.c].A; return [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]]; },
    equilibria: P => [[0, 0, classify(linCases[P.c].A[0][0] + linCases[P.c].A[1][1], linCases[P.c].A[0][0] * linCases[P.c].A[1][1] - linCases[P.c].A[0][1] * linCases[P.c].A[1][0]).kind]],
    curves: P => {
      const A = linCases[P.c].A;
      if (A[0][1] !== 0) return [];
      return [{ pts: [[-3, 0], [3, 0]], color: "--accent", width: 1.4, dash: [6, 4] }, { pts: [[0, -3], [0, 3]], color: "--accent", width: 1.4, dash: [6, 4] }];
    },
    series: [{ f: x => Math.hypot(x[0], x[1]), label: "‖x(t)‖" }],
    tlim: [0, 4],
    timeTitle: { en: "Distance from the origin ‖x(t)‖", fa: "فاصله از مبدأ ‖x(t)‖" },
    phaseTitle: { en: "Phase portrait (dashed = eigenvector directions)", fa: "تصویر فاز (خط‌چین = جهت بردارهای ویژه)" },
    eq: P => {
      const A = linCases[P.c].A, tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0], ev = eigs(tr, det);
      return `ẋ = A x,   A = [[${A[0][0]}, ${A[0][1]}], [${A[1][0]}, ${A[1][1]}]]
λ1 = ${fmtC(ev[0])},   λ2 = ${fmtC(ev[1])}`;
    },
    caption: P => ({
      node: { en: "Two negative real eigenvalues: every trajectory goes to the origin, tangent to the slow eigenvector (the one with the smaller |λ|).", fa: "دو مقدار ویژه‌ی حقیقی منفی: همه‌ی مسیرها به مبدأ می‌روند و در نزدیکی آن بر بردار ویژه‌ی کند (|λ| کوچک‌تر) مماس می‌شوند." },
      unode: { en: "Two positive real eigenvalues: the same picture with time reversed; everything leaves the origin.", fa: "دو مقدار ویژه‌ی حقیقی مثبت: همان تصویر با زمان برعکس؛ همه از مبدأ دور می‌شوند." },
      saddle: { en: "Eigenvalues of opposite sign: only the stable eigenvector leads in; every other trajectory comes close and is thrown out along the unstable one.", fa: "مقادیر ویژه با علامت مخالف: فقط روی بردار ویژه‌ی پایدار می‌توان وارد شد؛ هر مسیر دیگری نزدیک می‌شود و در امتداد بردار ناپایدار بیرون پرتاب می‌شود." },
      focus: { en: "Complex eigenvalues with negative real part: trajectories spiral in.", fa: "مقادیر ویژه‌ی مختلط با بخش حقیقی منفی: مسیرها مارپیچی به داخل می‌روند." },
      ufocus: { en: "Complex eigenvalues with positive real part: trajectories spiral out.", fa: "مقادیر ویژه‌ی مختلط با بخش حقیقی مثبت: مسیرها مارپیچی به بیرون می‌روند." },
      center: { en: "Purely imaginary eigenvalues: closed ellipses. This is the one case linearization cannot settle for a nonlinear system.", fa: "مقادیر ویژه‌ی موهومی محض: بیضی‌های بسته. این تنها حالتی است که خطی‌سازی برای سیستم غیرخطی تکلیفش را روشن نمی‌کند." }
    })[P.c]
  };

  register({ "ch2-linear": linear, "ch2-pend": pend, "ch2-msd": msd, "ch2-vdp": vdp });
})();
