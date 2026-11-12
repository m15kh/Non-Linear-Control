package main

import "strings"

var languages = []string{"fa", "en"}

func validLang(l string) bool { return l == "fa" || l == "en" }

func otherLang(l string) string {
	if l == "fa" {
		return "en"
	}
	return "fa"
}

func langDir(l string) string {
	if l == "fa" {
		return "rtl"
	}
	return "ltr"
}

// ui holds the interface strings used by the templates.
var ui = map[string]map[string]string{
	"fa": {
		"langName":      "فارسی",
		"siteTitle":     "کنترل غیرخطی، تصویری",
		"tagline":       "همراه تعاملی کتاب «سیستم‌های غیرخطی» خلیل",
		"heroLead":      "هر فصل کتاب خلیل با شکل‌های زنده: پارامترها را تغییر بده، روی صفحه‌ی فاز کلیک کن و ببین مفهوم‌ها واقعاً چه معنایی دارند.",
		"start":         "شروع از فصل ۱",
		"chapters":      "فصل‌ها",
		"chapter":       "فصل",
		"home":          "خانه",
		"contents":      "در این فصل",
		"read":          "خوانده شده",
		"labs":          "شکل تعاملی",
		"prev":          "فصل قبل",
		"next":          "فصل بعد",
		"switchLang":    "English",
		"theme":         "تغییر پوسته",
		"howTitle":      "چطور از این سایت استفاده کنی",
		"how1":          "کنار کتاب بخوان. هر صفحه همان ترتیب و شماره‌ی مثال‌های کتاب را دارد.",
		"how2":          "در هر شکل روی صفحه‌ی فاز کلیک کن تا مسیر جدیدی از همان نقطه شروع شود.",
		"how3":          "اسلایدرها را حرکت بده و قبل از دیدن نتیجه حدس بزن چه اتفاقی می‌افتد.",
		"bookNote":      "بر اساس کتاب «سیستم‌های غیرخطی» نوشته‌ی حسن خلیل، ویرایش سوم. این سایت یک منبع آموزشی مستقل است و وابسته به ناشر یا نویسنده‌ی کتاب نیست.",
		"madeBy":        "ساخته‌شده توسط",
		"github":        "گیت‌هاب",
		"website":       "وب‌سایت شخصی",
		"notFoundTitle": "صفحه پیدا نشد",
		"notFoundBody":  "این صفحه وجود ندارد. شاید شماره‌ی فصل اشتباه است.",
		"backHome":      "بازگشت به خانه",
		"skip":          "رفتن به محتوا",
	},
	"en": {
		"langName":      "English",
		"siteTitle":     "Nonlinear Control, Visualized",
		"tagline":       "An interactive companion to Khalil's Nonlinear Systems",
		"heroLead":      "Every chapter of Khalil's book with live figures: move the parameters, click the phase plane, and see what the concepts actually mean.",
		"start":         "Start with Chapter 1",
		"chapters":      "Chapters",
		"chapter":       "Chapter",
		"home":          "Home",
		"contents":      "In this chapter",
		"read":          "read",
		"labs":          "interactive figures",
		"prev":          "Previous chapter",
		"next":          "Next chapter",
		"switchLang":    "فارسی",
		"theme":         "Toggle theme",
		"howTitle":      "How to use this site",
		"how1":          "Read it next to the book. Each page follows the book's order and example numbers.",
		"how2":          "In every figure, click the phase plane to start a new trajectory from that point.",
		"how3":          "Move the sliders, and guess what will happen before you look.",
		"bookNote":      "Based on H. K. Khalil, Nonlinear Systems, 3rd edition. This is an independent study resource, not affiliated with the author or publisher.",
		"madeBy":        "Made by",
		"github":        "GitHub",
		"website":       "Personal website",
		"notFoundTitle": "Page not found",
		"notFoundBody":  "This page does not exist. The chapter number may be wrong.",
		"backHome":      "Back to home",
		"skip":          "Skip to content",
	},
}

var faDigits = strings.NewReplacer("0", "۰", "1", "۱", "2", "۲", "3", "۳", "4", "۴", "5", "۵", "6", "۶", "7", "۷", "8", "۸", "9", "۹")

// localNum writes digits in the script of the given language.
func localNum(lang, s string) string {
	if lang == "fa" {
		return faDigits.Replace(s)
	}
	return s
}

// pickLang chooses a language from a cookie value or an Accept-Language header.
// Persian is the default because most readers of the site are Persian speaking.
func pickLang(cookie, acceptLanguage string) string {
	if validLang(cookie) {
		return cookie
	}
	for _, part := range strings.Split(acceptLanguage, ",") {
		tag := strings.ToLower(strings.TrimSpace(strings.SplitN(part, ";", 2)[0]))
		switch {
		case strings.HasPrefix(tag, "fa"):
			return "fa"
		case strings.HasPrefix(tag, "en"):
			return "en"
		}
	}
	return "fa"
}
