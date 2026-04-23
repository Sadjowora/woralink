'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, PhoneCall, QrCode, Search, ShieldCheck, UserPlus } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';

type TabKey = 'pro' | 'visitor';

type Step = {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
};

type FaqItem = {
	question: string;
	answer: string;
};

const PRO_STEPS: Step[] = [
	{
		title: 'Créez votre vitrine',
		description: 'En 2 minutes, décrivez votre savoir-faire et uploadez vos photos pour présenter votre activité.',
		icon: UserPlus,
	},
	{
		title: 'Partagez votre profil',
		description: 'Utilisez votre bouton WhatsApp et votre QR Code pour attirer plus de clients facilement.',
		icon: QrCode,
	},
	{
		title: 'Gagnez en crédibilité',
		description: 'Les avis clients renforcent votre réputation et vous aident à devenir un pro incontournable sur Woralink.',
		icon: BadgeCheck,
	},
];

const VISITOR_STEPS: Step[] = [
	{
		title: 'Recherchez un expert',
		description: 'Utilisez la barre de recherche par métier ou par ville en Guinée pour trouver rapidement le bon profil.',
		icon: Search,
	},
	{
		title: 'Comparez les réalisations',
		description: 'Consultez la galerie photo et les avis clients pour choisir le meilleur professionnel.',
		icon: ShieldCheck,
	},
	{
		title: 'Contactez directement',
		description: 'Envoyez un message WhatsApp en un clic, sans intermédiaire.',
		icon: PhoneCall,
	},
];

const FAQ_ITEMS: FaqItem[] = [
	{
		question: 'Est-ce que Woralink est gratuit ?',
		answer: 'Oui, la création de vitrine est gratuite pour tous les artisans.',
	},
	{
		question: 'Comment sont vérifiés les avis ?',
		answer: 'Nous encourageons le partage de preuves de chantiers.',
	},
	{
		question: 'Puis-je modifier mon profil plus tard ?',
		answer: 'Oui, via votre tableau de bord personnel.',
	},
];

export default function CommentCaMarchePage() {
	const [activeTab, setActiveTab] = useState<TabKey>('pro');
	const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
	const steps = activeTab === 'pro' ? PRO_STEPS : VISITOR_STEPS;

	return (
		<div className="min-h-screen bg-white">
			<Navbar />

			<main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
				<header className="border-b border-gray-100 pb-8 text-center sm:pb-10">
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Comment ca marche</p>
					<h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">
						Woralink : La confiance au bout du clic
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
						Un parcours simple pour aider les professionnels a gagner en visibilite et les visiteurs a trouver les bons partenaires.
					</p>
				</header>

				<section className="mt-8 sm:mt-10">
					<div className="mx-auto grid w-full max-w-xl grid-cols-2 rounded-xl border border-gray-100 bg-white p-1">
						<button
							type="button"
							onClick={() => setActiveTab('pro')}
							className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
								activeTab === 'pro' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'
							}`}
						>
							Je suis un Professionnel
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('visitor')}
							className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
								activeTab === 'visitor' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'
							}`}
						>
							Je suis un Visiteur
						</button>
					</div>

					<div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5">
						{steps.map((step, index) => {
							const Icon = step.icon;

							return (
								<article key={step.title} className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
									<div className="flex items-start gap-4">
										<div className="flex items-center gap-3">
											<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
												{index + 1}
											</span>
											<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
												<Icon className="h-4 w-4 text-primary" />
											</span>
										</div>

										<div>
											<h2 className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">{step.title}</h2>
											<p className="mt-1 text-sm leading-relaxed text-gray-600 sm:text-base">{step.description}</p>
										</div>
									</div>
								</article>
							);
						})}
					</div>

					{activeTab === 'pro' && (
						<div className="pt-2">
							<Link
								href="/register"
								className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
							>
								Commencer maintenant
							</Link>
						</div>
					)}

					{activeTab === 'visitor' && (
						<div className="pt-2">
							<Link
								href="/"
								className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
							>
								Explorer les PME
							</Link>
						</div>
					)}
				</section>

				<section className="mt-10 border-t border-gray-100 pt-8 sm:mt-12 sm:pt-10">
					<div className="mx-auto w-full max-w-3xl">
						<h2 className="text-2xl font-bold tracking-tighter text-primary sm:text-3xl">FAQ</h2>
						<p className="mt-2 text-sm text-gray-600 sm:text-base">
							Réponses rapides aux questions les plus fréquentes.
						</p>

						<div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
							{FAQ_ITEMS.map((item, index) => {
								const isOpen = openFaqIndex === index;

								return (
									<div key={item.question} className="px-4 py-3 sm:px-5 sm:py-4">
										<button
											type="button"
											onClick={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
											className="flex w-full items-center justify-between gap-4 text-left"
											aria-expanded={isOpen}
										>
											<span className="text-sm font-semibold text-gray-900 sm:text-base">{item.question}</span>
											<span className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
												+
											</span>
										</button>

										<div
											className={`grid overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pt-2' : 'grid-rows-[0fr] opacity-0'}`}
										>
											<div className="overflow-hidden text-sm leading-relaxed text-gray-600 sm:text-base">
												{item.answer}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
