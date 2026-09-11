'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, isConfigured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPath = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (!loading && !user && !isPublicPath && isConfigured) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, isPublicPath, isConfigured, pathname, router]);

  // Public paths (like Dashboard /) are always rendered
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If loading authentication state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Checking access permissions...
        </p>
      </div>
    );
  }

  // If unauthenticated on a protected path, show access barrier
  if (!user && isConfigured) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Course tasks, team portals, lecture dossiers, and project files are restricted to registered team members. Anonymous guests can view the course Dashboard only.
          </p>

          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Continue</span>
          </Link>

          <div className="mt-4">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              &larr; Back to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
