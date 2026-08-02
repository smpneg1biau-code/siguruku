"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { Sun, Moon, Laptop, Palette, Check, ChevronDown } from "lucide-react";

export function ThemeSwitcher() {
  const { currentTheme, themeId, colorMode, setTheme, setColorMode, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs hover:opacity-90"
        style={{
          backgroundColor: currentTheme.colors.card,
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.text,
        }}
        title="Ganti Tema & Mode"
      >
        <Palette className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{currentTheme.name}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            backgroundColor: currentTheme.colors.card,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        >
          {/* Quick Mode Toggle */}
          <div className="px-2 py-1.5 border-b mb-1" style={{ borderColor: currentTheme.colors.border }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: currentTheme.colors.textSecondary }}>
              Mode Tampilan
            </span>
            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg border" style={{ backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }}>
              <button
                onClick={() => setColorMode("light")}
                className={`py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                  colorMode === "light" ? "bg-blue-600 text-white shadow-xs" : "hover:opacity-80"
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
              <button
                onClick={() => setColorMode("dark")}
                className={`py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                  colorMode === "dark" ? "bg-blue-600 text-white shadow-xs" : "hover:opacity-80"
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
              <button
                onClick={() => setColorMode("system")}
                className={`py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                  colorMode === "system" ? "bg-blue-600 text-white shadow-xs" : "hover:opacity-80"
                }`}
              >
                <Laptop className="w-3 h-3" /> Auto
              </button>
            </div>
          </div>

          {/* Theme List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider block px-2 py-1" style={{ color: currentTheme.colors.textSecondary }}>
              Pilihan Tema
            </span>
            {themes.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected ? "font-bold" : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: isSelected ? currentTheme.colors.sidebarActive : "transparent",
                    color: isSelected ? currentTheme.colors.primary : currentTheme.colors.text,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border shrink-0"
                      style={{ backgroundColor: t.colors.primary, borderColor: currentTheme.colors.border }}
                    />
                    <span className="truncate">{t.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: currentTheme.colors.primary }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
