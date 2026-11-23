// One-off: renders icon.svg to the PNG icons (uses the preinstalled Playwright).
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, "icon.svg"), "utf8");
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [name, size, pad] of [["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["apple-touch-icon.png", 180, 0]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, "..", name) });
  }
  await b.close();
})();
