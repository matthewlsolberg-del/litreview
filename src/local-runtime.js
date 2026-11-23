/* Lit Review Desk, hosted build: stands in for the claude.ai runtime.
   Data lives in this browser's localStorage; files download directly; no Claude features. */
(function () {
  "use strict";
  window.LRD_STANDALONE = true;
  var PREFIX = "lrd.db.";
  var mem = {}, listeners = {};
  function load(c) { try { return JSON.parse(localStorage.getItem(PREFIX + c) || "{}") || {}; } catch (e) { return {}; } }
  function col(c) { return mem[c] || (mem[c] = load(c)); }
  function persist(c) {
    try { localStorage.setItem(PREFIX + c, JSON.stringify(mem[c])); }
    catch (e) { var err = new Error("Storage is full"); err.code = "quota_exceeded"; throw err; }
  }
  function snap(c) {
    var m = col(c), ids = Object.keys(m);
    var docs = ids.map(function (id) { var d = m[id]; return { id: id, exists: true, data: function () { return d; }, metadata: { fromCache: false, hasPendingWrites: false } }; });
    return { docs: docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: function () { return []; } };
  }
  function notify(c) { (listeners[c] || []).forEach(function (fn) { try { fn(snap(c)); } catch (e) { console.error(e); } }); }
  function docRef(c, id) {
    return {
      id: id, path: c + "/" + id,
      get: function () { var d = col(c)[id]; return Promise.resolve({ id: id, exists: !!d, data: function () { return d; }, metadata: {} }); },
      set: function (data) { return new Promise(function (res, rej) { var prev = col(c)[id]; col(c)[id] = JSON.parse(JSON.stringify(data)); try { persist(c); } catch (e) { if (prev === undefined) delete col(c)[id]; else col(c)[id] = prev; return rej(e); } notify(c); res(); }); },
      update: function (data) { return this.set(Object.assign({}, col(c)[id] || {}, data)); },
      delete: function () { delete col(c)[id]; try { persist(c); } catch (e) {} notify(c); return Promise.resolve(); }
    };
  }
  var db = {
    collection: function (c) {
      return {
        path: c,
        doc: function (id) { return docRef(c, id || ("d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7))); },
        onSnapshot: function (next) {
          (listeners[c] = listeners[c] || []).push(next);
          setTimeout(function () { next(snap(c)); }, 0);
          return function () { listeners[c] = (listeners[c] || []).filter(function (f) { return f !== next; }); };
        },
        get: function () { return Promise.resolve(snap(c)); }
      };
    },
    doc: function (path) { var p = path.split("/"); return docRef(p[0], p[1]); }
  };
  /* Keep several open tabs in step. */
  window.addEventListener("storage", function (e) {
    if (e.key && e.key.indexOf(PREFIX) === 0) { var c = e.key.slice(PREFIX.length); mem[c] = load(c); notify(c); }
  });
  var TYPES = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", csv: "text/csv;charset=utf-8", json: "application/json", txt: "text/plain;charset=utf-8" };
  var downloads = {
    save: function (req) {
      var ext = String(req.filename).split(".").pop().toLowerCase();
      var blob = req.data instanceof Blob ? new Blob([req.data], { type: TYPES[ext] || "application/octet-stream" }) : new Blob([req.data], { type: TYPES[ext] || "application/octet-stream" });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = req.filename; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      return Promise.resolve({ status: "saved" });
    }
  };
  window.claude = { use: function (name) { return Promise.resolve(name === "db" ? db : name === "downloads" ? downloads : null); } };
  /* Ask the browser not to evict this site's data. */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  }
})();
