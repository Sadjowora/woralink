'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';

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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function ProCTASection() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
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
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100 md:text-3xl">
            Vous êtes une entreprise, un artisan ou un freelance ?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
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
              className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-all duration-150 hover:border-gray-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <span className="mb-3 block text-2xl">{benefit.icon}</span>
              <h3 className="mb-1 text-base font-semibold text-gray-900 transition-colors duration-200 dark:text-slate-100">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
                {benefit.description}
              </p>
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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Comment ça marche ?
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
