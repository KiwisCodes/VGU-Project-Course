'use client';

import React from 'react';
import { Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t py-12 text-xs" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Col: Course Info */}
        <div className="flex flex-col gap-2">
          <span className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
            Vietnamese-German University (VGU)
          </span>
          <p style={{ color: 'var(--text-muted)' }} className="leading-relaxed">
            Department of Computer Science • Winter Semester 2026-2027<br />
            Course: Project (10 ECTS, 4 weekly hours) • Dr. Tran Duc Khanh
          </p>
        </div>

        {/* Right Col: Contacts */}
        <div className="flex flex-col gap-2 md:items-end">
          <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
            Faculty & Teaching Support
          </span>
          <div className="flex flex-col gap-1.5 md:items-end" style={{ color: 'var(--text-muted)' }}>
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

      </div>
    </footer>
  );
};
