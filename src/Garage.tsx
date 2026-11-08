import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { cars, type Vehicle } from "./data";
import { Icon } from "./icons";
import { Scene, type View } from "./Scene";
import {
  equipmentFor,
  equipment,
  availabilityLabel,
  type EquipmentId,
} from "./equipment";
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
    [point, setPoint] = useState<EquipmentId | null>(null),
    [help, setHelp] = useState(false);
  const reduced = useRef(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  function select(v: Vehicle) {
    setVehicle(v);
    setPoint(null);
    setView("car");
  }
  function goto(v: View) {
    setView(v);
    setPoint(null);
  }
  function showPoint(id: EquipmentId) {
    setPoint(id);
    setView("cabin");
  }
  function fallback() {
    setFlat(true);
    setNotice(
      "La 3D est indisponible sur cet appareil. La galerie d’illustrations et les fiches des équipements restent accessibles.",
    );
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
          {flat ? "Galerie 2D" : "Showroom 3D"}
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
                ? "Illustration d’un habitacle de berline haut de gamme"
                : view === "car"
                  ? "Illustration de la catégorie " + cars[vehicle].category
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
                near: 0.012,
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
                point={point}
                showPoint={showPoint}
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
            {flat ? "Ouvrir en 3D" : "Galerie 2D"}
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
      </div>
      <div className="garagepanel">
        {interiorView && (
          <div className="cabin-equipment">
            <div
              className="cabin-options"
              role="group"
              aria-label="Explorer les équipements proposés"
            >
              {equipmentFor(vehicle).map((item) => (
                <button
                  key={item.id}
                  className="glassbtn"
                  aria-pressed={point === item.id}
                  onClick={() => showPoint(item.id)}
                >
                  <Icon name="plus" size={13} />
                  {item.title}
                </button>
              ))}
            </div>
            {point && (
              <div className="cabin-description" role="status">
                <p>
                  <strong>{equipment[point].title}.</strong>{" "}
                  {equipment[point].description}{" "}
                  {availabilityLabel(vehicle, point)}
                </p>
                <button className="link" onClick={() => setPoint(null)}>
                  {flat ? "Fermer la fiche" : "Revenir à la vue passager"}
                </button>
              </div>
            )}
          </div>
        )}
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
            <button className="link" onClick={() => goto("cabin")}>
              <Icon name="seat" size={16} />
              Découvrir l’intérieur
            </button>
          )}
          <button className="link" onClick={() => goto("overview")}>
            Vue d’ensemble
          </button>
        </div>
        <small className="caption">
          {flat
            ? "Illustrations de présentation. "
            : "Modèles 3D temporaires de berlines génériques. "}
          Les Mercedes Classe E et Classe S sont les références des catégories
          présentées.
        </small>
      </div>
    </div>
  );
}
