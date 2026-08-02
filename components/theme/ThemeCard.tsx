"use client";

import React from "react";
import { ThemeConfig } from "@/lib/theme/theme-types";
import { ThemePreview } from "./ThemePreview";
import { Check, Sun, Moon } from "lucide-react";

interface ThemeCardProps {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: (id: ThemeConfig["id"]) => void;
}

export function ThemeCard({ theme, isActive, onSelect }: ThemeCardProps) {
  const { id, name, description, isDark, colors } = theme;

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
        isActive
          ? "ring-2 ring-offset-2 ring-blue-500 shadow-md border-blue-500"
          : "hover:shadow-lg hover:border-gray-300"
      }`}
      style={{
        backgroundColor: colors.card,
        borderColor: isActive ? colors.primary : colors.border,
        color: colors.text,
      }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              color: colors.textSecondary,
              borderColor: colors.border,
            }}
          >
            {isDark ? <Moon className="w-3 h-3 text-purple-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
            {isDark ? "Dark Theme" : "Light Theme"}
          </span>

          {isActive && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 text-white shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Check className="w-3.5 h-3.5" />
              Aktif
            </span>
          )}
        </div>

        {/* Visual Preview */}
        <div className="mb-4">
          <ThemePreview theme={theme} isActive={isActive} />
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-base mb-1" style={{ color: colors.text }}>
          {name}
        </h3>
        <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: colors.textSecondary }}>
          {description}
        </p>
      </div>

      <div>
        {/* Color Palette Swatches */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] font-medium mr-1" style={{ color: colors.textSecondary }}>
            Palet:
          </span>
          {[colors.background, colors.sidebar, colors.primary, colors.card, colors.text].map(
            (hex, idx) => (
              <span
                key={idx}
                className="w-4 h-4 rounded-full border shadow-xs"
                style={{ backgroundColor: hex, borderColor: colors.border }}
                title={hex}
              />
            )
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isActive
              ? "opacity-90 cursor-default"
              : "hover:opacity-90 active:scale-[0.99]"
          }`}
          style={{
            backgroundColor: isActive ? colors.primary : colors.sidebarHover,
            color: isActive ? "#FFFFFF" : colors.text,
            border: `1px solid ${isActive ? colors.primary : colors.border}`,
          }}
        >
          {isActive ? (
            <>
              <Check className="w-4 h-4" />
              Sedang Digunakan
            </>
          ) : (
            "Gunakan Tema Ini"
          )}
        </button>
      </div>
    </div>
  );
}
