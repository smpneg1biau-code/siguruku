export type ThemeId =
  | "default-light"
  | "professional-dark"
  | "navy-blue"
  | "emerald"
  | "purple"
  | "coffee-brown"
  | "midnight-black"
  | "soft-gray";

export type ColorMode = "light" | "dark" | "system";

export interface ThemeColors {
  background: string;
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  card: string;
  cardHover: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeId: ThemeId;
  colorMode: ColorMode;
  resolvedMode: "light" | "dark";
  setTheme: (id: ThemeId) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleQuickMode: () => void;
  themes: ThemeConfig[];
}
