import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Mavro Console is dark-first (Cyber Editorial). Spanbix moved off this
// bundle in Phase 6 — it owns its own light-mode design system inside the
// standalone `spanbix-web/` Next.js app and doesn't share ThemeContext with
// the admin. So the only consumer left is the admin shell.
const DEFAULT_DARK = true;

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('mavro_theme');
      if (saved) return saved === 'dark';
    } catch {
      // localStorage unavailable (private mode, embedded contexts) — fall through.
    }
    return DEFAULT_DARK;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mavro_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
