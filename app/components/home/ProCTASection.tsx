'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';

const benefits = [
  {
    icon: '👁️',
    title: 'Visibilite immediate',
    description: 'Votre profil visible par tous les utilisateurs de Woralink en Guinee.',
  },
  {
    icon: '📞',
    title: 'Contacts directs',
    description: 'Les clients vous contactent directement depuis votre fiche.',
  },
  {
    icon: '🖼️',
    title: 'Galerie de realisations',
    description: 'Publiez vos photos et projets pour convaincre avant meme le premier contact.',
  },
  {
    icon: '✅',
    title: 'Badge verifie',
    description: 'Renforcez la confiance avec un profil verifie par Woralink.',
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
            Vous etes une entreprise, un artisan ou un freelance ?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            Rejoignez Woralink gratuitement et donnez de la visibilite a votre activite aupres de
            milliers de clients en Guinee.
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
            Comment ca marche ?
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
