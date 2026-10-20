import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { VictoryModal } from '../../components/VictoryModal';
import { useGameTheme } from '../../context/ThemeContext';
import { sound } from '../../utils/audio';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  trail: { x: number; y: number; alpha: number }[];
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

interface PowerUp {
  x: number;
  y: number;
  type: 'multiball' | 'speed' | 'expand';
  radius: number;
  pulse: number;
}

export const CyberPongGame: React.FC = () => {
  const { currentTheme, recordGameResult } = useGameTheme();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match settings & score state
  const [targetScore, setTargetScore] = useState<number>(7);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // Active game variables in refs to run buttery 60fps loop without React re-render lag
  const stateRef = useRef({
    p1Score: 0,
    p2Score: 0,
    targetScore: 7,
    p1Y: 250,
    p2Y: 250,
    paddleHeight: 90,
    p1Height: 90,
    p2Height: 90,
    paddleWidth: 14,
    paddleSpeed: 9,
    balls: [] as Ball[],
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    keys: {
      w: false,
      s: false,
      arrowUp: false,
      arrowDown: false,
    },
    shakeTime: 0,
    isPlaying: false,
  });

  const resetBall = (direction: 1 | -1): Ball => {
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -54 to +54 deg
    const speed = 7;
    return {
      x: 450,
      y: 250,
      vx: Math.cos(angle) * speed * direction,
      vy: Math.sin(angle) * speed,
      radius: 8,
      speed,
      trail: [],
    };
  };

  const startMatch = useCallback(() => {
    stateRef.current.p1Score = 0;
    stateRef.current.p2Score = 0;
    stateRef.current.p1Y = 250;
    stateRef.current.p2Y = 250;
    stateRef.current.p1Height = 90;
    stateRef.current.p2Height = 90;
    stateRef.current.balls = [resetBall(Math.random() > 0.5 ? 1 : -1)];
    stateRef.current.particles = [];
    stateRef.current.powerUps = [];
    stateRef.current.isPlaying = true;
    stateRef.current.targetScore = targetScore;

    setP1Score(0);
    setP2Score(0);
    setGameOver(false);
    setWinner(null);
    setIsPlaying(true);
  }, [targetScore]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') stateRef.current.keys.w = true;
      if (k === 's') stateRef.current.keys.s = true;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stateRef.current.keys.arrowUp = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stateRef.current.keys.arrowDown = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => {
          const next = !prev;
          stateRef.current.isPlaying = next;
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') stateRef.current.keys.w = false;
      if (k === 's') stateRef.current.keys.s = false;
      if (e.key === 'ArrowUp') stateRef.current.keys.arrowUp = false;
      if (e.key === 'ArrowDown') stateRef.current.keys.arrowDown = false;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let powerUpTimer = 0;

    const spawnParticles = (x: number, y: number, color: string, count: number = 14) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 5 + 1.5;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 4 + 2,
          color,
          alpha: 1,
        });
      }
    };

    // Initialize with 1 ball if empty
    if (stateRef.current.balls.length === 0) {
      stateRef.current.balls = [resetBall(1)];
    }

    const loop = () => {
      const state = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // Update positions if playing
      if (state.isPlaying) {
        // Player 1 input
        if (state.keys.w && state.p1Y - state.p1Height / 2 > 8) {
          state.p1Y -= state.paddleSpeed;
        }
        if (state.keys.s && state.p1Y + state.p1Height / 2 < H - 8) {
          state.p1Y += state.paddleSpeed;
        }

        // Player 2 input
        if (state.keys.arrowUp && state.p2Y - state.p2Height / 2 > 8) {
          state.p2Y -= state.paddleSpeed;
        }
        if (state.keys.arrowDown && state.p2Y + state.p2Height / 2 < H - 8) {
          state.p2Y += state.paddleSpeed;
        }

        // Spawn power-ups periodically
        powerUpTimer++;
        if (powerUpTimer > 500 && state.powerUps.length < 2) {
          powerUpTimer = 0;
          const types: ('multiball' | 'speed' | 'expand')[] = ['multiball', 'speed', 'expand'];
          state.powerUps.push({
            x: 250 + Math.random() * 400,
            y: 80 + Math.random() * 340,
            type: types[Math.floor(Math.random() * types.length)],
            radius: 14,
            pulse: 0,
          });
        }

        // Screen shake decay
        if (state.shakeTime > 0) state.shakeTime--;

        // Update Balls
        for (let i = state.balls.length - 1; i >= 0; i--) {
          const b = state.balls[i];

          // Trail
          b.trail.unshift({ x: b.x, y: b.y, alpha: 0.6 });
          if (b.trail.length > 8) b.trail.pop();
          b.trail.forEach((t) => (t.alpha *= 0.85));

          b.x += b.vx;
          b.y += b.vy;

          // Wall bounce (top / bottom)
          if (b.y - b.radius <= 0) {
            b.y = b.radius;
            b.vy = -b.vy;
            sound.playPaddleHit(true);
            spawnParticles(b.x, b.y, '#ffffff', 6);
          } else if (b.y + b.radius >= H) {
            b.y = H - b.radius;
            b.vy = -b.vy;
            sound.playPaddleHit(true);
            spawnParticles(b.x, b.y, '#ffffff', 6);
          }

          // Paddle 1 Collision (Left side)
          const p1Left = 30;
          const p1Right = p1Left + state.paddleWidth;
          const p1Top = state.p1Y - state.p1Height / 2;
          const p1Bottom = state.p1Y + state.p1Height / 2;

          if (
            b.vx < 0 &&
            b.x - b.radius <= p1Right &&
            b.x + b.radius >= p1Left &&
            b.y >= p1Top - 6 &&
            b.y <= p1Bottom + 6
          ) {
            b.x = p1Right + b.radius;
            // Angular deflection based on where ball hits paddle
            const hitOffset = (b.y - state.p1Y) / (state.p1Height / 2); // -1 to 1
            const maxAngle = (Math.PI / 4) * 1.2; // up to ~55 deg
            const angle = hitOffset * maxAngle;
            b.speed = Math.min(18, b.speed + 0.5); // speed surge
            b.vx = Math.cos(angle) * b.speed;
            b.vy = Math.sin(angle) * b.speed;
            sound.playPaddleHit(false);
            spawnParticles(b.x, b.y, currentTheme.p1Color, 12);
          }

          // Paddle 2 Collision (Right side)
          const p2Right = W - 30;
          const p2Left = p2Right - state.paddleWidth;
          const p2Top = state.p2Y - state.p2Height / 2;
          const p2Bottom = state.p2Y + state.p2Height / 2;

          if (
            b.vx > 0 &&
            b.x + b.radius >= p2Left &&
            b.x - b.radius <= p2Right &&
            b.y >= p2Top - 6 &&
            b.y <= p2Bottom + 6
          ) {
            b.x = p2Left - b.radius;
            const hitOffset = (b.y - state.p2Y) / (state.p2Height / 2);
            const maxAngle = (Math.PI / 4) * 1.2;
            const angle = hitOffset * maxAngle;
            b.speed = Math.min(18, b.speed + 0.5);
            b.vx = -Math.cos(angle) * b.speed;
            b.vy = Math.sin(angle) * b.speed;
            sound.playPaddleHit(false);
            spawnParticles(b.x, b.y, currentTheme.p2Color, 12);
          }

          // Power-up collisions
          for (let pIdx = state.powerUps.length - 1; pIdx >= 0; pIdx--) {
            const p = state.powerUps[pIdx];
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            if (Math.hypot(dx, dy) < b.radius + p.radius) {
              sound.playCheck();
              spawnParticles(p.x, p.y, '#eab308', 20);

              if (p.type === 'multiball') {
                state.balls.push(resetBall(b.vx > 0 ? 1 : -1));
              } else if (p.type === 'speed') {
                b.speed = Math.min(22, b.speed * 1.4);
                b.vx *= 1.4;
                b.vy *= 1.4;
              } else if (p.type === 'expand') {
                if (b.vx > 0) state.p1Height = 135;
                else state.p2Height = 135;
                setTimeout(() => {
                  state.p1Height = 90;
                  state.p2Height = 90;
                }, 8000);
              }
              state.powerUps.splice(pIdx, 1);
            }
          }

          // Goal: Left player conceded (P2 scores)
          if (b.x < 0) {
            sound.playExplosion();
            spawnParticles(0, b.y, currentTheme.p2Color, 30);
            state.shakeTime = 12;
            state.balls.splice(i, 1);

            state.p2Score++;
            setP2Score(state.p2Score);

            if (state.p2Score >= state.targetScore) {
              state.isPlaying = false;
              setIsPlaying(false);
              setGameOver(true);
              setWinner(2);
              recordGameResult('cyberpong', 2);
            } else if (state.balls.length === 0) {
              setTimeout(() => {
                stateRef.current.balls = [resetBall(1)];
              }, 600);
            }
          }
          // Goal: Right player conceded (P1 scores)
          else if (b.x > W) {
            sound.playExplosion();
            spawnParticles(W, b.y, currentTheme.p1Color, 30);
            state.shakeTime = 12;
            state.balls.splice(i, 1);

            state.p1Score++;
            setP1Score(state.p1Score);

            if (state.p1Score >= state.targetScore) {
              state.isPlaying = false;
              setIsPlaying(false);
              setGameOver(true);
              setWinner(1);
              recordGameResult('cyberpong', 1);
            } else if (state.balls.length === 0) {
              setTimeout(() => {
                stateRef.current.balls = [resetBall(-1)];
              }, 600);
            }
          }
        }
      }

      // ----------------- RENDER -----------------
      ctx.save();

      // Screen shake
      if (state.shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }

      // Clear Canvas Background
      ctx.fillStyle = currentTheme.bgMain;
      ctx.fillRect(0, 0, W, H);

      // Arena Center Line
      ctx.strokeStyle = `${currentTheme.borderColor}66`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center ring
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Power-ups
      state.powerUps.forEach((p) => {
        p.pulse = (p.pulse + 0.05) % (Math.PI * 2);
        const r = p.radius + Math.sin(p.pulse) * 2;
        ctx.fillStyle = p.type === 'multiball' ? '#06b6d4' : p.type === 'speed' ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'multiball' ? 'x3' : p.type === 'speed' ? 'SPD' : 'MAX', p.x, p.y);
      });

      // Draw Ball Trails & Balls
      state.balls.forEach((b) => {
        // Trail
        b.trail.forEach((t) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, b.radius * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.4})`;
          ctx.fill();
        });

        // Ball Glow & Body
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Paddles
      // Paddle 1 (Left)
      const p1Top = state.p1Y - state.p1Height / 2;
      ctx.fillStyle = currentTheme.p1Color;
      ctx.shadowColor = currentTheme.p1Color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(30, p1Top, state.paddleWidth, state.p1Height, 6);
      ctx.fill();

      // Paddle 2 (Right)
      const p2Top = state.p2Y - state.p2Height / 2;
      ctx.fillStyle = currentTheme.p2Color;
      ctx.shadowColor = currentTheme.p2Color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(W - 30 - state.paddleWidth, p2Top, state.paddleWidth, state.p2Height, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
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

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [currentTheme]);

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto py-6 px-4">
      {/* Score Header HUD */}
      <div
        className="w-full max-w-3xl flex items-center justify-between p-4 mb-4 rounded-2xl border shadow-xl"
        style={{
          backgroundColor: currentTheme.bgSurface,
          borderColor: currentTheme.borderColor,
        }}
      >
        {/* Player 1 HUD */}
        <div className="flex items-center gap-3">
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: currentTheme.p1Color }}
          />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {currentTheme.p1Name}
            </div>
            <div className="text-[11px] font-mono text-slate-400">Keys: [W] / [S]</div>
          </div>
        </div>

        {/* Big Score Board */}
        <div className="flex items-center gap-6">
          <span
            className="text-4xl font-black font-mono tabular-nums drop-shadow-md"
            style={{ color: currentTheme.p1Color }}
          >
            {p1Score}
          </span>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            First to {targetScore}
          </span>
          <span
            className="text-4xl font-black font-mono tabular-nums drop-shadow-md"
            style={{ color: currentTheme.p2Color }}
          >
            {p2Score}
          </span>
        </div>

        {/* Player 2 HUD */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {currentTheme.p2Name}
            </div>
            <div className="text-[11px] font-mono text-slate-400">Keys: [↑] / [↓]</div>
          </div>
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: currentTheme.p2Color }}
          />
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden border shadow-2xl"
        style={{
          borderColor: currentTheme.borderColor,
          boxShadow: `0 0 40px rgba(0,0,0,0.8)`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          className="w-full h-auto block select-none"
        />

        {/* Pause / Start overlay if not actively playing */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 text-white">
              <Zap className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Cyber Pong Arcade</h3>
            <p className="text-xs text-slate-300 max-w-sm mb-5">
              Player 1 controls left paddle via <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">W</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">S</kbd>.
              Player 2 controls right paddle via <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">↑</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">↓</kbd>.
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
              Start Match
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar & Touch buttons for tablets/phones */}
      <div className="w-full max-w-3xl mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Target score selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Game Point Target:
          </span>
          {[5, 7, 10].map((pts) => (
            <button
              key={pts}
              onClick={() => {
                sound.playClick();
                setTargetScore(pts);
                stateRef.current.targetScore = pts;
              }}
              className={`px-3 py-1 text-xs font-mono rounded-lg border transition-colors ${
                targetScore === pts
                  ? 'bg-white text-slate-900 font-bold border-white'
                  : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pts}
            </button>
          ))}
        </div>

        {/* Pause and Reset Buttons */}
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
              startMatch();
            }}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Score</span>
          </button>
        </div>
      </div>

      {/* Touch Screen Mobile Paddles Bar (visible on touch devices) */}
      <div className="w-full max-w-3xl mt-3 grid grid-cols-2 gap-4 lg:hidden">
        {/* P1 Left Controls */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-around">
          <span className="text-xs font-bold text-cyan-400">P1 Touch</span>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.keys.w = true)}
              onTouchEnd={() => (stateRef.current.keys.w = false)}
              className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg active:bg-cyan-500 active:text-slate-900"
            >
              ▲
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.s = true)}
              onTouchEnd={() => (stateRef.current.keys.s = false)}
              className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg active:bg-cyan-500 active:text-slate-900"
            >
              ▼
            </button>
          </div>
        </div>

        {/* P2 Right Controls */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-around">
          <span className="text-xs font-bold text-rose-400">P2 Touch</span>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.keys.arrowUp = true)}
              onTouchEnd={() => (stateRef.current.keys.arrowUp = false)}
              className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg active:bg-rose-500 active:text-slate-900"
            >
              ▲
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.arrowDown = true)}
              onTouchEnd={() => (stateRef.current.keys.arrowDown = false)}
              className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg active:bg-rose-500 active:text-slate-900"
            >
              ▼
            </button>
          </div>
        </div>
      </div>

      <VictoryModal
        isOpen={gameOver}
        winner={winner}
        winReason={`First to reach ${targetScore} points!`}
        onRematch={startMatch}
      />
    </div>
  );
};
