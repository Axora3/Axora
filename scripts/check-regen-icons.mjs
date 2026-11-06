import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const sprite = readFileSync("public/icons/regen.svg", "utf8");
const symbols = [...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24">([\s\S]*?)<\/symbol>/g)];
const names = new Set(symbols.map(m => m[1]));
assert.equal(names.size, symbols.length, "Duplicate sprite IDs");
for (const [, name, geometry] of symbols) {
  const variant = name.endsWith("-filled") ? "filled" : "outline";
  const file = name.replace(/-filled$/, "");
  const svg = readFileSync(`vendor/regen-icons/svg/${variant}/${file}.svg`, "utf8").trim();
  assert.equal(geometry, svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), `Changed source geometry: ${name}`);
}
const walk = d => readdirSync(d, {withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
for (const file of walk("src").filter(f=>f.endsWith(".tsx"))) {
  const source = readFileSync(file,"utf8");
  if (file !== "src/components/ui/icon.tsx") assert.ok(!/<svg\b/.test(source), `Legacy SVG: ${file}`);
  for (const match of source.matchAll(/<Icon name="([^"]+)"/g)) assert.ok(names.has(match[1]), `Missing asset: ${file}: ${match[1]}`);
}

// Audit nested admin modules as well as shared components. Configuration-driven
// icons must resolve too, not only literal <Icon name="..." /> callers.
const adminFiles = [...walk("src/app/admin"), ...walk("src/components/admin"), "src/lib/admin/labels.ts"];
for (const file of adminFiles.filter(f => /\.tsx?$/.test(f))) {
  const source = readFileSync(file, "utf8");
  // The sidebar's navigation config is the one admin file that uses Lucide, as specified for the admin navigation.
  const banned = file === "src/components/admin/nav.ts" ? /from ["'](?:@\/components\/icons|react-icons|@heroicons|@iconify)/ : /from ["'](?:@\/components\/icons|lucide-react|react-icons|@heroicons|@iconify)/;
  assert.doesNotMatch(source, banned, `Legacy admin icon import: ${file}`);
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "icon" && ts.isStringLiteral(node.initializer)) {
      assert.ok(names.has(node.initializer.text), `Missing configured asset: ${file}: ${node.initializer.text}`);
    }
    if (ts.isJsxText(node)) assert.doesNotMatch(node.text, /[✓✕◇↑↓↗↔⌄×]|^\s*!\s*$/, `Text icon in admin: ${file}`);
    ts.forEachChild(node, visit);
  };
  visit(ast);
}
console.log(`Audited ${adminFiles.length} admin source modules and status/navigation asset mappings.`);

// Exercise the actual renderer without a browser or adding a test dependency.
const output = ts.transpileModule(readFileSync("src/components/ui/icon.tsx", "utf8"), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(output, { exports, require: createRequire(import.meta.url) });
const render = props => renderToStaticMarkup(createElement(exports.Icon, { name: "home", ...props }));
assert.match(render({}), /aria-hidden="true"/);
assert.match(render({}), /width="20" height="20"/);
assert.match(render({}), /href="\/icons\/regen.svg#home"/);
const meaningful = render({ label: "Home", size: 24, color: "red", className: "custom-icon" });
assert.match(meaningful, /role="img"/);
assert.match(meaningful, /aria-label="Home"/);
assert.doesNotMatch(meaningful, /aria-hidden="true"/);
assert.match(meaningful, /width="24" height="24"/);
assert.match(meaningful, /color="red"/);
assert.match(meaningful, /custom-icon/);
assert.match(render({ "aria-labelledby": "icon-label" }), /role="img"/);
assert.match(render({ decorative: true, label: "Hidden" }), /aria-hidden="true"/);
console.log(`Verified ${symbols.length} exact Regen assets, source references, and accessible renderer output.`);
