import React from 'react';
import { ChessPieceType, ChessColor, PieceStyle } from '../types/game';

interface ChessPieceIconProps {
  type: ChessPieceType;
  color: ChessColor;
  p1Color: string;
  p2Color: string;
  style?: PieceStyle;
  className?: string;
}

export const ChessPieceIcon: React.FC<ChessPieceIconProps> = ({
  type,
  color,
  p1Color,
  p2Color,
  style = 'modern',
  className = 'w-10 h-10',
}) => {
  const isWhite = color === 'w';
  const fill = isWhite ? p1Color : p2Color;
  const stroke = isWhite ? '#ffffff' : '#1e1e24';
  const isNeon = style === 'neon';

  // SVG paths for Staunton / Modern chess pieces
  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="22.5"
            cy="14"
            r="6"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
          />
          <path
            d="M17 38h11c1 0 2-1 2-2 0-3-4-8-4-12h-7c0 4-4 9-4 12 0 1 1 2 2 2z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M14 38h17v3H14v-3z"
            fill={isNeon ? fill : isWhite ? '#ffffff' : '#000000'}
            opacity={isNeon ? '0.8' : '0.3'}
          />
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 39h23v3H11v-3zM14 36h17l-1-17h-15l-1 17z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M13 14h3v5h4v-5h5v5h4v-5h3v5H13v-5z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <rect x="12" y="38.5" width="21" height="2" fill={isWhite ? '#ffffff' : '#000000'} opacity="0.3" />
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10c-3 0-6 2-7 5-2 4-1 9-4 11-1 1-1 3 0 4 2 2 6 3 9 3 1-1 2-2 3-4l4-1c2 0 4-2 4-5 0-3-1-5-3-7-1-4-3-6-6-6z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M13 38h20v3H13v-3z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
          />
          <circle cx="21" cy="16" r="1.5" fill={isNeon ? fill : stroke} />
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22.5" cy="9.5" r="2" fill={isNeon ? fill : stroke} />
          <path
            d="M22.5 12c-4 0-8 6-8 12 0 4 3 8 6 9l-1 4h6l-1-4c3-1 6-5 6-9 0-6-4-12-8-12z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path d="M19 18l7 7M26 18l-7 7" stroke={isNeon ? fill : stroke} strokeWidth="1.5" />
          <path d="M13 38h19v3H13v-3z" fill={isNeon ? 'none' : fill} stroke={isNeon ? fill : stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="13" r="1.5" fill={isNeon ? fill : stroke} />
          <circle cx="15.75" cy="10" r="1.5" fill={isNeon ? fill : stroke} />
          <circle cx="22.5" cy="8.5" r="1.5" fill={isNeon ? fill : stroke} />
          <circle cx="29.25" cy="10" r="1.5" fill={isNeon ? fill : stroke} />
          <circle cx="36" cy="13" r="1.5" fill={isNeon ? fill : stroke} />
          <path
            d="M10 16l3 13h19l3-13-6 7-6.5-10-6.5 10-6-7z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M13 30h19c1 3-1 6-2 7H15c-1-1-3-4-2-7zM11 38h23v3H11v-3z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.5 7v6M19.5 9.5h6" stroke={isNeon ? fill : stroke} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M22.5 13c-5 0-9 4-9 9 0 4 2 7 5 9l-1 5h10l-1-5c3-2 5-5 5-9 0-5-4-9-9-9z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M12 38h21v3H12v-3z"
            fill={isNeon ? 'none' : fill}
            stroke={isNeon ? fill : stroke}
            strokeWidth={isNeon ? '2.5' : '1.5'}
          />
          <circle cx="22.5" cy="22" r="2.5" fill={isNeon ? fill : stroke} opacity="0.7" />
        </svg>
      );

    default:
      return null;
  }
};

interface CheckersPieceIconProps {
  player: 1 | 2;
  isKing: boolean;
  p1Color: string;
  p2Color: string;
  style?: PieceStyle;
  className?: string;
}

export const CheckersPieceIcon: React.FC<CheckersPieceIconProps> = ({
  player,
  isKing,
  p1Color,
  p2Color,
  className = 'w-10 h-10',
}) => {
  const color = player === 1 ? p1Color : p2Color;

  return (
    <svg viewBox="0 0 44 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer base shadow */}
      <circle cx="22" cy="24" r="18" fill="#000000" opacity="0.4" />
      {/* Outer disc */}
      <circle cx="22" cy="22" r="18" fill={color} />
      {/* Concentric ridge */}
      <circle cx="22" cy="22" r="14" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="10" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* King Crown if crowned */}
      {isKing && (
        <path
          d="M14 26l3-8 5 4 5-4 3 8H14zM22 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 19a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zM28 19a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.8"
        />
      )}
    </svg>
  );
};
