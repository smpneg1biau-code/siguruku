"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
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
  LayoutGrid,
  Calendar,
  GraduationCap,
  BarChart2,
  Activity,
  Database as DatabaseIcon,
  Shield,
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
  iconColor?: string;
};

type MenuCategory = {
  category: string;
  categoryIcon?: React.ElementType;
  categoryColor?: string;
  items: MenuItem[];
};

const MENU_CATEGORIES: MenuCategory[] = [
  {
    category: "Menu Utama",
    items: [{ id: "beranda", label: "Dashboard Utama", icon: LayoutGrid, iconColor: "text-sky-400" }],
  },
  {
    category: "Administrasi Kelas",
    categoryIcon: BookOpen,
    categoryColor: "text-indigo-400",
    items: [
      { id: "jurnal", label: "Jurnal Harian", icon: BookOpen, iconColor: "text-indigo-400" },
      { id: "rekap-jurnal", label: "Rekap Jurnal", icon: Printer, iconColor: "text-violet-400" },
      { id: "absensi", label: "Kehadiran", icon: Users, iconColor: "text-amber-400" },
      { id: "rekap-absensi", label: "Rekap Absensi", icon: Calendar, iconColor: "text-yellow-400" },
    ],
  },
  {
    category: "Penilaian & Tindak lanjut",
    categoryIcon: CheckSquare,
    categoryColor: "text-emerald-400",
    items: [
      { id: "formatif", label: "Formatif", icon: CheckSquare, iconColor: "text-emerald-400" },
      { id: "sumatif", label: "Sumatif", icon: Award, iconColor: "text-cyan-400" },
      { id: "remedial", label: "Remedial", icon: LifeBuoy, iconColor: "text-pink-400" },
    ],
  },
  {
    category: "Laporan Hasil Belajar",
    categoryIcon: FileText,
    categoryColor: "text-rose-400",
    items: [
      { id: "rapor", label: "Rapor", icon: FileText, iconColor: "text-rose-400" },
      { id: "rekap-akhir", label: "Rekap Akhir", icon: BarChart2, iconColor: "text-fuchsia-400" },
    ],
  },
  {
    category: "Kokurikuler",
    categoryIcon: GraduationCap,
    categoryColor: "text-teal-400",
    items: [
      { id: "tema-kokurikuler", label: "Daftar Tema", icon: BookOpen, koordinatorOnly: true, iconColor: "text-teal-400" },
      { id: "kegiatan-kokurikuler", label: "Kegiatan Kokurikuler", icon: FileText, koordinatorOnly: true, iconColor: "text-sky-400" },
      { id: "setting-rubrik-koku", label: "Setting Rubrik", icon: Settings, koordinatorOnly: true, iconColor: "text-blue-400" },
      { id: "absensi-kokurikuler", label: "Kehadiran Kokurikuler", icon: Users, koordinatorOnly: true, iconColor: "text-orange-400" },
      { id: "rekap-absensi-kokurikuler", label: "Rekap Kehadiran", icon: Printer, koordinatorOnly: true, iconColor: "text-amber-400" },
      { id: "asesmen-formatif-koku", label: "Asesmen Formatif", icon: CheckSquare, koordinatorOnly: true, iconColor: "text-purple-400" },
      { id: "asesmen-sumatif-koku", label: "Asesmen Sumatif", icon: Award, koordinatorOnly: true, iconColor: "text-violet-400" },
      { id: "fasilitator", label: "Fasilitator", icon: Users, koordinatorOnly: true, iconColor: "text-lime-400" },
    ],
  },
  {
    category: "Sistem & Pengaturan",
    categoryIcon: Settings,
    categoryColor: "text-slate-400",
    items: [
      { id: "konfigurasi", label: "Pengaturan", icon: Settings, iconColor: "text-slate-400" },
      { id: "database", label: "Database", icon: DatabaseIcon, iconColor: "text-red-400" },
      { id: "pengguna", label: "Pengguna", icon: Shield, adminOnly: true, iconColor: "text-blue-400" },
      { id: "monitoring", label: "Monitoring", icon: Activity, adminOnly: true, iconColor: "text-emerald-400" },
    ],
  },
];

