import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Crosshair } from 'lucide-react';
import { VictoryModal } from '../../components/VictoryModal';
import { useGameTheme } from '../../context/ThemeContext';
import { sound } from '../../utils/audio';

interface Tank {
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  health: number; // 100
  shields: number; // 0 or 1
  cooldown: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 1 | 2;
  bounces: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Barrier {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export const LaserTanksGame: React.FC = () => {
  const { currentTheme, recordGameResult } = useGameTheme();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  const stateRef = useRef({
    p1: {
      x: 100,
      y: 250,
      angle: 0,
      speed: 3,
      health: 100,
      shields: 0,
      cooldown: 0,
      color: currentTheme.p1Color,
    } as Tank,
    p2: {
      x: 800,
      y: 250,
      angle: Math.PI,
      speed: 3,
      health: 100,
      shields: 0,
      cooldown: 0,
      color: currentTheme.p2Color,
    } as Tank,
    bullets: [] as Bullet[],
    barriers: [] as Barrier[],
    particles: [] as Particle[],
    keys: {
      w: false,
      s: false,
      a: false,
      d: false,
      space: false,
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false,
      enter: false,
    },
    isPlaying: false,
    p1Wins: 0,
    p2Wins: 0,
    round: 1,
  });

  const initRound = useCallback(() => {
    stateRef.current.p1 = {
      x: 100,
      y: 250,
      angle: 0,
      speed: 3.2,
      health: 100,
      shields: 0,
      cooldown: 0,
      color: currentTheme.p1Color,
    };
    stateRef.current.p2 = {
      x: 800,
      y: 250,
      angle: Math.PI,
      speed: 3.2,
      health: 100,
      shields: 0,
      cooldown: 0,
      color: currentTheme.p2Color,
    };
    stateRef.current.bullets = [];
    stateRef.current.particles = [];

    // Map obstacles: central maze blocks
    stateRef.current.barriers = [
      // Central pillar
      { x: 420, y: 190, w: 60, h: 120, hp: 4 },
      // Top blocks
      { x: 260, y: 90, w: 40, h: 90, hp: 3 },
      { x: 600, y: 90, w: 40, h: 90, hp: 3 },
      // Bottom blocks
      { x: 260, y: 320, w: 40, h: 90, hp: 3 },
      { x: 600, y: 320, w: 40, h: 90, hp: 3 },
    ];
  }, [currentTheme]);

  const restartAll = useCallback(() => {
    stateRef.current.p1Wins = 0;
    stateRef.current.p2Wins = 0;
    stateRef.current.round = 1;
    setP1Wins(0);
    setP2Wins(0);
    setRound(1);
    setGameOver(false);
    setWinner(null);
    initRound();
    setIsPlaying(true);
    stateRef.current.isPlaying = true;
  }, [initRound]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') stateRef.current.keys.w = true;
      if (k === 's') stateRef.current.keys.s = true;
      if (k === 'a') stateRef.current.keys.a = true;
      if (k === 'd') stateRef.current.keys.d = true;
      if (e.code === 'Space') {
        e.preventDefault();
        stateRef.current.keys.space = true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stateRef.current.keys.arrowUp = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stateRef.current.keys.arrowDown = true;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stateRef.current.keys.arrowLeft = true;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stateRef.current.keys.arrowRight = true;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        stateRef.current.keys.enter = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') stateRef.current.keys.w = false;
      if (k === 's') stateRef.current.keys.s = false;
      if (k === 'a') stateRef.current.keys.a = false;
      if (k === 'd') stateRef.current.keys.d = false;
      if (e.code === 'Space') stateRef.current.keys.space = false;
      if (e.key === 'ArrowUp') stateRef.current.keys.arrowUp = false;
      if (e.key === 'ArrowDown') stateRef.current.keys.arrowDown = false;
      if (e.key === 'ArrowLeft') stateRef.current.keys.arrowLeft = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.arrowRight = false;
      if (e.key === 'Enter') stateRef.current.keys.enter = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    initRound();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 3 + 1.5,
          color,
          alpha: 1,
        });
      }
    };

