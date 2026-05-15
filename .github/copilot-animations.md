# Copilot Instructions — Animations Woralink

## Contexte

Stack : Next.js 14, React, Tailwind CSS, Framer Motion
Design system : Vercel-inspired, palette green-700/gray-\*, light mode uniquement
Règle animations : duration max 0.35s pour entrées, pas de loop sauf marquee, pas de scale sur cards

---

## 🎬 ANIMATION 1 — Compteur animé sur les stats du Hero

**Fichier cible :** le composant qui contient les stats `50+`, `8+`, `10+` (ex: `HeroSection.tsx`)

**Objectif :** Quand les stats entrent dans le viewport, les chiffres montent de 0 jusqu'à leur valeur cible avec une animation fluide.

**Instructions :**

1. Créer un hook `useCountUp` dans `hooks/useCountUp.ts` :

```ts
// hooks/useCountUp.ts
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration: number = 1500, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Easing easeOut
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);

  return count;
}
```

2. Dans le composant Hero, utiliser `useInView` de Framer Motion pour déclencher le compteur :

```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

// Dans le composant :
const statsRef = useRef(null);
const isInView = useInView(statsRef, { once: true, margin: '-40px' });

const stats = [
  { target: 50, suffix: '+', label: 'Entreprises inscrites' },
  { target: 8, suffix: '+', label: 'Villes couvertes' },
  { target: 10, suffix: '+', label: "Secteurs d'activité" },
];

// Composant stat individuel avec son propre compteur
function StatItem({
  target,
  suffix,
  label,
  animate,
}: {
  target: number;
  suffix: string;
  label: string;
  animate: boolean;
}) {
  const count = useCountUp(target, 1200, animate);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold tracking-tight text-gray-900">
        {count}
        {suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
    </div>
  );
}

// Rendu dans le Hero
<div ref={statsRef} className="mt-6 flex flex-wrap justify-center gap-6 md:gap-10">
  {stats.map((stat) => (
    <StatItem key={stat.label} {...stat} animate={isInView} />
  ))}
</div>;
```

**Règles :**

- Ne pas modifier la logique ni le layout existant des stats
- `once: true` — le compteur ne se relance pas à chaque scroll
- Duration 1200ms — fluide sans être lent

---

## 🎬 ANIMATION 2 — Stagger fadeInUp sur les secteurs populaires

**Fichier cible :** composant des secteurs populaires (ex: `SectorsSection.tsx` ou section dans `page.tsx`)

**Objectif :** Les boutons/badges de secteurs apparaissent un par un de gauche à droite au scroll.

**Instructions :**

```tsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Wrapper de la liste de secteurs
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-40px' }}
  className="flex flex-wrap gap-3" // garder les classes existantes
>
  {sectors.map((sector) => (
    <motion.div key={sector.label} variants={itemVariants}>
      {/* Le lien/badge existant sans modification */}
    </motion.div>
  ))}
</motion.div>;
```

**Règles :**

- Ne pas modifier les classes Tailwind existantes des badges
- Ne pas modifier les liens href existants
- Juste envelopper dans les motion.div

---

## 🎬 ANIMATION 3 — Infinite Marquee sur la section Tendances

**Fichier cible :** composant Tendances / galerie de réalisations

**Objectif :** Les images de réalisations défilent horizontalement en continu, en loop infini, sans interaction requise. Deux rangées en sens opposés pour un effet premium.

**Instructions :**

1. Créer un composant `InfiniteMarquee.tsx` dans `components/ui/` :

```tsx
// components/ui/InfiniteMarquee.tsx
'use client';

import { motion } from 'framer-motion';

interface MarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number; // secondes pour un cycle complet
}

export default function InfiniteMarquee({
  children,
  direction = 'left',
  speed = 30,
}: MarqueeProps) {
  const x = direction === 'left' ? [0, '-50%'] : ['-50%', 0];

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: speed,
          ease: 'linear',
        }}
      >
        {/* Dupliquer les enfants pour le loop seamless */}
        {children}
        {children}
      </motion.div>
    </div>
  );
}
```

