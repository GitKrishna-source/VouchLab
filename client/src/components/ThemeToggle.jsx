import React from 'react';
import { useTheme, THEMES } from '../context/ThemeContext.jsx';
import { Sun, Moon, Sparkles } from 'lucide-react';

export function ThemeToggle({ showLabels = false, compact = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 backdrop-blur-md transition-all ${compact ? 'scale-90' : ''}`}>
      <button
        type="button"
        onClick={() => setTheme(THEMES.LIGHT)}
        title="Light Theme (Modern Clean)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
          theme === THEMES.LIGHT
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        {showLabels && <span>Light</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme(THEMES.DARK)}
        title="Dark Theme (Stealth Charcoal)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
          theme === THEMES.DARK
            ? 'bg-slate-900 text-indigo-400 shadow-sm border border-slate-700'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabels && <span>Dark</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme(THEMES.PURPLE)}
        title="Cyber Purple Theme (Neon Violet)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
          theme === THEMES.PURPLE
            ? 'bg-purple-900 text-purple-200 shadow-sm border border-purple-500/50 glow-purple'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        {showLabels && <span>Purple</span>}
      </button>
    </div>
  );
}
