// Chapter 6: passivity. Stored energy never exceeds supplied energy.
(() => {
  "use strict";
  const { register, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;
  const Vs = (x, k) => 0.5 * k * x[0] * x[0] + 0.5 * x[1] * x[1];
  // total input force: external excitation plus optional output feedback u = -K y
  const uOf = (x, P, t) => P.A * Math.sin(P.w * t) - P.K * x[1];

  const passive = {
    mode: "time",
    dim: 4, // x, v, supplied energy S = ∫u·y dt, V(0) (constant)
    params: { A: 0.8, w: 1.3, c: 0.3, K: 0 },
    controls: [
      { type: "slider", key: "A", label: { en: "force amplitude A", fa: "دامنه‌ی نیرو A" }, min: 0, max: 2, step: 0.05, reset: true },
      { type: "slider", key: "w", label: { en: "frequency ω", fa: "فرکانس ω" }, min: 0.2, max: 3, step: 0.05, reset: true },
      { type: "slider", key: "c", label: { en: "damping c", fa: "میرایی c" }, min: 0, max: 1.5, step: 0.05, reset: true },
      { type: "slider", key: "K", label: { en: "output feedback K (u = −K·y + …)", fa: "فیدبک خروجی K (u = −K·y + …)" }, min: 0, max: 2, step: 0.05, reset: true }
    ],
    starts: () => [[1.5, 0, 0, Vs([1.5, 0], 1)]],
    f: (x, P, t) => { const u = uOf(x, P, t); return [x[1], -x[0] - P.c * x[1] + u, u * x[1], 0]; },
    tWindow: 30,
    series: [
      { f: x => Vs(x, 1) - x[3], label: { en: "stored  V(t) − V(0)", fa: "ذخیره‌شده  V(t) − V(0)" }, color: "--accent" },
      { f: x => x[2], label: { en: "supplied  ∫ u·y dt", fa: "تزریق‌شده  ∫ u·y dt" }, color: "--warn", dash: [7, 5] }
    ],
    side: "msd",
    sideOpts: P => ({ xmax: 3, dampColor: P.c > 0 ? "--accent" : "--muted", dampText: P.c > 0 ? "" : { en: "no damping: lossless", fa: "بدون میرایی: بدون اتلاف" } }),
    sideTitle: { en: "Mass-spring-damper; input = force u, output = velocity y", fa: "جرم-فنر-دمپر؛ ورودی = نیروی u، خروجی = سرعت y" },
    timeTitle: { en: "Energy balance: the solid curve can never rise above the dashed one", fa: "تراز انرژی: منحنی پر هرگز از خط‌چین بالاتر نمی‌رود" },
    readout: (t, P) => {
      const stored = Vs(t.x, 1) - t.x[3], supplied = t.x[2];
      return `stored = ${stored.toFixed(3)}   supplied = ${supplied.toFixed(3)}   dissipated = supplied − stored = ${(supplied - stored).toFixed(3)} ≥ 0`;
    },
    eq: P => `ẋ = v,   v̇ = −x − c·v + u,   y = v                     c = ${P.c.toFixed(2)}
storage  V(x, v) = ½x² + ½v²
V̇ = u·y − c·y²  ≤  u·y      ⇒  passive  (output strictly passive if c > 0)
u = A·sin(ωt) − K·y          A = ${P.A.toFixed(2)}, ω = ${P.w.toFixed(2)}, K = ${P.K.toFixed(2)}`,
    caption: P => P.c === 0 && P.K === 0
      ? T("With c = 0 the system is lossless: the two curves lie exactly on top of each other. Every joule supplied is stored.", "با c = 0 سیستم بدون اتلاف است: دو منحنی دقیقاً روی هم می‌افتند. هر ژولی که تزریق شود ذخیره می‌شود.")
      : T("The gap between the dashed and solid curves is the energy burned in the damper, ∫c·y² dt ≥ 0, so it only grows. That inequality, V(t) − V(0) ≤ ∫u·y, is the definition of passivity. Turn up K: feeding the output back negatively (u = −K·y) adds damping, which is why negative feedback of a passive system is always stable.",
        "فاصله‌ی خط‌چین و منحنی پر انرژی‌ای است که در دمپر تلف می‌شود، ∫c·y² dt ≥ 0، پس فقط زیاد می‌شود. همین نامساوی V(t) − V(0) ≤ ∫u·y تعریف پسیویتی است. K را زیاد کن: فیدبک منفی خروجی (u = −K·y) میرایی اضافه می‌کند و برای همین فیدبک منفی یک سیستم پسیو همیشه پایدار است.")
  };

  register({ "ch6-passive": passive });
})();
