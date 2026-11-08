import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  copyFile,
} from "node:fs/promises";
import { join, relative, extname } from "node:path";
const root = "dist/client",
  assets = {};
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".html": "text/html; charset=utf-8",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    assets["/" + relative(root, path).replaceAll("\\", "/")] = [
      mime[extname(path)] || "application/octet-stream",
      (await readFile(path)).toString("base64"),
    ];
  }
}
await walk(root);
const api = await readFile("server/api.mjs", "utf8"),
  worker = (await readFile("server/worker.mjs", "utf8")).replace(
    /^import [^\n]+\n/,
    "",
  );
const handler = `
function serveAsset(request){
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
 let p=new URL(request.url).pathname;if(p==='/')p='/index.html';if(p==='/contact'||p==='/contact/')p='/contact/index.html';
 const asset=ASSETS[p];if(!Array.isArray(asset))return new Response('Page introuvable',{status:404});
 const [type,base64]=asset;
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(base64),x=>x.charCodeAt(0)),{headers:{'Content-Type':type,'Cache-Control':p.startsWith('/assets/')?'public,max-age=31536000,immutable':p==='/index.html'?'no-cache':'public,max-age=3600','X-Content-Type-Options':'nosniff'}});
}`;
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
try {
  await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await writeFile(
  "dist/server/index.js",
  api +
    "\nconst ASSETS=" +
    JSON.stringify(assets) +
    ";\n" +
    handler +
    "\n" +
    worker,
);
console.log(
  "Worker construit, " + Object.keys(assets).length + " ressources intégrées.",
);

