package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

//go:embed app.html.gz
var bundledApp []byte

func unpackApp() ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(bundledApp))
	if err != nil {
		return nil, fmt.Errorf("read bundled application: %w", err)
	}
	defer reader.Close()
	html, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("verify bundled application: %w", err)
	}
	return html, nil
}

func stageApp(html []byte, cacheRoot string) (string, error) {
	hash := sha256.Sum256(html)
	dir := filepath.Join(cacheRoot, "DouglasCountyFinancialLab")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	target := filepath.Join(dir, "FinancialLab-"+hex.EncodeToString(hash[:8])+".html")
	valid := func() bool {
		contents, err := os.ReadFile(target)
		return err == nil && sha256.Sum256(contents) == hash
	}
	if valid() {
		return target, nil
	}
	file, err := os.CreateTemp(dir, "prepare-*.tmp")
	if err != nil {
		return "", err
	}
	temp := file.Name()
	defer os.Remove(temp)
	if _, err = file.Write(html); err != nil {
		file.Close()
		return "", err
	}
	if err = file.Close(); err != nil {
		return "", err
	}
	// Replace only a corrupt generated file at this content-addressed cache path.
	if err = os.Remove(target); err != nil && !os.IsNotExist(err) {
		return "", err
	}
	if err = os.Rename(temp, target); err != nil {
		if !valid() {
			return "", err
		}
	}
	return target, nil
}

func launch(cacheRoot string, open func(string) error) error {
	html, err := unpackApp()
	if err != nil {
		return err
	}
	file, err := stageApp(html, cacheRoot)
	if err != nil {
		return fmt.Errorf("prepare your local application: %w", err)
	}
	if err := open(file); err != nil {
		return fmt.Errorf("open the application in your default browser: %w", err)
	}
	return nil
}

func main() {
	cache, err := os.UserCacheDir()
	if err == nil {
		err = launch(cache, openBrowser)
	}
	if err != nil {
		showError("Financial Lab could not open. You can open OPEN FINANCIAL LAB.html from the portable folder instead.\n\nDetails: " + err.Error())
		os.Exit(1)
	}
}
