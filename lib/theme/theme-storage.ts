import { ThemeId, ColorMode } from "./theme-types";
import { DEFAULT_THEME_ID } from "./themes";

const THEME_STORAGE_KEY = "admin-guru-theme";
const MODE_STORAGE_KEY = "admin-guru-mode";

export function getSavedThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as ThemeId) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function saveThemeId(id: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (err) {
    console.error("Gagal menyimpan tema di localStorage:", err);
  }
}

export function getSavedColorMode(): ColorMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return (saved as ColorMode) || "system";
  } catch {
    return "system";
  }
}

export function saveColorMode(mode: ColorMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch (err) {
    console.error("Gagal menyimpan mode warna di localStorage:", err);
  }
}