    const loop = () => {
      const state = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      if (state.isPlaying) {
        // --- Player 1 Logic ---
        if (state.keys.a) state.p1.angle -= 0.06;
        if (state.keys.d) state.p1.angle += 0.06;
        if (state.keys.w) {
          const nx = state.p1.x + Math.cos(state.p1.angle) * state.p1.speed;
          const ny = state.p1.y + Math.sin(state.p1.angle) * state.p1.speed;
          if (nx > 25 && nx < W - 25 && ny > 25 && ny < H - 25) {
            state.p1.x = nx;
            state.p1.y = ny;
          }
        }
        if (state.keys.s) {
          const nx = state.p1.x - Math.cos(state.p1.angle) * (state.p1.speed * 0.7);
          const ny = state.p1.y - Math.sin(state.p1.angle) * (state.p1.speed * 0.7);
          if (nx > 25 && nx < W - 25 && ny > 25 && ny < H - 25) {
            state.p1.x = nx;
            state.p1.y = ny;
          }
        }

        // P1 Shooting
        if (state.p1.cooldown > 0) state.p1.cooldown--;
        if (state.keys.space && state.p1.cooldown === 0) {
          const activeP1Bullets = state.bullets.filter((b) => b.owner === 1).length;
          if (activeP1Bullets < 4) {
            sound.playLaser();
            const bSpeed = 7.5;
            const muzzleX = state.p1.x + Math.cos(state.p1.angle) * 26;
            const muzzleY = state.p1.y + Math.sin(state.p1.angle) * 26;
            state.bullets.push({
              x: muzzleX,
              y: muzzleY,
              vx: Math.cos(state.p1.angle) * bSpeed,
              vy: Math.sin(state.p1.angle) * bSpeed,
              owner: 1,
              bounces: 0,
              radius: 4,
              color: currentTheme.p1Color,
              trail: [],
            });
            state.p1.cooldown = 18;
          }
        }

        // --- Player 2 Logic ---
        if (state.keys.arrowLeft) state.p2.angle -= 0.06;
        if (state.keys.arrowRight) state.p2.angle += 0.06;
        if (state.keys.arrowUp) {
          const nx = state.p2.x + Math.cos(state.p2.angle) * state.p2.speed;
          const ny = state.p2.y + Math.sin(state.p2.angle) * state.p2.speed;
          if (nx > 25 && nx < W - 25 && ny > 25 && ny < H - 25) {
            state.p2.x = nx;
            state.p2.y = ny;
          }
        }
        if (state.keys.arrowDown) {
          const nx = state.p2.x - Math.cos(state.p2.angle) * (state.p2.speed * 0.7);
          const ny = state.p2.y - Math.sin(state.p2.angle) * (state.p2.speed * 0.7);
          if (nx > 25 && nx < W - 25 && ny > 25 && ny < H - 25) {
            state.p2.x = nx;
            state.p2.y = ny;
          }
        }

        // P2 Shooting
        if (state.p2.cooldown > 0) state.p2.cooldown--;
        if (state.keys.enter && state.p2.cooldown === 0) {
          const activeP2Bullets = state.bullets.filter((b) => b.owner === 2).length;
          if (activeP2Bullets < 4) {
            sound.playLaser();
            const bSpeed = 7.5;
            const muzzleX = state.p2.x + Math.cos(state.p2.angle) * 26;
            const muzzleY = state.p2.y + Math.sin(state.p2.angle) * 26;
            state.bullets.push({
              x: muzzleX,
              y: muzzleY,
              vx: Math.cos(state.p2.angle) * bSpeed,
              vy: Math.sin(state.p2.angle) * bSpeed,
              owner: 2,
              bounces: 0,
              radius: 4,
              color: currentTheme.p2Color,
              trail: [],
            });
            state.p2.cooldown = 18;
          }
        }

        // --- Bullets & Ricochet Physics ---
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.trail.unshift({ x: b.x, y: b.y });
          if (b.trail.length > 5) b.trail.pop();

          b.x += b.vx;
          b.y += b.vy;

          // Wall bounces
          let bounced = false;
          if (b.x - b.radius <= 0 || b.x + b.radius >= W) {
            b.vx = -b.vx;
            bounced = true;
          }
          if (b.y - b.radius <= 0 || b.y + b.radius >= H) {
            b.vy = -b.vy;
            bounced = true;
          }

          // Barrier Collisions
          for (let brIdx = state.barriers.length - 1; brIdx >= 0; brIdx--) {
            const br = state.barriers[brIdx];
            if (
              b.x + b.radius >= br.x &&
              b.x - b.radius <= br.x + br.w &&
              b.y + b.radius >= br.y &&
              b.y - b.radius <= br.y + br.h
            ) {
              b.vx = -b.vx;
              bounced = true;
              br.hp--;
              spawnParticles(b.x, b.y, '#94a3b8', 6);
              if (br.hp <= 0) {
                state.barriers.splice(brIdx, 1);
                sound.playExplosion();
              }
              break;
            }
          }

          if (bounced) {
            b.bounces++;
            sound.playPaddleHit(true);
            spawnParticles(b.x, b.y, b.color, 5);
            if (b.bounces > 3) {
              state.bullets.splice(i, 1);
              continue;
            }
          }

          // Hit detection on Tank 1
          const d1 = Math.hypot(b.x - state.p1.x, b.y - state.p1.y);
          if (d1 < 22) {
            sound.playExplosion();
            spawnParticles(state.p1.x, state.p1.y, currentTheme.p1Color, 25);
            state.bullets.splice(i, 1);

            // P2 scores round win!
            state.p2Wins++;
            state.round++;
            setP2Wins(state.p2Wins);
            setRound(state.round);

            if (state.p2Wins >= 5) {
              state.isPlaying = false;
              setIsPlaying(false);
              setGameOver(true);
              setWinner(2);
              recordGameResult('lasertanks', 2);
            } else {
              initRound();
            }
            continue;
          }

          // Hit detection on Tank 2
          const d2 = Math.hypot(b.x - state.p2.x, b.y - state.p2.y);
          if (d2 < 22) {
            sound.playExplosion();
            spawnParticles(state.p2.x, state.p2.y, currentTheme.p2Color, 25);
            state.bullets.splice(i, 1);

            // P1 scores round win!
            state.p1Wins++;
            state.round++;
            setP1Wins(state.p1Wins);
            setRound(state.round);

            if (state.p1Wins >= 5) {
              state.isPlaying = false;
              setIsPlaying(false);
              setGameOver(true);
              setWinner(1);
              recordGameResult('lasertanks', 1);
            } else {
              initRound();
            }
            continue;
          }
        }
      }

