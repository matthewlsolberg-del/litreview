/* Lit Review Desk, hosted build: stands in for the claude.ai runtime.
   Data lives in this browser's localStorage; files download directly; AI runs on the user's own Gemini or OpenAI key. */
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
  /* AI assistant: the user's own Gemini or OpenAI key, kept in this browser and sent only to that provider. */
  var AI_KEY = "lrd.ai";
  var AI_DEFAULTS = { gemini: "gemini-flash-latest", openai: "gpt-5.4-mini" };
  function aiCfg() { try { return JSON.parse(localStorage.getItem(AI_KEY) || "null"); } catch (e) { return null; } }
  function aiErr(code, message) { var e = new Error(message); e.code = code; return e; }
  function toText(input) {
    if (typeof input === "string") return input;
    return (input || []).map(function (m) { return (m.role === "assistant" ? "Assistant: " : "") + m.content; }).join("\n\n");
  }
  async function callAI(input, wantJson, cfgOverride) {
    var cfg = cfgOverride || aiCfg();
    if (!cfg || !cfg.key) throw aiErr("no_key", "Connect Gemini or ChatGPT first.");
    var prompt = toText(input), r, d, text = "";
    try {
      if (cfg.provider === "openai") {
        var body = { model: cfg.model || AI_DEFAULTS.openai, messages: [{ role: "user", content: prompt }] };
        if (wantJson) body.response_format = { type: "json_object" };
        r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.key }, body: JSON.stringify(body) });
        d = await r.json().catch(function () { return {}; });
        if (r.ok) text = (((d.choices || [])[0] || {}).message || {}).content || "";
      } else {
        var model = cfg.model || AI_DEFAULTS.gemini;
        r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: wantJson ? { responseMimeType: "application/json" } : {} })
        });
        d = await r.json().catch(function () { return {}; });
        if (r.ok) text = ((((d.candidates || [])[0] || {}).content || {}).parts || []).map(function (x) { return x.text || ""; }).join("");
      }
    } catch (e) { throw aiErr("network", "Couldn't reach " + (cfg.provider === "openai" ? "OpenAI" : "Google") + ". Check your connection."); }
    if (!r.ok) {
      var msg = (d && d.error && (d.error.message || d.error)) || ("Error " + r.status);
      if (r.status === 429) throw aiErr("rate_limited", "The AI is rate-limited or out of credit. Wait a minute, or check your plan. (" + msg + ")");
      if (r.status === 400 || r.status === 401 || r.status === 403) throw aiErr("bad_key", "The AI provider refused the request: " + msg);
      throw aiErr("error", msg);
    }
    if (!text) throw aiErr("empty", "The AI returned nothing. Try again.");
    return text;
  }
  function parseJSON(t) {
    t = String(t).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try { return JSON.parse(t); } catch (e) { var m = t.match(/[\[{][\s\S]*[\]}]/); if (m) return JSON.parse(m[0]); throw aiErr("bad_json", "The AI's answer couldn't be read. Try again."); }
  }
  var sample = async function (input, opts) { var t = await callAI(input, false); if (opts && opts.onText) try { opts.onText({ text: t, delta: t }); } catch (e) {} return { text: t, truncated: false }; };
  sample.json = async function (input) { return parseJSON(await callAI(input, true)); };
  sample.configured = function () { var c = aiCfg(); return !!(c && c.key); };
  sample.config = function () { var c = aiCfg(); return c ? { provider: c.provider, model: c.model || AI_DEFAULTS[c.provider] } : null; };
  sample.label = function () { var c = aiCfg(); return c && c.key ? (c.provider === "openai" ? "ChatGPT" : "Gemini") : "AI"; };
  sample.defaults = AI_DEFAULTS;
  sample.save = async function (cfg) {
    await callAI("Reply with the JSON {\"ok\": true}.", true, cfg);
    localStorage.setItem(AI_KEY, JSON.stringify(cfg));
  };
  sample.clear = function () { try { localStorage.removeItem(AI_KEY); } catch (e) {} };
  window.claude = { use: function (name) { return Promise.resolve(name === "db" ? db : name === "downloads" ? downloads : name === "sample" ? sample : null); } };
  /* Ask the browser not to evict this site's data. */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  }
})();
