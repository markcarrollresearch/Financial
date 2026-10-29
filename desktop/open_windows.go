//go:build windows

package main

import (
	"fmt"
	"syscall"
	"unsafe"
)

func openBrowser(path string) error {
	operation, err := syscall.UTF16PtrFromString("open")
	if err != nil {
		return err
	}
	target, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	result, _, _ := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW").Call(
		0, uintptr(unsafe.Pointer(operation)), uintptr(unsafe.Pointer(target)), 0, 0, 1,
	)
	if result <= 32 {
		return fmt.Errorf("Windows could not open your default browser (code %d)", result)
	}
	return nil
}

func showError(message string) {
	title, _ := syscall.UTF16PtrFromString("Financial Intelligence & Controls Lab")
	text, _ := syscall.UTF16PtrFromString(message)
	syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(text)), uintptr(unsafe.Pointer(title)), 0x10)
}
