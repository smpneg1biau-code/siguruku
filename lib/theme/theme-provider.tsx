"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeContext } from "./theme-context";
import { ThemeId, ColorMode, ThemeConfig } from "./theme-types";
import { THEMES, DEFAULT_THEME_ID } from "./themes";
import {
  getSavedThemeId,
  saveThemeId,
  getSavedColorMode,
  saveColorMode,
} from "./theme-storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => getSavedThemeId());
  const [colorMode, setColorModeState] = useState<ColorMode>(() => getSavedColorMode());
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Listen to OS prefers-color-scheme change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Resolve mode: light or dark
  const resolvedMode: "light" | "dark" = useMemo(() => {
    if (colorMode === "system") {
      return systemIsDark ? "dark" : "light";
    }
    return colorMode;
  }, [colorMode, systemIsDark]);

  // Find theme object based on active themeId or resolvedMode
  const currentTheme: ThemeConfig = useMemo(() => {
    let selected = THEMES.find((t) => t.id === themeId);
    if (!selected) {
      selected = THEMES[0];
    }

    // If colorMode overrides, and selected theme doesn't match mode, pick best theme for mode if necessary or adjust
    if (colorMode === "dark" && !selected.isDark && themeId === "default-light") {
      selected = THEMES.find((t) => t.id === "professional-dark") || selected;
    } else if (colorMode === "light" && selected.isDark && themeId === "professional-dark") {
      selected = THEMES.find((t) => t.id === "default-light") || selected;
    }

    return selected;
  }, [themeId, colorMode]);

  // Apply CSS variables to documentElement
  const applyThemeToDOM = useCallback((theme: ThemeConfig, mode: "light" | "dark") => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const { colors } = theme;

    root.setAttribute("data-theme", theme.id);
    root.setAttribute("data-mode", mode);
    if (theme.isDark || mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Inject CSS variables
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--sidebar", colors.sidebar);
    root.style.setProperty("--sidebar-hover", colors.sidebarHover);
    root.style.setProperty("--sidebar-active", colors.sidebarActive);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-hover", colors.cardHover);
    root.style.setProperty("--border", colors.border);
    root.style.setProperty("--text", colors.text);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-hover", colors.primaryHover);
    root.style.setProperty("--success", colors.success);
    root.style.setProperty("--warning", colors.warning);
    root.style.setProperty("--danger", colors.danger);
    root.style.setProperty("--shadow", colors.shadow);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(currentTheme, resolvedMode);
  }, [currentTheme, resolvedMode, mounted, applyThemeToDOM]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    saveThemeId(id);

    // If user explicitly picks a theme, update default color mode if needed
    const target = THEMES.find((t) => t.id === id);
    if (target) {
      if (target.isDark && colorMode === "light") {
        setColorModeState("dark");
        saveColorMode("dark");
      } else if (!target.isDark && colorMode === "dark") {
        setColorModeState("light");
        saveColorMode("light");
      }
    }
  }, [colorMode]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    saveColorMode(mode);

    if (mode === "dark" && themeId === "default-light") {
      setThemeId("professional-dark");
      saveThemeId("professional-dark");
    } else if (mode === "light" && themeId === "professional-dark") {
      setThemeId("default-light");
      saveThemeId("default-light");
    }
  }, [themeId]);

  const toggleQuickMode = useCallback(() => {
    if (resolvedMode === "light") {
      setColorMode("dark");
    } else {
      setColorMode("light");
    }
  }, [resolvedMode, setColorMode]);

  const contextValue = useMemo(
    () => ({
      currentTheme,
      themeId,
      colorMode,
      resolvedMode,
      setTheme,
      setColorMode,
      toggleQuickMode,
      themes: THEMES,
    }),
    [currentTheme, themeId, colorMode, resolvedMode, setTheme, setColorMode, toggleQuickMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
