import { lazy, Suspense, useEffect, useState } from "react";

import { agency, cars, faqs, services, type Vehicle } from "./data";
import { Brand, Icon } from "./icons";
import { Booking, ContactForm } from "./Forms";
import { carPhotos } from "./carPhotos";
import { placePhotos } from "./placePhotos";
import { equipmentFor, availabilityLabel } from "./equipment";
import { Dialog } from "./Dialog";

const Garage = lazy(() => import("./Garage"));
const models: Vehicle[] = ["E", "S"];
const views = [
  {image:"geneve",title:"Genève · La rade",alt:"Le Jet d’eau de Genève et les quais au coucher du soleil"},
  {image:"ouchy",title:"Lausanne · Ouchy",alt:"Le front de lac d’Ouchy, à Lausanne, vu du Léman"},
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
    [credits,setCredits] = useState(false), [menu, setMenu] = useState(false),
    [booking, setBooking] = useState<{ car: Vehicle; service: string; origin?:string; destination?:string } | null>(
      null,
    ),
    [garage, setGarage] = useState<{
      car?: Vehicle;
      interior?: boolean;
    } | null>(null);
  const contact = path.replace(/\/$/, "") === "/contact";
  const book = (car: Vehicle = "E", service = "", origin = "", destination = "") => {
    setGarage(null);
    setMenu(false);
    setBooking({ car, service, origin, destination });
  };
  const openGarage = (car?: Vehicle, interior = false) =>
    setGarage({ car, interior });
  const view = views[slide],
    home = contact ? "/" : "";
  useEffect(() => {
    if (contact) document.title = "Contact à Genève et Lausanne — Maison Veyre";
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
              Un transfert à Genève, un rendez-vous à Lausanne ou une excursion sur les rives du Léman ?
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
            className={"hero swisshero slide-" + slide}
            aria-label="Présentation de Maison Veyre"
          >
            <img
              className="heroimg"
              key={view.image}
              src={"/images/" + view.image + ".webp"}
              alt={view.alt}
              fetchPriority="high"
            />
            <div className="heroshade" />
            <div className="herocontent page">
              <div className="swiss-kicker"><i aria-hidden="true" />Genève • Lausanne • Suisse</div>
              <h1>Votre chauffeur privé<br/><em>à Genève et Lausanne.</em></h1>
              <p>L’élégance du transport privé au cœur de la Suisse romande. Des trajets pensés pour votre confort, vos rendez-vous et vos déplacements.</p>
              <div className="herolinks">
                <button className="button gold enter" onClick={()=>book()}>Réserver un chauffeur <Icon name="arrow" size={17}/></button>
                <a className="button ghost-route" href="#showroom">Découvrir nos véhicules</a>
              </div>
            </div>
            <button className="hero-car" onClick={()=>openGarage("E")} aria-label="Explorer la Classe E dans le garage">
              <img src="/images/classe-e.webp" alt="Mercedes Classe E noire, vue avant" />
              <span><small>La collection</small>Mercedes Classe E</span><Icon name="diagonal" size={15}/>
            </button>
            <div className="herobar page">
              <div className="viewindex">
                <b>0{slide + 1}</b>
                <span className="track">
                  <i style={{ width: ((slide + 1) / views.length) * 100 + "%" }} />
                </span>
                <span>02</span>
                <div className="viewname">{view.title}</div>
              </div>
              <div className="herocontrols">
                <button
                  className="iconbtn"
                  aria-label="Vue précédente"
                  onClick={() => setSlide((slide - 1 + views.length) % views.length)}
                >
                  <Icon name="left" size={16} />
                </button>
                <button
                  className="iconbtn"
                  aria-label="Vue suivante"
                  onClick={() => setSlide((slide + 1) % views.length)}
                >
                  <Icon name="right" size={16} />
                </button>
              </div>
            </div>
          </section>
          <div className="route-strip"><div className="page"><span>Préparer mon trajet</span>
            <button onClick={()=>book("E","Aéroport de Genève","Aéroport de Genève (GVA)")}>Genève Aéroport <Icon name="diagonal" size={13}/></button>
            <button onClick={()=>book("E","Trajet Genève–Lausanne","Genève","Lausanne")}>Genève → Lausanne <Icon name="diagonal" size={13}/></button>
            <button onClick={()=>book("E","Gares de Genève et Lausanne","Gare de Lausanne")}>Gare de Lausanne <Icon name="diagonal" size={13}/></button>
          </div></div>
          <section className="page section fleet" id="showroom">
            <Eyebrow>Le showroom</Eyebrow>
            <div className="sectionhead">
              <h2>
                Les berlines <em>Mercedes.</em>
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
                      alt={"Photographie de référence : " + cars[k].title + " noire"}
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
              Photographies de référence. Le véhicule attribué sera confirmé
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
                src="/images/ouchy.webp"
                alt="Les façades lausannoises du quartier d’Ouchy, vues du lac Léman"
                loading="lazy"
              />
              <div>
                <Eyebrow>La maison</Eyebrow>
                <h2>
                  Au fil <em>du Léman.</em>
                </h2>
                <p>
                  D’un accueil à Genève-Cornavin à un rendez-vous sur les quais d’Ouchy, chaque départ commence par un lieu et une heure convenus avec vous.
                </p>
                <h3>Le confort à bord</h3>
                <p>
                  {equipmentFor("S").length ? equipmentFor("S").map((item,i)=><span key={item.id}>{i ? " · " : ""}{item.title} ({availabilityLabel("S",item.id).startsWith("Disponibilité confirmée") ? "confirmé en Prestige" : "sur demande"})</span>) : "Précisez vos préférences lors de la réservation."}
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
                  "Aéroport de Genève",
                  "Mise à disposition",
                  "Excursions privées",
                ].map((s) => (
                  <div key={s}>
                    <h3>{s}</h3>
                    <p>{agency.rates[s] != null ? new Intl.NumberFormat("fr-CH",{style:"currency",currency:"CHF"}).format(agency.rates[s]!) : "Sur devis"}</p>
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
        <button className="creditlink" onClick={()=>setCredits(true)}>Crédits photos</button>
        <span>© {new Date().getFullYear()} Maison Veyre</span>
        <a href="/contact">
          Contact <Icon name="diagonal" size={13} />
        </a>
      </footer>
      {credits && <Dialog label="Crédits photographiques" onClose={()=>setCredits(false)}><div className="photocredits"><h2>Crédits photographiques</h2>{[...placePhotos,...carPhotos].map(p=><p key={p.source}><a href={p.source}>{p.label}</a><br/>{p.author} · <a href={p.licenseUrl}>{p.license}</a><br/>{p.changes}</p>)}</div></Dialog>}
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
            service={booking.service} origin={booking.origin} destination={booking.destination}
            onDone={() => setBooking(null)}
          />
        </Dialog>
      )}
    </>
  );
}
