import fs from "fs";
import path from "path";

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}

walk("src/app/v1");
walk("src/components/demo");

const routes = [
  "parts",
  "factory",
  "customers",
  "dashboard",
  "impact",
  "scenarios",
  "baselines",
  "guide",
  "settings",
];

let updated = 0;
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const route of routes) {
    content = content.replaceAll(`href="/${route}`, `href="/v1/${route}`);
    content = content.replaceAll(`href={\`/${route}`, `href={\`/v1/${route}`);
    content = content.replaceAll(`href: "/${route}`, `href: "/v1/${route}`);
  }
  content = content.replaceAll("/v1/v1/", "/v1/");
  if (content !== original) {
    fs.writeFileSync(file, content);
    updated += 1;
  }
}

console.log(`updated ${updated} files`);