      // ----------------- RENDER -----------------
      ctx.fillStyle = currentTheme.bgMain;
      ctx.fillRect(0, 0, W, H);

      // Arena Grid lines
      ctx.strokeStyle = `${currentTheme.borderColor}33`;
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw Obstacles / Barriers
      state.barriers.forEach((br) => {
        ctx.fillStyle = `${currentTheme.borderColor}aa`;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.w, br.h, 6);
        ctx.fill();
        ctx.stroke();

        // Energy shield bar
        ctx.fillStyle = br.hp > 2 ? '#10b981' : br.hp > 1 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(br.x + 4, br.y + br.h - 5, (br.w - 8) * (br.hp / 4), 3);
      });

      // Draw Laser Bullets
      state.bullets.forEach((b) => {
        // Trail
        b.trail.forEach((t, idx) => {
          ctx.fillStyle = b.color;
          ctx.globalAlpha = 0.2 + idx * 0.15;
          ctx.beginPath();
          ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Tanks
      const drawTank = (tank: Tank, color: string) => {
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);

        // Tank Treads
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-20, -18, 40, 7);
        ctx.fillRect(-20, 11, 40, 7);

        // Tank Body
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(-16, -12, 32, 24, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Turret
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Barrel
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -3, 24, 6);

        ctx.restore();
      };

      drawTank(state.p1, currentTheme.p1Color);
      drawTank(state.p2, currentTheme.p2Color);

      // Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [currentTheme, initRound]);

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto py-6 px-4">
      {/* HUD Header */}
      <div
        className="w-full max-w-3xl flex items-center justify-between p-4 mb-4 rounded-2xl border shadow-xl"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: currentTheme.p1Color }}
          />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {currentTheme.p1Name}
            </div>
            <div className="text-[11px] font-mono text-slate-400">WASD + Space</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span
            className="text-4xl font-black font-mono tabular-nums"
            style={{ color: currentTheme.p1Color }}
          >
            {p1Wins}
          </span>
          <div className="text-center">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Round {round}
            </div>
            <div className="text-[10px] text-slate-400">First to 5</div>
          </div>
          <span
            className="text-4xl font-black font-mono tabular-nums"
            style={{ color: currentTheme.p2Color }}
          >
            {p2Wins}
          </span>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {currentTheme.p2Name}
            </div>
            <div className="text-[11px] font-mono text-slate-400">Arrows + Enter</div>
          </div>
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: currentTheme.p2Color }}
          />
        </div>
      </div>

      {/* Arena Canvas */}
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden border shadow-2xl"
        style={{ borderColor: currentTheme.borderColor }}
      >
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          className="w-full h-auto block select-none"
        />

        {/* Start / Pause overlay */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 text-white">
              <Crosshair className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Laser Tanks Arena</h3>
            <p className="text-xs text-slate-300 max-w-sm mb-5">
              Ricochet Laser Combat! Lasers bounce off walls up to 3 times.
              Player 1: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">WASD</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Space</kbd>.
              Player 2: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">Arrows</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">Enter</kbd>.
            </p>
            <button
              onClick={() => {
                sound.playClick();
                setIsPlaying(true);
                stateRef.current.isPlaying = true;
              }}
              className="py-3 px-8 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-200 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-900" />
              Engage Battle
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Ricochet rule: Lasers bounce 3 times before burning out
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setIsPlaying((prev) => {
                const next = !prev;
                stateRef.current.isPlaying = next;
                return next;
              });
            }}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              restartAll();
            }}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Match</span>
          </button>
        </div>
      </div>

      {/* Touch Screen Mobile Buttons (visible on touch devices) */}
      <div className="w-full max-w-3xl mt-3 grid grid-cols-2 gap-4 lg:hidden">
        {/* P1 Controls */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-cyan-400">Player 1 Controls</span>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.keys.a = true)}
              onTouchEnd={() => (stateRef.current.keys.a = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ◀
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.w = true)}
              onTouchEnd={() => (stateRef.current.keys.w = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ▲
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.d = true)}
              onTouchEnd={() => (stateRef.current.keys.d = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ▶
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.space = true)}
              onTouchEnd={() => (stateRef.current.keys.space = false)}
              className="px-3 h-10 rounded-lg bg-cyan-500 text-slate-900 font-bold text-xs"
            >
              FIRE
            </button>
          </div>
        </div>

        {/* P2 Controls */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-rose-400">Player 2 Controls</span>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.keys.arrowLeft = true)}
              onTouchEnd={() => (stateRef.current.keys.arrowLeft = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ◀
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.arrowUp = true)}
              onTouchEnd={() => (stateRef.current.keys.arrowUp = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ▲
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.arrowRight = true)}
              onTouchEnd={() => (stateRef.current.keys.arrowRight = false)}
              className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold"
            >
              ▶
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.enter = true)}
              onTouchEnd={() => (stateRef.current.keys.enter = false)}
              className="px-3 h-10 rounded-lg bg-rose-500 text-slate-900 font-bold text-xs"
            >
              FIRE
            </button>
          </div>
        </div>
      </div>

      <VictoryModal
        isOpen={gameOver}
        winner={winner}
        winReason="Dominated the battlefield in 5 rounds!"
        onRematch={restartAll}
      />
    </div>
  );
};
