import { LogIn } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";

export default function LoginScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
          SI-GURUKU APP
        </h1>
        <p className="text-gray-500 mb-8 font-medium">Masuk untuk mensinkronkan data Anda</p>
        
        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4 py-3 font-semibold hover:opacity-90 transition shadow-md mb-4"
        >
          <LogIn size={20} />
          Masuk dengan Google
        </button>
        
        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">Atau</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <a
          href="/publik"
          className="flex items-center justify-center w-full gap-2 text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-3 font-semibold transition"
        >
          Cek Perkembangan Siswa (Publik)
        </a>
      </div>
    </div>
  );
}
