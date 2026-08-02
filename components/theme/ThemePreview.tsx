"use client";

import React from "react";
import { ThemeConfig } from "@/lib/theme/theme-types";

interface ThemePreviewProps {
  theme: ThemeConfig;
  isActive?: boolean;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const { colors } = theme;

  return (
    <div
      className="w-full h-32 rounded-lg p-2.5 flex flex-col justify-between overflow-hidden border transition-all duration-300 shadow-sm"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      {/* Topbar & Sidebar Mini Layout */}
      <div className="flex gap-2 h-full">
        {/* Mini Sidebar */}
        <div
          className="w-1/4 h-full rounded p-1 flex flex-col justify-between border"
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.border,
          }}
        >
          <div className="space-y-1">
            <div
              className="w-full h-2 rounded"
              style={{ backgroundColor: colors.primary }}
            />
            <div
              className="w-3/4 h-1.5 rounded opacity-60"
              style={{ backgroundColor: colors.textSecondary }}
            />
            <div
              className="w-full h-1.5 rounded mt-2"
              style={{ backgroundColor: colors.sidebarActive }}
            />
            <div
              className="w-5/6 h-1.5 rounded"
              style={{ backgroundColor: colors.sidebarHover }}
            />
          </div>
          <div
            className="w-full h-2 rounded"
            style={{ backgroundColor: colors.border }}
          />
        </div>

        {/* Mini Content */}
        <div className="flex-1 flex flex-col gap-1.5 h-full">
          {/* Header */}
          <div
            className="w-full h-4 rounded px-1.5 flex items-center justify-between border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <div
              className="w-12 h-1.5 rounded"
              style={{ backgroundColor: colors.text }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            <div
              className="rounded p-1.5 border flex flex-col justify-between"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <div
                className="w-8 h-1.5 rounded"
                style={{ backgroundColor: colors.textSecondary }}
              />
              <div
                className="w-10 h-3 rounded"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
            <div
              className="rounded p-1.5 border flex flex-col justify-between"
              style={{
                backgroundColor: colors.cardHover,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.success }}
                />
                <div
                  className="w-6 h-1.5 rounded"
                  style={{ backgroundColor: colors.text }}
                />
              </div>
              <div
                className="w-full h-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
