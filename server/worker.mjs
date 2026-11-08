import { handleRequest, findSQL, insertSQL } from "./api.mjs";
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/"))
      return handleRequest(request, {
        find: (k) => env.DB.prepare(findSQL).bind(k).first(),
        insert: (...v) =>
          env.DB.prepare(insertSQL)
            .bind(...v)
            .run(),
      });
    return serveAsset(request);
  },
};
