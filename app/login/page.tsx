'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, user, profile, isConfigured, errorMessage, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      const { error } = await signInWithGoogle();
      if (error) {
        alert(error.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize Google login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Subtle accent backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* VGU Department Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            VGU Computer Science - Year 4 (2026-2027)
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Project Hub Login
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Small Multimodal Models for Clinical Diagnosis
          </p>

          {/* Error display */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-left">
              <div className="flex items-start gap-2.5">
                <span className="text-red-600 dark:text-red-400 text-sm mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">Access Denied</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{errorMessage}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] hover:bg-slate-50 dark:hover:bg-[#181820] text-slate-800 dark:text-slate-100 font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {submitting ? 'Connecting...' : 'Sign in with Google'}
          </button>

          {/* VGU Domain Notice */}
          <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-[#121217] border border-slate-200/80 dark:border-slate-800/80 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Institutional Access Policy
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Login is restricted to official Vietnamese-German University student accounts ending with <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">@student.vgu.edu.vn</code>.
            </p>
          </div>

          {!isConfigured && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                ⚠️ Supabase environment variables not detected.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Continue in Local / Demo Mode →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
