const fs = require("fs");
const cp = require("child_process");
const html = fs.readFileSync("index.html", "utf8");

// Collect every asset reference (attributes + CSS url()).
const refs = new Set();
let m;
const reAttr = /(?:src|href|srcset|data-avif|data-jpg)="(assets\/[^"]+)"/g;
while ((m = reAttr.exec(html))) refs.add(m[1]);
const reUrl = /url\(['"]?(assets\/[^)'"]+)/g;
while ((m = reUrl.exec(html))) refs.add(m[1]);

console.log("=== Asset references vs files on disk ===");
let ok = 0, bad = 0;
[...refs].sort().forEach((r) => {
  const exists = fs.existsSync(r);
  console.log((exists ? "  OK      " : "  MISSING ") + r);
  exists ? ok++ : bad++;
});
console.log(`  -> ${ok} resolved, ${bad} missing\n`);

// Inline <script> (the one without src) must parse.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const inline = scripts.map((s) => s[1]).join("\n;\n");
fs.writeFileSync("/tmp/inline.js", inline);
try {
  cp.execSync("node --check /tmp/inline.js");
  console.log("=== JS syntax: OK (inline script parses clean) ===");
} catch (e) {
  console.log("=== JS syntax: FAILED ===");
  process.exit(1);
}
process.exit(bad ? 1 : 0);
