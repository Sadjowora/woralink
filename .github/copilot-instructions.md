# Copilot Instructions — Woralink

## 📋 Étape 1 — Lire les fichiers d'instructions existants

**Avant toute modification, tu DOIS lire et respecter :**

1. `@AGENTS.md` — instructions principales du projet (architecture, conventions, règles métier)
2. `@CLAUDE.md` — qui référence `@AGENTS.md`, à lire aussi pour le contexte complet

Ces fichiers sont **prioritaires**. Les directives design ci-dessous s'appliquent **en complément**, sans jamais contredire ce qui est défini dans `AGENTS.md`.

---

## 🎨 Étape 2 — Design system Woralink

### Philosophie visuelle

Style **Vercel-inspired** : clean, light, spacieux, typographie forte, détails soignés.
Pas de fioriture. Chaque élément a une raison d'être. Le contenu respire.

Inspiration pour la page `/search` : **ProductHunt** (liste de startups) — cards horizontales avec rang, logo, badges, description courte, et bouton BigUp.

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

Badges :
  - Brand (Vérifié, actif) : bg-green-50  text-green-700  border-green-200
  - PME                    : bg-blue-50   text-blue-700   border-blue-200
  - Freelance              : bg-green-50  text-green-700  border-green-200
  - Artisan                : bg-amber-50  text-amber-700  border-amber-200
  - Neutre (ville, secteur): bg-gray-100  text-gray-500   border-gray-200
```

**Règle absolue :** ne jamais utiliser de couleurs hors palette Tailwind.
Pas de `style={{ color: '...' }}`, pas de CSS custom pour les couleurs.

---

### Typographie

```
H1 hero    : text-4xl md:text-5xl lg:text-6xl  font-bold     text-gray-900  tracking-tight
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
<button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">

// Bouton secondaire (outline neutre)
<button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150">

// Bouton brand (vert — actions de confiance)
<button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors duration-150">
```

---

### Cards standard (profils, PME, résultats)

```tsx
<div className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer">
```

Pas de shadow spectaculaire. L'élévation vient de `hover:shadow-sm` + `hover:border-gray-300`.

---

### Cards résultats `/search` — style ProductHunt

Structure horizontale obligatoire pour toute card de résultat sur la page `/search` :

```tsx
<div className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-150 hover:border-gray-300 hover:shadow-sm">
  {/* 1. Bloc rang (gauche, min-w-[40px]) */}
  <div className="flex min-w-[40px] flex-col items-center pt-1">
    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Rang</span>
    <span className="text-lg font-semibold text-gray-900">#1</span>
  </div>

  {/* 2. Logo (52x52, rounded-lg, border, lettre fallback) */}
  <div className="w-13 h-13 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-500">
    {logo ? <Image src={logo} alt={name} width={52} height={52} /> : name[0]}
  </div>

  {/* 3. Corps de la card (flex-1) */}
  <div className="min-w-0 flex-1">
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <span className="text-[15px] font-semibold text-gray-900">{name}</span>
      {/* Badge type */}
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        PME
      </span>
      {/* Badge vérifié si applicable */}
      {verified && (
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <CheckCircleIcon className="h-3 w-3" /> Vérifié
        </span>
      )}
    </div>
    <p className="mb-2 text-xs text-gray-500">
      {sector} · {city}
    </p>
    <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{description}</p>
    <a
      href={`/pme/${slug}`}
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
    >
      Voir le profil →
    </a>
  </div>

  {/* 4. Bouton BigUp (droite, style ProductHunt) */}
  <div className="group/bigup flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 transition-colors duration-150 hover:border-green-700">
    <ChevronUpIcon className="h-4 w-4 text-gray-400 transition-colors group-hover/bigup:text-green-700" />
    <span className="text-sm font-medium text-gray-600">{bigupCount}</span>
  </div>
</div>
```

---

### Inputs / Barre de recherche

```tsx
<input className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-all duration-150">
```

---

### Pills de tri et de filtre

```tsx
// Pill inactive
<span className="px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-500 bg-white cursor-pointer hover:border-gray-400 transition-colors">