2. Utiliser dans la section Tendances — diviser les réalisations en 2 rangées :

```tsx
import InfiniteMarquee from '@/components/ui/InfiniteMarquee';

// Diviser les réalisations en deux groupes (row1 = première moitié, row2 = deuxième moitié)
const row1 = realisations.slice(0, Math.ceil(realisations.length / 2));
const row2 = realisations.slice(Math.ceil(realisations.length / 2));

<div className="flex flex-col gap-4">
  {/* Rangée 1 — défile vers la gauche */}
  <InfiniteMarquee direction="left" speed={35}>
    {row1.map((item) => (
      <a
        key={item.id}
        href={item.href}
        className="block h-36 w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 transition-all duration-150 hover:border-gray-300 hover:shadow-sm md:h-44 md:w-64"
      >
        <img src={item.imageUrl} alt={item.alt} className="h-full w-full object-cover" />
      </a>
    ))}
  </InfiniteMarquee>

  {/* Rangée 2 — défile vers la droite (sens opposé) */}
  <InfiniteMarquee direction="right" speed={28}>
    {row2.map((item) => (
      <a
        key={item.id}
        href={item.href}
        className="block h-36 w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 transition-all duration-150 hover:border-gray-300 hover:shadow-sm md:h-44 md:w-64"
      >
        <img src={item.imageUrl} alt={item.alt} className="h-full w-full object-cover" />
      </a>
    ))}
  </InfiniteMarquee>
</div>;
```

**Règles :**

- Ne pas modifier la logique de fetch des réalisations depuis Supabase
- Adapter les noms de champs (`item.imageUrl`, `item.href`, etc.) aux champs réels du projet
- `speed` différent pour les deux rangées — effet de profondeur

---

## 🎬 ANIMATION 4 — Hover + Stagger sur les cards "Dernières entreprises"

**Fichier cible :** composant des dernières entreprises inscrites

**Objectif :** Les cards apparaissent en stagger au scroll et ont un léger lift au hover.

**Instructions :**

```tsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// Wrapper de la grille
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-40px' }}
  className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
>
  {entreprises.map((entreprise) => (
    <motion.div
      key={entreprise.id}
      variants={cardVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all duration-150 hover:border-gray-300 hover:shadow-sm"
    >
      {/* Contenu existant de la card sans modification */}
    </motion.div>
  ))}
</motion.div>;
```

**Règles :**

- `whileHover={{ y: -2 }}` uniquement — pas de scale
- Ne pas modifier le contenu interne des cards
- Ne pas modifier les liens href

---

## 🎬 ANIMATION 5 — Pulse subtil sur le badge "Coup de Cœur"

**Fichier cible :** composant `CoupDeCoeur` ou section Coup de Cœur

**Objectif :** Le badge `✨ Coup de Cœur de la semaine` attire l'œil avec un pulse doux sur l'icône étoile uniquement.

**Instructions :**

```tsx
import { motion } from 'framer-motion';

// Badge complet avec pulse sur l'icône seulement
<span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
  <motion.span
    animate={{ scale: [1, 1.2, 1] }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
    }}
  >
    ✨
  </motion.span>
  Coup de Cœur de la semaine
</span>;
```

**Règles :**

- Le pulse est UNIQUEMENT sur l'icône `✨`, pas sur tout le badge
- `scale` entre 1 et 1.2 — subtil, pas agressif
- Duration 1.8s — lent et élégant
- C'est la SEULE animation en loop autorisée dans le projet (exception justifiée)

---

## ✅ Checklist animations

- [ ] `useCountUp` hook créé dans `hooks/useCountUp.ts`
- [ ] `InfiniteMarquee` composant créé dans `components/ui/InfiniteMarquee.tsx`
- [ ] Aucune logique Supabase modifiée
- [ ] Aucune classe Tailwind existante supprimée
- [ ] Toutes les durées d'entrée ≤ 0.35s
- [ ] `whileHover` uniquement `y: -2`, jamais de scale sur les cards
- [ ] Le pulse ✨ est la seule animation en loop (hors marquee)
- [ ] Tous les composants sont `"use client"`
