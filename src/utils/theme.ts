import { useCallback, useEffect, useState } from 'react';

/**
 * Manajemen tema: 2 mode (Terang & Gelap).
 * - Default otomatis mengikuti preferensi sistem perangkat (prefers-color-scheme).
 * - Pilihan manual pengguna disimpan di localStorage ('psdm-theme').
 * - Class `dark` dipasang pada <html>; script inline di index.html
 *   menerapkannya sebelum first paint untuk mencegah FOUC.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'psdm-theme';

const getSystemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    /* localStorage tidak dapat diakses */
  }
  return getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage tidak dapat diakses */
  }
  applyTheme(theme);
}

/** Hook untuk toggle 2 mode: terang <-> gelap */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Sinkronkan class DOM saat mount
    applyTheme(theme);

    // Jika pengguna belum pernah memilih tema manual, sinkronkan otomatis jika preferensi OS berubah
    let hasSavedPreference = false;
    try {
      hasSavedPreference = Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      hasSavedPreference = false;
    }

    if (!hasSavedPreference && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const nextTheme = e.matches ? 'dark' : 'light';
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      };
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      return next;
    });
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}
