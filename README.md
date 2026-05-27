# MissVote

PWA React de notation des candidates Miss France — swipe à la Tinder (4 directions), votes stockés en local, export Excel.

## Stack

- React 18 + Vite 6
- Tailwind CSS v4
- Framer Motion (swipe & animations)
- React Router 6
- SheetJS (`xlsx`) pour l'export
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
├── screens/                   ← SwipeScreen, ResultsScreen
├── utils/                     ← notes.js, exportExcel.js
├── App.jsx
├── main.jsx
└── index.css                  ← Tailwind v4 + variables de thème
```

## Stockage

Les votes sont stockés dans `localStorage` sous la clé `missVote_votes` :

```json
{ "001": "super_like", "002": "like", "003": "moyen", "004": "moche" }
```

Pour repartir de zéro : bouton **Réinitialiser** dans l'écran Résultats, ou `localStorage.clear()` en console.

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
      "photo": "https://...",
      "instagram": "handle_sans_arobase",
      "bio": "..."
    }
  ]
}
```

Champs obligatoires : `id`, `prenom`, `nom`, `region`, `age`, `ville`, `photo`. Optionnels : `instagram`, `bio`.

## Déploiement

`dist/` est statique : déposable sur Netlify, Vercel, Cloudflare Pages, GitHub Pages, ou n'importe quel serveur HTTP. Aucun backend requis.

Pour une PWA installable, le site doit être servi en **HTTPS** (sauf en localhost).
