import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  PURPLE: 'purple'
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vouchlab_theme') || THEMES.LIGHT;
  });

  useEffect(() => {
    localStorage.setItem('vouchlab_theme', theme);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-purple', 'dark');

    if (theme === THEMES.DARK) {
      root.classList.add('theme-dark', 'dark');
    } else if (theme === THEMES.PURPLE) {
      root.classList.add('theme-purple', 'dark');
    } else {
      root.classList.add('theme-light');
    }
  }, [theme]);

  const toggleTheme = (nextTheme) => {
    if (nextTheme) {
      setTheme(nextTheme);
    } else {
      // Cycle: light -> dark -> purple -> light
      setTheme(prev => {
        if (prev === THEMES.LIGHT) return THEMES.DARK;
        if (prev === THEMES.DARK) return THEMES.PURPLE;
        return THEMES.LIGHT;
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
