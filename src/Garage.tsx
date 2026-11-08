import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { cars, type Vehicle } from "./data";
import { Icon } from "./icons";
import { Scene, type View } from "./Scene";
class Boundary extends Component<
  { fallback: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fallback();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function Garage({
  initial,
  interior,
  onBook,
}: {
  initial?: Vehicle;
  interior: boolean;
  onBook: (v: Vehicle) => void;
}) {
  const [vehicle, setVehicle] = useState<Vehicle>(initial || "E"),
    [view, setView] = useState<View>(
      interior ? "cabin" : initial ? "car" : "intro",
    ),
    [flat, setFlat] = useState(false),
    [notice, setNotice] = useState(""),
    [point, setPoint] = useState(""),
    [help, setHelp] = useState(false);
  const reduced = useRef(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  function select(v: Vehicle) {
    setVehicle(v);
    setPoint("");
    setView("car");
  }
  function goto(v: View) {
    setView(v);
    setPoint("");
  }
  function fallback() {
    setFlat(true);
    setNotice("La visite photographique est disponible sur cet appareil.");
    setView((v) => (v === "intro" ? "overview" : v));
  }
  useEffect(() => {
    if (view === "intro" && flat) goto("overview");
  }, [view, flat]);
  const interiorView = view === "cabin" || view === "roof";
  return (
    <div className="garage">
      <div className="garagebar">
        <span className="eyebrow">
          <Icon name="cube" size={16} /> Le garage privé
        </span>
        <span className="garagebadge">
          {flat ? "Visite photo" : "Showroom 3D"}
        </span>
      </div>
      <div
        className="stage"
        tabIndex={0}
        aria-label="Scène du showroom, déplacement avec ZQSD ou les flèches"
        onPointerDown={(e) => {
          if (e.target instanceof HTMLCanvasElement) e.currentTarget.focus();
        }}
      >
        {flat ? (
          <img
            className="flatimg"
            alt={
              interiorView
                ? "Habitacle illustratif"
                : view === "car"
                  ? cars[vehicle].title
                  : "Les deux berlines du showroom"
            }
            src={
              "/images/" +
              (interiorView
                ? "cabin"
                : view === "car"
                  ? cars[vehicle].image
                  : view === "entrance"
                    ? "hero"
                    : "showroom") +
              ".webp"
            }
          />
        ) : (
          <Boundary fallback={fallback}>
            <Canvas
              dpr={[1, 1.65]}
              shadows
              camera={{
                fov: 48,
                position: [0, 2.15, 16.5],
                near: 0.035,
                far: 100,
              }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl }) => {
                gl.domElement.addEventListener(
                  "webglcontextlost",
                  (e) => {
                    e.preventDefault();
                    fallback();
                  },
                  { once: true },
                );
              }}
            >
              <Scene
                view={view}
                vehicle={vehicle}
                reduced={reduced}
                select={select}
                onEnter={() => setView((v) => (v === "intro" ? "overview" : v))}
                showPoint={setPoint}
              />
            </Canvas>
          </Boundary>
        )}
        <div className="stage-tools">
          <button
            className="glassbtn"
            onClick={() => {
              setFlat(!flat);
              setNotice("");
              if (view === "intro") goto("overview");
            }}
          >
            {flat ? "Ouvrir en 3D" : "Vue photo"}
          </button>
          <button
            className="iconbtn"
            aria-label="Aide à la navigation"
            aria-expanded={help}
            onClick={() => setHelp(!help)}
          >
            <Icon name="info" size={16} />
          </button>
        </div>
        {help && (
          <div className="stagehelp">
            Glissez pour orienter la caméra. Molette ou pincement pour zoomer.
            En vue d’ensemble, utilisez ZQSD, WASD ou les flèches pour circuler.
            Les boutons sous la scène permettent aussi de choisir une berline.
          </div>
        )}
        {view === "intro" && (
          <button
            className="stagebottom glassbtn"
            onClick={() => goto("overview")}
          >
            Passer l’introduction <Icon name="arrow" size={15} />
          </button>
        )}
        {view === "entrance" && (
          <button
            className="stagebottom button gold"
            onClick={() => goto(flat ? "overview" : "intro")}
          >
            Entrer dans le garage <Icon name="arrow" size={16} />
          </button>
        )}
        {interiorView && (
          <div className="hotspots">
            {["Sellerie", "Console"].map((t) => (
              <button key={t} onClick={() => setPoint(t)}>
                <Icon name="plus" size={13} />
                {t}
              </button>
            ))}
          </div>
        )}
        {point && (
          <div className="pointinfo" role="status">
            <b>{point}</b>
            <span>
              {point === "Sellerie"
                ? "Sièges sculptés et appuie-têtes du modèle de démonstration."
                : "Console centrale et commandes illustrées de la berline."}
            </span>
            <button
              aria-label="Fermer le point d’information"
              onClick={() => setPoint("")}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="garagepanel">
        <div className="garagetabs">
          {(["E", "S"] as Vehicle[]).map((v) => (
            <button
              key={v}
              aria-pressed={
                vehicle === v && ["cabin", "roof", "car"].includes(view)
              }
              onClick={() => select(v)}
            >
              {cars[v].category}
            </button>
          ))}
          <button
            aria-label="Revenir à l’entrée du garage"
            title="Revenir à l’entrée"
            onClick={() => goto("entrance")}
          >
            <Icon name="return" size={15} />
          </button>
        </div>
        <div className="garagetext">
          <div>
            <h3>
              {["car", "roof", "cabin"].includes(view)
                ? cars[vehicle].title
                : "Le showroom"}
            </h3>
            <p>
              {notice ||
                (["car", "roof", "cabin"].includes(view)
                  ? cars[vehicle].description
                  : "Sélectionnez une berline pour explorer sa silhouette et son habitacle.")}
            </p>
          </div>
          <button className="button gold" onClick={() => onBook(vehicle)}>
            Réserver <span>{cars[vehicle].category}</span>
            <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="garageactions">
          {interiorView ? (
            <>
              <button className="link" onClick={() => goto("car")}>
                Vue extérieure
              </button>
              {!flat && (
                <button
                  className="link"
                  onClick={() => goto(view === "roof" ? "cabin" : "roof")}
                >
                  {view === "roof" ? "Prendre place à bord" : "Vue de dessus"}{" "}
                  <Icon name="seat" size={15} />
                </button>
              )}
            </>
          ) : (
            <button
              className="link"
              onClick={() => goto(flat ? "cabin" : "roof")}
            >
              <Icon name="seat" size={16} />
              Découvrir l’intérieur
            </button>
          )}
          <button className="link" onClick={() => goto("overview")}>
            Vue d’ensemble
          </button>
        </div>
        <small className="caption">
          Berlines génériques de démonstration · Équipements du véhicule à
          confirmer.
        </small>
      </div>
    </div>
  );
}
