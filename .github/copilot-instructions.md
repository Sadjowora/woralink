# Copilot Instructions — Woralink

## 📋 Étape 1 — Lire les fichiers d'instructions existants

**Avant toute modification, tu DOIS lire et respecter :**

1. `@AGENTS.md` — instructions principales du projet (architecture, conventions, règles métier)
2. `@CLAUDE.md` — qui référence `@AGENTS.md`, à lire aussi pour le contexte complet

Ces fichiers sont prioritaires. Les directives design ci-dessous s'appliquent **en complément**, sans jamais contredire ce qui est défini dans `AGENTS.md`.

---

## 🎨 Étape 2 — Appliquer le nouveau design system

### Philosophie visuelle
Style **Vercel-inspired** : clean, light, spacieux, typographie forte, détails soignés.
Pas de fioriture. Chaque élément a une raison d'être. Le contenu respire.

---

### Palette de couleurs — Tailwind CSS

```
Couleur principale (brand) : text-green-700  (#15803d)
Couleur secondaire (muted)  : text-gray-500   (#6b7280)

Fonds :
  - Page globale       : bg-white
  - Sections alternées : bg-gray-50
  - Cards              : bg-white
  - Hover subtil       : hover:bg-gray-50

Bordures :
  - Standard           : border-gray-200
  - Focus / actif      : border-green-700
  - Subtile            : border-gray-100

Textes :
  - Titre principal    : text-gray-900
  - Corps              : text-gray-600
  - Muted / meta       : text-gray-500
  - Brand / accent     : text-green-700
  - Lien hover         : hover:text-green-700
  - Lien hover dark    : hover:text-green-800

Badges / Tags :
  - Fond brand         : bg-green-50  text-green-700  border-green-200
  - Fond neutre        : bg-gray-100  text-gray-500   border-gray-200
```

**Règle absolue :** ne jamais utiliser de couleurs en dehors de cette palette Tailwind.
Pas de style inline `color:`, pas de CSS custom pour les couleurs — Tailwind uniquement.

---

### Typographie

```
H1 hero    : text-4xl md:text-5xl lg:text-6xl  font-bold    text-gray-900  tracking-tight
H2 section : text-2xl md:text-3xl              font-semibold text-gray-900  tracking-tight
H3 card    : text-lg                            font-semibold text-gray-900
Corps      : text-base  text-gray-600  leading-relaxed
Muted      : text-sm    text-gray-500
Labels     : text-xs    text-gray-500  uppercase  tracking-wide  font-medium
Lien brand : text-green-700  hover:text-green-800  font-medium  underline-offset-4 hover:underline
```

---

### Boutons

```tsx
// Bouton principal (CTA — fond sombre style Vercel)
<button className="
  inline-flex items-center gap-2
  px-5 py-2.5 rounded-lg
  bg-gray-900 text-white text-sm font-medium
  hover:bg-gray-700
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
">

// Bouton secondaire (outline neutre)
<button className="
  inline-flex items-center gap-2
  px-5 py-2.5 rounded-lg
  border border-gray-200 bg-white
  text-gray-700 text-sm font-medium
  hover:bg-gray-50 hover:border-gray-300
  transition-colors duration-150
">

// Bouton brand (vert — actions de confiance)
<button className="
  inline-flex items-center gap-2
  px-5 py-2.5 rounded-lg
  bg-green-700 text-white text-sm font-medium
  hover:bg-green-800
  transition-colors duration-150
">
```

---

### Cards (entreprises, profils, PME)

```tsx
<div className="
  group relative
  bg-white rounded-xl
  border border-gray-200
  p-5
  hover:border-gray-300
  hover:shadow-sm
  transition-all duration-150
  cursor-pointer
">
```

Pas de shadow spectaculaire. L'élévation vient de `hover:shadow-sm` + `hover:border-gray-300`.
Style Vercel : sobre, propre, fonctionnel.

---

### Inputs / Barre de recherche

```tsx
<input className="
  w-full px-4 py-2.5 rounded-lg
  border border-gray-200 bg-white
  text-gray-900 placeholder:text-gray-400
  text-sm
  focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700
  transition-all duration-150
">
```

---

### Badges / Tags

```tsx
// Brand (secteur actif, "Coup de Cœur", vérifié)
<span className="
  inline-flex items-center gap-1
  px-2.5 py-0.5 rounded-full
  text-xs font-medium
  bg-green-50 text-green-700 border border-green-200
">

// Neutre (type PME/Freelance, ville, secteur)
<span className="
  inline-flex items-center gap-1
  px-2.5 py-0.5 rounded-full
  text-xs font-medium
  bg-gray-100 text-gray-500 border border-gray-200
">
```

---

### Séparateurs

```tsx
// Toujours une ligne fine — jamais de <hr> natif sans classe
<div className="border-t border-gray-100" />
```

---

## 🏗️ Mise en page — Règles générales

```
Container       : max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Sections        : py-16 md:py-24
Gap entre cards : gap-4 md:gap-6
Grille standard : grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

- **Fond de page** : `bg-white` — light mode uniquement
- **Sections alternées** : une section sur deux en `bg-gray-50` pour créer du rythme
- **Navbar** : `bg-white/80 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-50`
- **Footer** : `bg-gray-50 border-t border-gray-200 text-gray-500`

---

## ✨ Animations — Framer Motion (sobres)

```tsx
// Entrée de section
const fadeInUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

// Stagger pour listes
const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } }
};

// Toujours viewport once
<motion.div
  variants={fadeInUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-40px" }}
>
```

**Règles :**
- `duration` max : 0.35s pour entrées, 0.15s pour hover
- Hover cards : `whileHover={{ y: -2 }}` — pas de scale
- Boutons : `whileTap={{ scale: 0.98 }}` uniquement
- Pas d'animations en loop sur le contenu

---

## 🇬🇳 Contexte Woralink

- Annuaire des professionnels guinéens : PME, artisans, freelances, startups
- Villes : Conakry, Labé, Kankan, N'Zérékoré, Kindia, Mamou, Boké, Boké
- Secteurs : BTP, Informatique, Mécanique, Santé, Transport, Médias, Finance
- Langue : **Français uniquement**
- Ton : professionnel, chaleureux, local, de confiance
- Stack : Next.js 14, React, Tailwind CSS, Supabase

---

## 🚫 Interdits absolus

- PAS de fond sombre global (`bg-gray-900`, `bg-black`) — light mode only
- PAS de couleurs hors palette `green-*` / `gray-*` Tailwind
- PAS de style inline pour les couleurs
- PAS de `shadow-xl` ou `shadow-2xl` sur les cards — `shadow-sm` maximum
- PAS de `rounded-2xl` ou plus sur les cards — `rounded-xl` maximum
- PAS d'animations > 0.35s
- PAS de modification de la logique métier, des appels Supabase, ni de l'architecture définie dans `AGENTS.md`

---

## ✅ Checklist avant chaque modification

- [ ] J'ai lu `AGENTS.md` et `CLAUDE.md` en premier
- [ ] Je respecte l'architecture et les conventions de ces fichiers
- [ ] J'utilise uniquement `text-green-700` / `gray-*` / `green-*` Tailwind
- [ ] Le fond est `bg-white` ou `bg-gray-50`
- [ ] Les animations sont subtiles (≤ 0.35s, pas de loop)
- [ ] Le composant est mobile-first
- [ ] Aucune logique métier n'a été touchée
