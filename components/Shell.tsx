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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Beranda from "@/components/modules/Beranda";
import Konfigurasi from "@/components/modules/Konfigurasi";
import Jurnal from "@/components/modules/Jurnal";
import Absensi from "@/components/modules/Absensi";
import Formatif from "@/components/modules/Formatif";
import Sumatif from "@/components/modules/Sumatif";
import Remedial from "@/components/modules/Remedial";
import Rapor from "@/components/modules/Rapor";
import RekapAkhir from "@/components/modules/RekapAkhir";
import Database from "@/components/modules/Database";
import { BarChart2, Database as DatabaseIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/firebase";

export type TabId =
  | "beranda"
  | "konfigurasi"
  | "jurnal"
  | "absensi"
  | "formatif"
  | "sumatif"
  | "remedial"
  | "rapor"
  | "rekap-akhir"
  | "database";

const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", icon: Home },
  { id: "jurnal", label: "Jurnal", icon: BookOpen },
  { id: "absensi", label: "Absensi", icon: Users },
  { id: "formatif", label: "Formatif", icon: CheckSquare },
  { id: "sumatif", label: "Sumatif", icon: Award },
  { id: "remedial", label: "Remedial", icon: LifeBuoy },
  { id: "rapor", label: "Rapor", icon: FileText },
  { id: "rekap-akhir", label: "Rekap Akhir", icon: BarChart2 },
  { id: "konfigurasi", label: "Pengaturan", icon: Settings },
  { id: "database", label: "Database", icon: DatabaseIcon },
] as const;

export default function Shell() {
  const [activeTab, setActiveTab] = useState<TabId>("beranda");
  const { state, logout } = useStore();
  const [isOnline, setIsOnline] = useState(true);

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
      case "absensi":
        return <Absensi />;
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
      case "database":
        return <Database />;
      default:
        return <Beranda onNavigate={setActiveTab} />;
    }
  };

  const userName = auth.currentUser?.displayName || state.agmp_pengaturan.guruNama;
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 z-20 relative print:hidden">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">AGMP 2025</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              Admin Guru v2.0
            </p>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Navigasi
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "sidebar-item flex items-center w-full px-6 py-3 text-sm font-medium",
                activeTab === item.id ? "sidebar-active" : "text-gray-600",
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
              {userInitials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {state.agmp_pengaturan.mapel || "Guru Mata Pelajaran"}
              </p>
            </div>
            <button onClick={logout} className="p-1 hover:bg-gray-200 rounded text-red-500 transition-colors" title="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-16 md:pb-0">
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

        <div className="flex-1 p-4 md:p-6 print:p-0 space-y-6 overflow-y-auto no-scrollbar flex flex-col items-center">
          <div className="max-w-6xl w-full h-full">{renderContent()}</div>
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
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                activeTab === item.id ? "text-[#007AFF]" : "text-[#8E8E93]",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab("konfigurasi")}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              ["konfigurasi", "formatif", "remedial", "rapor", "rekap-akhir"].includes(
                activeTab,
              )
                ? "text-[#007AFF]"
                : "text-[#8E8E93]",
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
