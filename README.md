# Maison Veyre — Chauffeurs privés

Site de chauffeurs privés à Genève et Lausanne avec showroom WebGL facultatif, galerie de secours, contact et demandes de réservation.

## Lancement

Node.js 24 et pnpm sont nécessaires pour modifier et compiler le projet.

```sh
pnpm install
pnpm run dev
```

Le serveur de développement écoute sur http://127.0.0.1:4173. La variable PORT permet de changer le port.

Pour vérifier le typage, pré-rendre l’accueil et la page de contact, puis produire la version de production :

```sh
pnpm run build
pnpm start
```

La version déjà compilée peut également être démarrée avec `node server/local.mjs`. Le démarrage de cette version utilise exclusivement les modules intégrés à Node.js.

## Parcours

Le bouton d’entrée ouvre le garage 3D. Après l’ouverture du rideau, glissez pour orienter la caméra et utilisez la molette ou deux doigts pour zoomer. Dans la vue d’ensemble, cliquez dans la scène puis utilisez les flèches, ZQSD ou WASD. La sélection assistée et la visite photo fonctionnent aussi au clavier.

Sélectionnez Business ou Prestige, découvrez l’intérieur puis prenez place à bord. Réserver reprend la catégorie sélectionnée. Les dates et heures utilisent Europe/Zurich, y compris pour un visiteur à l’étranger. Le formulaire distingue les deux occurrences lors du retour à l’heure d’hiver. L’agence doit confirmer le tarif, la disponibilité et la course.

## Enregistrement

Les routes POST `/api/reservations` et `/api/contact` valident les champs côté serveur. Une référence est rendue après écriture et relecture de la demande. Une nouvelle tentative avec la même clé conserve la même référence.

En local, la base SQLite se trouve dans `.local/requests.sqlite`, en dehors du répertoire web. La table `requests` contient la référence, la date de création UTC, le type et le contenu JSON. Elle se consulte avec un client SQLite. La variable `VEYRE_DB` permet de choisir une base de test séparée.

Sur Sites, le Worker utilise la liaison D1 `DB` et la migration dans `drizzle/`. La prise en charge opérationnelle des demandes nécessite un accès agence à la base ou une intégration à son outil métier. Aucun e-mail ni SMS automatique n’est configuré.

## Fichiers principaux

- `src/App.tsx` et `src/styles.css` — pages et identité visuelle responsive.
- `src/Garage.tsx`, `src/Scene.tsx`, `src/Architecture.tsx` — interface du garage, caméras, éclairage et matériaux.
- `src/sedan.ts` — deux berlines procédurales originales, pièces regroupées par matériau. L’origine est au sol, l’avant du véhicule vers +Z.
- `src/Forms.tsx`, `server/api.mjs` — saisie, validation et enregistrement.
- `src/data.ts` — catégories, prestations, montants validés en CHF et avis authentiques.
- `public/images/` — photographies réelles de Genève, Lausanne-Ouchy et des Mercedes de référence. Les crédits, sources et licences CC BY-SA 4.0 sont dans `src/placePhotos.ts`, `src/carPhotos.ts` et dans le pied de page. Les images d’ambiance du garage sont des illustrations.
- `public/fonts/` — polices sous SIL Open Font License et licences jointes.

## Données à compléter pour l’agence

Valider l’identité, les coordonnées, les véhicules proposés et les conditions commerciales. Renseigner les tarifs, les équipements et les avis dans la configuration. Les berlines 3D temporaires sont des démonstrateurs originaux, distincts des photographies de Mercedes. Dans `src/equipment.ts`, par catégorie, définir chaque accessoire sur `proposed`, `confirmed` ou `hidden`. Un équipement masqué disparaît du modèle et des commandes. Un futur modèle officiel doit être assorti des droits commerciaux appropriés.

La géométrie procédurale est incluse dans le module 3D chargé à la demande. Pour intégrer des GLB, remplacer la fabrique `createSedan` en conservant ses repères, les pièces `roof` et `glass` et le matériau `headlamp`.

## Vercel

Le projet utilise le préréglage Vite, la commande `pnpm run build:vercel` et le répertoire `dist/client`. Les fonctions dans `api/` valident les demandes avec le même code que le serveur local. Lier au projet un magasin Vercel Blob privé pour stocker les réservations et les messages dans le dossier `demandes/`. Les clés de stockage restent dans les variables serveur de Vercel.
