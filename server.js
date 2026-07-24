// 工作流变更通知服务（Render Web Service）
// 接收画布上报的变更事件，落盘并展示实时变更流。
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");
const MAX_EVENTS = 500;

function loadEvents() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const a = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return Array.isArray(a) ? a : [];
    }
  } catch (e) { /* ignore */ }
  return [];
}
function saveEvents(arr) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr.slice(-MAX_EVENTS), null, 2));
  } catch (e) { console.error("save events failed:", e.message); }
}
let events = loadEvents();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", ...CORS });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit = 1e5) {
  return new Promise((resolve, reject) => {
    let data = "", size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > limit) { reject(new Error("payload too large")); req.destroy(); }
      else data += c;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const FEED_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>工作流变更通知</title>
<style>
  :root{--bg:#f4f6fb;--panel:#fff;--ink:#1f2733;--muted:#6b7686;--accent:#3b6cff;--accent-soft:#e8efff}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
    background:radial-gradient(1200px 600px at 50% -10%, #e9efff, var(--bg)); color:var(--ink); min-height:100vh}
  .wrap{max-width:760px;margin:0 auto;padding:40px 20px}
  h1{font-size:24px;margin:0 0 6px}
  .meta{color:var(--muted);font-size:13px;margin-bottom:22px}
  .list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
  .item{display:flex;gap:12px;align-items:flex-start;background:var(--panel);border:1px solid #dde3ee;
    border-radius:12px;padding:13px 15px;box-shadow:0 4px 14px rgba(31,39,51,.06)}
  .item .ic{font-size:20px;width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center;
    background:var(--accent-soft);border-radius:9px}
  .item .body{flex:1}
  .item .tt{font-weight:700;font-size:14px}
  .item .sub{color:var(--muted);font-size:12px;margin-top:3px}
  .empty{text-align:center;color:var(--muted);padding:40px 0}
  .live{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ok);font-weight:600}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:pulse 1.6s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
</style>
</head>
<body>
  <div class="wrap">
    <h1>🔔 工作流变更通知流</h1>
    <div class="meta"><span class="live"><span class="dot"></span>实时刷新（每 8 秒）</span> · 来源：商业视频工作流画布</div>
    <ul id="list" class="list"><li class="empty">加载中…</li></ul>
  </div>
  <script>
    var TYPE_ICON={add:"➕",delete:"🗑️",reorder:"↕️",layout:"🧩",reset:"♻️",edit:"✏️",update:"🔔"};
    function esc(s){return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
    function fmt(ts){try{return new Date(ts).toLocaleString("zh-CN");}catch(e){return ts;}}
    function load(){
      fetch("/api/events").then(function(r){return r.json();}).then(function(d){
        var list=document.getElementById("list");
        if(!d.events||!d.events.length){list.innerHTML='<li class="empty">暂无变更通知</li>';return;}
        list.innerHTML=d.events.map(function(e){
          var ic=TYPE_ICON[e.type]||"🔔";
          var sub=(e.detail?esc(e.detail)+" · ":"")+(e.by||"匿名")+" · "+fmt(e.ts);
          return '<li class="item"><span class="ic">'+ic+'</span><div class="body"><div class="tt">'+esc(e.title)+
            '</div><div class="sub">'+sub+'</div></div></li>';
        }).join("");
      }).catch(function(){document.getElementById("list").innerHTML='<li class="empty">加载失败，请刷新</li>';});
    }
    load(); setInterval(load, 8000);
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  try {
    if (p === "/api/notify" && req.method === "POST") {
      let d;
      try { d = JSON.parse(await readBody(req)); }
      catch (e) { return sendJSON(res, 400, { ok: false, error: "invalid json" }); }
      const ev = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        ts: new Date().toISOString(),
        type: String(d.type || "update").slice(0, 40),
        title: String(d.title || "").slice(0, 120),
        detail: String(d.detail || "").slice(0, 500),
        by: String(d.by || "匿名").slice(0, 60),
        site: String(d.site || "").slice(0, 120)
      };
      events.push(ev);
      saveEvents(events);
      return sendJSON(res, 200, { ok: true, id: ev.id });
    }
    if (p === "/api/events" && req.method === "GET") {
      const list = events.slice(-MAX_EVENTS).reverse();
      return sendJSON(res, 200, { count: list.length, events: list });
    }
    if ((p === "/" || p === "/notify") && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...CORS });
      return res.end(FEED_HTML);
    }
    if (p === "/health") return sendJSON(res, 200, { ok: true });
    res.writeHead(404, { ...CORS, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  } catch (e) {
    sendJSON(res, 500, { ok: false, error: e.message });
  }
});

server.listen(PORT, () => console.log("notify server listening on " + PORT));
