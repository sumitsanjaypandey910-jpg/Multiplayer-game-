/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameId } from './types/game';
import { ThemeProvider, useGameTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { StatsModal } from './components/StatsModal';
import { ControlsOverlay } from './components/ControlsOverlay';
import { ChessGame } from './games/chess/ChessGame';
import { CheckersGame } from './games/checkers/CheckersGame';
import { CyberPongGame } from './games/cyberpong/CyberPongGame';
import { LaserTanksGame } from './games/lasertanks/LaserTanksGame';
import { Connect4Game } from './games/connect4/Connect4Game';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from './utils/audio';

function GameArena() {
  const [activeGame, setActiveGame] = useState<GameId>('chess');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);

  const { currentTheme } = useGameTheme();

  const handleSelectGame = (game: GameId) => {
    sound.playClick();
    setActiveGame(game);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden cyber-grid-pattern">
      {/* Dynamic ambient radial lighting */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 -z-10 transition-colors duration-500"
        style={{ backgroundColor: currentTheme.p1Color }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 -z-10 transition-colors duration-500"
        style={{ backgroundColor: currentTheme.p2Color }}
      />

      {/* Top Bar Navigation */}
      <Navbar
        activeGame={activeGame}
        onSelectGame={handleSelectGame}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
      />

      {/* Mobile Game Switcher Bar */}
      <div className="md:hidden flex items-center justify-around p-2 border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
        {(['chess', 'checkers', 'cyberpong', 'lasertanks', 'connect4'] as GameId[]).map((g) => (
          <button
            key={g}
            onClick={() => handleSelectGame(g)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeGame === g
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {g === 'chess'
              ? 'Chess'
              : g === 'checkers'
              ? 'Checkers'
              : g === 'cyberpong'
              ? 'Pong'
              : g === 'lasertanks'
              ? 'Tanks'
              : 'Connect 4'}
          </button>
        ))}
      </div>

      {/* Main Play Viewport with Transitions */}
      <main className="flex-1 flex flex-col justify-center px-2 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGame}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {activeGame === 'chess' && <ChessGame />}
            {activeGame === 'checkers' && <CheckersGame />}
            {activeGame === 'cyberpong' && <CyberPongGame />}
            {activeGame === 'lasertanks' && <LaserTanksGame />}
            {activeGame === 'connect4' && <Connect4Game />}
          </motion.div>
        </AnimatePresence>

        {/* Keyboard & Touch Reference HUD */}
        <ControlsOverlay activeGame={activeGame} />
      </main>

      {/* Clean Footer (Anti-slop compliant: quiet site metadata & copyright) */}
      <footer className="py-4 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">DUALIS</span>
          <span>·</span>
          <span>Same-Screen 2-Player Local Battleground</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Chess · Checkers · Cyber Pong · Laser Tanks · Connect 4</span>
        </div>
      </footer>

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Head-to-Head Stats Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GameArena />
    </ThemeProvider>
  );
}
