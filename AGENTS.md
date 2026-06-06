# 🌊 Wunda — Frontend Web (Next.js)

> **Lis d'abord** :
>
> - `../00_VISION_MAITRE.md` — vision et piliers Wunda
> - `../02_AGENT_FRONTEND_WEB.md` — architecture et composants
> - `../04_AGENT_DESIGN_SYSTEM.md` — design tokens et direction artistique

---

## Ce projet

**Wunda Web** est le tableau de bord et l'interface publique de Wunda. C'est l'endroit où les contributeurs voient chaque franc traçable, où les porteurs documentent leur progression, où les Chefs valident.

- **Next.js 14** (App Router)
- **Tailwind CSS + shadcn/ui**
- **TypeScript**
- **React Query** pour la synchronisation
- **Zustand** pour l'état client

---

## Structure des dossiers

```
app/
├── (public)/          # Landing + pages publiques (non authentifiées)
│   ├── page.tsx       # Landing page
│   ├── login/
│   └── initiatives/[id]/  # Consultation initiative (lecture seule)
│
└── (dashboard)/       # Authentifiées + protégées par middleware
    ├── page.tsx       # Vue d'ensemble / Accueil
    ├── initiatives/   # CRUD initiatives
    ├── contributions/ # Mes contributions
    ├── localities/    # Gestion localité (si Chef)
    ├── validations/   # File de validation (si Agent/Chef)
    └── admin/         # Admin panel

components/
├── ui/                # shadcn/ui components (Button, Input, Dialog, etc)
├── layout/            # Layout components (Sidebar, Header, Nav)
├── initiatives/       # Initiative-specific components
├── tasks/             # Task components
└── common/            # Réutilisables (Loading, Error, etc)

lib/
├── api.ts             # Fetch helper + interceptor
├── auth.ts            # Auth logic
└── utils.ts           # Utilities

constants/
├── colors.ts          # Design tokens (Wunda blue, gold, etc)
└── endpoints.ts       # API endpoints

styles/
└── globals.css        # Tailwind directives + overrides
```

---

## Design tokens

Utilise TOUJOURS les couleurs Wunda, pas des couleurs génériques :

```typescript
// constants/colors.ts
export const WUNDA_BLUE = "#1B3F6E"; // Primaire
export const WUNDA_BLUE_LIGHT = "#2E5FA3"; // Hover/active
export const WUNDA_GOLD = "#C69C2E"; // Accents, montants
export const BG_LIGHT = "#FAFAF8"; // Background page
```

---

## Règles de code

### Routes protégées

- Utilise le `middleware.ts` pour rediriger les non-authentifiés
- Protège toujours les routes `(dashboard)/*`

### API calls

```typescript
// lib/api.ts
export async function fetchInitiatives() {
  const res = await fetch(`${API_URL}/initiatives/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch initiatives");
  return res.json();
}
```

### State management

- **Client-side ephemeral** : Zustand (forms, UI state)
- **Server-side fetched** : React Query (initiatives, contributions)
- **Never** : localStorage pour les tokens sensibles (utilise SecureStore côté mobile)

### Composants de tâche

- Importe `TaskCard` depuis `components/tasks/TaskCard.tsx`
- Elle gère les états visuels (TODO, IN_PROGRESS, DONE, VALIDATED, CONTESTED)
- Passe `userRole` pour montrer les bonnes actions

### Terminologie

- Jamais "projet" ou "campagne" → **initiative**
- Jamais "don" → **contribution**
- Jamais "utilisateur" → **contributeur** / **porteur** / **chef** / **agent**

---

## Points d'attention

1. **Immuabilité des preuves** : pas de bouton DELETE sur les preuves (RM-01)
2. **State machine stricte** : la transition de tâche se fait via API, pas localStorage (RM-02)
3. **Double validation** : l'UI montre distinctement Agent (vérification) vs Chef (validation officielle)
4. **Anonymat** : les contributeurs anonymes s'affichent comme "Un contributeur" dans la liste
5. **Traçabilité** : chaque action importante déclenche un ActivityLog enregistré par le backend

---

## Démarrage

```bash
npm install
npm run dev
```

Visite `http://localhost:3000`

---

## Feedback

Toute question : vérifie d'abord les fichiers agents dans `../`, puis demande.
