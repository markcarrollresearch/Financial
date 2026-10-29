import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const go = process.env.FINANCIAL_GO_BINARY || "go";
const exe = path.join(root, "portable", "Financial Lab.exe");
await mkdir(path.dirname(exe), { recursive: true });
const result = spawnSync(
  go,
  [
    "build",
    "-trimpath",
    "-ldflags=-s -w -H=windowsgui -buildid=",
    "-o",
    exe,
    ".",
  ],
  {
    cwd: path.join(root, "desktop"),
    env: {
      ...process.env,
      GOOS: "windows",
      GOARCH: "amd64",
      CGO_ENABLED: "0",
      GOMAXPROCS: "2",
      GOTOOLCHAIN: "local",
      GOCACHE: path.join(root, ".cache/go-build"),
      GOPATH: path.join(root, ".cache/go"),
    },
    stdio: "inherit",
  },
);
if (result.error) throw result.error;
if (result.status !== 0)
  throw new Error(
    "Windows cross-compilation failed. Set FINANCIAL_GO_BINARY to the Go compiler.",
  );
const binary = await readFile(exe);
if (binary.toString("ascii", 0, 2) !== "MZ")
  throw new Error("Output is not a Windows executable.");
const pe = binary.readUInt32LE(0x3c);
if (
  binary.readUInt32LE(pe) !== 0x4550 ||
  binary.readUInt16LE(pe + 4) !== 0x8664
)
  throw new Error("Output is not a Windows x64 PE executable.");
// IMAGE_OPTIONAL_HEADER64.Subsystem = IMAGE_SUBSYSTEM_WINDOWS_GUI (2).
if (binary.readUInt16LE(pe + 24 + 68) !== 2)
  throw new Error("Windows app would incorrectly show a console.");
const files = [
  "Financial Lab.exe",
  "OPEN FINANCIAL LAB.html",
  "START HERE.txt",
];
const hashes = await Promise.all(
  files.map(
    async (name) =>
      `${createHash("sha256")
        .update(await readFile(path.join(root, "portable", name)))
        .digest("hex")}  ${name}`,
  ),
);
await writeFile(
  path.join(root, "portable", "SHA256SUMS.txt"),
  hashes.join("\n") + "\n",
);
console.log(
  `Built Windows x64 GUI executable: ${binary.length.toLocaleString()} bytes. Native Windows execution still needs a Windows machine.`,
);
