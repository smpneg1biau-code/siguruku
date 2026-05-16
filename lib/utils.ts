import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Map score to levels and predicates
export function getNilaiDetails(nilai: number) {
  if (nilai >= 81) return { level: 4, text: 'Mahir', color: 'bg-[#34C759]', status: 'TUNTAS', predikat: 'menunjukkan kemajuan luar biasa' };
  if (nilai >= 61) return { level: 3, text: 'Cakap', color: 'bg-[#34C759]', status: 'TUNTAS', predikat: 'menunjukkan pemahaman yang baik' };
  if (nilai >= 41) return { level: 2, text: 'Layak', color: 'bg-[#FF3B30]', status: 'BELUM TUNTAS', predikat: 'mulai menunjukkan pemahaman' };
  return { level: 1, text: 'Baru Berkembang', color: 'bg-[#FF3B30]', status: 'BELUM TUNTAS', predikat: 'memerlukan bimbingan intensif' };
}
