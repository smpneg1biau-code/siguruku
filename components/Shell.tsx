"use client";

import { Suspense, useState, useEffect } from "react";
import {
  Home,
  Settings,
  BookOpen,
  Users,
  CheckSquare,
  Award,
  LifeBuoy,
  FileText,
  LogOut,
  Printer,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  Database as DatabaseIcon,
  GraduationCap,
  Folder,
  ClipboardList,
  ShieldCheck,
  UserPlus,
  BarChart2,
  Activity,
  Shield,
  Palette,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Beranda from "@/components/modules/Beranda";
import Konfigurasi from "@/components/modules/Konfigurasi";
import Jurnal from "@/components/modules/Jurnal";
import RekapJurnal from "@/components/modules/RekapJurnal";
import Absensi from "@/components/modules/Absensi";
import RekapAbsensi from "@/components/modules/RekapAbsensi";
import Formatif from "@/components/modules/Formatif";
import Sumatif from "@/components/modules/Sumatif";
import Remedial from "@/components/modules/Remedial";
import Rapor from "@/components/modules/Rapor";
import RekapAkhir from "@/components/modules/RekapAkhir";
import Database from "@/components/modules/Database";
import Monitoring from "@/components/modules/Monitoring";
import ManajemenPengguna from "@/components/modules/ManajemenPengguna";
import TemaBentuk from "@/components/modules/TemaBentuk";
import DaftarModul from "@/components/modules/DaftarModul";
import Fasilitator from "@/components/modules/Fasilitator";
import TemaKokurikuler from "@/components/modules/TemaKokurikuler";
import KegiatanKokurikuler from "@/components/modules/KegiatanKokurikuler";
import SettingRubrikKoku from "@/components/modules/SettingRubrikKoku";
import AbsensiKokurikuler from "@/components/modules/AbsensiKokurikuler";
import RekapAbsensiKokurikuler from "@/components/modules/RekapAbsensiKokurikuler";
import AsesmenFormatifKoku from "@/components/modules/AsesmenFormatifKoku";
import AsesmenSumatifKoku from "@/components/modules/AsesmenSumatifKoku";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { ThemeButton } from "@/components/theme/ThemeButton";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export type TabId =
  | "beranda"
  | "konfigurasi"
  | "jurnal"
  | "rekap-jurnal"
  | "absensi"
  | "rekap-absensi"
  | "formatif"
  | "sumatif"
  | "remedial"
  | "rapor"
  | "rekap-akhir"
  | "database"
  | "tema-bentuk"
  | "daftar-modul"
  | "tema-kokurikuler"
  | "kegiatan-kokurikuler"
  | "setting-rubrik-koku"
  | "asesmen-formatif-koku"
  | "asesmen-sumatif-koku"
  | "absensi-kokurikuler"
  | "rekap-absensi-kokurikuler"
  | "fasilitator"
  | "pengguna"
  | "monitoring";

type MenuItem = {
  adminOnly?: boolean;
  koordinatorOnly?: boolean;
  id: TabId;
  label: string;
  icon: React.ElementType;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

const MENU_CATEGORIES: MenuCategory[] = [
  {
    category: "MENU UTAMA",
    items: [{ id: "beranda", label: "Beranda", icon: LayoutDashboard }],
  },
  {
    category: "ADMINISTRASI KELAS",
    items: [
      { id: "jurnal", label: "Jurnal Harian", icon: BookOpen },
      { id: "rekap-jurnal", label: "Rekap Jurnal", icon: ClipboardList },
      { id: "absensi", label: "Kehadiran", icon: CalendarDays },
      { id: "rekap-absensi", label: "Rekap Absensi", icon: Printer },
    ],
  },
  {
    category: "PENILAIAN & TINDAK LANJUT",
    items: [
      { id: "formatif", label: "Formatif", icon: CheckSquare },
      { id: "sumatif", label: "Sumatif", icon: Award },
      { id: "remedial", label: "Remedial", icon: LifeBuoy },
    ],
  },
  {
    category: "LAPORAN HASIL BELAJAR",
    items: [
      { id: "rapor", label: "Rapor", icon: FileText },
      { id: "rekap-akhir", label: "Rekap Akhir", icon: BarChart2 },
    ],
  },
  {
    category: "KOKURIKULER",
    items: [
      { id: "tema-kokurikuler", label: "Daftar Tema", icon: BookOpen, koordinatorOnly: true },
      { id: "kegiatan-kokurikuler", label: "Kegiatan Kokurikuler", icon: Folder, koordinatorOnly: true },
      { id: "setting-rubrik-koku", label: "Setting Rubrik", icon: Settings, koordinatorOnly: true },
      { id: "absensi-kokurikuler", label: "Kehadiran Kokurikuler", icon: Users, koordinatorOnly: true },
      { id: "rekap-absensi-kokurikuler", label: "Rekap Kehadiran", icon: Printer, koordinatorOnly: true },
      { id: "asesmen-formatif-koku", label: "Asesmen Formatif", icon: CheckSquare, koordinatorOnly: true },
      { id: "asesmen-sumatif-koku", label: "Asesmen Sumatif", icon: Award, koordinatorOnly: true },
      { id: "fasilitator", label: "Fasilitator", icon: GraduationCap, koordinatorOnly: true },
    ],
  },
  {
    category: "SISTEM & PENGATURAN",
    items: [
      { id: "konfigurasi", label: "Pengaturan", icon: Settings },
      { id: "database", label: "Database", icon: DatabaseIcon },
      { id: "pengguna", label: "Pengguna", icon: ShieldCheck, adminOnly: true },
      { id: "monitoring", label: "Monitoring", icon: Activity, adminOnly: true },
    ],
  },
];

const NAV_ITEMS = MENU_CATEGORIES.flatMap((c) => c.items);

export default function Shell({ children }: { children?: React.ReactNode } = {}) {
  const [activeTab, setActiveTab] = useState<TabId>("beranda");
  const { state, logout, isAdmin, isKoordinator } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Expand category that contains the active tab
    const activeCat = MENU_CATEGORIES.find(c => c.items.some(i => i.id === activeTab))?.category;
    if (activeCat && !expandedCategories[activeCat]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCategories(prev => ({ ...prev, [activeCat]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle hash routing support
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (NAV_ITEMS.find((n) => n.id === hash)) {
        setActiveTab(hash);
      }
    });
  }

  const handleSelectTab = (tabId: TabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "beranda":
        return <Beranda onNavigate={setActiveTab} />;
      case "konfigurasi":
        return <Konfigurasi />;
      case "jurnal":
        return <Jurnal onNavigate={setActiveTab} />;
      case "rekap-jurnal":
        return <RekapJurnal />;
      case "absensi":
        return <Absensi />;
      case "rekap-absensi":
        return <RekapAbsensi />;
      case "formatif":
        return <Formatif />;
      case "sumatif":
        return <Sumatif />;
      case "remedial":
        return <Remedial />;
      case "rapor":
        return <Rapor />;
      case "rekap-akhir":
        return <RekapAkhir onNavigate={setActiveTab} />;
      case "tema-bentuk":
        return <TemaBentuk />;
      case "daftar-modul":
        return <DaftarModul />;
      case "tema-kokurikuler":
        return <TemaKokurikuler />;
      case "kegiatan-kokurikuler":
        return <KegiatanKokurikuler />;
      case "setting-rubrik-koku":
        return <SettingRubrikKoku />;
      case "absensi-kokurikuler":
        return <AbsensiKokurikuler />;
      case "rekap-absensi-kokurikuler":
        return <RekapAbsensiKokurikuler />;
      case "asesmen-formatif-koku":
        return <AsesmenFormatifKoku />;
      case "asesmen-sumatif-koku":
        return <AsesmenSumatifKoku />;
      case "fasilitator":
        return <Fasilitator />;
      case "database":
        return <Database />;
      case "monitoring":
        return isAdmin ? <Monitoring /> : <Beranda onNavigate={setActiveTab} />;
      case "pengguna":
        return isAdmin ? <ManajemenPengguna /> : <Beranda onNavigate={setActiveTab} />;
      default:
        return <Beranda onNavigate={setActiveTab} />;
    }
  };

  const userName = auth.currentUser?.displayName || state.agmp_pengaturan.guruNama || "Guru Pengajar";
  const userInitials = userName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || "AG";
  const userMapel = state.agmp_mapel?.find(m => m.id === state.agmp_pengaturan?.mapelId)?.nama || state.agmp_pengaturan.mapel || "Guru Mata Pelajaran";

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-[#E5E7EB] border-r border-white/[0.06] select-none">
      {/* Sidebar Header */}
      <div className="p-5 flex items-center gap-3.5 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">SI-GURUKU</h1>
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              v3.0
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] truncate mt-1 font-medium">
            Admin Guru Management Platform
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4 no-scrollbar">
        {MENU_CATEGORIES.map((category, catIndex) => {
          const filteredItems = category.items.filter(
            (item) => (!item.adminOnly || isAdmin) && (!item.koordinatorOnly || isAdmin || isKoordinator)
          );
          if (filteredItems.length === 0) return null;

          const isMain = category.category === "MENU UTAMA";
          const isExpanded = expandedCategories[category.category] ?? true;

          return (
            <div key={category.category} className="space-y-1">
              {catIndex > 0 && <div className="border-t border-white/[0.06] my-2 mx-2" />}

              {!isMain ? (
                <button
                  type="button"
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider hover:text-white transition-colors group cursor-pointer"
                >
                  <span>{category.category}</span>
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 group-hover:text-white",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="px-3 py-1 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {category.category}
                </div>
              )}

              {(isMain || isExpanded) && (
                <div className="space-y-1 pt-1">
                  {filteredItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={cn(
                          "relative flex items-center w-full px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer min-h-[52px]",
                          isActive
                            ? "bg-[#2563EB] text-white font-semibold shadow-lg shadow-blue-600/25"
                            : "text-[#E5E7EB] hover:bg-[#1E293B] hover:text-white"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-white rounded-r-full" />
                        )}
                        <Icon
                          className={cn(
                            "w-5 h-5 mr-3.5 flex-shrink-0 transition-colors",
                            isActive ? "text-white" : "text-[#94A3B8] group-hover:text-blue-400"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile Card */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="p-3 bg-[#1E293B]/80 border border-white/[0.08] rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{userMapel}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              <span className="text-[10px] font-medium text-[#94A3B8]">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-gray-900 print:h-auto print:block overflow-hidden">
      {/* Desktop Fixed Sidebar (width 280px) */}
      <aside className="hidden md:flex flex-col w-[280px] flex-shrink-0 z-30 relative print:hidden h-full">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-[280px] max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/10 hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-16 md:pb-0 print:h-auto print:overflow-visible print:block bg-[#F8FAFC]">
        {/* Mobile Top Header */}
        <header className="flex md:hidden h-14 bg-[#0F172A] border-b border-white/[0.06] px-4 items-center justify-between flex-shrink-0 text-white z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-tight">AGMP 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full text-[10px] font-semibold text-gray-200">
              <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-400" : "bg-amber-400")} />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 px-8 items-center justify-between flex-shrink-0 print:hidden shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Admin Guru Management Platform • PPA 2025
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <ThemeButton />
            <div className="text-right ml-2 mr-2">
              <div className="flex items-center justify-end gap-2 mb-0.5">
                <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}></div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  {isOnline ? "Online Sync" : "Offline Mode"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 print:p-0 space-y-6 overflow-y-auto no-scrollbar flex flex-col items-center print:h-auto print:overflow-visible print:block">
          <div className="max-w-6xl w-full h-full print:h-auto print:max-w-none print:block">
            {children || renderContent()}
          </div>
        </div>

        <footer className="hidden md:flex h-10 bg-white border-t border-gray-200 px-6 items-center justify-between text-[11px] text-gray-500 flex-shrink-0 print:hidden font-medium">
          <div>© 2026 AGMP — Admin Guru Management Platform</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              Status Database:{" "}
              <strong className={cn(isOnline ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold")}>
                {isOnline ? "Tersinkronisasi Cloud" : "Tersimpan Lokal"}
              </strong>
            </span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-white/[0.08] shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-30 pb-safe print:hidden text-[#94A3B8]">
        <div className="flex justify-around items-center h-16 px-1">
          {["beranda", "jurnal", "absensi", "formatif", "kegiatan-kokurikuler"]
            .map((id) => NAV_ITEMS.find((item) => item.id === id))
            .filter((item): item is MenuItem => {
              if (!item) return false;
              if (item.adminOnly && !isAdmin) return false;
              if (item.koordinatorOnly && !isAdmin && !isKoordinator) return false;
              return true;
            })
            .map((item) => {
              const label = item.id === "kegiatan-kokurikuler" ? "Kokurikuler" : item.label;
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors px-1",
                    isActive ? "text-blue-400 font-semibold" : "text-[#94A3B8] hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-center leading-tight line-clamp-1">{label}</span>
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
}

