// 로컬 서버: site/ 미리보기
// 사용법: npm run serve → http://localhost:8642
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const siteDir = path.join(root, "site");
const PORT = 8642;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mind": "application/octet-stream",
};

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function sendFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, "not found");
  send(res, 200, fs.readFileSync(file), mime[path.extname(file).toLowerCase()] ?? "application/octet-stream");
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = decodeURIComponent(url.pathname);

  const file = path.join(siteDir, p === "/" ? "index.html" : p);
  if (!file.startsWith(siteDir)) return send(res, 403, "forbidden");
  sendFile(res, file);
}).listen(PORT, () => {
  console.log(`미리보기 → http://localhost:${PORT}/`);
});
