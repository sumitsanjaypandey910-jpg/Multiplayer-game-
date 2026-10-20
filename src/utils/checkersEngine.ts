import { CheckersPiece, CheckersMove } from '../types/game';

export function getInitialCheckersPieces(): CheckersPiece[] {
  const pieces: CheckersPiece[] = [];
  let idCounter = 1;

  // Player 2 starts on top (rows 0, 1, 2)
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        pieces.push({
          id: `p2-${idCounter++}`,
          player: 2,
          isKing: false,
          row: r,
          col: c,
        });
      }
    }
  }

  // Player 1 starts on bottom (rows 5, 6, 7)
  for (let r = 5; r <= 7; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        pieces.push({
          id: `p1-${idCounter++}`,
          player: 1,
          isKing: false,
          row: r,
          col: c,
        });
      }
    }
  }

  return pieces;
}

export function getPieceAt(pieces: CheckersPiece[], row: number, col: number): CheckersPiece | undefined {
  return pieces.find((p) => p.row === row && p.col === col);
}

export function getLegalMovesForPiece(
  piece: CheckersPiece,
  allPieces: CheckersPiece[],
  mustJump: boolean = false
): CheckersMove[] {
  const moves: CheckersMove[] = [];
  const jumps: CheckersMove[] = [];

  const forwardDirs = piece.player === 1 ? [-1] : [1];
  const directions = piece.isKing ? [-1, 1] : forwardDirs;

  // 1. Check jumps (captures)
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const midRow = piece.row + dr;
      const midCol = piece.col + dc;
      const landRow = piece.row + dr * 2;
      const landCol = piece.col + dc * 2;

      if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8) {
        const midPiece = getPieceAt(allPieces, midRow, midCol);
        const landPiece = getPieceAt(allPieces, landRow, landCol);

        if (midPiece && midPiece.player !== piece.player && !landPiece) {
          const promoRow = piece.player === 1 ? 0 : 7;
          jumps.push({
            fromRow: piece.row,
            fromCol: piece.col,
            toRow: landRow,
            toCol: landCol,
            captures: [midRow, midCol],
            isPromotion: !piece.isKing && landRow === promoRow,
          });
        }
      }
    }
  }

  if (jumps.length > 0 || mustJump) {
    return jumps;
  }

  // 2. Check regular 1-step moves
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const targetRow = piece.row + dr;
      const targetCol = piece.col + dc;

      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        if (!getPieceAt(allPieces, targetRow, targetCol)) {
          const promoRow = piece.player === 1 ? 0 : 7;
          moves.push({
            fromRow: piece.row,
            fromCol: piece.col,
            toRow: targetRow,
            toCol: targetCol,
            isPromotion: !piece.isKing && targetRow === promoRow,
          });
        }
      }
    }
  }

  return moves;
}

export function getAllLegalMovesForPlayer(
  player: 1 | 2,
  pieces: CheckersPiece[]
): { piece: CheckersPiece; moves: CheckersMove[] }[] {
  const playerPieces = pieces.filter((p) => p.player === player);
  
  // First test if ANY jump exists (mandatory jump rule in checkers)
  const allJumps: { piece: CheckersPiece; moves: CheckersMove[] }[] = [];
  for (const p of playerPieces) {
    const jumps = getLegalMovesForPiece(p, pieces, true);
    if (jumps.length > 0) {
      allJumps.push({ piece: p, moves: jumps });
    }
  }

  if (allJumps.length > 0) {
    return allJumps;
  }

  // Otherwise return regular moves
  const allRegular: { piece: CheckersPiece; moves: CheckersMove[] }[] = [];
  for (const p of playerPieces) {
    const regular = getLegalMovesForPiece(p, pieces, false);
    if (regular.length > 0) {
      allRegular.push({ piece: p, moves: regular });
    }
  }

  return allRegular;
}
