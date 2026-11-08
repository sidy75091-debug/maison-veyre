export type Vehicle = "E" | "S";
export const cars = {
  E: {
    title: "Mercedes Classe E",
    category: "Business Class",
    image: "business",
    description:
      "L’élégance et le confort pour vos déplacements professionnels et privés.",
  },
  S: {
    title: "Mercedes Classe S",
    category: "Prestige Class",
    image: "prestige",
    description: "Une expérience exclusive où chaque détail compte.",
  },
} as const;
export const services = [
  [
    "plane",
    "Transferts aéroports",
    "Organisez votre prise en charge au départ ou à l’arrivée d’un vol.",
  ],
  [
    "train",
    "Transferts gares",
    "Reliez le quai, votre hôtel ou votre prochain rendez-vous.",
  ],
  [
    "case",
    "Déplacements professionnels",
    "Prévoyez vos trajets entre réunions, congrès et rendez-vous.",
  ],
  [
    "spark",
    "Mariages et événements",
    "Composez le parcours de votre journée avec un chauffeur dédié.",
  ],
  [
    "clock",
    "Mise à disposition",
    "Gardez un véhicule à disposition selon les étapes de votre programme.",
  ],
  [
    "compass",
    "Excursions privées",
    "Dessinez un itinéraire à votre rythme, avec les haltes de votre choix.",
  ],
] as const;
export const agency: {
  rates: Record<string, string>;
  equipment: string[];
  reviews: { quote: string; author: string; source: string }[];
} = { rates: {}, equipment: [], reviews: [] };
export const faqs = [
  [
    "Comment demander un chauffeur ?",
    "Renseignez votre trajet et vos coordonnées dans le formulaire. Une référence vous est communiquée après l’enregistrement. La disponibilité et le prix doivent ensuite être confirmés par l’agence.",
  ],
  [
    "Puis-je choisir une catégorie de véhicule ?",
    "Oui. Explorez le showroom puis choisissez Business Class ou Prestige Class. Votre sélection est reprise dans le formulaire. Le modèle affecté dépendra de la disponibilité confirmée.",
  ],
  [
    "Comment connaître le tarif de mon trajet ?",
    "Le devis tient compte de votre itinéraire, de la durée et de la catégorie souhaitée. Indiquez vos étapes et votre temps d’attente éventuel dans les informations complémentaires.",
  ],
  [
    "Comment préciser un besoin particulier ?",
    "Mentionnez vos bagages, une demande de siège enfant ou tout besoin d’accessibilité dans le formulaire. L’agence devra confirmer que le véhicule et les équipements conviennent.",
  ],
];
