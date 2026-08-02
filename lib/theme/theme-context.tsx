"use client";

import { createContext, useContext } from "react";
import { ThemeContextType } from "./theme-types";

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme harus digunakan di dalam <ThemeProvider>");
  }
  return context;
}