const NAV_ITEMS = MENU_CATEGORIES.flatMap((c) => c.items);

export default function Shell() {
    const [activeTab, setActiveTab] = useState<TabId>("beranda");
  const { state, logout, isAdmin, isKoordinator } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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

  const userName = auth.currentUser?.displayName || state.agmp_pengaturan.guruNama;
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] print:h-auto print:block">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#111827] text-slate-200 border-r border-slate-800/80 shadow-2xl flex-shrink-0 z-20 relative print:hidden">
        {/* Brand Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-800/80 bg-[#0f172a]/50">
          <Image
            src="/logo.png"
            alt="Logo AGMP 2025"
            width={36}
            height={36}
            className="w-9 h-9 object-contain rounded-xl bg-white/5 p-0.5 shadow-md border border-white/10"
            unoptimized
          />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-wide">AGMP 2025</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Admin Guru v2.0
            </p>
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 py-4 overflow-y-auto no-scrollbar px-3 space-y-3">
          {MENU_CATEGORIES.map((category) => {
            const filteredItems = category.items.filter(
              (item) =>
                (!item.adminOnly || isAdmin) &&
                (!item.koordinatorOnly || isAdmin || isKoordinator)
            );
            if (filteredItems.length === 0) return null;

            if (category.category === "Menu Utama") {
              return (
                <div key={category.category} className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {category.category}
                  </div>
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group cursor-pointer",
                        activeTab === item.id
                          ? "bg-blue-600/25 text-white font-semibold shadow-inner border-l-2 border-blue-500"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                          item.iconColor || "text-sky-400"
                        )}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            }

            const isExpanded = expandedCategories[category.category];
            const CategoryIcon = category.categoryIcon || BookOpen;

            return (
              <div key={category.category} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all duration-200 group cursor-pointer outline-none"
                >
                  <div className="flex items-center min-w-0">
                    <CategoryIcon
                      className={cn(
                        "w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                        category.categoryColor || "text-indigo-400"
                      )}
                    />
                    <span className="truncate text-sm font-medium text-slate-200">
                      {category.category}
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2",
                      isExpanded && "rotate-90 text-slate-200"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-1"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pl-4 pr-1 space-y-1 border-l border-slate-800 ml-5 my-1">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "flex items-center w-full px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 group cursor-pointer",
                            activeTab === item.id
                              ? "bg-blue-600/30 text-white font-semibold shadow-sm text-blue-300"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-4 h-4 mr-2.5 transition-transform duration-200 group-hover:scale-110",
                              item.iconColor || "text-indigo-400"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Panel */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0f172a]/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xs font-extrabold text-white shadow-sm">
              {userInitials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
                  state.agmp_pengaturan.mapel ||
                  "Guru Mata Pelajaran"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-16 md:pb-0 print:h-auto print:overflow-visible print:block">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 px-8 items-center justify-between flex-shrink-0 print:hidden">
          <div>
            <h2 className="text-lg font-semibold">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-gray-500">
              Overview sistem manajemen administrasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <div className="flex items-center justify-end gap-2 mb-1">
                <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")}></div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                  {isOnline ? "Online Sync" : "Offline Mode"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 print:p-0 space-y-6 overflow-y-auto no-scrollbar flex flex-col items-center print:h-auto print:overflow-visible print:block">
          <div className="max-w-6xl w-full h-full print:h-auto print:max-w-none print:block">{renderContent()}</div>
        </div>

        <footer className="hidden md:flex h-10 bg-white border-t border-gray-200 px-6 items-center justify-between text-[10px] text-gray-400 flex-shrink-0 print:hidden">
          <div>© 2026 Admin Guru Mata Pelajaran • PPA 2025 Compliant</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              DB Status:{" "}
              <strong className={cn(isOnline ? "text-green-500" : "text-amber-500")}>
                {isOnline ? "Connected & Syncing" : "Saved Locally (Pending Sync)"}
              </strong>
            </span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-30 pb-safe print:hidden">
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
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors px-1",
                    activeTab === item.id ? "text-[#007AFF]" : "text-[#8E8E93]",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[9px] font-medium text-center leading-tight line-clamp-1">{label}</span>
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
