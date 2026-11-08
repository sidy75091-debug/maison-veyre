import { get, put } from "@vercel/blob";
import { handleRequest } from "./api.mjs";

const pathname = (key) => "demandes/" + key + ".json";

async function find(key) {
  const blob = await get(pathname(key), { access: "private", useCache: false });
  if (!blob) return null;
  if (blob.statusCode !== 200 || !blob.stream) throw new Error("Lecture indisponible");
  return new Response(blob.stream).json();
}

async function insert(key, reference, kind, payload) {
  const record = { reference, kind, payload, createdAt: new Date().toISOString() };
  try {
    await put(pathname(key), JSON.stringify(record), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  } catch (error) {
    // A simultaneous submission may have already created this immutable record.
    // The common handler re-reads it and compares the payload.
    if (!(await find(key))) throw error;
  }
}

export default {
  fetch(request) {
    return handleRequest(request, { find, insert });
  },
};
