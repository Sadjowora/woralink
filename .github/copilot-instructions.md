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

---

---

## 🚀 Étape 3 — Améliorations prioritaires de la page d'accueil

Ces 3 améliorations sont **prioritaires** pour augmenter la conversion et l'acquisition d'entreprises.
Chaque section ci-dessous contient les instructions exactes à appliquer dans le composant concerné.

---

### 🔍 POINT 1 — Hero : Optimiser la barre de recherche

**Objectif :** Rendre la barre de recherche plus visible, plus engageante et plus efficace pour convertir les visiteurs.

**Instructions pour Copilot :**

Dans le composant Hero (ex: `HeroSection.tsx` ou `components/home/Hero.tsx`) :

1. **Wrapper de la barre de recherche** — entourer l'input + bouton dans un conteneur card avec ombre légère :

```tsx
<div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-150 focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-700/10">
  {/* Icône loupe à gauche */}
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

  {/* Input */}
  <input
    type="text"
    placeholder="Rechercher un menuisier à Conakry..."
    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
  />

  {/* Bouton Rechercher */}
  <button className="shrink-0 rounded-lg bg-green-700 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800">
    Rechercher
  </button>
</div>
```

2. **Placeholder rotatif** — le placeholder doit changer toutes les 3 secondes via `useState` + `useEffect` pour suggérer des cas d'usage concrets :

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

3. **Accroche du Hero** — remplacer le titre générique par une formulation plus émotionnelle et locale. Exemple :

```tsx
// AVANT (à remplacer)
<h1>Trouvez les meilleures PME, startups, artisans et freelances de Guinée</h1>

// APRÈS
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight text-center">
  Le meilleur professionnel de Guinée{" "}
  <span className="text-green-700">est peut-être à côté de chez vous</span>
</h1>
<p className="mt-4 text-base md:text-lg text-gray-500 text-center max-w-xl mx-auto leading-relaxed">
  Découvrez des PME, artisans et freelances vérifiés partout en Guinée.
  Comparez, contactez, faites confiance.
</p>
```

4. **Règles à respecter :**
   - La logique de recherche existante (router push, query params) ne doit PAS être modifiée
   - Seul le rendu visuel change
   - Le composant reste mobile-first

---

### 📊 POINT 2 — Hero : Ajouter les stats de confiance

**Objectif :** Rassurer immédiatement le visiteur avec des chiffres concrets affichés sous la barre de recherche.

**Instructions pour Copilot :**

Ajouter un bloc stats **juste sous la barre de recherche**, toujours dans le composant Hero :

```tsx
{
  /* Stats de confiance */
}
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
</div>;
```

**Règles importantes :**

- Les valeurs (`50+`, `8`, `10+`) sont des **valeurs statiques pour l'instant**. Ne pas faire d'appel Supabase ici — les chiffres seront mis à jour manuellement au fur et à mesure de la croissance.
- Si dans le futur un appel Supabase est nécessaire pour ces stats, il devra passer par une Server Component ou un `getStaticProps` avec revalidation — jamais un appel client bloquant dans le Hero.
- Séparateur visuel optionnel entre les stats sur desktop : `divide-x divide-gray-200` si alignés en ligne.

---

### 🏢 POINT 3 — Nouvelle section "Inscrivez votre entreprise"

**Objectif :** Cibler les professionnels qui visitent la page et les convertir en inscrits. Cette section doit être **distincte de la section visiteur** et parler directement aux entreprises.

**Instructions pour Copilot :**

Créer un nouveau composant `ProCTASection.tsx` dans `components/home/` et l'intégrer dans la page d'accueil **après la section "Dernières entreprises"** et **avant le footer**.

```tsx
// components/home/ProCTASection.tsx
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
        {/* En-tête */}
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

        {/* Grille des bénéfices */}
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

        {/* CTA final */}
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

**Intégration dans `page.tsx` (ou `index.tsx`) :**

```tsx
// Importer le composant
import ProCTASection from '@/components/home/ProCTASection';

// Placer après <DernieresEntreprisesSection /> et avant <Footer />
<ProCTASection />;
```

**Règles à respecter :**

- Ce composant est **purement UI** — aucun appel Supabase, aucune logique métier
- Le lien `/register` doit pointer vers la route d'inscription existante du projet
- Le lien `/comment-ca-marche` pointe vers la page existante
- Ne pas modifier ces routes

---

## ✅ Checklist avant chaque modification

- [ ] J'ai lu `AGENTS.md` et `CLAUDE.md` en premier
- [ ] Je respecte l'architecture et les conventions de ces fichiers
- [ ] J'utilise uniquement `text-green-700` / `gray-*` / `green-*` Tailwind
- [ ] Le fond est `bg-white` ou `bg-gray-50`
- [ ] Les animations sont subtiles (≤ 0.35s, pas de loop)
- [ ] Le composant est mobile-first
- [ ] Aucune logique métier n'a été touchée
- [ ] Les stats (Point 2) sont statiques — pas d'appel Supabase dans le Hero
- [ ] `ProCTASection` est un composant purement UI sans logique métier
