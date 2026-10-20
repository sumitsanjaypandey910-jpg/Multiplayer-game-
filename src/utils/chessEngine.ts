import { ChessBoard, ChessColor, ChessMove, ChessPiece, ChessPieceType } from '../types/game';

export const INITIAL_FEN_BOARD: ChessBoard = [
  // Row 0 (Black pieces)
  [
    { id: 'r-b-1', type: 'r', color: 'b', hasMoved: false },
    { id: 'n-b-1', type: 'n', color: 'b' },
    { id: 'b-b-1', type: 'b', color: 'b' },
    { id: 'q-b', type: 'q', color: 'b' },
    { id: 'k-b', type: 'k', color: 'b', hasMoved: false },
    { id: 'b-b-2', type: 'b', color: 'b' },
    { id: 'n-b-2', type: 'n', color: 'b' },
    { id: 'r-b-2', type: 'r', color: 'b', hasMoved: false },
  ],
  // Row 1 (Black pawns)
  Array.from({ length: 8 }, (_, i) => ({ id: `p-b-${i}`, type: 'p' as ChessPieceType, color: 'b' as ChessColor, hasMoved: false })),
  // Rows 2-5 (Empty)
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  // Row 6 (White pawns)
  Array.from({ length: 8 }, (_, i) => ({ id: `p-w-${i}`, type: 'p' as ChessPieceType, color: 'w' as ChessColor, hasMoved: false })),
  // Row 7 (White pieces)
  [
    { id: 'r-w-1', type: 'r', color: 'w', hasMoved: false },
    { id: 'n-w-1', type: 'n', color: 'w' },
    { id: 'b-w-1', type: 'b', color: 'w' },
    { id: 'q-w', type: 'q', color: 'w' },
    { id: 'k-w', type: 'k', color: 'w', hasMoved: false },
    { id: 'b-w-2', type: 'b', color: 'w' },
    { id: 'n-w-2', type: 'n', color: 'w' },
    { id: 'r-w-2', type: 'r', color: 'w', hasMoved: false },
  ],
];

export function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function isWithinBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getKingPosition(board: ChessBoard, color: ChessColor): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return [r, c];
      }
    }
  }
  return null;
}

// Check if a square (targetR, targetC) is attacked by the opponent of defenderColor
export function isSquareAttacked(
  board: ChessBoard,
  targetR: number,
  targetC: number,
  defenderColor: ChessColor
): boolean {
  const attackerColor: ChessColor = defenderColor === 'w' ? 'b' : 'w';

  // 1. Pawn attacks
  const pawnDir = attackerColor === 'w' ? -1 : 1; // white pawns move -1 (upwards)
  const pawnRow = targetR - pawnDir;
  for (const dc of [-1, 1]) {
    const pc = targetC + dc;
    if (isWithinBoard(pawnRow, pc)) {
      const p = board[pawnRow][pc];
      if (p && p.color === attackerColor && p.type === 'p') return true;
    }
  }

  // 2. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = targetR + dr;
    const nc = targetC + dc;
    if (isWithinBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === attackerColor && p.type === 'n') return true;
    }
  }

  // 3. King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = targetR + dr;
      const nc = targetC + dc;
      if (isWithinBoard(nr, nc)) {
        const p = board[nr][nc];
        if (p && p.color === attackerColor && p.type === 'k') return true;
      }
    }
  }

  // 4. Sliding rays (Rook, Bishop, Queen)
  const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of straightDirs) {
    let step = 1;
    while (true) {
      const nr = targetR + dr * step;
      const nc = targetC + dc * step;
      if (!isWithinBoard(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) {
          return true;
        }
        break; // blocked by piece
      }
      step++;
    }
  }

  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagDirs) {
    let step = 1;
    while (true) {
      const nr = targetR + dr * step;
      const nc = targetC + dc * step;
      if (!isWithinBoard(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) {
          return true;
        }
        break; // blocked by piece
      }
      step++;
    }
  }

  return false;
}

export function isKingInCheck(board: ChessBoard, color: ChessColor): boolean {
  const kingPos = getKingPosition(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos[0], kingPos[1], color);
}

