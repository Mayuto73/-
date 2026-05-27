import { useState } from "react";
import { LogOut, UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { saveSchedules } from "../lib/api";

export default function Settings() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract just the base64 part, discarding the data URL prefix
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/parse-schedule-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64Data }),
      });

      const resText = await res.text();
      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (err) {
        throw new Error("サーバーからの無効な応答です: " + resText.substring(0, 50));
      }

      if (!res.ok) throw new Error(resData.error || "Failed to parse");

      // We have the parsed schedule data from Gemini!
      console.log(resData.data);
      setResult(resData.data);

      await saveSchedules(resData.data);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">設定</h1>
        <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">SETTINGS</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          時間割PDFの登録
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          学校から配布された時間割PDFをアップロードすると、日付と授業・行事を自動で読み取って登録します。
        </p>

        <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors group">
          <UploadCloud className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={28} />
          <span className="text-sm font-bold text-blue-700">
            {uploading ? "解析中..." : "PDFを選択してアップロード"}
          </span>
          <span className="text-[10px] font-medium text-slate-400 mt-1">タップしてファイルを選択</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <h3 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1">
              <CheckCircle size={14} /> 解析成功
            </h3>
            <p className="text-[10px] text-emerald-700">
              {result.length}日分のスケジュールを登録しました。今日の画面で時間割が自動的に表示されるようになります。
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-sm font-bold text-slate-800">アカウント</h2>
             <p className="text-xs text-slate-500 mt-1">{auth.currentUser?.email}</p>
           </div>
           <button 
             onClick={handleLogout}
             className="p-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-colors"
           >
             <LogOut size={18} />
           </button>
         </div>
      </div>
    </div>
  );
}
