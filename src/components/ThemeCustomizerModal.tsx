import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Volume2, VolumeX, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { useGameTheme, THEME_PRESETS } from '../context/ThemeContext';
import { ThemeId, PieceStyle, BoardStyle } from '../types/game';
import { sound } from '../utils/audio';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const P1_SWATCHES = ['#06b6d4', '#10b981', '#eab308', '#38bdf8', '#f8fafc', '#a855f7', '#6366f1'];
const P2_SWATCHES = ['#f43f5e', '#ec4899', '#f97316', '#a855f7', '#94a3b8', '#ef4444', '#fb7185'];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { settings, currentTheme, updateSettings, updateCustomTheme } = useGameTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl text-slate-100"
          style={{
            backgroundColor: currentTheme.bgSurface,
            borderColor: currentTheme.borderColor,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${currentTheme.p1Color}20`,
                  borderColor: `${currentTheme.p1Color}50`,
                  color: currentTheme.p1Color,
                }}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Visual & Theme Studio</h3>
                <p className="text-xs text-slate-400">Curate your minimalist dark aesthetic and player colors</p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 pt-5">
            {/* Presets Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Minimalist Dark Themes
                </span>
                <span className="text-xs text-slate-500">{THEME_PRESETS[settings.themeId]?.name || 'Custom'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(THEME_PRESETS) as ThemeId[]).map((themeKey) => {
                  const preset = THEME_PRESETS[themeKey];
                  const isSelected = settings.themeId === themeKey;
                  return (
                    <button
                      key={themeKey}
                      onClick={() => {
                        sound.playClick();
                        updateSettings({ themeId: themeKey });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'ring-2 shadow-lg'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                      }`}
                      style={{
                        borderColor: isSelected ? currentTheme.p1Color : undefined,
                        backgroundColor: preset.bgSurface,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: preset.p1Color }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: preset.p2Color }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-white truncate">{preset.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Overrides */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Player Accent Colors
                </div>
                <span className="text-xs text-slate-500">Instant Live Preview</span>
              </div>

              {/* Player 1 Color */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Player 1 (Left / White)</span>
                  <span className="font-mono text-[11px] text-slate-300">{currentTheme.p1Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {P1_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        onClick={() => {
                          sound.playClick();
                          updateCustomTheme({ p1Color: swatch });
                        }}
                        className={`w-7 h-7 rounded-lg transition-transform active:scale-95 ${
                          currentTheme.p1Color.toLowerCase() === swatch.toLowerCase()
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={currentTheme.p1Color}
                    onChange={(e) => updateCustomTheme({ p1Color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 ml-auto"
                    title="Custom Hex Picker"
                  />
                </div>
              </div>

              {/* Player 2 Color */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Player 2 (Right / Black)</span>
                  <span className="font-mono text-[11px] text-slate-300">{currentTheme.p2Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {P2_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        onClick={() => {
                          sound.playClick();
                          updateCustomTheme({ p2Color: swatch });
                        }}
                        className={`w-7 h-7 rounded-lg transition-transform active:scale-95 ${
                          currentTheme.p2Color.toLowerCase() === swatch.toLowerCase()
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={currentTheme.p2Color}
                    onChange={(e) => updateCustomTheme({ p2Color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 ml-auto"
                    title="Custom Hex Picker"
                  />
                </div>
              </div>
            </div>

            {/* Graphic Piece Style */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Piece Graphic Style
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['modern', 'classic', 'neon'] as PieceStyle[]).map((style) => {
                  const isSelected = settings.pieceStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => {
                        sound.playClick();
                        updateSettings({ pieceStyle: style });
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm'
                          : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Board Surface Style */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Board Texture & Style
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['minimal', 'glass', 'carbon', 'tactical'] as BoardStyle[]).map((bStyle) => {
                  const isSelected = settings.boardStyle === bStyle;
                  return (
                    <button
                      key={bStyle}
                      onClick={() => {
                        sound.playClick();
                        updateSettings({ boardStyle: bStyle });
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {bStyle}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound FX & Ergonomics */}
            <div className="pt-2 border-t border-slate-800 space-y-3.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audio & Controls Ergonomics
              </span>

              {/* Sound Toggle & Volume */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const next = !settings.soundEnabled;
                      sound.setConfig(next, settings.soundVolume);
                      if (next) sound.playClick();
                      updateSettings({ soundEnabled: next });
                    }}
                    className={`p-2 rounded-lg border transition-colors ${
                      settings.soundEnabled
                        ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
                        : 'border-slate-700 text-slate-500 bg-slate-800/40'
                    }`}
                  >
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="text-xs font-medium text-white">Synthesized Audio FX</div>
                    <div className="text-[11px] text-slate-400">Procedural moves, hits, and chimes</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!settings.soundEnabled}
                    value={settings.soundVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      sound.setConfig(settings.soundEnabled, val);
                      updateSettings({ soundVolume: val });
                    }}
                    className="w-24 accent-cyan-400 cursor-pointer disabled:opacity-30"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Tabletop Head-to-Head Rotation Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg border border-slate-700 text-slate-400 bg-slate-800/40">
                    {settings.headToHeadRotation ? (
                      <Smartphone className="w-4 h-4 text-emerald-400 rotate-180" />
                    ) : (
                      <Monitor className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Tabletop 180° Inversion</div>
                    <div className="text-[11px] text-slate-400">
                      Flips Player 2's side for playing across a tablet or desk
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    updateSettings({ headToHeadRotation: !settings.headToHeadRotation });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.headToHeadRotation ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.headToHeadRotation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Keyboard Guide */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div>
                  <div className="text-xs font-medium text-white">Keyboard Reference HUD</div>
                  <div className="text-[11px] text-slate-400">Display active key bindings for P1 & P2</div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    updateSettings({ showKeyboardGuide: !settings.showKeyboardGuide });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showKeyboardGuide ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showKeyboardGuide ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-md"
            >
              Done Customizing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
