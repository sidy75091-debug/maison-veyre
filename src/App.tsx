import { lazy, Suspense, useEffect, useState } from "react";

import { agency, cars, faqs, services, type Vehicle } from "./data";
import { Brand, Icon } from "./icons";
import { Booking, ContactForm } from "./Forms";
import { Dialog } from "./Dialog";

const Garage = lazy(() => import("./Garage"));
const models: Vehicle[] = ["E", "S"];
const views = [
  {
    image: "hero",
    title: "Extérieur du garage",
    heading: (
      <>
        Bien plus qu’un trajet.
        <br />
        <em>Une expérience.</em>
      </>
    ),
    eyebrow: "L’expérience chauffeur privé",
    description:
      "Découvrez l’excellence du transport privé, où confort, ponctualité et élégance accompagnent chaque déplacement.",
  },
  {
    image: "showroom",
    title: "Le showroom",
    heading: (
      <>
        Le garage privé.
        <br />
        <em>Deux signatures.</em>
      </>
    ),
    eyebrow: "La collection",
    description:
      "Explorez les silhouettes Business et Prestige et choisissez la catégorie qui accompagnera votre trajet.",
  },
  {
    image: "cabin",
    title: "L’habitacle",
    heading: (
      <>
        À bord.
        <br />
        <em>En toute intimité.</em>
      </>
    ),
    eyebrow: "Le confort intérieur",
    description:
      "Prenez place dans l’habitacle virtuel et découvrez la perspective d’un passager.",
  },
];
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <i />
      {children}
    </div>
  );
}
export function App({ path = "/" }: { path?: string }) {
  const [slide, setSlide] = useState(0),
    [menu, setMenu] = useState(false),
    [booking, setBooking] = useState<{ car: Vehicle; service: string } | null>(
      null,
    ),
    [garage, setGarage] = useState<{
      car?: Vehicle;
      interior?: boolean;
    } | null>(null);
  const contact = path.replace(/\/$/, "") === "/contact";
  const book = (car: Vehicle = "E", service = "") => {
    setGarage(null);
    setMenu(false);
    setBooking({ car, service });
  };
  const openGarage = (car?: Vehicle, interior = false) =>
    setGarage({ car, interior });
  const view = views[slide],
    home = contact ? "/" : "";
  useEffect(() => {
    if (contact) document.title = "Contact — Maison Veyre, chauffeurs privés";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [contact]);
  return (
    <>
      <a className="skip" href="#content">
        Aller au contenu
      </a>
      <header>
        <div className="navwrap">
          <a className="homebrand" aria-label="Maison Veyre, accueil" href="/">
            <Brand />
          </a>
          <nav
            className={menu ? "open" : ""}
            id="nav"
            aria-label="Navigation principale"
            onClick={() => setMenu(false)}
          >
            <a href={home + "#showroom"}>Le showroom</a>
            <a href={home + "#prestations"}>Prestations</a>
            <a href={home + "#maison"}>La maison</a>
            <a href="/contact" aria-current={contact ? "page" : undefined}>
              Contact
            </a>
          </nav>
          <div className="navbuttons">
            <button className="button gold navbook" onClick={() => book()}>
              <Icon name="calendar" size={16} />
              Réserver <span>un chauffeur</span>
            </button>
            <button
              className="menubtn iconbtn"
              aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"}
              aria-controls="nav"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      {contact ? (
        <main className="page contactpage" id="content">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <h1>
              Parlons de
              <br />
              <em>votre trajet.</em>
            </h1>
            <p>
              Une question sur une prestation ou un déplacement particulier ?
              Écrivez à Maison Veyre.
            </p>
            <button className="link" onClick={() => book()}>
              Préparer une réservation <Icon name="arrow" />
            </button>
          </div>
          <ContactForm
            onDone={() => {
              location.href = "/";
            }}
          />
        </main>
      ) : (
        <main id="content">
          <section
            className={"hero slide-" + slide}
            aria-label="Présentation de Maison Veyre"
          >
            <img
              className="heroimg"
              key={view.image}
              src={"/images/" + view.image + ".webp"}
              alt={view.title}
              fetchPriority="high"
            />
            <div className="heroshade" />
            <div className="herocontent page" key={slide}>
              <Eyebrow>{view.eyebrow}</Eyebrow>
              <h1>{view.heading}</h1>
              <p>{view.description}</p>
              <div className="herolinks">
                <button
                  className="button gold enter"
                  onClick={() =>
                    openGarage(slide === 2 ? "S" : undefined, slide === 2)
                  }
                >
                  <Icon name="cube" size={18} />
                  Entrer dans notre univers <Icon name="arrow" size={17} />
                </button>
                <a className="skipintro" href="#showroom">
                  Passer l’introduction <Icon name="diagonal" size={14} />
                </a>
              </div>
            </div>
            <div className="herobar page">
              <div className="viewindex">
                <b>0{slide + 1}</b>
                <span className="track">
                  <i style={{ width: ((slide + 1) / 3) * 100 + "%" }} />
                </span>
                <span>03</span>
                <div className="viewname">{view.title}</div>
              </div>
              <div className="herocontrols">
                <button
                  className="iconbtn"
                  aria-label="Vue précédente"
                  onClick={() => setSlide((slide + 2) % 3)}
                >
                  <Icon name="left" size={16} />
                </button>
                <button
                  className="iconbtn"
                  aria-label="Vue suivante"
                  onClick={() => setSlide((slide + 1) % 3)}
                >
                  <Icon name="right" size={16} />
                </button>
              </div>
            </div>
          </section>
          <section className="page section fleet" id="showroom">
            <Eyebrow>Le showroom</Eyebrow>
            <div className="sectionhead">
              <h2>
                Notre collection <em>privée.</em>
              </h2>
              <button className="link" onClick={() => openGarage()}>
                <Icon name="cube" size={17} />
                Explorer en 3D <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="cargrid">
              {models.map((k) => (
                <article className="carcard" key={k}>
                  <button
                    className="carphoto"
                    onClick={() => openGarage(k)}
                    aria-label={"Explorer " + cars[k].title + " en 3D"}
                  >
                    <img
                      src={"/images/" + cars[k].image + ".webp"}
                      alt={"Illustration de la berline " + cars[k].category}
                      loading="lazy"
                    />
                    <span className="carclass">{cars[k].category}</span>
                    <span className="roundcube">
                      <Icon name="cube" size={17} />
                    </span>
                  </button>
                  <div className="carbody">
                    <h3>{cars[k].title}</h3>
                    <p>{cars[k].description}</p>
                    <button className="link" onClick={() => openGarage(k)}>
                      Explorer le véhicule <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <p className="caption">
              Modèles de référence illustrés. Le véhicule attribué sera confirmé
              par l’agence.
            </p>
          </section>
          <section className="band" id="prestations">
            <div className="page section">
              <Eyebrow>Nos prestations</Eyebrow>
              <h2>
                À chaque trajet, <em>son service.</em>
              </h2>
              <div className="servicegrid">
                {services.map(([icon, title, desc]) => (
                  <button
                    key={title}
                    className="service"
                    onClick={() => book("E", title)}
                  >
                    <Icon name={icon} size={25} />
                    <h3>{title}</h3>
                    <p>{desc}</p>
                    <Icon name="diagonal" size={16} />
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section className="page section" id="maison">
            <div className="maison">
              <img
                src="/images/cabin.webp"
                alt="Illustration d’un habitacle en cuir cognac"
                loading="lazy"
              />
              <div>
                <Eyebrow>La maison</Eyebrow>
                <h2>
                  Le sens <em>du détail.</em>
                </h2>
                <p>
                  Notre engagement commence avant le départ : préciser le lieu
                  de rencontre, prendre en compte vos contraintes horaires et
                  préparer un trajet discret.
                </p>
                <h3>Le confort à bord</h3>
                <p>
                  {agency.equipment.length
                    ? agency.equipment.join(" · ")
                    : "Indiquez vos préférences à la réservation. Les équipements à bord et les possibilités d’accueil seront précisés avec le véhicule proposé."}
                </p>
                <button className="link" onClick={() => openGarage("S", true)}>
                  Découvrir l’intérieur <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          </section>
          <section className="band">
            <div className="page section">
              <Eyebrow>Les forfaits</Eyebrow>
              <h2>
                Un trajet <em>à votre mesure.</em>
              </h2>
              <div className="rates">
                {[
                  "Transferts aéroports",
                  "Mise à disposition",
                  "Excursions privées",
                ].map((s) => (
                  <div key={s}>
                    <h3>{s}</h3>
                    <p>{agency.rates[s] || "Sur devis"}</p>
                    <button className="link" onClick={() => book("E", s)}>
                      Demander un devis <Icon name="arrow" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="page section questions">
            <div>
              <Eyebrow>Vos questions</Eyebrow>
              <h2>
                Avant <em>le départ.</em>
              </h2>
              <a className="link" href="/contact">
                Nous contacter <Icon name="arrow" size={15} />
              </a>
            </div>
            <div className="faqs">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Icon name="plus" size={17} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>
          <section className="page reviews">
            <Eyebrow>Avis clients</Eyebrow>
            {agency.reviews.length ? (
              agency.reviews.map((r) => (
                <blockquote key={r.quote}>
                  {r.quote}
                  <cite>
                    {r.author} · {r.source}
                  </cite>
                </blockquote>
              ))
            ) : (
              <p>Aucun avis publié pour le moment.</p>
            )}
          </section>
          <section className="endcta">
            <div className="page">
              <h2>
                Votre prochain <em>départ.</em>
              </h2>
              <div>
                <button className="button gold" onClick={() => book()}>
                  Réserver un chauffeur <Icon name="arrow" />
                </button>
                <a className="link" href="#showroom">
                  Explorer nos véhicules <Icon name="arrow" size={16} />
                </a>
              </div>
            </div>
          </section>
        </main>
      )}
      <footer className="page">
        <a href="/" aria-label="Maison Veyre, accueil">
          <Brand />
        </a>
        <span>© {new Date().getFullYear()} Maison Veyre</span>
        <a href="/contact">
          Contact <Icon name="diagonal" size={13} />
        </a>
      </footer>
      {garage && (
        <Dialog
          wide
          label="Showroom interactif"
          onClose={() => setGarage(null)}
        >
          <Suspense fallback={<p className="loading">Ouverture du garage…</p>}>
            <Garage
              initial={garage.car}
              interior={!!garage.interior}
              onBook={book}
            />
          </Suspense>
        </Dialog>
      )}
      {booking && (
        <Dialog label="Réserver un chauffeur" onClose={() => setBooking(null)}>
          <Booking
            initial={booking.car}
            service={booking.service}
            onDone={() => setBooking(null)}
          />
        </Dialog>
      )}
    </>
  );
}
