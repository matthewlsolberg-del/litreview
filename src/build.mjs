// Builds the site: wraps src/page.html into ./index.html and copies the runtime, service worker, manifest and icon to the repo root (served by GitHub Pages).
// The same page.html is what's published as the claude.ai artifact; this wraps it in a full document
// and swaps the claude.ai runtime for local-runtime.js.  Run: node src/build.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..");
mkdirSync(out, { recursive: true });
const page = readFileSync(join(here, "page.html"), "utf8");
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Plan literature searches, collect and screen sources, get correct APA 7 citations, and export an annotated bibliography to Word.">
<meta name="theme-color" content="#9A3D21">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Lit Review">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="icon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script src="config.js"></script>
<script src="local-runtime.js"></script>
</head>
<body>
`;
writeFileSync(join(out, "index.html"), head + page + "\n</body>\n</html>\n");
for (const f of ["local-runtime.js", "sw.js", "manifest.webmanifest", "icon.svg"]) copyFileSync(join(here, f), join(out, f));
console.log("Built index.html");
