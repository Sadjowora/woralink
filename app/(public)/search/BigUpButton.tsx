'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

type BigUpButtonProps = {
  companyId: string;
  initialCount?: number | null;
};

type IncrementBigUpResponse = {
  bigup?: number;
  voted?: boolean;
  created_vote?: boolean;
};

function extractBigUpResponse(payload: unknown): IncrementBigUpResponse | null {
  if (!payload || typeof payload !== 'object') {
    if (Array.isArray(payload) && payload.length > 0) {
      return extractBigUpResponse(payload[0]);
    }
    return null;
  }

  return payload as IncrementBigUpResponse;
}

export default function BigUpButton({ companyId, initialCount = 0 }: BigUpButtonProps) {
  const [count, setCount] = useState(Math.max(0, Number(initialCount ?? 0) || 0));
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [notice, setNotice] = useState('');
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncVoteState = async (userId?: string | null) => {
      const nextUserId = userId ?? null;

      if (!nextUserId) {
        if (!mounted) return;
        setIsAuthenticated(false);
        setHasVoted(false);
        return;
      }

      const { data } = await supabase
        .from('company_votes')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', nextUserId)
        .maybeSingle();

      if (!mounted) return;
      setIsAuthenticated(true);
      setHasVoted(Boolean(data));
    };

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      void syncVoteState(user?.id ?? null);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncVoteState(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [companyId]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice('');
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  const handleBigUp = async () => {
    if (loading || hasVoted) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAuthenticated(false);
      setNotice('Connectez-vous via Google, Facebook ou LinkedIn pour envoyer un BigUp.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('increment_bigup', {
        p_company_id: companyId,
      });

      if (error) throw error;

      const next = extractBigUpResponse(data);
      if (typeof next?.bigup === 'number') {
        setCount(Math.max(0, next.bigup));
      }
      setHasVoted(Boolean(next?.voted));
      setIsAuthenticated(true);
      setIsPopping(Boolean(next?.created_vote));
    } catch (err) {
      const details = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('BigUp error:', err);
      setNotice(`Impossible d'envoyer votre BigUp: ${details}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 pt-0.5">
      <motion.button
        type="button"
        onClick={handleBigUp}
        disabled={loading || hasVoted}
        whileTap={{ scale: hasVoted ? 1 : 0.98 }}
        animate={isPopping ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onAnimationComplete={() => setIsPopping(false)}
        className={`flex min-w-14 flex-row items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium leading-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-80 ${
          hasVoted
            ? 'border-green-700 bg-green-700 text-white hover:border-green-800 hover:bg-green-800'
            : 'border-gray-300 bg-white text-gray-700 hover:border-green-700 hover:bg-green-50 hover:text-green-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-green-700 dark:hover:bg-slate-800 dark:hover:text-green-400'
        }`}
        aria-label="Bravo"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          👏
        </span>
        <motion.span
          key={count}
          initial={{ scale: 0.95, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className={`text-base font-semibold ${hasVoted ? 'text-white' : 'text-gray-900 dark:text-white'}`}
        >
          {count}
        </motion.span>
      </motion.button>

      {notice ? (
        <div className="max-w-64 rounded-lg border border-gray-200 bg-white p-2 text-right text-[11px] leading-relaxed text-gray-600 shadow-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:shadow-none">
          <p>{notice}</p>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="mt-1 inline-flex text-xs font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
            >
              Se connecter
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
