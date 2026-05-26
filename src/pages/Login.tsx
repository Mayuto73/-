import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { BookA } from "lucide-react";

export default function Login() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4 text-slate-800">
      <div className="flex flex-col items-center space-y-6 max-w-sm w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
          <BookA size={32} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">しぶんノート</h1>
          <p className="text-sm text-slate-500">高校生活の毎日の自分を記録</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full mt-8 flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 px-4 rounded-xl font-medium transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