// Pill active (ex: tri sélectionné, ville active)
<span className="px-3 py-1 rounded-full border border-green-700 text-xs font-medium text-white bg-green-700 cursor-pointer">
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
Layout /search  : grid grid-cols-[220px_1fr] gap-6  (sidebar + contenu)
```

- **Fond de page** : `bg-white` — light mode uniquement
- **Sections alternées** : `bg-gray-50` pour créer du rythme
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
- Villes : Conakry, Labé, Kankan, N'Zérékoré, Kindia, Mamou, Boké, Faranah
- Secteurs : BTP, Tech & Numérique, Mécanique, Santé, Transport, Médias, Finance, Artisanat
- Langue : **Français uniquement**
- Ton : professionnel, chaleureux, local, de confiance
- Stack : Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase

---

## 🚫 Interdits absolus

- PAS de fond sombre global (`bg-gray-900`, `bg-black`) — light mode only
- PAS de couleurs hors palette `green-*` / `gray-*` / `blue-*` / `amber-*` Tailwind
- PAS de style inline pour les couleurs
- PAS de `shadow-xl` ou `shadow-2xl` sur les cards — `shadow-sm` maximum
- PAS de `rounded-2xl` ou plus sur les cards — `rounded-xl` maximum
- PAS d'animations > 0.35s
- PAS de `<form>` sur les pages qui utilisent des URL params — utiliser `onChange` + `useRouter`
- PAS de modification de la logique métier, des appels Supabase, ni de l'architecture définie dans `AGENTS.md`
- PAS de dark mode — l'application est light mode uniquement

---

## 🚀 Étape 3 — Améliorations prioritaires homepage

### 🔍 POINT 1 — Hero : Optimiser la barre de recherche

Dans le composant Hero (`HeroSection.tsx` ou `components/home/Hero.tsx`) :

**1. Wrapper de la barre de recherche**

```tsx
<div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-150 focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-700/10">
  <svg
    className="h-4 w-4 shrink-0 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
  <input
    type="text"
    placeholder="Rechercher un menuisier à Conakry..."
    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
  />
  <button className="shrink-0 rounded-lg bg-green-700 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800">
    Rechercher
  </button>
</div>
```

**2. Placeholder rotatif** — changer toutes les 3 secondes

```tsx
const placeholders = [
  'Rechercher un menuisier à Conakry...',
  'Trouver une clinique à Labé...',
  'Chercher un développeur web en Guinée...',
  'Trouver un mécanicien à Kindia...',
  "Chercher une imprimerie à N'Zérékoré...",
];

const [placeholderIndex, setPlaceholderIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
  }, 3000);
  return () => clearInterval(interval);
}, []);
```

**3. Titre du Hero**

```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight text-center">
  Le meilleur professionnel de Guinée{" "}
  <span className="text-green-700">est peut-être à côté de chez vous</span>
</h1>
<p className="mt-4 text-base md:text-lg text-gray-500 text-center max-w-xl mx-auto leading-relaxed">
  Découvrez des PME, artisans et freelances vérifiés partout en Guinée.
  Comparez, contactez, faites confiance.
</p>
```

**Règles :**

- La logique de recherche existante (router push, query params) ne doit PAS être modifiée
- Seul le rendu visuel change
- Composant mobile-first

---

### 📊 POINT 2 — Hero : Stats de confiance

Ajouter **juste sous la barre de recherche** dans le Hero :

```tsx
<div className="mt-6 flex flex-wrap justify-center gap-6 md:gap-10">
  {[
    { value: '50+', label: 'Entreprises inscrites' },
    { value: '8', label: 'Villes couvertes' },
    { value: '10+', label: "Secteurs d'activité" },
  ].map((stat) => (
    <div key={stat.label} className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold tracking-tight text-gray-900">{stat.value}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {stat.label}
      </span>
    </div>
  ))}
</div>
```

**Règles :**

- Valeurs **statiques** pour l'instant — pas d'appel Supabase dans le Hero
- Séparateur visuel optionnel sur desktop : `divide-x divide-gray-200`

---

### 🏢 POINT 3 — Section ProCTA

Créer `components/home/ProCTASection.tsx` et l'intégrer **après la section "Dernières entreprises"** et **avant le footer**.

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const benefits = [
  {
    icon: '👁️',
    title: 'Visibilité immédiate',
    description: 'Votre profil visible par tous les utilisateurs de Woralink en Guinée.',
  },
  {
    icon: '📞',
    title: 'Contacts directs',
    description: 'Les clients vous contactent directement depuis votre fiche.',
  },
  {
    icon: '🖼️',
    title: 'Galerie de réalisations',
    description: 'Publiez vos photos et projets pour convaincre avant même le premier contact.',
  },
  {
    icon: '✅',
    title: 'Badge vérifié',
    description: 'Renforcez la confiance avec un profil vérifié par Woralink.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function ProCTASection() {
  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Pour les professionnels
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Vous êtes une entreprise, un artisan ou un freelance ?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            Rejoignez Woralink gratuitement et donnez de la visibilité à votre activité auprès de
            milliers de clients en Guinée.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={fadeInUp}
              whileHover={{ y: -2 }}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-all duration-150 hover:border-gray-300 hover:shadow-sm"
            >
              <span className="mb-3 block text-2xl">{benefit.icon}</span>
              <h3 className="mb-1 text-base font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
          >
            Inscrire mon entreprise gratuitement
          </Link>
          <Link
            href="/comment-ca-marche"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
          >
            Comment ça marche ?
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
```

