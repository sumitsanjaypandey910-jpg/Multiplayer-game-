import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeColors, AppSettings, PieceStyle, BoardStyle, GlobalStats, GameId } from '../types/game';
import { sound } from '../utils/audio';

export const THEME_PRESETS: Record<ThemeId, ThemeColors> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian & Cyan',
    bgMain: '#080b11',
    bgSurface: '#0f172a',
    bgSubtle: '#1e293b',
    borderColor: '#334155',
    p1Color: '#06b6d4',
    p1Name: 'Player 1 (Cyan)',
    p2Color: '#f43f5e',
    p2Name: 'Player 2 (Rose)',
    boardDark: '#0b1329',
    boardLight: '#1e293b',
    accentGlow: 'rgba(6, 182, 212, 0.25)',
  },
  royal: {
    id: 'royal',
    name: 'Onyx & Royal Gold',
    bgMain: '#0a0a0d',
    bgSurface: '#14141c',
    bgSubtle: '#22222e',
    borderColor: '#38384a',
    p1Color: '#eab308',
    p1Name: 'Player 1 (Gold)',
    p2Color: '#a855f7',
    p2Name: 'Player 2 (Amethyst)',
    boardDark: '#12121c',
    boardLight: '#262638',
    accentGlow: 'rgba(234, 179, 8, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Midnight Emerald',
    bgMain: '#05110d',
    bgSurface: '#0c221a',
    bgSubtle: '#15382b',
    borderColor: '#1f4d3c',
    p1Color: '#10b981',
    p1Name: 'Player 1 (Emerald)',
    p2Color: '#f59e0b',
    p2Name: 'Player 2 (Amber)',
    boardDark: '#0a1d16',
    boardLight: '#183f31',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
  },
  sunset: {
    id: 'sunset',
    name: 'Carbon & Tangerine',
    bgMain: '#0d0d12',
    bgSurface: '#171722',
    bgSubtle: '#252536',
    borderColor: '#3c3c52',
    p1Color: '#f97316',
    p1Name: 'Player 1 (Orange)',
    p2Color: '#8b5cf6',
    p2Name: 'Player 2 (Violet)',
    boardDark: '#141420',
    boardLight: '#2b2b3f',
    accentGlow: 'rgba(249, 115, 22, 0.25)',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Titanium Minimal',
    bgMain: '#050505',
    bgSurface: '#121214',
    bgSubtle: '#202024',
    borderColor: '#38383e',
    p1Color: '#f8fafc',
    p1Name: 'Player 1 (White)',
    p2Color: '#94a3b8',
    p2Name: 'Player 2 (Slate)',
    boardDark: '#0e0e11',
    boardLight: '#27272f',
    accentGlow: 'rgba(248, 250, 252, 0.15)',
  },
  custom: {
    id: 'custom',
    name: 'Custom Studio',
    bgMain: '#090d16',
    bgSurface: '#0f172a',
    bgSubtle: '#1e293b',
    borderColor: '#334155',
    p1Color: '#00f2fe',
    p1Name: 'Player 1',
    p2Color: '#fe0979',
    p2Name: 'Player 2',
    boardDark: '#0c1427',
    boardLight: '#1d2a45',
    accentGlow: 'rgba(0, 242, 254, 0.25)',
  },
};

const DEFAULT_STATS: GlobalStats = {
  totalMatches: 0,
  perGame: {
    chess: { p1Wins: 0, p2Wins: 0, draws: 0 },
    checkers: { p1Wins: 0, p2Wins: 0, draws: 0 },
    cyberpong: { p1Wins: 0, p2Wins: 0, draws: 0 },
    lasertanks: { p1Wins: 0, p2Wins: 0, draws: 0 },
    connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
  },
};

interface ThemeContextType {
  settings: AppSettings;
  currentTheme: ThemeColors;
  stats: GlobalStats;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateCustomTheme: (updates: Partial<ThemeColors>) => void;
  recordGameResult: (gameId: GameId, winner: 1 | 2 | 'draw') => void;
  resetStats: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const SETTINGS_KEY = 'dualis_settings_v1';
const STATS_KEY = 'dualis_stats_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      themeId: 'obsidian',
      customTheme: {},
      soundEnabled: true,
      soundVolume: 0.6,
      headToHeadRotation: false,
      showKeyboardGuide: true,
      pieceStyle: 'modern',
      boardStyle: 'minimal',
    };
  });

  const [stats, setStats] = useState<GlobalStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_STATS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
    sound.setConfig(settings.soundEnabled, settings.soundVolume);
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error(e);
    }
  }, [stats]);

  const activeThemeBase = THEME_PRESETS[settings.themeId] || THEME_PRESETS.obsidian;
  const currentTheme: ThemeColors = settings.themeId === 'custom'
    ? { ...activeThemeBase, ...settings.customTheme }
    : activeThemeBase;

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateCustomTheme = (updates: Partial<ThemeColors>) => {
    setSettings((prev) => ({
      ...prev,
      themeId: 'custom',
      customTheme: { ...prev.customTheme, ...updates },
    }));
  };

  const recordGameResult = (gameId: GameId, winner: 1 | 2 | 'draw') => {
    setStats((prev) => {
      const current = prev.perGame[gameId] || { p1Wins: 0, p2Wins: 0, draws: 0 };
      const updated = {
        ...current,
        p1Wins: winner === 1 ? current.p1Wins + 1 : current.p1Wins,
        p2Wins: winner === 2 ? current.p2Wins + 1 : current.p2Wins,
        draws: winner === 'draw' ? current.draws + 1 : current.draws,
      };

      return {
        totalMatches: prev.totalMatches + 1,
        perGame: {
          ...prev.perGame,
          [gameId]: updated,
        },
      };
    });
  };

  const resetStats = () => {
    setStats(DEFAULT_STATS);
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        currentTheme,
        stats,
        updateSettings,
        updateCustomTheme,
        recordGameResult,
        resetStats,
      }}
    >
      <div
        style={{
          backgroundColor: currentTheme.bgMain,
          color: '#f8fafc',
          minHeight: '100vh',
          // CSS custom properties for dynamic theming across components
          ['--color-p1' as string]: currentTheme.p1Color,
          ['--color-p2' as string]: currentTheme.p2Color,
          ['--color-surface' as string]: currentTheme.bgSurface,
          ['--color-subtle' as string]: currentTheme.bgSubtle,
          ['--color-border' as string]: currentTheme.borderColor,
          ['--board-dark' as string]: currentTheme.boardDark,
          ['--board-light' as string]: currentTheme.boardLight,
        }}
        className="transition-colors duration-200"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useGameTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useGameTheme must be used within ThemeProvider');
  return ctx;
};
