import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { Connect4Board, Connect4Cell } from '../../types/game';
import { VictoryModal } from '../../components/VictoryModal';
import { useGameTheme } from '../../context/ThemeContext';
import { sound } from '../../utils/audio';

const ROWS = 6;
const COLS = 7;

function createEmptyBoard(): Connect4Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function checkWin(board: Connect4Board): { winner: 1 | 2; cells: [number, number][] } | null {
  // Horizontal check
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== 0 && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
        return {
          winner: p,
          cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]],
        };
      }
    }
  }

  // Vertical check
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p !== 0 && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
        return {
          winner: p,
          cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]],
        };
      }
    }
  }

  // Diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== 0 && p === board[r - 1][c + 1] && p === board[r - 2][c + 2] && p === board[r - 3][c + 3]) {
        return {
          winner: p,
          cells: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]],
        };
      }
    }
  }

  // Diagonal \
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== 0 && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
        return {
          winner: p,
          cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]],
        };
      }
    }
  }

  return null;
}

export const Connect4Game: React.FC = () => {
  const { currentTheme, settings, recordGameResult } = useGameTheme();

  const [board, setBoard] = useState<Connect4Board>(createEmptyBoard);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [winLine, setWinLine] = useState<[number, number][] | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setTurn(1);
    setHoverCol(null);
    setWinLine(null);
    setGameOver(false);
    setWinner(null);
  }, []);

  const dropChip = useCallback(
    (col: number) => {
      if (gameOver) return;

      // Find lowest available row in column
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
          targetRow = r;
          break;
        }
      }

      if (targetRow === -1) return; // Column full

      sound.playMove();
      const nextBoard = board.map((row) => [...row]);
      nextBoard[targetRow][col] = turn as Connect4Cell;
      setBoard(nextBoard);

      const winResult = checkWin(nextBoard);
      if (winResult) {
        setWinLine(winResult.cells);
        setGameOver(true);
        setWinner(winResult.winner);
        recordGameResult('connect4', winResult.winner);
        return;
      }

      // Check full board draw
      const isFull = nextBoard.every((row) => row.every((cell) => cell !== 0));
      if (isFull) {
        setGameOver(true);
        setWinner('draw');
        recordGameResult('connect4', 'draw');
        return;
      }

      setTurn((prev) => (prev === 1 ? 2 : 1));
    },
    [board, gameOver, turn, recordGameResult]
  );

  // Keyboard shortcut: Keys 1 to 7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 7) {
        dropChip(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropChip]);

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto py-6 px-4">
      {/* Top Turn HUD */}
      <div
        className={`w-full max-w-xl flex items-center justify-between p-3.5 mb-4 rounded-xl border transition-all ${
          settings.headToHeadRotation && turn === 2 ? 'rotate-180' : ''
        }`}
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full transition-colors shadow-sm"
            style={{ backgroundColor: turn === 1 ? currentTheme.p1Color : currentTheme.p2Color }}
          />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Current Turn</div>
            <div className="text-sm font-bold text-white">
              {turn === 1 ? currentTheme.p1Name : currentTheme.p2Name}
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Keys: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">1</kbd> to{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">7</kbd>
        </div>
      </div>

      {/* Connect-4 Board */}
      <div
        className="relative w-full max-w-xl p-4 sm:p-6 rounded-2xl border shadow-2xl overflow-hidden select-none"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
          boxShadow: `0 20px 50px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Column Hover Indicator Strip */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 h-7 sm:h-8">
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={col} className="flex justify-center items-center">
              {hoverCol === col && !gameOver && (
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full opacity-70 animate-bounce"
                  style={{
                    backgroundColor: turn === 1 ? currentTheme.p1Color : currentTheme.p2Color,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* The 7x6 Grid Frame */}
        <div
          className="grid grid-cols-7 gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border border-slate-800"
          style={{ backgroundColor: currentTheme.boardDark }}
        >
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const cell = board[r][c];
              const isWinCell = winLine?.some(([wr, wc]) => wr === r && wc === c);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => dropChip(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  className="aspect-square rounded-full flex items-center justify-center relative cursor-pointer outline-none group"
                  style={{
                    backgroundColor: '#070a10',
                  }}
                >
                  {/* Outer bezel */}
                  <div className="absolute inset-0 rounded-full border border-slate-800 pointer-events-none" />

                  {/* Chip */}
                  {cell !== 0 && (
                    <motion.div
                      initial={{ y: -150, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                      className={`w-full h-full rounded-full flex items-center justify-center ${
                        isWinCell ? 'ring-4 ring-white animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: cell === 1 ? currentTheme.p1Color : currentTheme.p2Color,
                        boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.4), 0 0 12px ${
                          cell === 1 ? currentTheme.p1Color : currentTheme.p2Color
                        }66`,
                      }}
                    >
                      <div className="w-1/2 h-1/2 rounded-full border-2 border-white/30" />
                    </motion.div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-xl mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Connect 4 discs horizontally, vertically, or diagonally to win.
        </span>

        <button
          onClick={() => {
            sound.playClick();
            resetGame();
          }}
          className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Grid</span>
        </button>
      </div>

      <VictoryModal
        isOpen={gameOver}
        winner={winner}
        winReason="Connected 4 in a row!"
        onRematch={resetGame}
      />
    </div>
  );
};
