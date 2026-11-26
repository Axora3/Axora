import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

async function walk(directory) {
  return (
    await Promise.all(
      (await fs.readdir(directory, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const files = [
  ...(await walk("public/images/cinematic")),
  ...(await walk("public/images/animated-hands")),
  ...(await walk("src/components/background")),
  "src/components/cinematic/GlobalBackground.tsx",
];
const assets = [];
for (const file of files) {
  const normalized = file.replaceAll("\\", "/");
  const content = await fs.readFile(file);
  const blob = execFileSync("git", ["hash-object", file], {
    encoding: "utf8",
  }).trim();
  const original = execFileSync("git", ["rev-parse", `HEAD:${normalized}`], {
    encoding: "utf8",
  }).trim();
  assets.push({
    file: normalized,
    sha256: createHash("sha256").update(content).digest("hex"),
    matchesGit: blob === original,
  });
}
const css = await fs.readFile("src/app/cinematic.css", "utf8");
const originalCss = execFileSync(
  "git",
  ["show", "HEAD:src/app/cinematic.css"],
  { encoding: "utf8" },
);
const protectedRules = (text) =>
  text.match(
    /\.ax-global-(?:hands|background)(?: canvas)?\s*\{[^}]*\}|\.ax-cinematic-overlay\s*\{[^}]*\}/g,
  );
const compositionUnchanged =
  JSON.stringify(protectedRules(css)) ===
  JSON.stringify(protectedRules(originalCss));
await fs.mkdir("artifacts/final-qa", { recursive: true });
await fs.writeFile(
  "artifacts/final-qa/protected-assets.json",
  JSON.stringify({ assets, compositionUnchanged }, null, 2),
);
console.log(
  JSON.stringify({
    files: assets.length,
    changed: assets.filter((asset) => !asset.matchesGit),
    compositionUnchanged,
  }),
);
if (assets.some((asset) => !asset.matchesGit) || !compositionUnchanged)
  process.exitCode = 1;
