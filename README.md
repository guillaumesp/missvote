# MissVote

PWA React de notation des candidates Miss France — vote via 4 boutons (Moche, Moyen, Like, Super like), votes stockés en local, export Excel, classement de groupe en pair-à-pair.

## Stack

- React 18 + Vite 6
- Tailwind CSS v4
- Framer Motion (animations)
- Embla Carousel (défilement des photos)
- React Router 6
- SheetJS (`xlsx`) pour l'export
- Trystero (WebRTC pair-à-pair) pour l'onglet Groupe
- `vite-plugin-pwa` (Workbox)

## Prérequis

- Node.js ≥ 18 (testé avec Node 22)
- npm ≥ 9

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'app est servie sur [http://localhost:5173](http://localhost:5173). Le hot reload est actif.

> Astuce : pour tester l'expérience mobile, ouvre les DevTools Chrome → toggle device toolbar (Ctrl/Cmd+Shift+M) et choisis un format iPhone/Pixel. L'app reste centrée et limitée à 430px sur desktop.

## Build de production

```bash
npm run build
```

Le résultat est généré dans `dist/`. Le service worker (`sw.js`) et le manifest PWA sont produits automatiquement par `vite-plugin-pwa`.

## Aperçu du build

```bash
npm run preview
```

Sert `dist/` sur [http://localhost:4173](http://localhost:4173). C'est l'environnement à utiliser pour tester l'installation PWA et le mode hors-ligne.

## Structure

```
src/
├── assets/candidates.json     ← Données candidates (statique, bundlé)
├── components/                ← SwipeCard, ActionButtons, BottomNav, modales, etc.
├── hooks/useVotes.js          ← Lecture/écriture localStorage
├── p2p/group.js               ← Connexion pair-à-pair de l'onglet Groupe
├── screens/                   ← SwipeScreen, ResultsScreen, GroupScreen
├── utils/                     ← notes.js, exportExcel.js
├── App.jsx
├── main.jsx
└── index.css                  ← Tailwind v4 + variables de thème
```

## Stockage

Les votes sont stockés dans `localStorage` sous la clé `missVote_votes_<annee>` (ex. `missVote_votes_2027`) :

```json
{ "001": "super_like", "002": "like", "003": "moyen", "004": "moche" }
```

Pour repartir de zéro : bouton **Réinitialiser** dans l'écran Résultats, ou `localStorage.clear()` en console.

## Onglet Groupe (pair-à-pair)

Chaque personne choisit un pseudo. Il n'y a qu'un seul salon : tous les appareils connectés se connectent directement entre eux en WebRTC et s'échangent leurs votes : l'onglet affiche le classement de chaque personne connectée et un classement commun (moyenne : Super Like 3 pts, Like 2, Moyen 1, Moche 0, ramenée sur 10).

- **Pas de serveur applicatif, pas d'hôte** : maillage complet, chaque pair garde l'état de tous les autres. Si quelqu'un part, les autres continuent sans rien avoir à élire.
- **Mise en relation** : via des relais Nostr publics (Trystero), uniquement pour échanger les offres WebRTC chiffrées. Les votes passent ensuite directement d'appareil à appareil.
- **Résilience** : profil renvoyé à chaque nouveau venu et toutes les 10 s ; pair retiré après 35 s sans nouvelles ; reconnexion automatique au retour du réseau, au retour sur l'onglet et au rechargement (pseudo gardé dans `localStorage`, clé `missVote_profile`).
- **Limites** : rien n'est conservé quand tout le monde est parti ; certains réseaux d'entreprise bloquent WebRTC sans serveur TURN ; prévu pour quelques dizaines de personnes connectées en même temps.

## Changer l'édition / les candidates

Remplace le contenu de `src/assets/candidates.json` en respectant le schéma :

```json
{
  "edition": "Miss France 2025",
  "candidates": [
    {
      "id": "001",
      "prenom": "...",
      "nom": "...",
      "region": "...",
      "age": 30,
      "ville": "...",
      "taille": 1.75,
      "photo": "https://...",
      "photos": ["https://...", "https://..."],
      "instagram": "handle_sans_arobase",
      "bio": "..."
    }
  ]
}
```

Champs obligatoires : `id`, `prenom`, `nom`, `region`, `photo`. Optionnels : `age`, `taille`, `ville`, `photos` (galerie : la première sert de couverture, `photo` reste le repli), `instagram`, `bio`.

Les votes sont stockés par édition (`missVote_votes_<annee>`) : changer d'édition repart d'une grille vierge sans effacer l'ancienne.

## Photos

- **Carte candidate** : la carte ne se glisse plus pour voter (vote uniquement via les boutons) ; les photos défilent dans un carrousel Embla (glisser horizontalement ou taper sur le bord gauche/droit), taper au centre (ou la loupe) ouvre la visionneuse.
- **Fiche candidate** (écran Résultats) : carrousel à faire défiler, tap pour agrandir.
- **Visionneuse** : pinch, molette, double-tap ou boutons +/− pour zoomer (jusqu'à ×5), glisser pour se déplacer dans la photo zoomée, swipe ou flèches ←/→ pour changer de photo, Échap pour fermer.

## Déploiement

`dist/` est statique : déposable sur Netlify, Vercel, Cloudflare Pages, GitHub Pages, ou n'importe quel serveur HTTP. Aucun backend requis.

Pour une PWA installable, le site doit être servi en **HTTPS** (sauf en localhost).
