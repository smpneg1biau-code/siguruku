"use client";

import React from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeButton() {
  const { currentTheme, resolvedMode, toggleQuickMode } = useTheme();

  return (
    <button
      onClick={toggleQuickMode}
      className="p-2 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-bold hover:scale-105 active:scale-95 shadow-2xs"
      style={{
        backgroundColor: currentTheme.colors.card,
        borderColor: currentTheme.colors.border,
        color: currentTheme.colors.text,
      }}
      title={`Ganti ke mode ${resolvedMode === "light" ? "Gelap (Dark)" : "Terang (Light)"}`}
    >
      {resolvedMode === "light" ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span className="hidden md:inline text-[11px]">☀ Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline text-[11px]">🌙 Dark</span>
        </>
      )}
    </button>
  );
}
