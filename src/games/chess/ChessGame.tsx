import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Flag, Handshake, RotateCcw } from 'lucide-react';
import {
  ChessBoard,
  ChessColor,
  ChessMove,
  ChessPiece,
  ChessPieceType,
  ChessClockMode,
} from '../../types/game';
import {
  INITIAL_FEN_BOARD,
  cloneBoard,
  getLegalMoves,
  applyMove,
  isKingInCheck,
  getAllLegalMoves,
  toAlgebraic,
  PIECE_VALUES,
} from '../../utils/chessEngine';
import { ChessPieceIcon } from '../../components/PieceIcon';
import { VictoryModal } from '../../components/VictoryModal';
import { useGameTheme } from '../../context/ThemeContext';
import { sound } from '../../utils/audio';

const CLOCK_TIMES: Record<ChessClockMode, number> = {
  none: 0,
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '10m': 600,
};

export const ChessGame: React.FC = () => {
  const { currentTheme, settings, recordGameResult } = useGameTheme();

  const [board, setBoard] = useState<ChessBoard>(() => cloneBoard(INITIAL_FEN_BOARD));
  const [turn, setTurn] = useState<ChessColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessMove[]>([]);
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ san: string; move: ChessMove }[]>([]);

  // Promotion handling
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: [number, number];
    to: [number, number];
    piece: ChessPiece;
  } | null>(null);

  // Clocks
  const [clockMode, setClockMode] = useState<ChessClockMode>('5m');
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [clockActive, setClockActive] = useState<boolean>(false);

  // Board Flip options
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);

  // Victory / Game over state
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [winReason, setWinReason] = useState<string>('');

  // Clock countdown loop
  useEffect(() => {
    if (clockMode === 'none' || !clockActive || gameOver) return;

    const timer = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeout('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeout('b');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, clockActive, clockMode, gameOver]);

  const handleTimeout = (loserColor: ChessColor) => {
    setGameOver(true);
    setClockActive(false);
    const winPlayer = loserColor === 'w' ? 2 : 1;
    setWinner(winPlayer);
    setWinReason(`Time out! ${loserColor === 'w' ? 'Black' : 'White'} ran out of time.`);
    recordGameResult('chess', winPlayer);
  };

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(cloneBoard(INITIAL_FEN_BOARD));
    setTurn('w');
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setPendingPromotion(null);
    setGameOver(false);
    setWinner(null);
    setWinReason('');
    const time = CLOCK_TIMES[clockMode];
    setWhiteTime(time);
    setBlackTime(time);
    setClockActive(false);
  }, [clockMode]);

  // Check state
  const inCheck = isKingInCheck(board, turn);

  // Select square / Make move
  const handleSquareClick = (r: number, c: number) => {
    if (gameOver || pendingPromotion) return;

    const clickedPiece = board[r][c];

    // If a square was already selected
    if (selectedSquare) {
      const [selR, selC] = selectedSquare;

      // Check if clicked square is a valid target
      const targetMove = legalMoves.find((m) => m.to[0] === r && m.to[1] === c);

      if (targetMove) {
        // If pawn promotion move without chosen piece yet
        if (targetMove.piece.type === 'p' && (r === 0 || r === 7)) {
          setPendingPromotion({
            from: [selR, selC],
            to: [r, c],
            piece: targetMove.piece,
          });
          return;
        }

        executeMove(targetMove);
        return;
      }

      // If clicked on own other piece, switch selection
      if (clickedPiece && clickedPiece.color === turn) {
        sound.playClick();
        setSelectedSquare([r, c]);
        setLegalMoves(getLegalMoves(board, r, c, lastMove));
        return;
      }

      // Deselect
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Select piece
    if (clickedPiece && clickedPiece.color === turn) {
      sound.playClick();
      setSelectedSquare([r, c]);
      setLegalMoves(getLegalMoves(board, r, c, lastMove));
    }
  };

  const executeMove = (move: ChessMove) => {
    if (!clockActive && clockMode !== 'none') {
      setClockActive(true);
    }

    const nextBoard = applyMove(board, move);
    const nextTurn: ChessColor = turn === 'w' ? 'b' : 'w';

    // Check check / checkmate on next player
    const nextCheck = isKingInCheck(nextBoard, nextTurn);
    const opponentLegalMoves = getAllLegalMoves(nextBoard, nextTurn, move);
    const isMate = nextCheck && opponentLegalMoves.length === 0;
    const isStalemate = !nextCheck && opponentLegalMoves.length === 0;

    const san = toAlgebraic(move, nextCheck, isMate);
    setMoveHistory((prev) => [...prev, { san, move }]);

    if (move.captured) {
      sound.playCapture();
    } else {
      sound.playMove();
    }

    if (nextCheck && !isMate) {
      sound.playCheck();
    }

    setBoard(nextBoard);
    setLastMove(move);
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);

    if (isMate) {
      setGameOver(true);
      setClockActive(false);
      const winPlayer = turn === 'w' ? 1 : 2;
      setWinner(winPlayer);
      setWinReason(`Checkmate! ${turn === 'w' ? 'White' : 'Black'} delivers victory.`);
      recordGameResult('chess', winPlayer);
    } else if (isStalemate) {
      setGameOver(true);
      setClockActive(false);
      setWinner('draw');
      setWinReason('Stalemate! No legal moves available.');
      recordGameResult('chess', 'draw');
    } else {
      setTurn(nextTurn);
    }
  };

  const handlePromoteChoice = (promoPieceType: ChessPieceType) => {
    if (!pendingPromotion) return;
    const { from, to, piece } = pendingPromotion;
    const promoMove: ChessMove = {
      from,
      to,
      piece,
      captured: board[to[0]][to[1]],
      promotion: promoPieceType,
    };
    executeMove(promoMove);
  };

  // Captured pieces calculation
  const getCapturedPieces = () => {
    const initialCounts: Record<ChessColor, Record<ChessPieceType, number>> = {
      w: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
      b: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
    };

    const currentCounts: Record<ChessColor, Record<ChessPieceType, number>> = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          currentCounts[p.color][p.type]++;
        }
      }
    }

    const capturedByWhite: ChessPieceType[] = [];
    const capturedByBlack: ChessPieceType[] = [];

    (['p', 'n', 'b', 'r', 'q'] as ChessPieceType[]).forEach((type) => {
      const diffB = initialCounts.b[type] - currentCounts.b[type];
      for (let i = 0; i < diffB; i++) capturedByWhite.push(type);

      const diffW = initialCounts.w[type] - currentCounts.w[type];
      for (let i = 0; i < diffW; i++) capturedByBlack.push(type);
    });

    let whiteScore = 0;
    capturedByWhite.forEach((t) => (whiteScore += PIECE_VALUES[t]));
    let blackScore = 0;
    capturedByBlack.forEach((t) => (blackScore += PIECE_VALUES[t]));

    return {
      capturedByWhite,
      capturedByBlack,
      whiteAdvantage: whiteScore - blackScore,
    };
  };

  const { capturedByWhite, capturedByBlack, whiteAdvantage } = getCapturedPieces();

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Board display rows/cols based on flip
  const displayRows = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-8 max-w-7xl mx-auto py-6 px-4">
      {/* Promotion Modal */}
      <AnimatePresence>
        {pendingPromotion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 rounded-2xl border text-center shadow-2xl max-w-sm w-full"
              style={{
                backgroundColor: currentTheme.bgSurface,
                borderColor: currentTheme.borderColor,
              }}
            >
              <h3 className="text-base font-bold text-white mb-2">Pawn Promotion</h3>
              <p className="text-xs text-slate-400 mb-5">Choose piece upgrade:</p>
              <div className="grid grid-cols-4 gap-3">
                {(['q', 'r', 'b', 'n'] as ChessPieceType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => handlePromoteChoice(pt)}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-1.5"
                  >
                    <ChessPieceIcon
                      type={pt}
                      color={turn}
                      p1Color={currentTheme.p1Color}
                      p2Color={currentTheme.p2Color}
                      className="w-10 h-10"
                    />
                    <span className="text-[11px] font-semibold uppercase text-slate-300">
                      {pt === 'q' ? 'Queen' : pt === 'r' ? 'Rook' : pt === 'b' ? 'Bishop' : 'Knight'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Chess Arena */}
      <div className="flex flex-col items-center w-full max-w-xl">
        {/* Top Player HUD (Player 2 / Black) */}
        <div
          className={`w-full flex items-center justify-between p-3 mb-2 rounded-xl border transition-all ${
            settings.headToHeadRotation ? 'rotate-180' : ''
          }`}
          style={{
            backgroundColor: turn === 'b' ? `${currentTheme.p2Color}15` : currentTheme.bgSurface,
            borderColor: turn === 'b' ? currentTheme.p2Color : currentTheme.borderColor,
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
                {turn === 'b' && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${currentTheme.p2Color}30`, color: currentTheme.p2Color }}
                  >
                    To Move
                  </span>
                )}
              </div>
              {/* Captured by black tray */}
              <div className="flex items-center gap-1 mt-1 h-5">
                {capturedByBlack.map((type, idx) => (
                  <div key={idx} className="scale-75 -mx-1 opacity-80">
                    <ChessPieceIcon
                      type={type}
                      color="w"
                      p1Color={currentTheme.p1Color}
                      p2Color={currentTheme.p2Color}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
                {whiteAdvantage < 0 && (
                  <span className="text-[11px] font-bold text-slate-400 ml-1">
                    +{Math.abs(whiteAdvantage)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Player 2 Clock */}
          {clockMode !== 'none' && (
            <div
              className={`px-3.5 py-1.5 rounded-lg font-mono text-base font-bold tabular-nums border ${
                blackTime <= 30 && turn === 'b'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              {formatClock(blackTime)}
            </div>
          )}
        </div>

        {/* The 8x8 Chessboard */}
        <div
          className="relative aspect-square w-full rounded-2xl overflow-hidden border shadow-2xl p-2 select-none"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
            boxShadow: `0 20px 50px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden border border-slate-800">
            {displayRows.map((r) =>
              displayCols.map((c) => {
                const piece = board[r][c];
                const isDarkSquare = (r + c) % 2 === 1;
                const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                const isLegalTarget = legalMoves.some((m) => m.to[0] === r && m.to[1] === c);
                const isLastMoveSquare =
                  lastMove &&
                  ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                    (lastMove.to[0] === r && lastMove.to[1] === c));
                const isCheckedKing =
                  inCheck && piece && piece.type === 'k' && piece.color === turn;

                const squareBg = isDarkSquare
                  ? currentTheme.boardDark
                  : currentTheme.boardLight;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className="relative flex items-center justify-center transition-colors cursor-pointer outline-none group"
                    style={{
                      backgroundColor: isCheckedKing
                        ? '#dc2626'
                        : isSelected
                        ? `${currentTheme.p1Color}40`
                        : isLastMoveSquare
                        ? `${currentTheme.p1Color}25`
                        : squareBg,
                    }}
                  >
                    {/* Legal target dot or capture ring */}
                    {isLegalTarget && (
                      <div
                        className={`absolute z-20 pointer-events-none rounded-full transition-transform ${
                          piece
                            ? 'w-full h-full border-4 border-dashed animate-pulse opacity-90'
                            : 'w-4 h-4 shadow-sm'
                        }`}
                        style={{
                          borderColor: currentTheme.p1Color,
                          backgroundColor: piece ? 'transparent' : `${currentTheme.p1Color}cc`,
                        }}
                      />
                    )}

                    {/* Chess Piece with animation */}
                    {piece && (
                      <motion.div
                        key={piece.id}
                        initial={false}
                        animate={{ scale: isSelected ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`relative z-10 w-full h-full p-1.5 flex items-center justify-center ${
                          settings.headToHeadRotation && piece.color === 'b' ? 'rotate-180' : ''
                        }`}
                      >
                        <ChessPieceIcon
                          type={piece.type}
                          color={piece.color}
                          p1Color={currentTheme.p1Color}
                          p2Color={currentTheme.p2Color}
                          style={settings.pieceStyle}
                          className="w-full h-full drop-shadow-md"
                        />
                      </motion.div>
                    )}

                    {/* Rank & File Coordinates on edge squares */}
                    {c === (boardFlipped ? 7 : 0) && (
                      <span className="absolute top-1 left-1 text-[9px] font-mono text-slate-400 font-bold opacity-60 pointer-events-none">
                        {8 - r}
                      </span>
                    )}
                    {r === (boardFlipped ? 0 : 7) && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-slate-400 font-bold opacity-60 pointer-events-none">
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Player HUD (Player 1 / White) */}
        <div
          className="w-full flex items-center justify-between p-3 mt-2 rounded-xl border transition-all"
          style={{
            backgroundColor: turn === 'w' ? `${currentTheme.p1Color}15` : currentTheme.bgSurface,
            borderColor: turn === 'w' ? currentTheme.p1Color : currentTheme.borderColor,
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
                {turn === 'w' && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${currentTheme.p1Color}30`, color: currentTheme.p1Color }}
                  >
                    To Move
                  </span>
                )}
              </div>
              {/* Captured by white tray */}
              <div className="flex items-center gap-1 mt-1 h-5">
                {capturedByWhite.map((type, idx) => (
                  <div key={idx} className="scale-75 -mx-1 opacity-80">
                    <ChessPieceIcon
                      type={type}
                      color="b"
                      p1Color={currentTheme.p1Color}
                      p2Color={currentTheme.p2Color}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
                {whiteAdvantage > 0 && (
                  <span className="text-[11px] font-bold text-slate-400 ml-1">
                    +{whiteAdvantage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Player 1 Clock */}
          {clockMode !== 'none' && (
            <div
              className={`px-3.5 py-1.5 rounded-lg font-mono text-base font-bold tabular-nums border ${
                whiteTime <= 30 && turn === 'w'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              {formatClock(whiteTime)}
            </div>
          )}
        </div>
      </div>

      {/* Side Control & Moves Panel */}
      <div
        className="w-full xl:w-80 rounded-2xl border p-5 flex flex-col justify-between shadow-xl"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
          minHeight: '480px',
        }}
      >
        <div>
          {/* Header & Clocks mode selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Chess Match Controls
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setBoardFlipped((prev) => !prev);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
              title="Flip board view"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
          </div>

          {/* Clock Presets */}
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Timer Preset
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['none', '1m', '3m', '5m'] as ChessClockMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    sound.playClick();
                    setClockMode(mode);
                    const t = CLOCK_TIMES[mode];
                    setWhiteTime(t);
                    setBlackTime(t);
                    setClockActive(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                    clockMode === mode
                      ? 'bg-white text-slate-900 font-bold'
                      : 'border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {mode === 'none' ? 'None' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Move History Log */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Notation Log
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {Math.ceil(moveHistory.length / 2)} moves
              </span>
            </div>
            <div className="h-44 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/60 p-2 font-mono text-xs space-y-1">
              {moveHistory.length === 0 ? (
                <div className="text-slate-600 text-center py-8 italic font-sans text-xs">
                  Moves will appear here as algebraic notation
                </div>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const whiteMove = moveHistory[i * 2];
                  const blackMove = moveHistory[i * 2 + 1];
                  return (
                    <div key={i} className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-slate-900">
                      <span className="text-slate-500 w-6">{i + 1}.</span>
                      <span className="text-cyan-400 w-16 font-semibold">{whiteMove?.san}</span>
                      <span className="text-rose-400 w-16 font-semibold">{blackMove?.san || ''}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Draw offer, Resign, Rematch */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playClick();
                if (window.confirm(`${turn === 'w' ? 'White' : 'Black'} offers a draw. Does opponent agree?`)) {
                  setGameOver(true);
                  setClockActive(false);
                  setWinner('draw');
                  setWinReason('Draw agreed by mutual consent.');
                  recordGameResult('chess', 'draw');
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              Offer Draw
            </button>

            <button
              onClick={() => {
                sound.playClick();
                const resigningPlayer = turn === 'w' ? 1 : 2;
                const winnerPlayer = turn === 'w' ? 2 : 1;
                if (window.confirm(`${turn === 'w' ? 'White' : 'Black'} resigns?`)) {
                  setGameOver(true);
                  setClockActive(false);
                  setWinner(winnerPlayer);
                  setWinReason(`${turn === 'w' ? 'White' : 'Black'} resigned.`);
                  recordGameResult('chess', winnerPlayer);
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-800 hover:border-rose-900/40 hover:bg-rose-950/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              Resign
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              resetGame();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Board
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameOver}
        winner={winner}
        winReason={winReason}
        onRematch={resetGame}
      />
    </div>
  );
};
