'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const TEAM_MEMBERS = [
  { name: 'Le Quang Minh Khoa', email: '10423057@student.vgu.edu.vn', role: 'Team Leader & ML Architect' },
  { name: 'Nguyen Vo Minh Khoi', email: '10423063@student.vgu.edu.vn', role: 'Clinical Data & Pipeline Engineer' },
  { name: 'Nguyen Duc Khang', email: '10423054@student.vgu.edu.vn', role: 'Vision-Language & PEFT Engineer' },
  { name: 'Phan Thanh Hung', email: '10423051@student.vgu.edu.vn', role: 'RAG & Medical Knowledge Graph Specialist' },
  { name: 'Duong Quy Trang', email: '10423110@student.vgu.edu.vn', role: 'Multi-Agent & Clinical Evaluation Engineer' },
];

export default function LoginPage() {
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithEmail,
    user,
    isConfigured,
    errorMessage,
    clearError
  } = useAuth();

  const [authTab, setAuthTab] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
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
      setFormError(null);
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message.includes('not enabled')) {
          setFormError('Google sign-in is not enabled yet in your Supabase dashboard. Please enable it under Authentication -> Providers -> Google, or use the Email & Password tab below.');
        } else {
          setFormError(error.message);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to initialize Google login');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setInfoMessage(null);

    if (emailMode === 'signin') {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setFormError(error.message);
      } else {
        router.push('/');
      }
    } else {
      const { error } = await signUpWithEmail(email, password, fullName);
      if (error) {
        setFormError(error.message);
      } else {
        setInfoMessage('Account created successfully! You can now sign in.');
        setEmailMode('signin');
      }
    }
    setSubmitting(false);
  };

  const handleSelectTeamMember = (memberEmail: string, memberName: string) => {
    setEmail(memberEmail);
    setFullName(memberName);
    setAuthTab('email');
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

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
            Project Hub Login
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
            Small Multimodal Models for Clinical Diagnosis
          </p>

          {/* Tab Switcher: Google vs Email */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#14141a] rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('google');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authTab === 'google'
                  ? 'bg-white dark:bg-[#1e1e26] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Google OAuth
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('email');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authTab === 'email'
                  ? 'bg-white dark:bg-[#1e1e26] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              VGU Email
            </button>
          </div>

          {/* Error display */}
          {(errorMessage || formError) && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-left">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">Notice</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
                    {errorMessage || formError}
                  </p>
                </div>
                <button
                  onClick={() => {
                    clearError();
                    setFormError(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Info display */}
          {infoMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {infoMessage}
            </div>
          )}

          {/* TAB 1: GOOGLE SIGN IN */}
          {authTab === 'google' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] hover:bg-slate-50 dark:hover:bg-[#181820] text-slate-800 dark:text-slate-100 font-semibold text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Requires enabling Google provider in your Supabase Dashboard.
              </p>
            </div>
          )}

          {/* TAB 2: VGU EMAIL + PASSWORD */}
          {authTab === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3.5 text-left">
              {emailMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Le Quang Minh Khoa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  VGU Student Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="10423057@student.vgu.edu.vn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Authenticating...' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                    setFormError(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  {emailMode === 'signin' ? 'First time? Create password for your VGU email' : 'Already have a password? Sign in'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Member Selection for Instant Setup */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-left">
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
              Seeded Team Members (Click to select):
            </p>
            <div className="space-y-1.5">
              {TEAM_MEMBERS.map((m) => (
                <button
                  type="button"
                  key={m.email}
                  onClick={() => handleSelectTeamMember(m.email, m.name)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {m.name}
                  </span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 ml-2 shrink-0">
                    {m.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* VGU Domain Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-[#121217] border border-slate-200/80 dark:border-slate-800/80 text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Institutional Policy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Login is restricted to official student accounts ending with <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">@student.vgu.edu.vn</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
