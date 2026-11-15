// ASTRA standalone offline server — zero dependencies, Node 18+.
// Serves the prerendered app from dist/client and falls back to index.html
// so every page works when the laptop has no internet connection.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./dist", import.meta.url));
const port = Number(process.env.PORT || 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".glb": "model/gltf-binary",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

async function sendFile(res, path) {
  const body = await readFile(path);
  res.writeHead(200, { "content-type": TYPES[extname(path).toLowerCase()] ?? "application/octet-stream" });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const safe = normalize(url).replace(/^(\.\.[/\\])+/, "");
    let path = join(root, safe);
    try {
      await sendFile(res, path);
      return;
    } catch {
      /* not a file — try as a prerendered page, then the app shell */
    }
    try {
      await sendFile(res, join(path, "index.html"));
      return;
    } catch {
      /* fall through to the shell */
    }
    await sendFile(res, join(root, "index.html"));
  } catch (err) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`ASTRA is running. Open http://localhost:${port} in your browser.`);
  console.log("Offline Demo Mode works with no internet connection. Press Ctrl+C to stop.");
});
