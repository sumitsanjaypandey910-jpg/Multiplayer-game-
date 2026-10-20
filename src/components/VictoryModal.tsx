import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { useGameTheme } from '../context/ThemeContext';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  winner: 1 | 2 | 'draw' | null;
  winReason?: string;
  onRematch: () => void;
  onSelectAnotherGame?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winner,
  winReason,
  onRematch,
  onSelectAnotherGame,
}) => {
  const { currentTheme } = useGameTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !winner) return;
    sound.playVictory();

    // Canvas particle burst
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const winnerColor = winner === 1 ? currentTheme.p1Color : winner === 2 ? currentTheme.p2Color : '#f8fafc';
    const colors = [winnerColor, '#ffffff', '#eab308', currentTheme.p1Color, currentTheme.p2Color];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
      opacity: number;
      shape: 'rect' | 'circle';
    }

    const particles: Particle[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2,
        y: height / 2 + 40,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.007;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      if (alive) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, winner, currentTheme]);

  if (!isOpen) return null;

  const winnerName =
    winner === 1 ? currentTheme.p1Name : winner === 2 ? currentTheme.p2Name : 'Nobody';
  const winnerColor =
    winner === 1 ? currentTheme.p1Color : winner === 2 ? currentTheme.p2Color : '#94a3b8';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-20 w-full max-w-md p-8 rounded-2xl border text-center shadow-2xl overflow-hidden"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
            boxShadow: `0 0 50px ${winnerColor}33`,
          }}
        >
          {/* Ambient header glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ backgroundColor: winnerColor }}
          />

          <div className="relative">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${winnerColor}20`,
                borderColor: `${winnerColor}60`,
                color: winnerColor,
              }}
            >
              {winner === 'draw' ? (
                <Sparkles className="w-8 h-8" />
              ) : (
                <Trophy className="w-8 h-8" />
              )}
            </div>

            <div className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-1">
              Match Concluded
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              {winner === 'draw' ? 'Stalemate / Draw' : `${winnerName} Victorious!`}
            </h2>

            {winReason && (
              <p className="text-sm text-slate-400 mb-6 font-medium">
                {winReason}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => {
                  sound.playClick();
                  onRematch();
                }}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-slate-900"
                style={{
                  backgroundColor: winnerColor,
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>

              {onSelectAnotherGame && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onSelectAnotherGame();
                  }}
                  className="py-3 px-4 rounded-xl font-medium text-sm border text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-white/5 active:scale-95"
                  style={{ borderColor: currentTheme.borderColor }}
                >
                  Game Menu
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
