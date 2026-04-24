'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { submitContactMessage, type ContactFormState } from './actions';

const SUBJECTS = ['Support', 'Partenariat', 'Signalement'] as const;

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ContactFormState>({ status: 'idle' });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setState({ status: 'idle' });

    const result = await submitContactMessage({ name, email, subject, message });
    setState(result);
    setLoading(false);

    if (result.status === 'success') {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }
  };

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tighter text-gray-900">
            Merci&nbsp;! Votre message a bien été envoyé.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Nous reviendrons vers vous dans les plus brefs délais.
          </p>
        </div>
        <button
          onClick={() => setState({ status: 'idle' })}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state.status === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500"
          >
            Nom complet
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mamadou Diallo"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500"
        >
          Sujet
        </label>
        <select
          id="contact-subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10 appearance-none"
        >
          <option value="" disabled>
            Sélectionner un sujet
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre demande en détail…"
          className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          'Envoyer le message'
        )}
      </button>
    </form>
  );
}
