# ParkQuest — Checklist de déploiement Vercel (mode démonstration)

Guide pas à pas : README → « Déployer la démo ParkQuest sur Vercel » et « Dépannage Vercel ».
Mode : `NEXT_PUBLIC_DEMO_MODE=true` — aucun service externe connecté (ni Supabase, ni Auth, ni Storage,
ni PostHog, ni Mapbox). Seul le fond de carte OpenStreetMap (OpenFreeMap, sans clé) est chargé depuis Internet.

Les cases cochées ont été vérifiées lors de l'audit du 28/09/2026 (branche `feature/parkquest-premium-design-integration`).

## Variables Vercel (Production et Preview)

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `true` |
| `NEXT_PUBLIC_MAP_ENGINE` | `maplibre` |
| `NEXT_PUBLIC_APP_URL` | `https://VOTRE-NOM-DE-PROJET.vercel.app` |

## Avant déploiement

- [x] Branche Git testée (`feature/parkquest-premium-design-integration`).
- [x] `npm run verify` réussi (lint, types, traductions 5 langues, tests unitaires).
- [x] `npm run build` réussi (avec les variables ci-dessus, dossier `public/vendor` supprimé au préalable).
- [x] `npm run demo:capture` réussi (captures iPhone sombre + clair).
- [x] Tests e2e sur le build de production (`next start`).
- [x] Pas de clés secrètes dans Git (fichiers suivis **et** historique complet analysés).
- [x] `NEXT_PUBLIC_DEMO_MODE=true` documenté ; aucune clé requise.
- [x] MapLibre chargé uniquement côté client ; repli « carte simplifiée » validé sans WebGL et sans fond.
- [x] PWA testée en local en production : service worker actif, précache OK, page servie hors ligne.
- [x] README mis à jour (déploiement + dépannage).
- [ ] **Branche publiée choisie** : fusion dans `main` (recommandé) ou « Production Branch » temporaire.
- [ ] Design iPhone validé par le porteur du projet.
- [x] Données Meise indiquées comme démonstration (badges « Démo », avertissements, panneau DÉMO).

## Après déploiement

- [ ] URL HTTPS de production fonctionne sur iPhone (Safari).
- [ ] `/fr` fonctionne (et `/` redirige vers `/fr`).
- [ ] Navigation mobile (barre du bas) fonctionne.
- [ ] Carte MapLibre avec fond OpenStreetMap, vue 3D (bouton « 3D »), arbres et étang.
- [ ] Repli carte simplifiée (tester en mode avion après chargement, ou `NEXT_PUBLIC_MAP_ENGINE=fallback` en Preview).
- [ ] Mode visite : « Activez votre position », « Voir le spot », découverte, fin de parcours.
- [ ] Quiz, défi, progression, badges et profil fonctionnent.
- [ ] Photo de spot : proposition (reste sur l'appareil en démo) et validation simulée.
- [ ] PWA installable : Safari → Partager → Sur l'écran d'accueil ; ouverture plein écran.
- [ ] GPS réel testé en HTTPS (panneau DÉMO → « Réel »).
- [ ] Aucun secret exposé (onglet Réseau : aucun appel à Supabase, Mapbox ou PostHog).
- [ ] Console navigateur sans erreur critique.
- [ ] Test en Wi-Fi **et** en 4G/5G.
- [ ] Captures de la version déployée contrôlées (`node scripts/capture-demo.mjs https://VOTRE-NOM-DE-PROJET.vercel.app`).

## Points connus (non bloquants)

- **Thème (Next 16)** : le script d'initialisation reste un `<script>` en ligne (aucun flash clair/sombre) ;
  avertissement React possible en développement uniquement. Détails et TODO : `docs/ARCHITECTURE.md` § 11.
- **Page introuvable** : les adresses inconnues affichent la page « introuvable » avec un statut HTTP 200
  (au lieu de 404). Sans effet pour la démo ; à corriger avant l'ouverture publique (référencement).
- **Fond OpenStreetMap** : OpenFreeMap est prévu pour un usage web (HTTPS, CORS ouvert) ; non vérifiable depuis
  l'environnement de développement (réseau filtré) → à contrôler sur l'URL Vercel. Pour du trafic important, prévoir
  un fournisseur dédié (`NEXT_PUBLIC_MAP_STYLE_URL`).
- **Relief 3D** : tuiles « Terrain Tiles » (AWS Open Data), sans clé.
