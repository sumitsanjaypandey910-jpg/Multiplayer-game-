import React from 'react';
import { GameId } from '../types/game';
import { useGameTheme } from '../context/ThemeContext';
import { Keyboard, Smartphone } from 'lucide-react';

interface ControlsOverlayProps {
  activeGame: GameId;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ activeGame }) => {
  const { currentTheme, settings } = useGameTheme();

  if (!settings.showKeyboardGuide) return null;

  return (
    <div
      className="max-w-4xl mx-auto my-6 px-4 py-3 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
      style={{
        backgroundColor: `${currentTheme.bgSurface}90`,
        borderColor: `${currentTheme.borderColor}80`,
      }}
    >
      <div className="flex items-center gap-2 text-slate-400 font-medium">
        <Keyboard className="w-4 h-4 text-cyan-400" />
        <span>Local 2-Player Controls Guide</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
        {/* Player 1 Controls */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentTheme.p1Color }}
          />
          <span className="font-semibold text-white">{currentTheme.p1Name}:</span>
          {activeGame === 'cyberpong' ? (
            <span className="font-mono text-[11px] text-cyan-300">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">W</kbd> Up ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">S</kbd> Down
            </span>
          ) : activeGame === 'lasertanks' ? (
            <span className="font-mono text-[11px] text-cyan-300">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">WASD</kbd> Move ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Space</kbd> Fire
            </span>
          ) : activeGame === 'connect4' ? (
            <span className="font-mono text-[11px] text-cyan-300">
              Click Column or keys <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">1-7</kbd>
            </span>
          ) : (
            <span className="text-slate-400">Click & Drag / Tap square</span>
          )}
        </div>

        <div className="text-slate-600 hidden md:block">|</div>

        {/* Player 2 Controls */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentTheme.p2Color }}
          />
          <span className="font-semibold text-white">{currentTheme.p2Name}:</span>
          {activeGame === 'cyberpong' ? (
            <span className="font-mono text-[11px] text-rose-300">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">↑</kbd> Up ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">↓</kbd> Down
            </span>
          ) : activeGame === 'lasertanks' ? (
            <span className="font-mono text-[11px] text-rose-300">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Arrows</kbd> Move ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Enter</kbd> Fire
            </span>
          ) : activeGame === 'connect4' ? (
            <span className="font-mono text-[11px] text-rose-300">
              Click Column or keys <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">1-7</kbd>
            </span>
          ) : (
            <span className="text-slate-400">Click & Drag / Tap square</span>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
        <span>Touch Supported</span>
      </div>
    </div>
  );
};
