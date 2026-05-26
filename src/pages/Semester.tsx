import { useState, useEffect } from "react";
import { Flag, Save, Check } from "lucide-react";
import { SemesterGoal } from "../types";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { cn } from "../lib/utils";

const CATEGORIES = ["勉強", "生活", "人間関係", "部活", "チャレンジ"];

export default function Semester() {
  const [goals, setGoals] = useState<Record<string, Partial<SemesterGoal>>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    async function load() {
      if (!auth.currentUser) return;
      const path = `users/${auth.currentUser.uid}/semesterGoals`;
      const snap = await getDoc(doc(db, path, "2026-1"));
      if (snap.exists()) {
        const data = snap.data();
        setGoals(data.goals || {});
      } else {
        const initial: any = {};
        CATEGORIES.forEach(c => {
          initial[c] = { category: c, goal: "", evaluation: "", comment: "" };
        });
        setGoals(initial);
      }
    }
    load();
  }, []);

  const updateGoal = (cat: string, field: string, value: string) => {
    setGoals(prev => ({
      ...prev,
      [cat]: { ...prev[cat], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    const path = `users/${auth.currentUser.uid}/semesterGoals`;
    await setDoc(doc(db, path, "2026-1"), { goals }, { merge: true });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">今学期がんばること</h1>
        <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">SEMESTER GOALS</p>
      </div>

      <div className="space-y-6 mb-8">
        {CATEGORIES.map(cat => (
          <div key={cat} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Flag size={12} />
              </div>
              {cat}
            </h2>
            
            <div className="space-y-3 pl-2 border-l-2 border-blue-50 ml-3">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 tracking-wide block mb-1">目標</label>
                 <input 
                   value={goals[cat]?.goal || ""}
                   onChange={e => updateGoal(cat, "goal", e.target.value)}
                   placeholder="具体的な目標を書こう"
                   className="w-full bg-transparent border-b border-slate-200 pb-1 text-sm text-slate-700 focus:outline-none focus:border-blue-300"
                 />
               </div>
               <div className="flex gap-2 items-center pt-2">
                 <div className="w-full">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wide block mb-1">振り返り・自己評価</label>
                    <textarea 
                      value={goals[cat]?.comment || ""}
                      onChange={e => updateGoal(cat, "comment", e.target.value)}
                      placeholder="学期の終わりに書き込もう"
                      className="w-full bg-slate-50 rounded-xl p-3 text-xs text-slate-700 focus:outline-none resize-none min-h-[60px]"
                    />
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm shadow-sm transition-all duration-300",
          savedMsg 
            ? "bg-emerald-500 text-white" 
            : "bg-slate-800 text-white hover:bg-slate-700"
        )}
      >
        {saving ? (
          "保存中..."
        ) : savedMsg ? (
          <><Check size={18} /> 保存しました</>
        ) : (
          <><Save size={18} /> 目標と記録を保存</>
        )}
      </button>
    </div>
  );
}
