const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers });
const serviceNames = [
  "Aéroport de Genève",
  "Gares de Genève et Lausanne",
  "Trajet Genève–Lausanne",
  "Transferts aéroports",
  "Transferts gares",
  "Déplacements professionnels",
  "Mariages et événements",
  "Mise à disposition",
  "Excursions privées",
];
function validate(input, kind) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return;
  const fields =
    kind === "contact"
      ? ["name", "email", "message"]
      : [
          "name",
          "email",
          "origin",
          "destination",
          "date",
          "time",
          "departureAt",
          "timezone",
          "passengers",
          "vehicle",
          "phone",
          "service",
          "notes",
        ];
  const out = {};
  for (const k of fields) {
    const v = input[k] ?? "";
    if (typeof v !== "string") return;
    const trimmed = v.trim();
    if (
      (k !== "notes" && !trimmed) ||
      trimmed.length > (["message", "notes"].includes(k) ? 2000 : 240)
    )
      return;
    out[k] = trimmed;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return;
  if (kind === "reservations") {
    if (
      !["E", "S"].includes(out.vehicle) ||
      !["1", "2", "3", "4"].includes(out.passengers) ||
      !serviceNames.includes(out.service) ||
      !/^\+?[\d ()\.\-]{6,30}$/.test(out.phone) ||
      out.phone.replace(/\D/g, "").length < 6
    )
      return;
    const timestamp = new Date(out.departureAt);
    if (!Number.isFinite(timestamp.getTime())) return;
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: out.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(timestamp)
          .map((p) => [p.type, p.value]),
      );
      if (
        out.date !== [parts.year, parts.month, parts.day].join("-") ||
        out.time !== [parts.hour, parts.minute].join(":")
      )
        return;
    } catch {
      return;
    }
  }
  return out;
}
export async function handleRequest(request, db) {
  const path = new URL(request.url).pathname,
    kind = path.slice(5);
  if (kind !== "contact" && kind !== "reservations")
    return json({ error: "Adresse inconnue." }, 404);
  if (request.method !== "POST")
    return json({ error: "Méthode non autorisée." }, 405);
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return json({ error: "Origine non autorisée." }, 403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return json({ error: "Format attendu : JSON." }, 415);
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Demande vide." }, 400);
    const decoder = new TextDecoder();
    let bytes = 0,
      raw = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) {
        await reader.cancel();
        return json({ error: "Demande trop longue." }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(raw + decoder.decode());
  } catch {
    return json({ error: "Données illisibles." }, 400);
  }
  const data = validate(input, kind);
  if (!data || !/^[-\da-f]{36}$/i.test(input.key))
    return json({ error: "Vérifiez les champs de votre demande." }, 422);
  const payload = JSON.stringify(data);
  try {
    const existing = await db.find(input.key);
    if (existing)
      return existing.kind === kind && existing.payload === payload
        ? json({ reference: existing.reference }, 200)
        : json({ error: "Identifiant déjà utilisé." }, 409);
    if (kind === "reservations" && Date.parse(data.departureAt) <= Date.now())
      return json({ error: "Choisissez un départ à venir." }, 422);
    const ref = "MV-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    await db.insert(input.key, ref, kind, payload);
    const saved = await db.find(input.key);
    if (!saved) throw Error("write");
    if (saved.kind !== kind || saved.payload !== payload)
      return json({ error: "Identifiant déjà utilisé." }, 409);
    return json({ reference: saved.reference }, 201);
  } catch {
    return json(
      {
        error:
          "L’enregistrement est temporairement indisponible. Vous pouvez réessayer.",
      },
      503,
    );
  }
}
export const findSQL =
  "SELECT reference, kind, payload FROM requests WHERE idempotency_key = ?";
export const insertSQL =
  "INSERT INTO requests(idempotency_key,reference,kind,payload) VALUES(?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING";
