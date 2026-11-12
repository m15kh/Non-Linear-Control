package main

// Text holds one string in both site languages.
type Text struct {
	FA string
	EN string
}

// In returns the string for the given language code.
func (t Text) In(lang string) string {
	if lang == "fa" {
		return t.FA
	}
	return t.EN
}

// Chapter describes one chapter of H. K. Khalil, Nonlinear Systems (3rd ed.).
// The page body lives in content/<lang>/chNN.html and the interactive labs,
// if any, in web/static/js/labs/chNN.js.
type Chapter struct {
	Num     int
	Title   Text
	Summary Text
}

var chapters = []Chapter{
	{1,
		Text{"مقدمه", "Introduction"},
		Text{"سیستم غیرخطی چیست، مدل‌های نمونه‌ی کتاب (آونگ، دیود تونلی، نوسان‌ساز مقاومت منفی) و پدیده‌هایی که فقط در سیستم‌های غیرخطی دیده می‌شوند.",
			"What makes a system nonlinear, the book's model examples (pendulum, tunnel diode, negative-resistance oscillator) and the phenomena that only nonlinear systems show."}},
	{2,
		Text{"سیستم‌های مرتبه دوم", "Second-Order Systems"},
		Text{"صفحه‌ی فاز، خطی‌سازی و انواع نقطه‌ی تعادل، چند نقطه‌ی تعادل، چرخه‌ی حدی و دوشاخگی.",
			"The phase plane, linearization and equilibrium types, multiple equilibria, limit cycles and bifurcation."}},
	{3,
		Text{"ویژگی‌های بنیادی", "Fundamental Properties"},
		Text{"وجود و یکتایی جواب، شرط لیپشیتز، زمان فرار محدود، وابستگی پیوسته به شرایط اولیه و نامساوی گرونوال.",
			"Existence and uniqueness, the Lipschitz condition, finite escape time, continuous dependence on initial conditions and the Gronwall inequality."}},
	{4,
		Text{"پایداری لیاپانوف", "Lyapunov Stability"},
		Text{"قضیه‌ی لیاپانوف، روش گرادیان متغیر، پایداری سراسری، ناپایداری (چتایف)، اصل تغییرناپذیری لاسال و پایداری ورودی-به-حالت.",
			"Lyapunov's theorem, the variable gradient method, global stability, instability (Chetaev), LaSalle's invariance principle and input-to-state stability."}},
	{5,
		Text{"پایداری ورودی-خروجی", "Input–Output Stability"},
		Text{"پایداری L، بهره‌ی L₂ و L∞، پایداری L در فضای حالت و قضیه‌ی بهره‌ی کوچک.",
			"L stability, L₂ and L∞ gain, L stability of state models and the small-gain theorem."}},
	{6,
		Text{"پسیویتی", "Passivity"},
		Text{"سیستم‌های بدون حافظه و دینامیکی پسیو، تابع ذخیره، سیستم‌های حقیقی مثبت و اتصال فیدبکی سیستم‌های پسیو.",
			"Passive memoryless and dynamical systems, storage functions, positive real systems and feedback connections of passive systems."}},
	{7,
		Text{"تحلیل حوزه‌ی فرکانس سیستم‌های فیدبک", "Frequency Domain Analysis of Feedback Systems"},
		Text{"پایداری مطلق، معیار دایره و پوپوف، و پیش‌بینی چرخه‌ی حدی با تابع توصیفی.",
			"Absolute stability, the circle and Popov criteria, and predicting limit cycles with the describing function."}},
	{8,
		Text{"تحلیل پیشرفته‌ی پایداری", "Advanced Stability Analysis"},
		Text{"نظریه‌ی خمینه‌ی مرکزی، تخمین ناحیه‌ی جذب، قضیه‌های شبه-تغییرناپذیری و پایداری جواب‌های متناوب.",
			"Center manifold theory, estimating the region of attraction, invariance-like theorems and stability of periodic solutions."}},
	{9,
		Text{"پایداری سیستم‌های اغتشاش‌یافته", "Stability of Perturbed Systems"},
		Text{"اغتشاش محوشونده و محونشونده، کران‌داری نهایی و قضیه‌ی مقایسه.",
			"Vanishing and nonvanishing perturbations, ultimate boundedness and the comparison method."}},
	{10,
		Text{"نظریه‌ی اغتشاش و میانگین‌گیری", "Perturbation Theory and Averaging"},
		Text{"روش اغتشاش منظم، میانگین‌گیری و سیستم‌های با تحریک متناوب سریع.",
			"The regular perturbation method, averaging, and systems driven by fast periodic excitation."}},
	{11,
		Text{"اغتشاشات تکین", "Singular Perturbations"},
		Text{"مدل استاندارد اغتشاش تکین، دینامیک کند و تند، خمینه‌ی کند و قضیه‌ی تیخونوف.",
			"The standard singular perturbation model, slow and fast dynamics, the slow manifold and Tikhonov's theorem."}},
	{12,
		Text{"کنترل فیدبک", "Feedback Control"},
		Text{"مسئله‌ی پایدارسازی، طراحی با خطی‌سازی، کنترل انتگرالی و ناحیه‌ای که کنترلر خطی در آن کار می‌کند.",
			"The stabilization problem, design via linearization, integral control, and the region where a linear controller works."}},
	{13,
		Text{"خطی‌سازی فیدبکی", "Feedback Linearization"},
		Text{"خطی‌سازی ورودی-حالت و ورودی-خروجی، درجه‌ی نسبی، دینامیک صفر و طراحی کنترل با حذف غیرخطی‌ها.",
			"Input-state and input-output linearization, relative degree, zero dynamics and control by cancelling the nonlinearities."}},
	{14,
		Text{"ابزارهای طراحی غیرخطی", "Nonlinear Design Tools"},
		Text{"کنترل مد لغزشی، طراحی بازطراحی لیاپانوف، بک‌استپینگ و کنترل مبتنی بر پسیویتی.",
			"Sliding mode control, Lyapunov redesign, backstepping and passivity-based control."}},
}

func chapterByNum(n int) (Chapter, int, bool) {
	for i, c := range chapters {
		if c.Num == n {
			return c, i, true
		}
	}
	return Chapter{}, -1, false
}
