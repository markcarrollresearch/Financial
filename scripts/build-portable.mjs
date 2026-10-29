import { build } from "esbuild";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(
  await readFile(path.join(root, "public/data.json"), "utf8"),
);
const logo = await readFile(path.join(root, "assets/douglas_county_logo.png"));
const logoHash = createHash("sha256").update(logo).digest("hex");
if (logoHash !== source.hashes["assets/douglas_county_logo.png"]) {
  throw new Error("The supplied logo does not match the source package.");
}
source.logoDataUrl = `data:image/png;base64,${logo.toString("base64")}`;
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/main.tsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "inline",
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.BASE_URL": '"./"',
  },
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js"))?.text;
const css = result.outputFiles.find((f) => f.path.endsWith(".css"))?.text;
if (!js || !css)
  throw new Error("Portable JavaScript or CSS output is missing.");
const json = JSON.stringify(source).replaceAll("<", "\\u003c");
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#762123">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="description" content="Independent interview concept. Synthetic financial data. Not an official County report. Portable offline edition.">
<title>Douglas County | Financial Intelligence &amp; Controls Lab</title>
<link rel="icon" href="${source.logoDataUrl}">
<style>${css.replaceAll("</style", "<\\/style")}</style></head>
<body><div id="root"></div>
<script id="financial-lab-data" type="application/json">${json}</script>
<script>${js.replaceAll("</script", "<\\/script")}</script>
</body></html>`;
const out = path.join(root, "portable");
await mkdir(out, { recursive: true });
// Avoid packaging an executable built against an older embedded document.
await rm(path.join(out, "Financial Lab.exe"), { force: true });
await rm(path.join(out, "SHA256SUMS.txt"), { force: true });
await mkdir(path.join(root, "desktop"), { recursive: true });
await writeFile(path.join(out, "OPEN FINANCIAL LAB.html"), html);
await writeFile(
  path.join(root, "desktop/app.html.gz"),
  gzipSync(html, { level: 9 }),
);
await writeFile(
  path.join(out, "START HERE.txt"),
  `DOUGLAS COUNTY | FINANCIAL INTELLIGENCE & CONTROLS LAB

1. Extract this ZIP completely (right-click > Extract All on Windows).
2. Double-click OPEN FINANCIAL LAB.html.

The complete application opens in your normal browser.
No Python, Node, installation, terminal commands, server, administrator access,
or internet connection is required. You may copy the HTML to a USB drive.
Keep using the HTML file if Windows blocks the optional unsigned EXE.

Optional Windows program: double-click Financial Lab.exe if included.
It opens the identical offline application in your normal browser, with no
console window or background server. It stores a generated HTML copy in your
user cache. Close the browser tab to finish. No installer is required.
To remove its generated copy: open %LOCALAPPDATA% in File Explorer and delete
only the DouglasCountyFinancialLab folder. Your source data is not changed.

Use the left navigation for Executive overview, Revenue assurance,
Accounts receivable, and Decision Lab. The Division selector applies throughout.
For presentation, use the browser's full-screen command (F11 on Windows).

This is a portable browser application, not a native Samsung/Android installer.
The Windows EXE targets Windows 10/11 x64. It was cross-compiled on Linux;
physical Windows execution and actual Samsung hardware have not been tested.
The embedded HTML application was rendered with networking disabled in Chromium.
The cloud browser blocks direct file navigation by policy; that policy was not changed.

Independent interview concept. Synthetic financial data.
Not an official County report. No website has been deployed by this package.
`,
);
console.log(
  `Built self-contained portable HTML: ${Buffer.byteLength(html).toLocaleString()} bytes.`,
);
console.log(
  "Includes the original source records, unchanged logo, scripts and styles. No runtime fetches.",
);
