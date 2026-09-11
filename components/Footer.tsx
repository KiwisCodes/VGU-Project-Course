'use client';

import React, { useRef } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Download, Upload, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  const { exportData, importData } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importData(content);
        if (ok) {
          alert('Project data imported successfully!');
        } else {
          alert('Invalid project backup format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <footer className="mt-20 border-t py-12 text-xs" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Col: Course Info */}
        <div className="flex flex-col gap-2">
          <span className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
            Vietnamese-German University (VGU)
          </span>
          <p style={{ color: 'var(--text-muted)' }} className="leading-relaxed">
            Department of Computer Science • Winter Semester 2026-2027<br />
            Course: Project (10 ECTS, 4 weekly hours) • Dr. Tran Duc Khanh
          </p>
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Design System: Taste Anti-Slop (No Em-Dashes, Bento Grids)
          </span>
        </div>

        {/* Center Col: Contacts */}
        <div className="flex flex-col gap-2">
          <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
            Faculty & Teaching Support
          </span>
          <div className="flex flex-col gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: 'var(--text-main)' }}>Dr. Tran Duc Khanh:</span>
              <a href="mailto:khanh.td@vgu.edu.vn" className="hover:underline flex items-center gap-1">
                <Mail className="w-3 h-3" /> khanh.td@vgu.edu.vn
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: 'var(--text-main)' }}>Mr. Le Viet Tin (TA):</span>
              <a href="mailto:10422078@student.vgu.edu.vn" className="hover:underline flex items-center gap-1">
                <Mail className="w-3 h-3" /> 10422078@student.vgu.edu.vn
              </a>
            </div>
          </div>
        </div>

        {/* Right Col: Data Backup */}
        <div className="flex flex-col gap-2.5">
          <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
            Team Data Persistence
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold hover:opacity-80 transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold hover:opacity-80 transition-all cursor-pointer"
              style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>

      </div>
    </footer>
  );
};
