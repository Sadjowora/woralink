import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Politique de confidentialite | Woralink',
  description:
    'Politique de confidentialite de Woralink: collecte, utilisation, conservation et protection des donnees personnelles.',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Politique de confidentialite</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Protection des donnees personnelles
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Date d&apos;entree en vigueur: 6 mai 2026
            <br />
            Derniere mise a jour: 6 mai 2026
          </p>
        </header>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">1. Qui sommes-nous</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink est une plateforme SaaS dediee a la decouverte des artisans, freelances, startups et PME en
              Guinee, et plus largement en Afrique. Woralink permet aux professionnels d&apos;ameliorer leur visibilite
              digitale et aux utilisateurs de trouver des prestataires locaux.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Responsable du traitement: Woralink
              <br />
              Contact: geniewora@gmail.com / +351 920287214
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">2. Portee de la politique</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Cette politique decrit la maniere dont Woralink collecte, utilise, stocke, partage et protege les donnees
              personnelles des utilisateurs de ses services web et mobiles, conformement aux lois applicables,
              notamment le RGPD (Reglement UE 2016/679) lorsque celui-ci s&apos;applique.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">3. Donnees collectees</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Donnees d&apos;identite: nom, prenom, nom d&apos;entreprise, fonction.</li>
              <li>Donnees de contact: adresse e-mail, numero de telephone, adresse professionnelle.</li>
              <li>
                Donnees de profil: description d&apos;activite, secteur, ville/localisation, medias (photos, logo),
                horaires, liens professionnels.
              </li>
              <li>
                Donnees d&apos;authentification: identifiants de connexion, informations liees a l&apos;authentification via
                fournisseur tiers (ex. Google).
              </li>
              <li>
                Donnees techniques: adresse IP, type d&apos;appareil, navigateur, systeme d&apos;exploitation, journaux
                techniques.
              </li>
              <li>Donnees d&apos;utilisation: pages visitees, actions realisees, preferences, interactions.</li>
              <li>Donnees de communication: messages envoyes via formulaires de contact et support.</li>
              <li>Donnees marketing: consentements et preferences de communication.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">4. Methodes de collecte</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Formulaires en ligne (inscription, profil, contact).</li>
              <li>Authentification et connexion sociale (ex. Google OAuth).</li>
              <li>Cookies et technologies similaires.</li>
              <li>APIs et journaux techniques de la plateforme.</li>
              <li>Echanges directs avec le support client.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">5. Finalites et bases legales</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">Nous utilisons vos donnees pour:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Creer et gerer votre compte utilisateur.</li>
              <li>Publier et administrer les profils professionnels.</li>
              <li>Permettre la mise en relation entre utilisateurs et professionnels.</li>
              <li>Assurer la securite, la prevention de la fraude et le bon fonctionnement du service.</li>
              <li>Repondre aux demandes de support et de contact.</li>
              <li>Ameliorer nos services, fonctionnalites et performances.</li>
              <li>Envoyer des informations utiles et communications marketing selon vos choix.</li>
              <li>Respecter nos obligations legales et reglementaires.</li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Bases legales selon les cas: execution du contrat, consentement, interet legitime et obligation legale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">6. Cookies</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink utilise des cookies et technologies similaires pour assurer le fonctionnement technique,
              memoriser vos preferences, mesurer l&apos;audience et ameliorer l&apos;experience utilisateur.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Cookies strictement necessaires.</li>
              <li>Cookies de performance et d&apos;analyse.</li>
              <li>Cookies de fonctionnalite.</li>
              <li>Cookies marketing, uniquement si vous y consentez lorsque la loi l&apos;exige.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">7. Services tiers</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Nous pouvons recourir a des prestataires tiers pour operer le service, notamment Supabase
              (infrastructure, base de donnees, authentification, stockage), Google Auth et d&apos;autres integrations
              techniques necessaires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">8. Partage des donnees</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Nous ne vendons pas vos donnees personnelles. Nous pouvons partager certaines donnees avec des
              sous-traitants techniques, pour respecter une obligation legale ou lorsqu&apos;une operation de fusion/cession
              l&apos;exige, avec garanties adequates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">9. Transferts internationaux</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Vos donnees peuvent etre traitees hors de votre pays de residence, y compris hors EEE. Lorsque de tels
              transferts ont lieu, Woralink met en place des garanties appropriees (clauses contractuelles types,
              mesures techniques et organisationnelles, evaluations de protection).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">10. Stockage et conservation</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Les donnees sont stockees sur des infrastructures securisees exploitees par Woralink et ses prestataires.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Donnees de compte: pendant la duree du compte actif.</li>
              <li>Donnees de profil public professionnel: jusqu&apos;a suppression/modification ou fermeture du compte.</li>
              <li>Donnees de support/contact: jusqu&apos;a 24 mois apres traitement de la demande.</li>
              <li>Donnees techniques et logs: duree limitee necessaire a la securite et au diagnostic.</li>
              <li>Donnees marketing: jusqu&apos;au retrait du consentement ou au maximum 3 ans sans interaction.</li>
              <li>Donnees soumises a obligations legales: selon les delais imposes par la loi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">11. Securite</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Controle d&apos;acces logique aux systemes.</li>
              <li>Chiffrement en transit (HTTPS/TLS).</li>
              <li>Journalisation et surveillance des acces.</li>
              <li>Sauvegardes et mecanismes de restauration.</li>
              <li>Principe du moindre privilege et procedures de gestion des incidents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">12. Vos droits</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
              <li>Droit d&apos;acces.</li>
              <li>Droit de rectification.</li>
              <li>Droit d&apos;effacement.</li>
              <li>Droit a la limitation du traitement.</li>
              <li>Droit d&apos;opposition.</li>
              <li>Droit a la portabilite.</li>
              <li>Droit de retirer votre consentement.</li>
              <li>Droit d&apos;introduire une reclamation aupres d&apos;une autorite competente.</li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Pour exercer vos droits: geniewora@gmail.com / +351 920287214
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">13. Mineurs</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Woralink n&apos;est pas destine aux mineurs de moins de 16 ans sans autorisation parentale lorsque la loi
              locale l&apos;exige. Si vous pensez qu&apos;un mineur nous a transmis des donnees sans autorisation appropriee,
              contactez-nous.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">14. Liens vers des services tiers</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Notre plateforme peut contenir des liens vers des services tiers. Woralink n&apos;est pas responsable des
              pratiques de confidentialite de ces services. Consultez leurs politiques respectives.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">15. Modifications de cette politique</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Nous pouvons mettre a jour cette politique pour refleter les evolutions legales, techniques ou
              operationnelles. La version la plus recente est publiee sur nos supports officiels.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">16. Contact</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">Pour toute question relative a la confidentialite:</p>
            <p className="mt-2 text-base leading-relaxed text-gray-600">
              E-mail: geniewora@gmail.com
              <br />
              Telephone: +351 920287214
            </p>
          </section>

          <section className="rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Version simplifiee</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Woralink collecte certaines donnees (identite, contact, profil professionnel et donnees techniques) pour
              faire fonctionner la plateforme, securiser les comptes et ameliorer le service. Nous utilisons des
              prestataires comme Supabase et Google Auth. Nous ne vendons pas vos donnees. Vous pouvez demander
              l&apos;acces, la correction, la suppression ou la portabilite de vos donnees a tout moment.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-500">
          En poursuivant votre utilisation de Woralink, vous reconnaissez avoir pris connaissance de cette politique.
          <div className="mt-3 flex-wrap items-center gap-4">
            <Link href="/" className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline">
              Retour à l&apos;accueil
            </Link>
              <Link href="/conditions-utilisation" className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline">
                Voir les conditions d&apos;utilisation
              </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
