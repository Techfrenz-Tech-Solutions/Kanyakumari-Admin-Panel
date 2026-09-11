import { createContext, useContext, useEffect, useState } from 'react';

// Accent themes: 'red' | 'gold' | 'ink'
// Color mode:   'light' | 'dark'

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode]     = useState(() => localStorage.getItem('dw_mode')   || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('dw_accent') || 'gold');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('dw_mode',   mode);
    localStorage.setItem('dw_accent', accent);
  }, [mode, accent]);

  const toggleMode   = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  const switchAccent = (a) => setAccent(a);

  // legacy alias so existing code using `theme` / `toggleTheme` still works
  return (
    <ThemeContext.Provider value={{ theme: mode, toggleTheme: toggleMode, mode, toggleMode, accent, switchAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
