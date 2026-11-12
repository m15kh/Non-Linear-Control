// Command nonlinear-control serves "Nonlinear Control, Visualized": a bilingual
// (Persian / English) interactive companion to H. K. Khalil, Nonlinear Systems.
//
// Everything (templates, chapter pages, CSS, JavaScript) is embedded in the
// binary, so deploying is copying one file and running it.
package main

import (
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
)

//go:embed web/templates/*.html
var templateFS embed.FS

//go:embed web/static
var staticFS embed.FS

//go:embed content
var contentFS embed.FS

type server struct {
	pages   map[string]*template.Template
	content map[string]template.HTML // key: "fa/3"
	labJS   map[int]bool             // chapters that have web/static/js/labs/chNN.js
	version string                   // hash of the static files, for cache busting
	log     *slog.Logger
}

type card struct {
	Num, Labs           int
	NumLocal, LabsLocal string
	Title, Summary, URL string
}

type chapterView struct {
	card
	Content    template.HTML
	Prev, Next *card
	LabScript  string
}

type pageData struct {
	Lang, Dir, AltLang, AltURL, Path string
	Title, Description               string
	T                                map[string]string
	Version                          string
	Chapters                         []card
	Chapter                          *chapterView
	Year                             string
}

func newServer(logger *slog.Logger) (*server, error) {
	s := &server{
		pages:   map[string]*template.Template{},
		content: map[string]template.HTML{},
		labJS:   map[int]bool{},
		log:     logger,
	}

	base, err := template.ParseFS(templateFS, "web/templates/layout.html")
	if err != nil {
		return nil, err
	}
	for _, name := range []string{"home", "chapter", "notfound"} {
		t, err := template.Must(base.Clone()).ParseFS(templateFS, "web/templates/"+name+".html")
		if err != nil {
			return nil, err
		}
		s.pages[name] = t
	}

	for _, c := range chapters {
		for _, l := range languages {
			b, err := contentFS.ReadFile(fmt.Sprintf("content/%s/ch%02d.html", l, c.Num))
			if err != nil {
				return nil, fmt.Errorf("chapter %d (%s): %w", c.Num, l, err)
			}
			// Chapter bodies are our own trusted files, written as HTML.
			s.content[fmt.Sprintf("%s/%d", l, c.Num)] = template.HTML(b)
		}
		if _, err := fs.Stat(staticFS, fmt.Sprintf("web/static/js/labs/ch%02d.js", c.Num)); err == nil {
			s.labJS[c.Num] = true
		}
	}

	h := sha256.New()
	var files []string
	fs.WalkDir(staticFS, "web/static", func(p string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			files = append(files, p)
		}
		return nil
	})
	sort.Strings(files)
	for _, p := range files {
		b, _ := staticFS.ReadFile(p)
		h.Write([]byte(p))
		h.Write(b)
	}
	s.version = hex.EncodeToString(h.Sum(nil))[:10]
	return s, nil
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", s.handleRoot)
	for _, l := range languages {
		lang := l
		mux.HandleFunc("GET /"+lang, func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, "/"+lang+"/", http.StatusMovedPermanently)
		})
		mux.HandleFunc("GET /"+lang+"/{$}", func(w http.ResponseWriter, r *http.Request) { s.handleHome(w, r, lang) })
		mux.HandleFunc("GET /"+lang+"/chapter/{num}", func(w http.ResponseWriter, r *http.Request) { s.handleChapter(w, r, lang) })
	}
	static, _ := fs.Sub(staticFS, "web/static")
	files := http.StripPrefix("/static/", http.FileServerFS(static))
	mux.Handle("GET /static/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") { // no directory listings
			s.notFound(w, r, "fa")
			return
		}
		w.Header().Set("Cache-Control", "public, max-age=86400")
		files.ServeHTTP(w, r)
	}))
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprintln(w, "ok")
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		lang := strings.SplitN(strings.TrimPrefix(r.URL.Path, "/"), "/", 2)[0]
		if !validLang(lang) {
			lang = pickLang(cookieValue(r, "lang"), r.Header.Get("Accept-Language"))
		}
		s.notFound(w, r, lang)
	})
	return s.logRequests(securityHeaders(mux))
}

func cookieValue(r *http.Request, name string) string {
	if c, err := r.Cookie(name); err == nil {
		return c.Value
	}
	return ""
}

func (s *server) handleRoot(w http.ResponseWriter, r *http.Request) {
	lang := pickLang(cookieValue(r, "lang"), r.Header.Get("Accept-Language"))
	http.Redirect(w, r, "/"+lang+"/", http.StatusFound)
}

