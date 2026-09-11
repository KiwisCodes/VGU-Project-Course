'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  FileText, 
  Download, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, setTheme, exportData } = useProject();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/members', label: 'Team', icon: Users },
    { href: '/lectures', label: 'Lectures', icon: BookOpen },
    { href: '/materials', label: 'Materials & Slides', icon: FileText },
  ];

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-md" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-sm sm:text-base" style={{ color: 'var(--text-main)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-sm" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
              VGU
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
                CS Project 10 ECTS
              </span>
              <span className="leading-tight font-extrabold text-xs sm:text-sm">
                Small Multimodal Models
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-blue-soft)' : 'transparent',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)'
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Segmented Theme Toggle & Export */}
        <div className="flex items-center gap-2.5">
          
          <button
            onClick={exportData}
            title="Download JSON Backup"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
            style={{ 
              borderColor: 'var(--border-subtle)', 
              backgroundColor: 'var(--bg-surface)', 
              color: 'var(--text-muted)' 
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {/* Segmented Theme Switcher */}
          <div 
            className="flex items-center rounded-full p-0.5 border text-xs font-bold"
            style={{ 
              borderColor: 'var(--border-strong)', 
              backgroundColor: 'var(--bg-surface-elevated)' 
            }}
          >
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                theme === 'light' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
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
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                theme === 'dark' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
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

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t overflow-x-auto text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded font-bold"
              style={{
                color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)'
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
