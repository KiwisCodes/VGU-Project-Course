'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, TEAM_SECRET_KEY } from '@/context/AuthContext';
import { KeyRound, Lock, User, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'Le Quang Minh Khoa', email: '10423057@student.vgu.edu.vn', role: 'Team Leader & ML Architect' },
  { name: 'Nguyen Vo Minh Khoi', email: '10423063@student.vgu.edu.vn', role: 'Clinical Data & Pipeline Engineer' },
  { name: 'Nguyen Duc Khang', email: '10423054@student.vgu.edu.vn', role: 'Vision-Language & PEFT Engineer' },
  { name: 'Phan Thanh Hung', email: '10423051@student.vgu.edu.vn', role: 'RAG & Medical Knowledge Graph Specialist' },
  { name: 'Duong Quy Trang', email: '10423110@student.vgu.edu.vn', role: 'Multi-Agent & Clinical Evaluation Engineer' },
];

function LoginFormContent() {
  const {
    signInWithPassword,
    signUpWithEmail,
    user,
    isConfigured,
    errorMessage,
    clearError
  } = useAuth();

  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTarget = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.push(redirectTarget);
    }
  }, [user, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessInfo(null);

    if (mode === 'signin') {
      const { error } = await signInWithPassword(usernameOrEmail, password);
      if (error) {
        setFormError(error.message);
      } else {
        router.push(redirectTarget);
      }
    } else {
      // Registration requires secret key
      if (!secretKey.trim()) {
        setFormError('Please enter the 6-digit course registration secret key.');
        setSubmitting(false);
        return;
      }
      if (secretKey.trim() !== TEAM_SECRET_KEY) {
        setFormError('Invalid secret key. Please obtain the 6-digit registration key from your team leader.');
        setSubmitting(false);
        return;
      }

      const { error } = await signUpWithEmail(usernameOrEmail, password, fullName, secretKey);
      if (error) {
        setFormError(error.message);
      } else {
        setSuccessInfo('Registration successful! Profile linked. You are now logged in.');
        router.push(redirectTarget);
      }
    }
    setSubmitting(false);
  };

  const handleSelectMember = (memberEmail: string, memberName: string) => {
    setUsernameOrEmail(memberEmail);
    setFullName(memberName);
    setFormError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-7 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Accent Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* VGU Department Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            VGU Computer Science - Year 4 (2026-2027)
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
            Project Hub Login
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Small Multimodal Models for Clinical Diagnosis
          </p>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#14141a] rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#1e1e26] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1e1e26] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Register (First Time)
            </button>
          </div>

          {/* Error Message */}
          {(errorMessage || formError) && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-left">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">Access Denied</p>
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

          {/* Success Message */}
          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
            {mode === 'register' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Le Quang Minh Khoa"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                VGU Student Email or ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="10423057 or 10423057@student.vgu.edu.vn"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tip: You can just type your Student ID. Domain is auto-appended.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121217] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <label className="block font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Team Secret Key (Verification)</span>
                </label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter 6-digit registration key"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#121217] text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block">
                  Private registration key provided directly by your team leader.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Verifying...' : mode === 'signin' ? 'Sign In to Hub' : 'Verify Key & Register'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Member Selection for Instant Fill */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-left">
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Quick Select Team Member (Auto-fill):
            </p>
            <div className="space-y-1">
              {TEAM_MEMBERS.map((m) => (
                <button
                  type="button"
                  key={m.email}
                  onClick={() => handleSelectMember(m.email, m.name)}
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

          {/* Public Access Note */}
          <div className="mt-4 pt-3 text-center border-t border-slate-100 dark:border-slate-900">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              &larr; Return to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