func rememberLang(w http.ResponseWriter, lang string) {
	http.SetCookie(w, &http.Cookie{Name: "lang", Value: lang, Path: "/", MaxAge: 365 * 24 * 3600, SameSite: http.SameSiteLaxMode})
}

func (s *server) cardFor(lang string, c Chapter) card {
	return card{
		Num:      c.Num,
		NumLocal: localNum(lang, strconv.Itoa(c.Num)),
		Title:    c.Title.In(lang),
		Summary:  c.Summary.In(lang),
		URL:      fmt.Sprintf("/%s/chapter/%d", lang, c.Num),
	}
}

func (s *server) base(lang, path string) pageData {
	alt := otherLang(lang)
	return pageData{
		Lang:    lang,
		Dir:     langDir(lang),
		AltLang: alt,
		AltURL:  "/" + alt + strings.TrimPrefix(path, "/"+lang),
		Path:    path,
		T:       ui[lang],
		Version: s.version,
		Year:    localNum(lang, strconv.Itoa(time.Now().Year())),
	}
}

func (s *server) handleHome(w http.ResponseWriter, r *http.Request, lang string) {
	d := s.base(lang, r.URL.Path)
	d.Title = ui[lang]["siteTitle"]
	d.Description = ui[lang]["tagline"]
	for _, c := range chapters {
		d.Chapters = append(d.Chapters, s.cardFor(lang, c))
	}
	rememberLang(w, lang)
	s.render(w, http.StatusOK, "home", d)
}

func (s *server) handleChapter(w http.ResponseWriter, r *http.Request, lang string) {
	n, err := strconv.Atoi(r.PathValue("num"))
	c, i, ok := chapterByNum(n)
	if err != nil || !ok {
		s.notFound(w, r, lang)
		return
	}
	v := &chapterView{card: s.cardFor(lang, c), Content: s.content[fmt.Sprintf("%s/%d", lang, n)]}
	if i > 0 {
		p := s.cardFor(lang, chapters[i-1])
		v.Prev = &p
	}
	if i < len(chapters)-1 {
		nx := s.cardFor(lang, chapters[i+1])
		v.Next = &nx
	}
	if s.labJS[n] {
		v.LabScript = fmt.Sprintf("/static/js/labs/ch%02d.js?v=%s", n, s.version)
	}
	d := s.base(lang, r.URL.Path)
	d.Title = fmt.Sprintf("%s %s: %s", ui[lang]["chapter"], v.NumLocal, v.Title)
	d.Description = v.Summary
	d.Chapter = v
	for _, c := range chapters {
		d.Chapters = append(d.Chapters, s.cardFor(lang, c))
	}
	rememberLang(w, lang)
	s.render(w, http.StatusOK, "chapter", d)
}

func (s *server) notFound(w http.ResponseWriter, r *http.Request, lang string) {
	d := s.base(lang, "/"+lang+"/")
	d.Title = ui[lang]["notFoundTitle"]
	s.render(w, http.StatusNotFound, "notfound", d)
}

func (s *server) render(w http.ResponseWriter, status int, page string, d pageData) {
	var b strings.Builder
	if err := s.pages[page].ExecuteTemplate(&b, "layout.html", d); err != nil {
		s.log.Error("render", "page", page, "err", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Language", d.Lang)
	w.WriteHeader(status)
	_, _ = w.Write([]byte(b.String()))
}

func securityHeaders(next http.Handler) http.Handler {
	csp := strings.Join([]string{
		"default-src 'self'",
		"script-src 'self' https://cdn.jsdelivr.net",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
		"img-src 'self' data:",
		"connect-src 'self' https://cdn.jsdelivr.net",
		"frame-ancestors 'none'",
		"base-uri 'self'",
	}, "; ")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Content-Security-Policy", csp)
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (s *server) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		s.log.Info("request", "method", r.Method, "path", r.URL.Path, "status", sw.status, "dur", time.Since(start).Round(time.Microsecond))
	})
}

func main() {
	defaultAddr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		defaultAddr = ":" + p
	}
	addr := flag.String("addr", defaultAddr, "listen address")
	flag.Parse()

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	s, err := newServer(logger)
	if err != nil {
		logger.Error("startup", "err", err)
		os.Exit(1)
	}

	srv := &http.Server{
		Addr:              *addr,
		Handler:           s.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		logger.Info("listening", "addr", *addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server", "err", err)
			os.Exit(1)
		}
	}()
	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdown)
}
