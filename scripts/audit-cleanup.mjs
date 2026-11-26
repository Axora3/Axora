import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import ts from "typescript";

const root = process.cwd();
const phase = process.argv.includes("--final") ? "final" : "baseline";
const output = path.join(root, "artifacts/cleanup");
const ignored = new Set([".git", "node_modules"]);
const generated = p => /^(\.next(?:-[^/]+)?|out|dist|build|coverage|\.turbo|\.cache|test-results|playwright-report)(\/|$)/.test(p);
const visual = /\.(png|jpe?g|webp|avif|svg|gif|ico|bmp|tiff?|apng|heic|mp4|webm|mov)$/i;
const code = /\.(tsx?|jsx?|mjs|cjs|mts|cts|css|glsl)$/i;
const text = /\.(tsx?|jsx?|mjs|cjs|mts|cts|css|glsl|json|md|mdx|html|ps1|yml|yaml|toml)$/i;
const files = [];
function walk(dir, relative = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (rel === "artifacts/cleanup" || entry.isSymbolicLink()) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, rel);
    else if (entry.isFile()) files.push({ path: rel, size: fs.statSync(absolute).size });
  }
}
walk(root);
const maintained = files.filter(f => !generated(f.path));
const texts = new Map(maintained.filter(f => text.test(f.path) && !f.path.startsWith(".env") && f.size < 5_000_000).map(f => [f.path, fs.readFileSync(path.join(root, f.path), "utf8")]));
const sources = maintained.filter(f => f.path.startsWith("src/") && code.test(f.path));
const paths = new Set(sources.map(f => f.path));
const edges = new Map(sources.map(f => [f.path, []]));
const dynamic = [];
function resolve(from, request) {
  if (!request.startsWith(".") && !request.startsWith("@/")) return null;
  const base = request.startsWith("@/") ? `src/${request.slice(2)}` : path.posix.normalize(path.posix.join(path.posix.dirname(from), request));
  return [base, ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", "/index.ts", "/index.tsx"].map(ext => base + ext)].find(p => paths.has(p));
}
for (const file of sources) {
  if (!/\.[cm]?[jt]sx?$/.test(file.path)) continue;
  const source = ts.createSourceFile(file.path, texts.get(file.path) || "", ts.ScriptTarget.Latest, true);
  function visit(node) {
    let spec;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) spec = node.moduleSpecifier.text;
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === "require")) {
      if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) spec = node.arguments[0].text;
      else dynamic.push({ path: file.path, expression: node.getText(source).slice(0, 200) });
    }
    if (spec) { const target = resolve(file.path, spec); if (target) edges.get(file.path).push(target); }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const entries = sources.filter(f => /^src\/app\//.test(f.path) && /\/(page|layout|template|loading|error|global-error|not-found|default|route|icon|apple-icon|opengraph-image|twitter-image|manifest|robots|sitemap)\.[jt]sx?$/.test(f.path) || /^src\/(proxy|middleware|instrumentation|instrumentation-client)\.[jt]s$/.test(f.path)).map(f => f.path);
// Tests and operational tools can legitimately use modules outside the application graph.
for (const [from, contents] of texts) if (!from.startsWith("src/")) {
  for (const match of contents.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)["']/g)) {
    const target = resolve(from, match[1]); if (target) entries.push(target);
  }
}
const reachable = new Set();
function mark(file) { if (reachable.has(file)) return; reachable.add(file); for (const dependency of edges.get(file) || []) mark(dependency); }
entries.forEach(mark);
const unreachable = sources.filter(f => !reachable.has(f.path)).map(f => ({ ...f, mentions: [...texts].filter(([p, s]) => p !== f.path && (s.includes(f.path) || s.includes(path.posix.basename(f.path).replace(/\.[^.]+$/, "")))).map(([p]) => p) }));
const hashes = new Map();
const assets = maintained.filter(f => visual.test(f.path)).map(f => {
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, f.path))).digest("hex");
  const refs = [...texts].filter(([p, s]) => p !== f.path && (s.includes(f.path) || s.includes(path.posix.basename(f.path)))).map(([p]) => p);
  const item = { ...f, sha256, references: refs, publicOrSource: /^(public|src)\//.test(f.path) };
  if (!hashes.has(sha256)) hashes.set(sha256, []); hashes.get(sha256).push(f.path);
  return item;
});
const packages = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dependencies = Object.entries({ ...packages.dependencies, ...packages.devDependencies }).map(([name, version]) => ({ name, version, references: [...texts].filter(([p, s]) => !/package(-lock)?\.json$/.test(p) && s.includes(name)).map(([p]) => p) }));
const byDirectory = {};
for (const file of files) { const key = file.path.includes("/") ? file.path.split("/")[0] : "root-files"; byDirectory[key] = (byDirectory[key] || 0) + file.size; }
const report = { phase, method: "Regular files; excludes .git, node_modules, symlinks and artifacts/cleanup. Generated totals separate. No environment content read.", metrics: { projectBytes: files.reduce((n, f) => n + f.size, 0), maintainedBytes: maintained.reduce((n, f) => n + f.size, 0), generatedBytes: files.filter(f => generated(f.path)).reduce((n, f) => n + f.size, 0), sourceFiles: sources.length, sourceBytes: sources.reduce((n, f) => n + f.size, 0), assetFiles: assets.length, assetBytes: assets.reduce((n, f) => n + f.size, 0), dependencies: Object.keys(packages.dependencies).length, devDependencies: Object.keys(packages.devDependencies).length }, byDirectory, entryCount: entries.length, unreachable, dynamicImports: dynamic, dependencies, assets, duplicates: [...hashes.values()].filter(group => group.length > 1) };
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, `${phase}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ metrics: report.metrics, byDirectory, unreachable: unreachable.map(f => f.path), dynamicImports: dynamic, dependenciesWithoutTextReferences: dependencies.filter(d => !d.references.length).map(d => d.name) }, null, 2));
