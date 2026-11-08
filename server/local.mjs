import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  createReadStream,
  existsSync,
  readFileSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { resolve, extname, sep } from "node:path";
import { Readable } from "node:stream";
import { handleRequest, findSQL, insertSQL } from "./api.mjs";
const port = Number(process.env.PORT || 4173),
  host = "127.0.0.1",
  dev = process.argv.includes("--dev");
const vite = dev
  ? await (
      await import("vite")
    ).createServer({
      server: {
        middlewareMode: true,
        fs: {
          deny: [
            "**/.local/**",
            "**/.git/**",
            "**/.env*",
            "**/server/**",
            "**/.openai/**",
          ],
        },
      },
      appType: "spa",
    })
  : null;
const databaseFile = process.env.VEYRE_DB || ".local/requests.sqlite";
if (!process.env.VEYRE_DB) mkdirSync(".local", { recursive: true });
const database = new DatabaseSync(databaseFile);
database.exec(readFileSync("drizzle/0000_requests.sql", "utf8"));
database.exec("PRAGMA journal_mode=WAL;");
const db = {
  find: (k) => database.prepare(findSQL).get(k),
  insert: (...v) => database.prepare(insertSQL).run(...v),
};
const root = resolve("dist/client"),
  mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".txt": "text/plain",
  };
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://" + (req.headers.host || host));
      if (url.pathname.startsWith("/api/")) {
        const response = await handleRequest(
          new Request(url, {
            method: req.method,
            headers: req.headers,
            ...(!["GET", "HEAD"].includes(req.method)
              ? { body: Readable.toWeb(req), duplex: "half" }
              : {}),
          }),
          db,
        );
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
        return;
      }
      if (vite) {
        vite.middlewares(req, res);
        return;
      }
      if (!["HEAD", "GET"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const part =
        url.pathname === "/"
          ? "/index.html"
          : ["/contact", "/contact/"].includes(url.pathname)
            ? "/contact/index.html"
            : decodeURIComponent(url.pathname);
      const file = resolve(root, "." + part);
      if (
        !file.startsWith(root + sep) ||
        !existsSync(file) ||
        !statSync(file).isFile()
      ) {
        res.writeHead(404);
        res.end("Page introuvable");
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      if (req.method === "HEAD") res.end();
      else createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500);
      res.end("Service indisponible");
    }
  })
  .listen(port, host, () =>
    console.log("Maison Veyre : http://" + host + ":" + port),
  );
