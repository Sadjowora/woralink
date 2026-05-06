import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Conditions d utilisation | Woralink',
  description:
    'Conditions d utilisation de Woralink: regles d acces, responsabilites, contenus, propriete intellectuelle et cadre juridique.',
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Conditions d utilisation</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Conditions Generales d Utilisation (CGU)
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Date d entree en vigueur: 6 mai 2026
            <br />
            Derniere mise a jour: 6 mai 2026
          </p>
        </header>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">1. Objet et acceptation</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Les presentes Conditions Generales d Utilisation regissent l acces et l utilisation de Woralink,
              plateforme SaaS permettant la creation de profils professionnels, la mise en relation et la visibilite en
              ligne des artisans, PME et autres professionnels, notamment en Guinee et en Afrique.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              En accedant a Woralink ou en creant un compte, vous reconnaissez avoir lu, compris et accepte sans reserve
              les presentes CGU. Si vous n acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">2. Acces au service</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink est accessible via le web et peut proposer des fonctionnalites adaptees au mobile. Nous mettons
              en oeuvre des moyens raisonnables pour assurer la disponibilite du service, sans garantir un acces continu
              et sans interruption.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              L acces peut etre temporairement suspendu pour maintenance, mise a jour, securite ou en cas de force
              majeure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">3. Creation de compte et responsabilite</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Vous devez fournir des informations exactes, completes et a jour.</li>
              <li>Vous etes responsable de la confidentialite de vos identifiants de connexion.</li>
              <li>Vous etes responsable de toute activite effectuee depuis votre compte.</li>
              <li>Vous devez nous informer rapidement en cas d acces non autorise ou de suspicion de fraude.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">4. Obligations generales des utilisateurs</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">Vous vous engagez a:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Respecter les lois applicables en Guinee, en Afrique et a l international selon votre situation.</li>
              <li>Ne pas publier de contenus illicites, diffamatoires, frauduleux, trompeurs ou violant des droits tiers.</li>
              <li>Ne pas perturber le fonctionnement de la plateforme ni contourner les mesures de securite.</li>
              <li>Ne pas utiliser Woralink a des fins de spam, d usurpation d identite ou d escroquerie.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">5. Regles specifiques pour les professionnels</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Les informations de profil (activite, prix, localisation, contacts, disponibilite) doivent etre exactes.</li>
              <li>Les services proposes doivent etre conformes aux lois et reglementations applicables.</li>
              <li>Le professionnel reste seul responsable de la qualite, de la livraison et de la legalite de ses prestations.</li>
              <li>Les contenus publies (textes, images, logos) ne doivent pas porter atteinte aux droits de tiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">6. Propriete intellectuelle</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              La structure, le design, les marques, les logos, les textes et les elements techniques de Woralink sont
              proteges par les lois de propriete intellectuelle. Sauf autorisation ecrite prealable, toute reproduction,
              extraction, reutilisation ou exploitation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">7. Gestion des contenus publies</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Vous conservez vos droits sur les contenus que vous publiez, mais vous accordez a Woralink une licence non
              exclusive, mondiale, gratuite et necessaire a l hebergement, l affichage, la diffusion et la promotion du
              service.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink peut retirer ou moderer tout contenu manifestement illicite, trompeur, dangereux ou contraire aux
              presentes CGU, sans preavis lorsque cela est necessaire.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">8. Limitation de responsabilite de la plateforme</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink agit comme plateforme de mise en relation et de visibilite. Sauf disposition legale imperative,
              Woralink n est pas partie aux contrats conclus entre utilisateurs et professionnels et ne garantit pas la
              qualite, la conformite, la disponibilite, ni le resultat des prestations proposees.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Dans la limite autorisee par la loi, Woralink ne pourra etre tenue responsable des dommages indirects,
              pertes de chiffre d affaires, pertes de donnees, pertes d opportunites ou atteintes reputatonnelles lies a
              l utilisation de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">9. Suspension et suppression de compte</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink peut suspendre ou supprimer, temporairement ou definitivement, tout compte en cas de violation
              des CGU, d activite illegale, de comportement abusif ou de risque pour la securite de la plateforme ou des
              utilisateurs.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              L utilisateur peut demander la suppression de son compte a tout moment, sous reserve des obligations
              legales de conservation applicables.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">10. Paiements, abonnements et publicites</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink peut proposer un modele freemium, des options payantes ou de la mise en avant publicitaire.
              Lorsque des paiements s appliquent, les prix, conditions, periodicites, renouvellements, annulations et
              remboursements sont precises avant validation de la commande.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Les paiements peuvent etre traites via des prestataires tiers securises, notamment Stripe si applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">11. Protection des donnees personnelles</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Le traitement des donnees personnelles est decrit dans la Politique de confidentialite de Woralink,
              disponible ici:{' '}
              <Link href="/politique-confidentialite" className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline">
                Politique de confidentialite
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">12. Services tiers et liens externes</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink peut integrer ou rediriger vers des services tiers (par exemple Supabase, Google Auth, WhatsApp
              API, Stripe). L utilisation de ces services est soumise a leurs propres conditions et politiques.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink n est pas responsable du contenu, de la disponibilite ou des pratiques de ces services tiers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">13. Modification des conditions</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink peut modifier les presentes CGU a tout moment pour tenir compte des evolutions legales,
              techniques ou economiques. La version applicable est celle publiee sur la plateforme a la date de votre
              consultation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">14. Droit applicable et juridiction</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Sauf disposition legale imperative contraire, les presentes CGU sont regies par le droit applicable en
              Guinee. En cas de litige et a defaut de resolution amiable, competence est attribuee aux juridictions
              competentes du ressort du siege de Woralink, sous reserve des droits protecteurs reconnus aux
              consommateurs selon leur pays de residence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">15. Contact</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">Pour toute question relative aux CGU:</p>
            <p className="mt-2 text-base leading-relaxed text-gray-600">
              E-mail: geniewora@gmail.com
              <br />
              Telephone: +351 920287214
            </p>
          </section>

          <section className="rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Resume simplifie</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Woralink vous aide a etre visible et a entrer en contact avec des clients, mais vous restez responsable de
              vos informations, de vos contenus et de vos prestations. Nous pouvons suspendre un compte en cas d abus ou
              de non-respect des regles. L utilisation de services tiers (Google, WhatsApp, Stripe) implique aussi leurs
              propres conditions.
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Conseils de conformite (facultatif)</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Mettre a jour regulierement vos informations de profil et contacts.</li>
              <li>Verifier la legalite des offres publiees et des promotions annoncees.</li>
              <li>Conserver des preuves de commandes, echanges et confirmations clients.</li>
              <li>Respecter les obligations fiscales, sociales et professionnelles locales applicables.</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-500">
          En utilisant Woralink, vous reconnaissez avoir pris connaissance des presentes Conditions d utilisation.
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Link href="/" className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline">
              Retour à l&apos;accueil
            </Link>
            <Link href="/politique-confidentialite" className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline">
              Voir la politique de confidentialite
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
