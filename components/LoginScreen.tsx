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
          className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4 py-3 font-semibold hover:opacity-90 transition shadow-md"
        >
          <LogIn size={20} />
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