// Generate raw candidate moves ignoring check restrictions
export function getPseudoLegalMoves(
  board: ChessBoard,
  r: number,
  c: number,
  lastMove: ChessMove | null
): ChessMove[] {
  const piece = board[r][c];
  if (!piece) return [];
  const color = piece.color;
  const moves: ChessMove[] = [];

  const addMove = (
    toR: number,
    toC: number,
    extra?: Partial<ChessMove>
  ) => {
    moves.push({
      from: [r, c],
      to: [toR, toC],
      piece,
      captured: board[toR][toC],
      ...extra,
    });
  };

  if (piece.type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    // 1-step advance
    const nextR = r + dir;
    if (isWithinBoard(nextR, c) && !board[nextR][c]) {
      if (nextR === promoRow) {
        ['q', 'r', 'b', 'n'].forEach((pt) => {
          addMove(nextR, c, { promotion: pt as ChessPieceType });
        });
      } else {
        addMove(nextR, c);
      }

      // 2-step advance
      const doubleR = r + dir * 2;
      if (r === startRow && !board[doubleR][c]) {
        addMove(doubleR, c);
      }
    }

    // Captures
    for (const dc of [-1, 1]) {
      const capC = c + dc;
      if (isWithinBoard(nextR, capC)) {
        const target = board[nextR][capC];
        if (target && target.color !== color) {
          if (nextR === promoRow) {
            ['q', 'r', 'b', 'n'].forEach((pt) => {
              addMove(nextR, capC, { promotion: pt as ChessPieceType });
            });
          } else {
            addMove(nextR, capC);
          }
        } else if (!target && lastMove && lastMove.piece.type === 'p') {
          // En Passant check
          const [lastFromR, lastFromC] = lastMove.from;
          const [lastToR, lastToC] = lastMove.to;
          if (
            Math.abs(lastToR - lastFromR) === 2 &&
            lastToR === r &&
            lastToC === capC
          ) {
            addMove(nextR, capC, {
              isEnPassant: true,
              captured: lastMove.piece,
            });
          }
        }
      }
    }
  } else if (piece.type === 'n') {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (isWithinBoard(nr, nc)) {
        const target = board[nr][nc];
        if (!target || target.color !== color) {
          addMove(nr, nc);
        }
      }
    }
  } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
    const dirs: number[][] = [];
    if (piece.type === 'b' || piece.type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (piece.type === 'r' || piece.type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of dirs) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (!isWithinBoard(nr, nc)) break;
        const target = board[nr][nc];
        if (!target) {
          addMove(nr, nc);
        } else {
          if (target.color !== color) {
            addMove(nr, nc);
          }
          break; // ray stopped
        }
        step++;
      }
    }
  } else if (piece.type === 'k') {
    // 1-step in any direction
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            addMove(nr, nc);
          }
        }
      }
    }

    // Castling
    if (!piece.hasMoved && !isKingInCheck(board, color)) {
      const row = color === 'w' ? 7 : 0;
      if (r === row && c === 4) {
        // Kingside: c=5 and c=6 must be empty & unattacked; rook at c=7 must not have moved
        const rkPiece = board[row][7];
        if (
          rkPiece &&
          rkPiece.type === 'r' &&
          rkPiece.color === color &&
          !rkPiece.hasMoved &&
          !board[row][5] &&
          !board[row][6] &&
          !isSquareAttacked(board, row, 5, color) &&
          !isSquareAttacked(board, row, 6, color)
        ) {
          addMove(row, 6, { isCastling: 'kingside' });
        }

        // Queenside: c=3, c=2, c=1 must be empty; c=3 and c=2 must be unattacked; rook at c=0
        const rqPiece = board[row][0];
        if (
          rqPiece &&
          rqPiece.type === 'r' &&
          rqPiece.color === color &&
          !rqPiece.hasMoved &&
          !board[row][1] &&
          !board[row][2] &&
          !board[row][3] &&
          !isSquareAttacked(board, row, 2, color) &&
          !isSquareAttacked(board, row, 3, color)
        ) {
          addMove(row, 2, { isCastling: 'queenside' });
        }
      }
    }
  }

  return moves;
}

// Simulate move and verify king is not left in check
export function getLegalMoves(
  board: ChessBoard,
  r: number,
  c: number,
  lastMove: ChessMove | null
): ChessMove[] {
  const pseudoMoves = getPseudoLegalMoves(board, r, c, lastMove);
  const color = board[r][c]?.color;
  if (!color) return [];

  return pseudoMoves.filter((mv) => {
    const nextBoard = applyMove(board, mv);
    return !isKingInCheck(nextBoard, color);
  });
}

export function getAllLegalMoves(
  board: ChessBoard,
  color: ChessColor,
  lastMove: ChessMove | null
): ChessMove[] {
  const allMoves: ChessMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color) {
        allMoves.push(...getLegalMoves(board, r, c, lastMove));
      }
    }
  }
  return allMoves;
}

export function applyMove(board: ChessBoard, move: ChessMove): ChessBoard {
  const next = cloneBoard(board);
  const [fromR, fromC] = move.from;
  const [toR, toC] = move.to;

  const movedPiece: ChessPiece = {
    ...move.piece,
    hasMoved: true,
  };

  if (move.promotion) {
    movedPiece.type = move.promotion;
  }

  next[fromR][fromC] = null;
  next[toR][toC] = movedPiece;

  // Handle En Passant capture removal
  if (move.isEnPassant) {
    const capRow = fromR;
    const capCol = toC;
    next[capRow][capCol] = null;
  }

  // Handle Castling Rook move
  if (move.isCastling === 'kingside') {
    const rook = next[toR][7];
    if (rook) {
      next[toR][7] = null;
      next[toR][5] = { ...rook, hasMoved: true };
    }
  } else if (move.isCastling === 'queenside') {
    const rook = next[toR][0];
    if (rook) {
      next[toR][0] = null;
      next[toR][3] = { ...rook, hasMoved: true };
    }
  }

  return next;
}

// Standard algebraic notation generator
export function toAlgebraic(move: ChessMove, isCheck: boolean, isMate: boolean): string {
  if (move.isCastling === 'kingside') return isMate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  if (move.isCastling === 'queenside') return isMate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const dest = `${files[move.to[1]]}${ranks[move.to[0]]}`;
  let notation = '';

  if (move.piece.type === 'p') {
    if (move.captured) {
      notation = `${files[move.from[1]]}x${dest}`;
    } else {
      notation = dest;
    }
    if (move.promotion) {
      notation += `=${move.promotion.toUpperCase()}`;
    }
  } else {
    notation = `${move.piece.type.toUpperCase()}${move.captured ? 'x' : ''}${dest}`;
  }

  if (isMate) notation += '#';
  else if (isCheck) notation += '+';

  return notation;
}

export const PIECE_VALUES: Record<ChessPieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};
