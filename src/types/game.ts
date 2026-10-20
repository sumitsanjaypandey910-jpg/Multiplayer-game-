/**
 * DUALIS Game Suite Types
 */

export type GameId = 'chess' | 'checkers' | 'cyberpong' | 'lasertanks' | 'connect4';

export type ThemeId = 'obsidian' | 'royal' | 'emerald' | 'sunset' | 'monochrome' | 'custom';

export type PieceStyle = 'modern' | 'classic' | 'neon';

export type BoardStyle = 'minimal' | 'glass' | 'carbon' | 'tactical';

export interface ThemeColors {
  id: ThemeId;
  name: string;
  bgMain: string;
  bgSurface: string;
  bgSubtle: string;
  borderColor: string;
  p1Color: string; // e.g. #06b6d4 (Cyan)
  p1Name: string;
  p2Color: string; // e.g. #f43f5e (Crimson)
  p2Name: string;
  boardDark: string;
  boardLight: string;
  accentGlow: string;
}

export interface AppSettings {
  themeId: ThemeId;
  customTheme: Partial<ThemeColors>;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  headToHeadRotation: boolean; // 180deg flip for P2 side in tabletop mode
  showKeyboardGuide: boolean;
  pieceStyle: PieceStyle;
  boardStyle: BoardStyle;
}

export interface PlayerStats {
  p1Wins: number;
  p2Wins: number;
  draws: number;
}

export interface GlobalStats {
  totalMatches: number;
  perGame: Record<GameId, PlayerStats>;
}

// ----------------- CHESS TYPES -----------------
export type ChessPieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type ChessColor = 'w' | 'b';

export interface ChessPiece {
  id: string;
  type: ChessPieceType;
  color: ChessColor;
  hasMoved?: boolean;
}

export type ChessSquare = ChessPiece | null;
export type ChessBoard = ChessSquare[][];

export interface ChessMove {
  from: [number, number];
  to: [number, number];
  piece: ChessPiece;
  captured?: ChessPiece | null;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  promotion?: ChessPieceType;
  san?: string;
}

export type ChessClockMode = 'none' | '1m' | '3m' | '5m' | '10m';

// ----------------- CHECKERS TYPES -----------------
export interface CheckersPiece {
  id: string;
  player: 1 | 2;
  isKing: boolean;
  row: number;
  col: number;
}

export interface CheckersMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captures?: [number, number];
  isPromotion?: boolean;
}

// ----------------- CONNECT 4 TYPES -----------------
export type Connect4Cell = 0 | 1 | 2; // 0 = empty, 1 = P1, 2 = P2
export type Connect4Board = Connect4Cell[][]; // 6 rows x 7 cols
