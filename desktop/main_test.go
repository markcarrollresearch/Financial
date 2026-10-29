package main

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestEmbeddedApplicationAndLogo(t *testing.T) {
	html, err := unpackApp()
	if err != nil {
		t.Fatal(err)
	}
	for _, marker := range [][]byte{[]byte(`id="financial-lab-data"`), []byte(`data:image/png;base64,`), []byte(`"rowCount":17000`), []byte(`Financial Intelligence &amp; Controls Lab`)} {
		if !bytes.Contains(html, marker) {
			t.Fatalf("embedded app missing %s", marker)
		}
	}
}

func TestStageAppReusesAndRepairsCache(t *testing.T) {
	root := filepath.Join(t.TempDir(), "User With Spaces", "Présentation")
	html := []byte("<html>portable synthetic financial lab</html>")
	path, err := stageApp(html, root)
	if err != nil {
		t.Fatal(err)
	}
	initial, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	again, err := stageApp(html, root)
	if err != nil || again != path {
		t.Fatalf("second launch: %s, %v", again, err)
	}
	reused, _ := os.Stat(path)
	if !reused.ModTime().Equal(initial.ModTime()) {
		t.Fatal("unchanged generated app was rewritten")
	}
	if err := os.WriteFile(path, []byte("corrupt"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := stageApp(html, root); err != nil {
		t.Fatal(err)
	}
	actual, _ := os.ReadFile(path)
	if !bytes.Equal(actual, html) {
		t.Fatal("cache repair did not restore embedded HTML")
	}
}

func TestLaunchPassesActualFileAndReportsBrowserFailure(t *testing.T) {
	sentinel := errors.New("default browser unavailable")
	err := launch(t.TempDir(), func(path string) error {
		raw, readErr := os.ReadFile(path)
		if readErr != nil || !bytes.Contains(raw, []byte(`id="financial-lab-data"`)) {
			t.Fatal("browser received no valid portable application")
		}
		return sentinel
	})
	if !errors.Is(err, sentinel) {
		t.Fatalf("browser failure was lost: %v", err)
	}
}

func TestUnwritableCacheIsReported(t *testing.T) {
	file := filepath.Join(t.TempDir(), "not-a-directory")
	if err := os.WriteFile(file, []byte("x"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := stageApp([]byte("<html/>"), file); err == nil {
		t.Fatal("cache failure was silently ignored")
	}
}
