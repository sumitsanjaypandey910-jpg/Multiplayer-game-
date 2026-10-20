import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Trophy, Swords } from 'lucide-react';
import { useGameTheme } from '../context/ThemeContext';
import { GameId } from '../types/game';
import { sound } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  chess: 'Chess Duel',
  checkers: 'Checkers (Draughts)',
  cyberpong: 'Cyber Pong Arcade',
  lasertanks: 'Laser Tanks Combat',
  connect4: 'Connect 4 Grav-Grid',
};

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme, stats, resetStats } = useGameTheme();

  if (!isOpen) return null;

  let totalP1 = 0;
  let totalP2 = 0;
  let totalDraws = 0;

  Object.values(stats.perGame).forEach((item) => {
    totalP1 += item.p1Wins;
    totalP2 += item.p2Wins;
    totalDraws += item.draws;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-2xl text-slate-100"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${currentTheme.p1Color}20`,
                  borderColor: `${currentTheme.p1Color}50`,
                  color: currentTheme.p1Color,
                }}
              >
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Head-to-Head Records</h3>
                <p className="text-xs text-slate-400">Local leaderboard for this device</p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Overall Scoreboard Banner */}
          <div className="my-5 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-slate-400 truncate">{currentTheme.p1Name}</div>
              <div
                className="text-3xl font-black tabular-nums mt-1"
                style={{ color: currentTheme.p1Color }}
              >
                {totalP1}
              </div>
              <div className="text-[11px] text-slate-500">victories</div>
            </div>

            <div className="px-4 text-center">
              <Swords className="w-5 h-5 text-slate-500 mx-auto mb-1" />
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                {totalDraws} draws
              </div>
            </div>

            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-slate-400 truncate">{currentTheme.p2Name}</div>
              <div
                className="text-3xl font-black tabular-nums mt-1"
                style={{ color: currentTheme.p2Color }}
              >
                {totalP2}
              </div>
              <div className="text-[11px] text-slate-500">victories</div>
            </div>
          </div>

          {/* Breakdown per game */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {(Object.keys(stats.perGame) as GameId[]).map((gameId) => {
              const record = stats.perGame[gameId];
              return (
                <div
                  key={gameId}
                  className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40 flex items-center justify-between"
                >
                  <div className="text-xs font-medium text-slate-200">
                    {GAME_NAMES[gameId]}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                    <span style={{ color: currentTheme.p1Color }}>{record.p1Wins} W</span>
                    <span className="text-slate-500">{record.draws} D</span>
                    <span style={{ color: currentTheme.p2Color }}>{record.p2Wins} W</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Reset all match stats to 0?')) {
                  sound.playClick();
                  resetStats();
                }
              }}
              className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Records
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-md"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
