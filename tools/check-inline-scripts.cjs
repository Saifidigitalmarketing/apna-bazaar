const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ignored = new Set([".git", "node_modules", "vendor"]);
const failures = [];
let checked = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (/\.js$/i.test(entry.name)) {
      checkScript(fs.readFileSync(full, "utf8"), full);
    } else if (/\.html?$/i.test(entry.name)) {
      const html = fs.readFileSync(full, "utf8");
      const tag = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
      let match;
      let index = 0;
      while ((match = tag.exec(html))) {
        if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
        checkScript(match[2], `${full} inline script #${++index}`);
      }
    }
  }
}

function checkScript(source, filename) {
  checked++;
  try {
    new vm.Script(source, { filename });
  } catch (error) {
    failures.push(`${filename}: ${error.message}`);
  }
}

walk(process.cwd());

if (failures.length) {
  console.error("JavaScript syntax validation failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log(`JavaScript syntax validation passed (${checked} script blocks/files).`);
