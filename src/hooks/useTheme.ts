import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'ds-theme';

/**
 * Theme state synced to <html data-theme>. The initial attribute is set by a
 * tiny inline script in index.html (no-flash), so we read it from the DOM.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
