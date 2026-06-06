# Claude Instructions — Wunda Frontend Web

Quand tu travailles sur ce projet, applique ces directives :

## 1. Lecture obligatoire avant chaque action

- `../00_VISION_MAITRE.md` sections 5-6 (state machines + règles métier)
- `../02_AGENT_FRONTEND_WEB.md` (architecture, routes, composants)
- `../04_AGENT_DESIGN_SYSTEM.md` (couleurs, typo)

## 2. Règles inviolables

- **RM-01** : Pas de bouton DELETE sur les preuves (jamais de suppression)
- **RM-02** : Transitions de tâche uniquement via API (state machine stricte)
- **RM-07** : Agent = vérification. Chef = validation. Visuellement distinct.

## 3. Couleurs à utiliser

```typescript
const WUNDA_COLORS = {
  primary: "#1B3F6E", // Bleu profond
  accent: "#2E5FA3", // Bleu clair (hover)
  success: "#2D6A4F", // Vert validation
  warning: "#A07010", // Or/ambre
  bg: "#FAFAF8", // Fond clair
  text: "#1A1F2E", // Texte foncé
};
```

## 4. Terminology mapping

| ❌ Ancien  | ✅ Wunda               |
| ---------- | ---------------------- |
| Daara      | Localité               |
| Campagne   | Initiative             |
| Don        | Contribution           |
| Collecteur | Agent de vérification  |
| Dashboard  | Vue d'ensemble / Suivi |

## 5. Patterns à respecter

- Utilise `fetchInitiatives()` depuis `lib/api.ts` pour les requêtes
- Intègre `TaskCard` pour afficher les tâches
- Les routes protégées sont dans `(dashboard)/*`
- La landing page est dans `(public)/*`

## 6. Avant de pusher

- Vérifie que les couleurs sont Wunda (bleu + gold)
- Vérifie que la terminologie est cohérente
- Teste les transitions de tâche en mode Agent vs Chef
- Pas de boutons DELETE sur les preuves
