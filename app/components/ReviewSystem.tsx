'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

type Review = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer_name: string | null;
    reviewer_email: string | null;
    reviewer_phone: string | null;
    profiles: { full_name: string | null } | null;
};

type ReviewRow = Omit<Review, 'profiles'> & {
    profiles: { full_name: string | null }[] | null;
};

type ReviewSystemProps = {
    companyId: string;
};

function StarRating({
    value,
    onChange,
    readOnly = false,
    size = 'md',
}: {
    value: number;
    onChange?: (v: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}) {
    const [hovered, setHovered] = useState(0);
    const sizeClass = size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-sm sm:text-base' : 'text-lg sm:text-xl';

    return (
        <div className={`flex gap-0.5 ${sizeClass}`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (readOnly ? value : hovered || value);
                return (
                    <button
                        key={star}
                        type={readOnly ? 'button' : 'button'}
                        disabled={readOnly}
                        className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${filled ? 'text-amber-400' : 'text-gray-300'}`}
                        onMouseEnter={() => !readOnly && setHovered(star)}
                        onMouseLeave={() => !readOnly && setHovered(0)}
                        onClick={() => !readOnly && onChange?.(star)}
                        aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

export default function ReviewSystem({ companyId }: ReviewSystemProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    const normalizeReviews = (rows: ReviewRow[]): Review[] => {
        return rows.map((row) => ({
            ...row,
            profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
        }));
    };

    const loadReviews = useCallback(async () => {
        const { data } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, reviewer_name, reviewer_email, reviewer_phone, profiles(full_name)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (data) {
            setReviews(normalizeReviews(data as ReviewRow[]));
        }
    }, [companyId]);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);

            if (user) {
                const profileResult = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .maybeSingle();

                const profileName = profileResult.data?.full_name?.trim() ?? '';
                const profileEmail = profileResult.data?.email?.trim() ?? user.email?.trim() ?? '';
                const metadataPhone = typeof user.user_metadata?.phone === 'string'
                    ? user.user_metadata.phone.trim()
                    : '';

                setFullName(profileName);
                setEmail(profileEmail);
                setPhone(metadataPhone);

                const has = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('company_id', companyId)
                    .eq('user_id', user.id)
                    .maybeSingle();
                setAlreadyReviewed(!!has.data);
            } else {
                setAlreadyReviewed(false);
            }

            await loadReviews();
            setLoading(false);
        }
        load();
    }, [companyId, loadReviews]);

    const average =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) { setError('Veuillez sélectionner une note.'); return; }
        const trimmedComment = comment.trim();
        const trimmedFullName = fullName.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        if (!trimmedComment) {
            setError('Veuillez saisir votre message.');
            return;
        }

        if (!userId) {
            if (!trimmedFullName) {
                setError('Veuillez renseigner votre nom complet.');
                return;
            }

            if (!trimmedEmail && !trimmedPhone) {
                setError('Veuillez renseigner un email ou un numero de telephone.');
                return;
            }

            if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                setError('Veuillez renseigner un email valide.');
                return;
            }
        }

        setSubmitting(true);
        setError(null);

        const { error: insertError } = await supabase.from('reviews').insert({
            company_id: companyId,
            user_id: userId,
            rating,
            comment: trimmedComment,
            reviewer_name: userId ? (trimmedFullName || 'Utilisateur Woralink') : trimmedFullName,
            reviewer_email: trimmedEmail || null,
            reviewer_phone: trimmedPhone || null,
        });

        if (insertError) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } else {
            setSuccess(true);
            if (userId) {
                setAlreadyReviewed(true);
            } else {
                setFullName('');
                setEmail('');
                setPhone('');
            }
            await loadReviews();
        }
        setSubmitting(false);
    }

    if (loading) {
        return (
            <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
                Chargement des avis…
            </div>
        );
    }

    return (
        <section className="space-y-6">

            {/* Average */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-amber-500 leading-none">
                        {reviews.length > 0 ? average.toFixed(1) : '—'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        {reviews.length} avis
                    </span>
                </div>
                <div className="flex flex-col items-center sm:items-start gap-2">
                    <StarRating value={Math.round(average)} readOnly size="lg" />
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-400 justify-center sm:justify-start">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter((r) => r.rating === star).length;
                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-1">
                                    <span>{star}★</span>
                                    <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Form */}
            {!alreadyReviewed && !success && (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Laisser un avis</h3>
                    {userId ? (
                        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs sm:text-sm text-blue-700">
                            Connecte en tant que <strong>{fullName || email || 'Utilisateur Woralink'}</strong>. Vos informations seront ajoutees automatiquement.
                        </p>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Nom complet *</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    maxLength={120}
                                    placeholder="Votre nom complet"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        maxLength={160}
                                        placeholder="vous@email.com"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Numero de telephone</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        maxLength={30}
                                        placeholder="Ex: 622 00 00 00"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500">Au moins un contact est requis: email ou numero de telephone.</p>
                        </>
                    )}
                    <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Note *</label>
                        <StarRating value={rating} onChange={setRating} size="lg" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Message *</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Partagez votre experience..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                            required
                        />
                        <p className="text-right text-[10px] sm:text-xs text-gray-400">{comment.length}/500</p>
                    </div>
                    {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md bg-primary px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {submitting ? 'Envoi…' : 'Publier mon avis'}
                    </button>
                </form>
            )}

            {userId && alreadyReviewed && (
                <p className="text-xs sm:text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 sm:px-4 py-2">
                    ✓ Vous avez déjà publié un avis pour cette entreprise.
                </p>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-400 text-center py-4">
                    Aucun avis pour le moment. Soyez le premier !
                </p>
            ) : (
                <ul className="space-y-3">
                    {reviews.map((r) => (
                        <li key={r.id} className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-medium text-xs sm:text-sm text-gray-800">
                                    {r.reviewer_name?.trim() || r.profiles?.full_name || 'Utilisateur anonyme'}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-400">
                                    {new Date(r.created_at).toLocaleDateString('fr-GN', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <StarRating value={r.rating} readOnly size="sm" />
                            {r.comment && (
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
