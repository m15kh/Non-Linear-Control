package main

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
)

func testServer(t *testing.T) http.Handler {
	t.Helper()
	s, err := newServer(slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err != nil {
		t.Fatal(err)
	}
	return s.routes()
}

func get(h http.Handler, path string, hdr map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestRootRedirectsByLanguage(t *testing.T) {
	h := testServer(t)
	cases := []struct {
		hdr  map[string]string
		want string
	}{
		{nil, "/fa/"},
		{map[string]string{"Accept-Language": "en-US,en;q=0.9"}, "/en/"},
		{map[string]string{"Accept-Language": "fa-IR,fa;q=0.9,en;q=0.5"}, "/fa/"},
		{map[string]string{"Accept-Language": "en", "Cookie": "lang=fa"}, "/fa/"},
	}
	for _, c := range cases {
		rec := get(h, "/", c.hdr)
		if rec.Code != http.StatusFound || rec.Header().Get("Location") != c.want {
			t.Errorf("headers %v: got %d %q, want 302 %q", c.hdr, rec.Code, rec.Header().Get("Location"), c.want)
		}
	}
}

func TestEveryChapterRendersInBothLanguages(t *testing.T) {
	h := testServer(t)
	labRe := regexp.MustCompile(`data-lab="([a-z0-9-]+)"`)
	for _, l := range languages {
		home := get(h, "/"+l+"/", nil)
		if home.Code != http.StatusOK {
			t.Fatalf("home %s: %d", l, home.Code)
		}
		body := home.Body.String()
		for _, want := range []string{`lang="` + l + `"`, `dir="` + langDir(l) + `"`, "https://github.com/m15kh", "https://m15kh.github.io/"} {
			if !strings.Contains(body, want) {
				t.Errorf("home %s: missing %q", l, want)
			}
		}
		for _, c := range chapters {
			path := fmt.Sprintf("/%s/chapter/%d", l, c.Num)
			rec := get(h, path, nil)
			if rec.Code != http.StatusOK {
				t.Errorf("%s: status %d", path, rec.Code)
				continue
			}
			b := rec.Body.String()
			if !strings.Contains(b, c.Title.In(l)) {
				t.Errorf("%s: title missing", path)
			}
			alt := fmt.Sprintf("/%s/chapter/%d", otherLang(l), c.Num)
			if !strings.Contains(b, `href="`+alt+`"`) {
				t.Errorf("%s: language switch should link to %s", path, alt)
			}
			// every lab placeholder must have its chapter script and a matching config id
			labs := labRe.FindAllStringSubmatch(b, -1)
			if len(labs) == 0 {
				continue
			}
			script := fmt.Sprintf("/static/js/labs/ch%02d.js", c.Num)
			if !strings.Contains(b, script) {
				t.Errorf("%s: has labs but no %s", path, script)
				continue
			}
			js, err := staticFS.ReadFile("web" + script)
			if err != nil {
				t.Fatal(err)
			}
			for _, m := range labs {
				if !strings.Contains(string(js), `"`+m[1]+`"`) {
					t.Errorf("%s: lab %q is not registered in %s", path, m[1], script)
				}
			}
		}
	}
}

func TestNotFound(t *testing.T) {
	h := testServer(t)
	for _, p := range []string{"/en/chapter/0", "/en/chapter/15", "/fa/chapter/x", "/de/", "/nope", "/static/"} {
		if rec := get(h, p, nil); rec.Code != http.StatusNotFound {
			t.Errorf("%s: got %d, want 404", p, rec.Code)
		}
	}
}

func TestStaticAndHealth(t *testing.T) {
	h := testServer(t)
	for _, p := range []string{"/static/js/lab.js", "/static/css/site.css", "/static/favicon.svg", "/healthz"} {
		if rec := get(h, p, nil); rec.Code != http.StatusOK {
			t.Errorf("%s: got %d", p, rec.Code)
		}
	}
	if rec := get(h, "/fa", nil); rec.Code != http.StatusMovedPermanently || rec.Header().Get("Location") != "/fa/" {
		t.Errorf("/fa: got %d %q", rec.Code, rec.Header().Get("Location"))
	}
}

func TestPickLang(t *testing.T) {
	cases := map[[2]string]string{
		{"", ""}:                 "fa",
		{"en", "fa"}:             "en",
		{"xx", "de-DE,en;q=0.8"}: "en",
		{"", "de-DE"}:            "fa",
	}
	for in, want := range cases {
		if got := pickLang(in[0], in[1]); got != want {
			t.Errorf("pickLang(%q, %q) = %q, want %q", in[0], in[1], got, want)
		}
	}
}
