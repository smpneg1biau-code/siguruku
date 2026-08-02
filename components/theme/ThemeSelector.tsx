"use client";

import React, { useState } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { ThemeCard } from "./ThemeCard";
import { ColorMode } from "@/lib/theme/theme-types";
import { Sun, Moon, Laptop, Palette, Sparkles } from "lucide-react";

export function ThemeSelector() {
  const { currentTheme, themeId, colorMode, setTheme, setColorMode, themes } = useTheme();
  const [filter, setFilter] = useState<"all" | "light" | "dark">("all");

  const filteredThemes = themes.filter((t) => {
    if (filter === "light") return !t.isDark;
    if (filter === "dark") return t.isDark;
    return true;
  });

  const modes: { id: ColorMode; label: string; icon: React.ElementType; desc: string }[] = [
    {
      id: "light",
      label: "Terang (Light)",
      icon: Sun,
      desc: "Tampilan cerah dengan kontras bersih",
    },
    {
      id: "dark",
      label: "Gelap (Dark)",
      icon: Moon,
      desc: "Tampilan gelap yang nyaman untuk mata",
    },
    {
      id: "system",
      label: "Sistem (Auto)",
      icon: Laptop,
      desc: "Mengikuti pengaturan sistem perangkat",
    },
  ];

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-6 md:p-8 border shadow-sm transition-all duration-300"
        style={{
          backgroundColor: currentTheme.colors.card,
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.text,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: currentTheme.colors.sidebarActive,
                color: currentTheme.colors.primary,
                borderColor: currentTheme.colors.border,
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              Theme Manager
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manajemen Tema Tampilan
            </h2>
            <p className="text-sm max-w-xl" style={{ color: currentTheme.colors.textSecondary }}>
              Pilih dari 8 tema profesional yang disesuaikan untuk kenyamanan administrasi guru. Realtime tanpa refresh halaman.
            </p>
          </div>

          {/* Active Theme Summary Card */}
          <div
            className="p-4 rounded-xl border flex items-center gap-4 shadow-xs self-start md:self-auto min-w-[240px]"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: currentTheme.colors.textSecondary }}>
                Tema Aktif Saat Ini
              </span>
              <p className="font-bold text-sm" style={{ color: currentTheme.colors.text }}>
                {currentTheme.name}
              </p>
              <span className="text-[11px] font-medium" style={{ color: currentTheme.colors.primary }}>
                Mode: {colorMode.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
          <span>Mode Tampilan Tipe Sistem</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = colorMode === m.id;

            return (
              <button
                key={m.id}
                onClick={() => setColorMode(m.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-start gap-3.5 ${
                  isSelected
                    ? "ring-2 ring-blue-500 border-blue-500 shadow-sm"
                    : "hover:border-gray-400 opacity-90"
                }`}
                style={{
                  backgroundColor: isSelected ? currentTheme.colors.sidebarActive : currentTheme.colors.card,
                  borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <div
                  className="p-2.5 rounded-lg shrink-0 border"
                  style={{
                    backgroundColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.background,
                    color: isSelected ? "#FFFFFF" : currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: currentTheme.colors.text }}>
                    {m.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: currentTheme.colors.textSecondary }}>
                    {m.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Selection Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: currentTheme.colors.border }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
              Koleksi Tema Profesional (8 Tema)
            </h3>
            <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
              Klik tombol Gunakan pada tema pilihan Anda
            </p>
          </div>

          {/* Filter Pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto"
            style={{
              backgroundColor: currentTheme.colors.card,
              borderColor: currentTheme.colors.border,
            }}
          >
            {(["all", "light", "dark"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? "shadow-xs"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: filter === f ? currentTheme.colors.primary : "transparent",
                  color: filter === f ? "#FFFFFF" : currentTheme.colors.textSecondary,
                }}
              >
                {f === "all" ? "Semua (8)" : f === "light" ? "Terang (4)" : "Gelap (4)"}
              </button>
            ))}
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredThemes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={themeId === t.id}
              onSelect={setTheme}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
