'use client';

import React from 'react';
import { FileText, X } from 'lucide-react';

interface BookTextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bookText: string;
}

export const BookTextDrawer: React.FC<BookTextDrawerProps> = ({
  isOpen,
  onClose,
  title,
  bookText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end transition-opacity duration-base font-ui">
      <div className="w-full max-w-xl bg-charcoal border-l border-rule h-full flex flex-col shadow-card">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-obsidian shrink-0">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-oxide" />
            <div>
              <h3 className="font-display font-bold text-base text-paper leading-tight">{title}</h3>
              <span className="text-[11px] text-muted font-mono">{bookText.length} characters</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-paper bg-charcoal hover:bg-sunken border border-rule rounded-sm transition duration-fast cursor-pointer"
            aria-label="Close manuscript drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content (Independent Scrollable Container) */}
        <div className="flex-1 p-6 overflow-y-auto font-body text-sm text-paper leading-relaxed whitespace-pre-wrap select-text book-measure mx-auto">
          {bookText}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-rule bg-obsidian flex justify-between items-center text-xs text-muted font-ui shrink-0">
          <span>Source Manuscript Text</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-obsidian hover:bg-charcoal text-paper border border-rule rounded-sm font-semibold uppercase tracking-wider text-[11px] transition duration-fast cursor-pointer"
          >
            Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
