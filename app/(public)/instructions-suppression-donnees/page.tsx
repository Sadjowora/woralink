import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Instructions de suppression des donnees utilisateur | Woralink',
  description:
    'Procedure officielle de suppression des donnees utilisateur pour Woralink, conforme aux exigences Meta/Facebook Developers.',
};

export default function InstructionsSuppressionDonneesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Conformite Meta
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-4xl">
            Instructions de suppression des donnees utilisateur
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
            Application: Woralink (SaaS)
            <br />
            Description: Plateforme de decouverte des artisans et PME en Guinee.
            <br />
            Services integres: Supabase, Google Auth, WhatsApp API, Facebook Login.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
            Derniere mise a jour: 7 mai 2026
          </p>
        </header>

        <div className="space-y-8 text-gray-700 transition-colors duration-200 dark:text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              1. Objet de cette page
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Cette page explique la procedure officielle pour demander la suppression des donnees
              personnelles traitees par Woralink. Elle est publiee pour repondre aux exigences de
              conformite des plateformes Meta, notamment Facebook Login, WhatsApp API et autres Meta
              APIs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              2. Comment demander la suppression de vos donnees
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Vous pouvez demander la suppression de vos donnees par les moyens suivants:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>E-mail: geniewora@gmail.com</li>
              <li>Telephone/WhatsApp: +351 920287214</li>
              <li>Objet recommande: &quot;Demande de suppression des donnees - Woralink&quot; </li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Pour proteger votre compte, nous pouvons vous demander une verification raisonnable d
              identite avant execution de la suppression.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              3. Donnees concernees par la suppression
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Sous reserve des obligations legales, la demande de suppression couvre notamment:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>Donnees de compte (identifiants, e-mail, nom, informations de profil).</li>
              <li>Donnees professionnelles publiees (fiche entreprise, medias, descriptions).</li>
              <li>Donnees de contact et de support associees a votre compte.</li>
              <li>Donnees liees aux integrations sociales et techniques necessaires au service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              4. Delais de traitement
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>Accuse de reception de la demande: sous 72 heures ouvrables.</li>
              <li>Traitement standard de suppression: sous 30 jours calendaires maximum.</li>
              <li>
                Cas complexes ou verification supplementaire: prolongation possible dans la limite
                legale, avec information prealable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              5. Comptes connectes via Facebook Login
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Si vous avez utilise Facebook Login pour creer ou connecter votre compte Woralink,
              vous pouvez demander la suppression de vos donnees a tout moment par e-mail.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>
                Nous supprimons ou anonymisons les donnees rattachees a votre compte Woralink selon
                la demande.
              </li>
              <li>
                Nous supprimons les jetons et autorisations techniques utilises pour Facebook Login
                dans nos systemes, lorsque applicable.
              </li>
              <li>
                Vous pouvez aussi retirer l autorisation de l application depuis vos parametres
                Facebook.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              6. Donnees liees a WhatsApp API et Meta APIs
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Lorsque des interactions techniques passent par WhatsApp API ou d autres Meta APIs,
              Woralink traite les donnees strictement necessaires a l execution du service. En cas
              de demande de suppression:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>
                Les donnees conservees par Woralink et rattachees a votre compte sont supprimees ou
                anonymisees.
              </li>
              <li>
                Les traitements effectues par des fournisseurs tiers restent soumis a leurs propres
                politiques de conservation.
              </li>
              <li>
                Nous vous orientons vers les canaux tiers pertinents si une action complementaire
                est requise hors Woralink.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              7. Droit d acces et de rectification
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Avant une suppression definitive, vous pouvez exercer vos droits d acces, de
              correction ou de mise a jour de vos donnees. Ces demandes peuvent etre adressees via
              les memes canaux de contact.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              8. Exceptions legales et conservation minimale
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Certaines informations peuvent etre conservees pour respecter une obligation legale,
              reglementaire, comptable, fiscale, de securite ou de resolution de litiges. Dans ce
              cas, les donnees sont limitees au strict necessaire pendant la duree imposee par la
              loi applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              9. Confirmation de suppression
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              Une fois votre demande executee, vous recevez une confirmation ecrite par e-mail.
              Cette confirmation peut inclure:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              <li>La date de traitement effectif.</li>
              <li>Le perimetre des donnees supprimees ou anonymisees.</li>
              <li>
                Le detail des eventuelles donnees conservees au titre d une obligation legale.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              10. Contacts officiels
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300">
              E-mail: geniewora@gmail.com
              <br />
              Telephone/WhatsApp: +351 920287214
            </p>
          </section>

          <section className="rounded-xl border border-green-200 bg-green-50 p-6 transition-colors duration-200 dark:border-green-900/40 dark:bg-green-950/20">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              Version courte (FAQ)
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700 transition-colors duration-200 dark:text-slate-300">
              Pour supprimer vos donnees Woralink, envoyez un e-mail a geniewora@gmail.com avec l
              objet &quot;Demande de suppression des données&quot;. Nous accusons reception sous 72
              heures ouvrables et traitons la suppression sous 30 jours maximum. Si votre compte est
              connecte via Facebook Login, la suppression couvre aussi les donnees rattachees dans
              Woralink. Une confirmation de suppression vous est envoyee par e-mail.
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
              Exemple d e-mail de demande
            </h2>
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm leading-relaxed text-gray-700 transition-colors duration-200 dark:text-slate-300">
                Objet: Demande de suppression des donnees - Woralink
                <br />
                <br />
                Bonjour,
                <br />
                <br />
                Je souhaite exercer mon droit a la suppression de mes donnees personnelles associees
                a mon compte Woralink.
                <br />
                E-mail du compte: [votre e-mail]
                <br />
                Compte connecte via Facebook Login: [oui/non]
                <br />
                Numero WhatsApp lie au compte (si applicable): [numero]
                <br />
                <br />
                Merci de me confirmer la prise en charge de ma demande et la date effective de
                suppression.
                <br />
                <br />
                Cordialement,
                <br />
                [Nom complet]
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-500 transition-colors duration-200 dark:border-slate-800 dark:text-slate-400">
          Pour plus d informations, consultez aussi la{' '}
          <Link
            href="/politique-confidentialite"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            politique de confidentialite
          </Link>{' '}
          et les{' '}
          <Link
            href="/conditions-utilisation"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            conditions d utilisation
          </Link>
          .
        </div>
      </main>
    </div>
  );
}
