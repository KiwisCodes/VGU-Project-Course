'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  FileText, 
  Download, 
  Sun, 
  Moon,
  User as UserIcon,
  LogOut,
  Settings,
  LogIn,
  Lock
} from 'lucide-react';
import { VguIcon } from '@/components/VguLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, setTheme, exportData, syncStatus, isSupabase } = useProject();
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/members', label: 'Team', icon: Users },
    { href: '/lectures', label: 'Lectures', icon: BookOpen },
    { href: '/materials', label: 'Materials & Slides', icon: FileText },
  ];

  const userDisplayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const userInitials = profile?.initials || userDisplayName.slice(0, 2).toUpperCase();
  const avatarBg = profile?.avatar_bg || '#2563eb';

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-md" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand: VGU Icon & Project Course */}
        <div className="flex items-center gap-7">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-transform active:scale-[0.99]"
            title="Vietnamese-German University - Project Course"
          >
            <VguIcon 
              size={36} 
              className="border border-orange-500/25 bg-orange-500/10 group-hover:border-orange-500/40 group-hover:scale-105 transition-all shadow-xs" 
            />
            <span 
              className="font-extrabold text-sm sm:text-[15px] tracking-tight leading-none group-hover:opacity-90 transition-opacity" 
              style={{ color: 'var(--text-main)' }}
            >
              Project Course
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const isLocked = !user && link.href !== '/';
              const targetHref = isLocked ? `/login?redirect=${encodeURIComponent(link.href)}` : link.href;
              return (
                <Link
                  key={link.href}
                  href={targetHref}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'font-bold shadow-xs'
                      : 'font-semibold hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-blue-soft)' : 'transparent',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)'
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                  {isLocked && <Lock className="w-2.5 h-2.5 opacity-50 ml-0.5" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Sync indicator, Theme, and User / Login */}
        <div className="flex items-center gap-2.5">
          
          {/* Supabase Sync Status Indicator */}
          {isSupabase && (
            <div
              className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[10px] font-semibold border shadow-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-elevated)',
                color: 'var(--text-muted)'
              }}
              title={syncStatus === 'synced' ? 'Live Supabase real-time sync active' : 'Syncing data...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                    : syncStatus === 'syncing'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span className="uppercase tracking-wider text-[9px] font-mono">
                {syncStatus === 'synced' ? 'Live Sync' : syncStatus === 'syncing' ? 'Syncing' : 'Offline'}
              </span>
            </div>
          )}

          {/* Segmented Theme Switcher */}
          <div 
            className="flex items-center h-8 rounded-full p-0.5 border text-xs font-semibold shadow-xs"
            style={{ 
              borderColor: 'var(--border-strong)', 
              backgroundColor: 'var(--bg-surface-elevated)' 
            }}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-full transition-all text-[11px] cursor-pointer ${
                theme === 'light' ? 'shadow-xs font-bold' : 'opacity-60 hover:opacity-100 font-medium'
              }`}
              style={{
                backgroundColor: theme === 'light' ? 'var(--bg-surface)' : 'transparent',
                color: theme === 'light' ? 'var(--accent-blue)' : 'var(--text-muted)',
              }}
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-full transition-all text-[11px] cursor-pointer ${
                theme === 'dark' ? 'shadow-xs font-bold' : 'opacity-60 hover:opacity-100 font-medium'
              }`}
              style={{
                backgroundColor: theme === 'dark' ? '#1c1c24' : 'transparent',
                color: theme === 'dark' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <Moon className="w-3 h-3" />
              <span>Pitch Black</span>
            </button>
          </div>

          {/* Quick Backup Action */}
          <button
            type="button"
            onClick={exportData}
            title="Download JSON backup of all team project data"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold hover:border-blue-500/40 hover:bg-[var(--bg-surface)] transition-all cursor-pointer shadow-xs"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)',
            }}
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Backup</span>
          </button>

          {/* User Profile or Sign In Button */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-full border transition-all hover:shadow-xs cursor-pointer"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shrink-0 shadow-xs"
                  style={{ backgroundColor: avatarBg }}
                >
                  {userInitials}
                </div>
                <span className="text-xs font-bold hidden sm:inline" style={{ color: 'var(--text-main)' }}>
                  {profile?.name ? profile.name.split(/\s+/).slice(-1)[0] : userDisplayName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-xl py-2 z-50 overflow-hidden"
                  style={{
                    borderColor: 'var(--border-strong)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  {/* User info banner */}
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                      {userDisplayName}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                    {profile?.role && (
                      <p className="text-[10px] mt-1 font-semibold text-blue-600 dark:text-blue-400 truncate">
                        {profile.role}
                      </p>
                    )}
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                      style={{ color: 'var(--text-main)' }}
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Profile Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        exportData();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                      style={{ color: 'var(--text-main)' }}
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export JSON Backup</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        signOut();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t overflow-x-auto text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          const isLocked = !user && link.href !== '/';
          const targetHref = isLocked ? `/login?redirect=${encodeURIComponent(link.href)}` : link.href;
          return (
            <Link
              key={link.href}
              href={targetHref}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded font-bold"
              style={{
                color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)'
              }}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 text-slate-400 absolute -top-1 -right-1.5 opacity-70" />
                )}
              </div>
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
