import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "dist");
const destination = path.join(root, "docs");
await mkdir(destination, { recursive: true });
// Copy only build outputs, preserving the original documentation and screenshots.
for (const name of await readdir(source)) {
  await cp(path.join(source, name), path.join(destination, name), {
    recursive: true,
  });
}
await writeFile(path.join(destination, ".nojekyll"), "");
console.log(
  "Prepared GitHub Pages site in docs/. No deployment has been performed.",
);
