import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Spanbix is a premium light-mode-first brand (cream + navy). The full Mavro
// Console remains dark-first (Cyber Editorial). We pick the default by
// build target so each property gets the visual identity its brand intends —
// before the React tree renders, before any flash.
const DEFAULT_DARK = import.meta.env.VITE_BUILD_TARGET !== 'spanbix';

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
