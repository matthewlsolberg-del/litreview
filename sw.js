/* Lit Review Desk service worker: works offline, picks up new versions on the next visit. */
const CACHE = "lrd-v2";
const SHELL = ["./", "./index.html", "./local-runtime.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (/api\.(openalex|crossref)\.org$/.test(url.hostname)) return; // live data: always network
  const sameOrigin = url.origin === location.origin;
  const isLib = /fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname);
  if (!sameOrigin && !isLib) return;
  if (sameOrigin && (e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith(".js"))) {
    // network first so updates arrive; fall back to cache offline
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })));
});