**Intégration dans `page.tsx` :**

```tsx
import ProCTASection from '@/components/home/ProCTASection';
// Placer après <DernieresEntreprisesSection /> et avant <Footer />
<ProCTASection />;
```

**Règles :** composant purement UI, aucun appel Supabase, liens vers routes existantes uniquement.

---

## 🔍 Étape 4 — Page `/search` : refonte style ProductHunt

### Objectif

La page `/search` doit ressembler à la liste de startups de ProductHunt :
cards horizontales avec rang, logo, badges, description, bouton BigUp.
Le layout est **sidebar (220px) + zone résultats (flex-1)**.

---

### Composant SearchResultCard

```tsx
// components/search/SearchResultCard.tsx
interface SearchResultCardProps {
  rank: number;
  logo?: string;
  name: string;
  type: 'PME' | 'Freelance' | 'Artisan';
  verified: boolean;
  sector: string;
  city: string;
  description: string;
  slug: string;
  bigupCount: number;
}
```

Structure JSX : voir section **"Cards résultats `/search`"** dans Étape 2.

---

### Sidebar des filtres — deux blocs séparés

**Bloc 1 — Quick Links** (card blanche, rounded-xl, border, p-4) :

- Label `QUICK LINKS` en `text-xs uppercase tracking-wide text-gray-400`
- Tags en pills : `rounded-full border border-gray-200 text-xs px-2.5 py-0.5 hover:bg-gray-50`
- Clic sur un tag → update `?q=` via `useRouter`

**Bloc 2 — Filtres** (card blanche, rounded-xl, border, p-4) :

- Label `FILTRES` identique
- Trois `<select>` : Ville, Secteur d'activité, Type de profil
- Chaque `<select>` avec un label `text-xs font-medium text-gray-600` au-dessus
- Bouton "Effacer les filtres" : pleine largeur, ghost style, `text-sm text-gray-500`
- Chaque filtre update l'URL param correspondant (`?city=`, `?sector=`, `?type=`) via `useSearchParams` + `useRouter`

---

### Toolbar résultats

```tsx
<div className="flex flex-wrap items-center justify-between gap-2">
  {/* Tri */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-400">Trier par</span>
    {['Pertinence', 'Plus vus', 'Vérifiés'].map((label) => (
      <button
        key={label}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          currentSort === label
            ? 'border-green-700 bg-green-700 text-white'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
        }`}
        onClick={() => updateSort(label)}
      >
        {label}
      </button>
    ))}
  </div>
  {/* Compteur */}
  <span className="text-sm text-gray-400">{count} résultats</span>
</div>
```

---

### Pills villes (sous la toolbar)

```tsx
<div className="flex flex-wrap gap-2">
  {cities.map((city) => (
    <button
      key={city}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        currentCity === city
          ? 'border-green-700 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-500 hover:border-green-700 hover:text-green-700'
      }`}
      onClick={() => updateCity(city)}
    >
      {city}
    </button>
  ))}
</div>
```

**Règles pour toute la page `/search` :**

- Tout l'état de filtre/tri passe par les **URL params** (`useSearchParams` + `useRouter`) — jamais `useState` seul
- Pas de `<form>` — utiliser `onClick` / `onChange`
- La logique de requête Supabase existante ne doit PAS être modifiée
- Composant `SearchResultCard` = Client Component (`'use client'`)

---

## ✅ Checklist avant chaque modification

- [ ] J'ai lu `AGENTS.md` et `CLAUDE.md` en premier
- [ ] Je respecte l'architecture et les conventions de ces fichiers
- [ ] J'utilise uniquement les couleurs de la palette définie (green / gray / blue / amber)
- [ ] Le fond est `bg-white` ou `bg-gray-50` — jamais de fond sombre global
- [ ] Les animations sont subtiles (≤ 0.35s, pas de loop)
- [ ] Le composant est mobile-first
- [ ] Aucune logique métier ni appel Supabase n'a été touché
- [ ] L'état des filtres passe par les URL params (pas de useState isolé)
- [ ] Les stats du Hero (Point 2) sont statiques — pas d'appel Supabase
- [ ] `ProCTASection` est un composant purement UI
