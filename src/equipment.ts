import type { Vehicle } from "./data";

export type EquipmentId = "charger" | "water" | "sweets";
type Position = [number, number, number];
type Availability = "proposed" | "confirmed" | "hidden";

export type Equipment = {
  id: EquipmentId;
  title: string;
  description: string;
  focus: Position;
  eye: Position;
  marker: Position;
};

export const equipment: Record<EquipmentId, Equipment> = {
  charger: {
    id: "charger",
    title: "Chargeur USB-C",
    description:
      "Le câble et sa prise USB-C se trouvent sur la face arrière de la console centrale.",
    focus: [0.018, 0.668, -0.535],
    eye: [0.192, 0.839, -0.793],
    marker: [0.085, 0.716, -0.543],
  },
  water: {
    id: "water",
    title: "Bouteille d’eau",
    description:
      "La bouteille prend place dans le porte-gobelet de la portière arrière.",
    focus: [-0.707, 0.775, -0.796],
    eye: [-0.39, 1.006, -1.047],
    marker: [-0.632, 0.883, -0.798],
  },
  sweets: {
    id: "sweets",
    title: "Bonbons",
    description:
      "Des confiseries emballées individuellement reposent sur le plateau de l’accoudoir arrière.",
    focus: [0.012, 0.725, -0.983],
    eye: [0.201, 0.951, -0.794],
    marker: [-0.046, 0.79, -0.983],
  },
};

// Set these independently for each category after the owner verifies the vehicle.
// Hidden items are removed from the geometry, hotspots and accessible equipment list.
export const equipmentAvailability: Record<
  Vehicle,
  Record<EquipmentId, Availability>
> = {
  E: { charger: "proposed", water: "proposed", sweets: "proposed" },
  S: { charger: "proposed", water: "proposed", sweets: "proposed" },
};

export function equipmentFor(vehicle: Vehicle) {
  return Object.values(equipment).filter(
    (item) => equipmentAvailability[vehicle][item.id] !== "hidden",
  );
}

export function availabilityLabel(vehicle: Vehicle, item: EquipmentId) {
  return equipmentAvailability[vehicle][item] === "confirmed"
    ? "Disponibilité confirmée pour cette catégorie."
    : "Équipement souhaité, disponibilité à confirmer.";
}
