import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PaletteId } from '../config/theme.config';

export const ThemePicker: React.FC = () => {
  const {
    activePalette,
    activePaletteId,
    setPalette,
    showThemePicker,
    availablePalettes,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!showThemePicker) return null;

  return (
    <div className="relative" ref={dropdownRef} data-testid="theme-picker-container">
      {/* Trigger Button */}
      <button
        type="button"
        data-testid="theme-picker-btn"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-brand-500/50 text-slate-200 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer group"
        title={`Current theme: ${activePalette.name}`}
      >
        {/* Color Swatch Dot */}
        <span
          className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${activePalette.primaryColor}, ${activePalette.secondaryColor})`,
            boxShadow: `0 0 8px ${activePalette.glowColor}`,
          }}
        />

        <span className="hidden sm:inline font-medium">{activePalette.name}</span>
        <Palette className="h-3.5 w-3.5 text-brand-400 transition-colors" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          data-testid="theme-picker-dropdown"
          className="absolute right-0 mt-2 w-72 p-2 bg-dark-900/95 backdrop-blur-xl border border-dark-700/80 rounded-2xl shadow-2xl shadow-black/80 z-50 animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-dark-800/80 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <span>Accent Color Theme</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 border border-dark-750">
              Dark Canvas
            </span>
          </div>

          {/* Palette List */}
          <div className="flex flex-col gap-1">
            {availablePalettes.map((palette) => {
              const isSelected = palette.id === activePaletteId;
              return (
                <button
                  key={palette.id}
                  type="button"
                  role="menuitem"
                  data-testid={`palette-option-${palette.id}`}
                  onClick={() => {
                    setPalette(palette.id as PaletteId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-500/15 border border-brand-500/40 text-white shadow-sm'
                      : 'hover:bg-dark-800/80 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch Pill with Glow */}
                    <div
                      className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${palette.primaryColor}, ${palette.secondaryColor})`,
                        boxShadow: isSelected ? `0 0 10px ${palette.glowColor}` : 'none',
                      }}
                    />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold tracking-tight">{palette.name}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-brand-500/20 text-brand-300 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {palette.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-brand-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
