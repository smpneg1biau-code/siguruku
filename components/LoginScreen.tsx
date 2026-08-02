"use client";

import Image from "next/image";
import {
  LogIn,
  BookOpen,
  Award,
  Users,
  ShieldCheck,
  BarChart3,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";

export default function LoginScreen() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Section: Information & Features Showcase */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-4">
          {/* Header Tag & Title */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Manajemen Guru Mata Pelajaran</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="AGMP Logo"
                  width={56}
                  height={56}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  AGMP <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">2025</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-400 font-medium">
                  Aplikasi Administrasi, Absensi & Asesmen Terintegrasi
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Dirancang khusus untuk mendukung efisiensi kerja <strong className="text-white font-semibold">Guru Mata Pelajaran</strong> dalam mengelola jurnal KBM, absensi harian, penilaian formatif & sumatif, hingga asesmen kegiatan kokurikuler Kurikulum Merdeka.
            </p>
          </div>

          {/* Key Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Jurnal KBM & Absensi</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Pencatatan materi harian, kehadiran siswa, dan rekap otomatis yang siap dicetak.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Asesmen Formatif & Sumatif</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Pengolahan nilai TP, KKTP dengan rubrik/interval, serta program remedial siswa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Modul Kokurikuler </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Pengelolaan tema, kegiatan, kehadiran, serta rubrik penilaian dimensi kokurikuler.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Olah Nilai Rapor & Rekap</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Perhitungan nilai akhir semester otomatis yang akurat & terstruktur.
              </p>
            </div>
          </div>

          {/* Highlights Footer list */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autentikasi Aman Google</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Sinkronisasi Real-time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Eksplorasi Portal Publik</span>
            </div>
          </div>
        </div>

        {/* Right Section: Login Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 relative">
            
            {/* Header in Card */}
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 mx-auto mb-3">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                    unoptimized
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Selamat Datang di AGMP
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Silakan masuk menggunakan Akun Google terdaftar Anda untuk mengakses portal guru.
              </p>
            </div>

            {/* Google Sign-in Button */}
            <div className="space-y-4">
              <button
                onClick={signInWithGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer group"
              >
                {/* Google Icon SVG */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm">Masuk dengan Akun Google</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-3 text-slate-500 text-xs font-medium">
                  Atau Akses Publik
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Public Portal Link */}
              <a
                href="/publik"
                className="w-full flex items-center justify-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm group"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Cek Perkembangan Siswa (Portal Publik)</span>
              </a>
            </div>

            {/* Info Footer in Card */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Aplikasi Manajemen Pembelajaran SMP & SMA/SMK © 2025.
                <br />
                Penyimpanan terenkripsi & sinkron otomatis.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
