'use client';

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isEditable) return;

      const shortcut = shortcuts.find(s => {
        const keyMatches = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatches = !s.ctrl || e.ctrlKey || e.metaKey;
        const shiftMatches = !s.shift || e.shiftKey;
        const altMatches = !s.alt || e.altKey;
        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
