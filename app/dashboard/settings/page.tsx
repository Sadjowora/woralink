'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bell, Clock, Loader2, Lock, Shield } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { supabase } from '../../../lib/supabase';

type TabKey = 'security' | 'notifications' | 'privacy';

type CompanySettingsRow = {
  company_id: string;
  notify_new_message: boolean;
  notify_weekly_report: boolean;
  disable_whatsapp_access: boolean;
  availability_status: 'online' | 'offline';
  away_message: string;
};

type Notice = {
  type: 'success' | 'error';
  message: string;
};

const DEFAULT_SETTINGS: Omit<CompanySettingsRow, 'company_id'> = {
  notify_new_message: true,
  notify_weekly_report: true,
  disable_whatsapp_access: false,
  availability_status: 'online',
  away_message: '',
};

const tabs: Array<{ key: TabKey; label: string; icon: typeof Lock }> = [
  { key: 'security', label: 'Securite', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'privacy', label: 'Confidentialite', icon: Shield },
];

function SettingsSwitch({
  checked,
  onToggle,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{description}</p>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-150 ${
          checked
            ? 'border-green-700 bg-green-700 dark:border-green-600 dark:bg-green-600'
            : 'border-gray-300 bg-gray-200 dark:border-slate-600 dark:bg-slate-700'
        }`}
      >
        <span
          className={`h-4.5 w-4.5 absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('security');
  const [checking, setChecking] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [securitySending, setSecuritySending] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<Notice | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<Notice | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!securityNotice) return;

    const timer = window.setTimeout(() => setSecurityNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [securityNotice]);

  useEffect(() => {
    if (!settingsNotice) return;

    const timer = window.setTimeout(() => setSettingsNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [settingsNotice]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setChecking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle<{ id: string }>();

      if (!mounted) return;

      if (companyError || !company?.id) {
        setSettingsNotice({
          type: 'error',
          message: 'Impossible de charger votre espace configuration.',
        });
        setChecking(false);
        return;
      }

      setCompanyId(company.id);
      setSettingsLoading(true);

      const { data: existing, error: settingsError } = await supabase
        .from('company_settings')
        .select(
          'company_id, notify_new_message, notify_weekly_report, disable_whatsapp_access, availability_status, away_message',
        )
        .eq('company_id', company.id)
        .maybeSingle<CompanySettingsRow>();

      if (!mounted) return;

      if (settingsError) {
        setSettingsNotice({
          type: 'error',
          message: "Les preferences n'ont pas pu etre chargees.",
        });
      }

      const resolved: Omit<CompanySettingsRow, 'company_id'> = existing
        ? {
            notify_new_message: !!existing.notify_new_message,
            notify_weekly_report: !!existing.notify_weekly_report,
            disable_whatsapp_access: !!existing.disable_whatsapp_access,
            availability_status: existing.availability_status === 'offline' ? 'offline' : 'online',
            away_message: existing.away_message ?? '',
          }
        : DEFAULT_SETTINGS;

      setSettings(resolved);

      if (!existing) {
        const { error: seedError } = await supabase.from('company_settings').upsert(
          {
            company_id: company.id,
            ...resolved,
          },
          { onConflict: 'company_id' },
        );

        if (seedError) {
          setSettingsNotice({
            type: 'error',
            message: 'Initialisation des preferences impossible pour le moment.',
          });
        }
      }

      setSettingsLoading(false);
      setChecking(false);
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = async (nextSettings: typeof settings, successMessage?: string) => {
    if (!companyId) return;

    setSettingsSaving(true);

    const { error } = await supabase.from('company_settings').upsert(
      {
        company_id: companyId,
        ...nextSettings,
      },
      { onConflict: 'company_id' },
    );

    setSettingsSaving(false);

    if (error) {
      setSettingsNotice({ type: 'error', message: "Impossible d'enregistrer ce parametre." });
      return false;
    }

    if (successMessage) {
      setSettingsNotice({ type: 'success', message: successMessage });
    }

    return true;
  };

  const onToggleNotification = async (key: 'notify_new_message' | 'notify_weekly_report') => {
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);

    const ok = await persistSettings(next, 'Preferences de notification mises a jour.');
    if (!ok) {
      setSettings(previous);
    }
  };

  const onAvailabilityChange = async (value: 'online' | 'offline') => {
    const previous = settings;
    const next = { ...settings, availability_status: value };
    setSettings(next);

    const ok = await persistSettings(next, 'Disponibilite mise a jour.');
    if (!ok) {
      setSettings(previous);
    }
  };

  const onToggleWhatsappAccess = async () => {
    const previous = settings;
    const next = {
      ...settings,
      disable_whatsapp_access: !settings.disable_whatsapp_access,
    };

    setSettings(next);
    const ok = await persistSettings(next, 'Preference WhatsApp mise a jour.');
    if (!ok) {
      setSettings(previous);
    }
  };

  const awayLength = useMemo(() => settings.away_message.length, [settings.away_message]);

  const saveAwayMessage = async (event: FormEvent) => {
    event.preventDefault();
    await persistSettings(settings, "Message d'absence enregistre.");
  };

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault();

    setSecurityNotice(null);

    if (newPassword.length < 8) {
      setSecurityNotice({
        type: 'error',
        message: 'Le nouveau mot de passe doit contenir au moins 8 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityNotice({
        type: 'error',
        message: 'La confirmation du mot de passe ne correspond pas.',
      });
      return;
    }

    setSecuritySending(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSecuritySending(false);

    if (error) {
      setSecurityNotice({
        type: 'error',
        message: 'Impossible de mettre a jour le mot de passe. Reessayez.',
      });
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setSecurityNotice({
      type: 'success',
      message:
        'Mot de passe mis a jour. Deconnectez-vous puis reconnectez-vous pour rendre le changement effectif.',
    });
  };

  return (
    <DashboardShell
      title="Configuration"
      subtitle="Pilotez la securite, les notifications et la confidentialite de votre espace entreprise."
      actions={
        <Link
          href="/dashboard/setup"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Configuration avancee
        </Link>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-2 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="scrollbar-thin flex gap-2 overflow-x-auto px-1 py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/25 ${
                    isActive
                      ? 'border-green-700 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {checking ? (
          <section className="rounded-xl border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement des parametres...
            </div>
          </section>
        ) : (
          <>
            {settingsNotice ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  settingsNotice.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                }`}
              >
                {settingsNotice.message}
              </div>
            ) : null}

            {activeTab === 'security' ? (
              <section className="rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 md:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Lock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Securite du compte
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Mettez a jour votre mot de passe directement depuis cet espace securise.
                    </p>
                  </div>
                </div>

                {securityNotice ? (
                  <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                      securityNotice.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                    }`}
                  >
                    {securityNotice.message}
                  </div>
                ) : null}

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="newPassword"
                        className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                      >
                        Nouveau mot de passe
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Minimum 8 caracteres"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        disabled={securitySending}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                      >
                        Confirmer le mot de passe
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Retapez le mot de passe"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        disabled={securitySending}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={securitySending}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {securitySending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Mise a jour en cours...
                      </>
                    ) : (
                      'Mettre a jour la securite'
                    )}
                  </button>
                </form>
              </section>
            ) : null}

            {activeTab === 'notifications' ? (
              <section className="rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 md:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Notifications
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Choisissez les alertes que vous souhaitez recevoir.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SettingsSwitch
                    checked={settings.notify_new_message}
                    onToggle={() => void onToggleNotification('notify_new_message')}
                    disabled={settingsLoading || settingsSaving}
                    label="Recevoir un email pour chaque nouveau message"
                    description="Vous etes alerte quand un client vous ecrit."
                  />
                  <SettingsSwitch
                    checked={settings.notify_weekly_report}
                    onToggle={() => void onToggleNotification('notify_weekly_report')}
                    disabled={settingsLoading || settingsSaving}
                    label="Recevoir le rapport de performance hebdomadaire"
                    description="Un resume de vos vues, interactions et conversations."
                  />
                </div>
              </section>
            ) : null}

            {activeTab === 'privacy' ? (
              <section className="rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 md:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Confidentialite et presence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Definissez votre disponibilite et votre message d&apos;absence.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={settings.disable_whatsapp_access}
                      onChange={() => void onToggleWhatsappAccess()}
                      disabled={settingsLoading || settingsSaving}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-2 focus:ring-green-700/30 dark:border-slate-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100">
                        Desactiver l&apos;acces WhatsApp
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
                        Les clients ne verront plus votre moyen de contact WhatsApp public.
                      </span>
                    </span>
                  </label>

                  <div>
                    <label
                      htmlFor="availabilityStatus"
                      className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                    >
                      Etat
                    </label>
                    <select
                      id="availabilityStatus"
                      value={settings.availability_status}
                      onChange={(event) =>
                        void onAvailabilityChange(
                          event.target.value === 'offline' ? 'offline' : 'online',
                        )
                      }
                      disabled={settingsLoading || settingsSaving}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="online">En ligne</option>
                      <option value="offline">Hors ligne</option>
                    </select>
                  </div>

                  <form onSubmit={saveAwayMessage} className="space-y-2">
                    <label
                      htmlFor="awayMessage"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                    >
                      Message d&apos;absence automatique
                    </label>
                    <textarea
                      id="awayMessage"
                      rows={4}
                      maxLength={320}
                      value={settings.away_message}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, away_message: event.target.value }))
                      }
                      placeholder="Ex: Nous sommes indisponibles pour le moment. Nous repondrons sous 24h."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                      disabled={settingsLoading || settingsSaving}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-slate-400">{awayLength}/320</p>
                      <button
                        type="submit"
                        disabled={settingsLoading || settingsSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {settingsSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer'
                        )}
                      </button>
                    </div>
                  </form>

                  {settings.availability_status === 'offline' ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                      Votre statut est hors ligne. Le message d&apos;absence sera utilise pour
                      informer vos clients.
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
