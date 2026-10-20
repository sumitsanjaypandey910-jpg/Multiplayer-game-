import React from 'react';
import { Palette, Volume2, VolumeX, BarChart2 } from 'lucide-react';
import { GameId } from '../types/game';
import { useGameTheme } from '../context/ThemeContext';
import { sound } from '../utils/audio';

interface NavbarProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
  onOpenThemeModal: () => void;
  onOpenStatsModal: () => void;
}

const NAV_GAMES: { id: GameId; label: string }[] = [
  { id: 'chess', label: 'Chess' },
  { id: 'checkers', label: 'Checkers' },
  { id: 'cyberpong', label: 'Cyber Pong' },
  { id: 'lasertanks', label: 'Laser Tanks' },
  { id: 'connect4', label: 'Connect 4' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeGame,
  onSelectGame,
  onOpenThemeModal,
  onOpenStatsModal,
}) => {
  const { settings, currentTheme, updateSettings } = useGameTheme();

  return (
    <header
      className="flex items-center justify-between gap-8 px-6 py-3.5 border-b sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: `${currentTheme.bgSurface}ee`,
        borderColor: currentTheme.borderColor,
      }}
    >
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            onSelectGame('chess');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: currentTheme.p1Color }}
          />
          <span>DUALIS</span>
        </button>
      </div>

      {/* Zone 2: 4–5 clean single-line navigation links/tabs */}
      <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80">
        {NAV_GAMES.map((item) => {
          const isActive = activeGame === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                onSelectGame(item.id);
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              style={{
                backgroundColor: isActive ? currentTheme.bgSubtle : 'transparent',
                borderWidth: isActive ? '1px' : '0px',
                borderColor: isActive ? currentTheme.borderColor : 'transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick audio toggle */}
        <button
          onClick={() => {
            const next = !settings.soundEnabled;
            sound.setConfig(next, settings.soundVolume);
            if (next) sound.playClick();
            updateSettings({ soundEnabled: next });
          }}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={settings.soundEnabled ? 'Mute audio' : 'Unmute audio'}
          aria-label="Toggle sound"
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>

        {/* Match stats record */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenStatsModal();
          }}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Match Records"
          aria-label="View head-to-head match stats"
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        {/* Theme customizer button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenThemeModal();
          }}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 rounded-lg hover:brightness-110 active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-md"
          style={{ backgroundColor: currentTheme.p1Color }}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Customize Style</span>
        </button>
      </div>
    </header>
  );
};
