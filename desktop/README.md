# Portable Windows launcher

The launcher embeds a gzip-compressed copy of the exact portable HTML. It decompresses it into a content-addressed file in the current user's application cache, checks/reuses the existing copy, opens that file via Windows `ShellExecuteW`, and exits. There is no HTTP listener, installer, elevation request, dependency download or background launcher process. The generated HTML contains the original synthetic records and unchanged logo.

From the project root, with Node, Python and the Go programming-language compiler installed:

```sh
npm ci
npm run build:windows
npm run test:portable
```

Run `go test ./...` from this directory to test launcher logic on the build OS. The four tests cover embedded content, spaces and Unicode in cache paths, cache reuse and corruption repair, browser hand-off, browser errors and cache-write failures. `app.html.gz` is generated and ignored by Git; build the portable edition before testing the launcher.

`FINANCIAL_GO_BINARY` may point to a compiler outside PATH. Builds target `windows/amd64`, use no CGO, and set the Windows GUI subsystem to hide console windows. `scripts/build-windows.mjs` verifies the PE signature, machine architecture and GUI subsystem. `scripts/package-portable.py` packages only the release HTML, optional EXE, short instructions and checksums.

The recorded build compiler is in `toolchain.json`. In the cloud build it was downloaded from the official HTTPS Go release destination and verified against the official SHA-256 and size before extraction. No verification was bypassed. The system's unrelated `/usr/bin/go` program is not the Go programming-language compiler, so the verified compiler path was selected explicitly.

The EXE is unsigned. Use the equivalent HTML if Windows blocks the executable; do not disable system security to run it. Native Windows execution was unavailable during development, so cross-compilation and Linux unit tests do not establish that the Windows shell integration has run successfully. This limitation is documented in the release instructions.
