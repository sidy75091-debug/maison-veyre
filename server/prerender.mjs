import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const vite = await createServer({
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
try {
  const { App } = await vite.ssrLoadModule("/src/App.tsx");
  const shell = await readFile("dist/client/index.html", "utf8");
  for (const path of ["/", "/contact"]) {
    const content = renderToString(createElement(App, { path }));
    let html = shell.replace(
      /<div id="root">[\s\S]*?<\/div>/,
      () => '<div id="root" data-prerendered="true">' + content + "</div>",
    );
    if (path === "/contact") {
      html = html
        .replace(
          /<title>.*?<\/title>/,
          "<title>Contact — Maison Veyre, chauffeurs privés</title>",
        )
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
          '<meta name="description" content="Contactez Maison Veyre pour préparer votre déplacement avec chauffeur ou préciser un besoin particulier.">',
        )
        .replace(
          /<link rel="preload" as="image" href="\/images\/hero\.webp"\s*\/?>/,
          "",
        );
      await mkdir("dist/client/contact", { recursive: true });
    }
    await writeFile(
      path === "/"
        ? "dist/client/index.html"
        : "dist/client/contact/index.html",
      html,
    );
  }
} finally {
  await vite.close();
}

