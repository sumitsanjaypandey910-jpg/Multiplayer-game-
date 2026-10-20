import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Flag } from 'lucide-react';
import { CheckersPiece, CheckersMove } from '../../types/game';
import {
  getInitialCheckersPieces,
  getAllLegalMovesForPlayer,
  getLegalMovesForPiece,
} from '../../utils/checkersEngine';
import { CheckersPieceIcon } from '../../components/PieceIcon';
import { VictoryModal } from '../../components/VictoryModal';
import { useGameTheme } from '../../context/ThemeContext';
import { sound } from '../../utils/audio';

export const CheckersGame: React.FC = () => {
  const { currentTheme, settings, recordGameResult } = useGameTheme();

  const [pieces, setPieces] = useState<CheckersPiece[]>(() => getInitialCheckersPieces());
  const [turn, setTurn] = useState<1 | 2>(1);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [activeMoves, setActiveMoves] = useState<CheckersMove[]>([]);
  const [chainJumpingPieceId, setChainJumpingPieceId] = useState<string | null>(null);

  // Victory / Game over state
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [winReason, setWinReason] = useState<string>('');
  const [moveCount, setMoveCount] = useState<number>(0);

  const resetGame = useCallback(() => {
    setPieces(getInitialCheckersPieces());
    setTurn(1);
    setSelectedPieceId(null);
    setActiveMoves([]);
    setChainJumpingPieceId(null);
    setGameOver(false);
    setWinner(null);
    setWinReason('');
    setMoveCount(0);
  }, []);

  const p1PieceCount = pieces.filter((p) => p.player === 1).length;
  const p2PieceCount = pieces.filter((p) => p.player === 2).length;

  // Check if player has any moves
  const checkGameOver = (currentTurn: 1 | 2, currentPieces: CheckersPiece[]) => {
    const oppLegal = getAllLegalMovesForPlayer(currentTurn, currentPieces);
    if (oppLegal.length === 0) {
      const winPlayer = currentTurn === 1 ? 2 : 1;
      setGameOver(true);
      setWinner(winPlayer);
      setWinReason(`Player ${winPlayer} wins! Player ${currentTurn} has no legal moves.`);
      recordGameResult('checkers', winPlayer);
      return true;
    }
    return false;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (gameOver) return;

    // Check if clicked square is a legal destination
    const targetMove = activeMoves.find((m) => m.toRow === r && m.toCol === c);
    if (targetMove && selectedPieceId) {
      executeMove(targetMove);
      return;
    }

    // If currently locked in a multi-jump chain, cannot change piece
    if (chainJumpingPieceId) return;

    // Check if clicked on a piece
    const clickedPiece = pieces.find((p) => p.row === r && p.col === c);
    if (clickedPiece && clickedPiece.player === turn) {
      const allPlayerMoves = getAllLegalMovesForPlayer(turn, pieces);
      const pieceOption = allPlayerMoves.find((o) => o.piece.id === clickedPiece.id);

      if (pieceOption) {
        sound.playClick();
        setSelectedPieceId(clickedPiece.id);
        setActiveMoves(pieceOption.moves);
      } else {
        // Player tried to select a piece that has no legal moves (e.g. jump is mandatory elsewhere)
        setSelectedPieceId(null);
        setActiveMoves([]);
      }
    } else {
      setSelectedPieceId(null);
      setActiveMoves([]);
    }
  };

  const executeMove = (move: CheckersMove) => {
    let nextPieces = pieces.map((p) => {
      if (p.id === selectedPieceId) {
        return {
          ...p,
          row: move.toRow,
          col: move.toCol,
          isKing: p.isKing || move.isPromotion || false,
        };
      }
      return p;
    });

    const isJump = Boolean(move.captures);

    // If jump, remove captured piece
    if (move.captures) {
      const [capR, capC] = move.captures;
      nextPieces = nextPieces.filter((p) => !(p.row === capR && p.col === capC));
      sound.playCapture();
    } else {
      sound.playMove();
    }

    setMoveCount((prev) => prev + 1);

    // Multi-jump continuation check
    if (isJump && !move.isPromotion) {
      const movedPiece = nextPieces.find((p) => p.id === selectedPieceId);
      if (movedPiece) {
        const continuationJumps = getLegalMovesForPiece(movedPiece, nextPieces, true);
        if (continuationJumps.length > 0) {
          // Player must continue multi-jump with this piece!
          setPieces(nextPieces);
          setChainJumpingPieceId(movedPiece.id);
          setSelectedPieceId(movedPiece.id);
          setActiveMoves(continuationJumps);
          return;
        }
      }
    }

    // Turn complete
    setChainJumpingPieceId(null);
    setSelectedPieceId(null);
    setActiveMoves([]);
    setPieces(nextPieces);

    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn);
    checkGameOver(nextTurn, nextPieces);
  };

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-8 max-w-7xl mx-auto py-6 px-4">
      {/* Board Column */}
      <div className="flex flex-col items-center w-full max-w-xl">
        {/* Top HUD (Player 2) */}
        <div
          className={`w-full flex items-center justify-between p-3 mb-2 rounded-xl border transition-all ${
            settings.headToHeadRotation ? 'rotate-180' : ''
          }`}
          style={{
            backgroundColor: turn === 2 ? `${currentTheme.p2Color}15` : currentTheme.bgSurface,
            borderColor: turn === 2 ? currentTheme.p2Color : currentTheme.borderColor,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: currentTheme.p2Color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentTheme.p2Name}</span>
                {turn === 2 && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${currentTheme.p2Color}30`, color: currentTheme.p2Color }}
                  >
                    Active Turn
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {p2PieceCount} pieces remaining
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 tabular-nums">
            Score: {12 - p1PieceCount} captures
          </div>
        </div>

        {/* 8x8 Checkers Board */}
        <div
          className="relative aspect-square w-full rounded-2xl overflow-hidden border shadow-2xl p-2 select-none"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
            boxShadow: `0 20px 50px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden border border-slate-800">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => {
                const isDarkSquare = (r + c) % 2 === 1;
                const piece = pieces.find((p) => p.row === r && p.col === c);
                const isSelected = selectedPieceId === piece?.id;
                const isLegalTarget = activeMoves.some((m) => m.toRow === r && m.toCol === c);

                const squareBg = isDarkSquare ? currentTheme.boardDark : currentTheme.boardLight;

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={!isDarkSquare}
                    onClick={() => handleSquareClick(r, c)}
                    className="relative flex items-center justify-center transition-colors cursor-pointer outline-none group"
                    style={{
                      backgroundColor: isSelected ? `${currentTheme.p1Color}35` : squareBg,
                    }}
                  >
                    {/* Legal move indicator */}
                    {isLegalTarget && (
                      <div
                        className="absolute z-20 w-4 h-4 rounded-full shadow-lg animate-pulse"
                        style={{ backgroundColor: currentTheme.p1Color }}
                      />
                    )}

                    {/* Checkers Piece */}
                    {piece && (
                      <motion.div
                        initial={false}
                        animate={{ scale: isSelected ? 1.12 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="relative z-10 w-full h-full p-2 flex items-center justify-center"
                      >
                        <CheckersPieceIcon
                          player={piece.player}
                          isKing={piece.isKing}
                          p1Color={currentTheme.p1Color}
                          p2Color={currentTheme.p2Color}
                          style={settings.pieceStyle}
                          className="w-full h-full drop-shadow-md"
                        />
                      </motion.div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom HUD (Player 1) */}
        <div
          className="w-full flex items-center justify-between p-3 mt-2 rounded-xl border transition-all"
          style={{
            backgroundColor: turn === 1 ? `${currentTheme.p1Color}15` : currentTheme.bgSurface,
            borderColor: turn === 1 ? currentTheme.p1Color : currentTheme.borderColor,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: currentTheme.p1Color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentTheme.p1Name}</span>
                {turn === 1 && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${currentTheme.p1Color}30`, color: currentTheme.p1Color }}
                  >
                    Active Turn
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {p1PieceCount} pieces remaining
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 tabular-nums">
            Score: {12 - p2PieceCount} captures
          </div>
        </div>
      </div>

      {/* Side Information & Rule Panel */}
      <div
        className="w-full xl:w-80 rounded-2xl border p-5 flex flex-col justify-between shadow-xl"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
          minHeight: '440px',
        }}
      >
        <div>
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Checkers Match
            </span>
            <span className="text-xs font-mono text-slate-400">{moveCount} moves</span>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-400">
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1.5">
              <div className="font-semibold text-slate-200">Official Tournament Rules</div>
              <p>• Mandatory Jumps: If a capture jump is available, it must be taken.</p>
              <p>• Multi-Jumps: Continue jumping in the same turn if further jumps exist.</p>
              <p>• Kinging: Reaching back rank crowns a King with bidirectional moves & jumps.</p>
            </div>

            {chainJumpingPieceId && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs animate-pulse">
                Multi-jump required! Complete your jump sequence.
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
          <button
            onClick={() => {
              sound.playClick();
              const resigningPlayer = turn;
              const winnerPlayer = turn === 1 ? 2 : 1;
              if (window.confirm(`Player ${resigningPlayer} resigns?`)) {
                setGameOver(true);
                setWinner(winnerPlayer);
                setWinReason(`Player ${resigningPlayer} conceded defeat.`);
                recordGameResult('checkers', winnerPlayer);
              }
            }}
            className="w-full py-2 px-3 rounded-xl border border-slate-800 hover:border-rose-900/40 hover:bg-rose-950/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            Concede Turn
          </button>

          <button
            onClick={() => {
              sound.playClick();
              resetGame();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Match
          </button>
        </div>
      </div>

      <VictoryModal
        isOpen={gameOver}
        winner={winner}
        winReason={winReason}
        onRematch={resetGame}
      />
    </div>
  );
};
