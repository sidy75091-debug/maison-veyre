import { useRef, useState, type FormEvent } from "react";
import { cars, type Vehicle, services } from "./data";
import { Icon } from "./icons";
import { formatSwissDeparture, swissDepartures, swissZone, todayInSwitzerland } from "./swissTime";
type Fields = Record<string, string>;
const vehicleKeys: Vehicle[] = ["E", "S"];
async function send(kind: string, data: Fields, key: string) {
  const response = await fetch("/api/" + kind, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...data, key }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.reference)
    throw new Error(
      result.error ||
        "L’enregistrement a échoué. Vos informations sont conservées dans ce formulaire pour réessayer.",
    );
  return result.reference as string;
}
function Success({
  reference,
  contact = false,
  onDone,
}: {
  reference: string;
  contact?: boolean;
  onDone: () => void;
}) {
  return (
    <div className="success">
      <span className="successmark">
        <Icon name="check" size={28} />
      </span>
      <p className="eyebrow">Maison Veyre</p>
      <h2>{contact ? "Message enregistré" : "Demande enregistrée"}</h2>
      <p>
        Votre référence est <strong>{reference}</strong>.
      </p>
      {!contact && (
        <p>
          Votre trajet reste à confirmer par l’agence après vérification de la
          disponibilité et du tarif.
        </p>
      )}
      <button className="button gold" onClick={onDone}>
        Retour au site <Icon name="arrow" />
      </button>
    </div>
  );
}
export function Booking({
  initial,
  service,
  origin = "",
  destination = "",
  onDone,
}: {
  initial: Vehicle;
  service: string;
  origin?: string;
  destination?: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(1),
    [data, setData] = useState<Fields>({
      vehicle: initial,
      service: service || services[0][1],
      passengers: "1",
      origin,
      destination,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState("");
  const key = useRef(crypto.randomUUID()),
    sending = useRef(false);
  const choices = swissDepartures(data.date, data.time);
  const when = choices.length === 1 ? choices[0] : choices.find(d => d.toISOString() === data.occurrence);
  function change(k: string, v: string) {
    setData((d) => ({ ...d, [k]: v }));
    key.current = crypto.randomUUID();
    setError("");
  }
  function field(
    k: string,
    label: string,
    type = "text",
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) {
    return (
      <label>
        {label}
        <input
          required
          type={type}
          maxLength={240}
          value={data[k] || ""}
          onChange={(e) => change(k, e.target.value)}
          {...props}
        />
      </label>
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    setError("");
    if (!when || when.getTime() <= Date.now()) {
      setStep(1);
      setError(!choices.length ? "Cette heure n’existe pas en Suisse à cette date. Choisissez une autre heure." :
        !when ? "Précisez l’heure souhaitée lors du passage à l’heure d’hiver." : "Choisissez une date et une heure à venir.");
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      setReference(
        await send(
          "reservations",
          {
            ...data,
            departureAt: when.toISOString(),
            timezone: swissZone,
          },
          key.current,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connexion indisponible. Veuillez réessayer.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (reference) return <Success reference={reference} onDone={onDone} />;
  return (
    <div className="formwrap">
      <span className="eyebrow">
        <i /> Réservation
      </span>
      <h2>Réserver un chauffeur</h2>
      <div className="steps">
        <span className={step === 1 ? "current" : ""}>
          01 &nbsp; Votre trajet
        </span>
        <span className={step === 2 ? "current" : ""}>
          02 &nbsp; Coordonnées
        </span>
      </div>
      <form onSubmit={submit}>
        {step === 1 ? (
          <div className="fields" key="trip">
            <label className="span2">
              Prestation
              <select
                value={data.service}
                onChange={(e) => change("service", e.target.value)}
              >
                {services.map((s) => (
                  <option key={s[1]}>{s[1]}</option>
                ))}
              </select>
            </label>
            {field("origin", "Adresse de départ", "text", {
              placeholder: "Ex. Genève Aéroport, Arrivées",
            })}
            {field("destination", "Adresse de destination", "text", {
              placeholder: "Ex. Gare de Lausanne",
            })}
            {field("date", "Date de départ", "date", { min: todayInSwitzerland() })}
            {field("time", "Heure de départ", "time")}
            <small className="span2 muted">
              Heure locale suisse · Europe/Zurich
            </small>
            {choices.length === 2 && <label className="span2">Passage à l’heure d’hiver
              <select required value={when?.toISOString() || ""} onChange={e => change("occurrence", e.target.value)}>
                <option value="">Choisir le premier ou le second passage</option>
                {choices.map(d => <option key={d.toISOString()} value={d.toISOString()}>{formatSwissDeparture(d)}</option>)}
              </select>
            </label>}
            <label>
              Passagers
              <select
                value={data.passengers}
                onChange={(e) => change("passengers", e.target.value)}
              >
                {[1, 2, 3, 4].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Catégorie Mercedes souhaitée
              <select
                value={data.vehicle}
                onChange={(e) => change("vehicle", e.target.value)}
              >
                {vehicleKeys.map((k) => (
                  <option key={k} value={k}>
                    {cars[k].title} · {cars[k].category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="fields" key="contact">
            <div className="summary span2">
              <Icon name="pin" />
              <div>
                <b>
                  {data.origin} → {data.destination}
                </b>
                <small>
                  {when && formatSwissDeparture(when)}{" "}
                  · {cars[data.vehicle as Vehicle].category} · {data.passengers}{" "}
                  pass.
                </small>
              </div>
            </div>
            {field("name", "Nom complet", "text", { autoComplete: "name" })}
            {field("phone", "Téléphone", "tel", {
              autoComplete: "tel",
              placeholder: "+41 …",
              minLength: 6,
              maxLength: 30,
              title: "Numéro de téléphone, avec indicatif si nécessaire.",
            })}
            <div className="span2">
              {field("email", "Adresse e-mail", "email", {
                autoComplete: "email",
              })}
            </div>
            <label className="span2">
              Informations complémentaires (facultatif)
              <textarea
                rows={3}
                maxLength={2000}
                value={data.notes || ""}
                onChange={(e) => change("notes", e.target.value)}
                placeholder="Bagages, étapes, besoins particuliers…"
              />
            </label>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="formactions">
          {step === 2 && (
            <button
              type="button"
              className="textbtn"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              Retour
            </button>
          )}
          <button disabled={busy} className="button gold">
            {busy
              ? "Enregistrement…"
              : step === 1
                ? "Continuer"
                : "Envoyer ma demande"}
            <Icon name="arrow" />
          </button>
        </div>
      </form>
    </div>
  );
}
export function ContactForm({ onDone }: { onDone: () => void }) {
  const [reference, setRef] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID()),
    pending = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Fields;
    try {
      setRef(await send("contact", data, key.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion indisponible.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (reference)
    return <Success reference={reference} contact onDone={onDone} />;
  return (
    <form
      onSubmit={submit}
      onChange={() => {
        key.current = crypto.randomUUID();
      }}
      className="contactform"
    >
      <div className="fields">
        <label>
          Nom complet
          <input name="name" required autoComplete="name" maxLength={160} />
        </label>
        <label>
          Adresse e-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={240}
          />
        </label>
        <label className="span2">
          Votre message
          <textarea name="message" required rows={5} maxLength={2000} />
        </label>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button gold" disabled={busy}>
        {busy ? "Enregistrement…" : "Envoyer le message"}
        <Icon name="arrow" />
      </button>
    </form>
  );
}
