import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Camera, Save, ChevronLeft, ChevronRight, Check, ListTodo, Plus, Trash2 } from "lucide-react";
import { DailyLog, DaySchedule, DailyTask } from "../types";
import { getDailyLog, saveDailyLog, getSchedule, uploadPhoto } from "../lib/api";
import { auth } from "../firebase";
import { cn } from "../lib/utils";

const MOODS = ["😀", "🙂", "😐", "😢", "😡"];

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");
  
  const yesterdayDate = new Date(currentDate.getTime() - 86400000);
  const yesterdayStr = format(yesterdayDate, "yyyy-MM-dd");
  
  const [log, setLog] = useState<Partial<DailyLog>>({
    mood: "",
    diary: "",
    score: 50,
    goodThings: ["", "", ""],
    difficultThings: "",
    tomorrowMemo: "",
    photos: [],
    tasks: []
  });
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    async function load() {
      const existingLog = await getDailyLog(dateStr);
      if (existingLog) {
        setLog({
          ...existingLog,
          goodThings: existingLog.goodThings || ["", "", ""],
          tasks: existingLog.tasks || []
        });
      } else {
        setLog({
          mood: "",
          diary: "",
          score: 50,
          goodThings: ["", "", ""],
          difficultThings: "",
          tomorrowMemo: "",
          photos: [],
          tasks: []
        });
      }

      const sched = await getSchedule(dateStr);
      setSchedule(sched);
      
      const yLog = await getDailyLog(yesterdayStr);
      setYesterdayLog(yLog);
    }
    load();
  }, [dateStr, yesterdayStr]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await saveDailyLog({
        ...log,
        id: dateStr,
        userId: auth.currentUser.uid,
        date: dateStr,
        createdAt: Date.now(),
      } as DailyLog);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setLog(prev => ({ ...prev, photos: [...(prev.photos || []), url] }));
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const updateGoodThing = (index: number, val: string) => {
    const newItems = [...(log.goodThings || ["", "", ""])];
    newItems[index] = val;
    setLog(prev => ({ ...prev, goodThings: newItems }));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: DailyTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false
    };
    setLog(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    setLog(prev => ({
      ...prev,
      tasks: prev.tasks?.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const deleteTask = (id: string) => {
    setLog(prev => ({
      ...prev,
      tasks: prev.tasks?.filter(t => t.id !== id)
    }));
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto relative">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => setCurrentDate(d => new Date(d.getTime() - 86400000))}
          className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {format(currentDate, "M月d日(E)", { locale: ja })}
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-widest mt-1">TODAY</p>
        </div>
        <button 
          onClick={() => setCurrentDate(d => new Date(d.getTime() + 86400000))}
          className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {yesterdayLog && (
        <div className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-slate-300"></div>
          <h2 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
            昨日の自分
          </h2>
          <div className="flex items-center gap-3 mb-2">
             <span className="text-2xl">{yesterdayLog.mood}</span>
             <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">{yesterdayLog.diary || "記録はありません"}</p>
          </div>
          {yesterdayLog.tomorrowMemo && (
             <div className="bg-blue-50/50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100/50 mt-3">
               <span className="font-bold tracking-widest block mb-1">昨日の自分からのメモ:</span>
               {yesterdayLog.tomorrowMemo}
             </div>
          )}
        </div>
      )}

      {schedule && (schedule.periods.length > 0 || schedule.events.length > 0) && (
        <div className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-blue-50/50">
          <h2 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            今日の時間割
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {schedule.periods.map((p, i) => (
              <div key={i} className="bg-blue-50/50 rounded-xl p-2 text-center border border-blue-100/50">
                <span className="block text-[10px] text-blue-400 font-bold mb-0.5">{i + 1}</span>
                <span className="text-xs text-slate-700 font-medium truncate py-0.5 block">{p}</span>
              </div>
            ))}
          </div>
          {schedule.events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schedule.events.map((e, i) => (
                <span key={i} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-indigo-300"></div>
        <div className="p-6 space-y-8">
          
          <section>
            <label className="text-xs font-bold text-slate-400 tracking-wider mb-3 block">今日の気分</label>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setLog({ ...log, mood: m })}
                  className={cn(
                    "text-3xl p-2 rounded-xl transition-all duration-200 hover:scale-110",
                    log.mood === m ? "bg-white shadow-sm ring-1 ring-slate-200/50 scale-110" : "opacity-60 grayscale"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section>
             <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block">一言日記</label>
             <div className="relative">
                <textarea 
                  value={log.diary}
                  onChange={e => setLog({ ...log, diary: e.target.value })}
                  placeholder="今日はどんな日でしたか？"
                  className="w-full bg-transparent resize-none leading-relaxed text-slate-700 text-sm focus:outline-none min-h-[120px]"
                  style={{
                    backgroundImage: 'linear-gradient(transparent, transparent 27px, #f1f5f9 27px, #f1f5f9 28px)',
                    backgroundSize: '100% 28px',
                    lineHeight: '28px'
                  }}
                />
             </div>
          </section>

          <section>
             <div className="flex items-center justify-between mb-3 mt-4">
               <label className="text-xs font-bold text-slate-400 tracking-wider block">思い出の写真</label>
               <label className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium flex items-center gap-1 cursor-pointer hover:bg-slate-200 transition-colors">
                 <Camera size={12} />
                 {uploading ? "追加中..." : "追加"}
                 <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
               </label>
             </div>
             {log.photos && log.photos.length > 0 && (
               <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                 {log.photos.map((url, i) => (
                   <img key={i} src={url} alt="day" className="w-24 h-24 object-cover rounded-2xl shadow-sm border border-slate-100 snap-center shrink-0" />
                 ))}
               </div>
             )}
          </section>

          <section className="pt-2">
             <label className="text-xs font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-2">
               <ListTodo size={14} /> 今日の予定・課題
             </label>
             <div className="space-y-2 mb-3">
               {log.tasks?.map(task => (
                 <div key={task.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                   <button 
                     onClick={() => toggleTask(task.id)}
                     className={cn(
                       "w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                       task.done ? "bg-emerald-400 border-emerald-400 text-white" : "bg-white border-slate-300 text-transparent hover:border-emerald-300"
                     )}
                   >
                     <Check size={12} strokeWidth={3} />
                   </button>
                   <span className={cn("text-sm flex-1 transition-all", task.done ? "text-slate-400 line-through" : "text-slate-700")}>
                     {task.text}
                   </span>
                   <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-400 opacity-0 md:opacity-100 transition-opacity p-1">
                     <Trash2 size={14} />
                   </button>
                 </div>
               ))}
               {(!log.tasks || log.tasks.length === 0) && (
                 <p className="text-xs text-slate-400 italic px-2">予定や提出物はありません</p>
               )}
             </div>
             <div className="flex items-center gap-2">
               <input
                 type="text"
                 value={newTaskText}
                 onChange={e => setNewTaskText(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addTask()}
                 placeholder="新しい予定を追加..."
                 className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
               />
               <button 
                 onClick={addTask}
                 disabled={!newTaskText.trim()}
                 className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors"
               >
                 <Plus size={18} />
               </button>
             </div>
          </section>

          <section className="pt-2">
             <label className="text-xs font-bold text-slate-400 tracking-wider mb-4 block flex justify-between">
               今日よかったこと (3つ)
             </label>
             <div className="space-y-3">
               {[0,1,2].map(i => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                     <span className="text-[10px] font-bold text-emerald-600">{i+1}</span>
                   </div>
                   <input
                     value={log.goodThings?.[i] || ""}
                     onChange={e => updateGoodThing(i, e.target.value)}
                     placeholder="..."
                     className="flex-1 bg-transparent border-b border-slate-200 pb-1 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-colors"
                   />
                 </div>
               ))}
             </div>
          </section>

          <section className="pt-2">
             <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block">大変だったこと・モヤモヤ</label>
             <textarea 
               value={log.difficultThings}
               onChange={e => setLog({ ...log, difficultThings: e.target.value })}
               placeholder="..."
               className="w-full bg-slate-50 p-4 rounded-2xl resize-none text-sm text-slate-700 focus:outline-none border border-slate-100 min-h-[80px]"
             />
          </section>

          <section className="pt-2 pb-6 border-b border-dashed border-slate-200">
             <label className="text-xs font-bold text-blue-400 tracking-wider mb-2 block">明日の自分へメモ</label>
             <textarea 
               value={log.tomorrowMemo}
               onChange={e => setLog({ ...log, tomorrowMemo: e.target.value })}
               placeholder="明日は〇〇を忘れない！"
               className="w-full bg-blue-50/50 p-4 rounded-2xl resize-none text-sm text-slate-700 focus:outline-none border border-blue-100/50 min-h-[80px]"
             />
          </section>
          
          <div className="pt-4 flex justify-between items-center">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">今日の自己評価</span>
               <div className="flex items-end gap-1">
                 <input 
                   type="number" 
                   min="0" max="100" 
                   value={log.score || 0}
                   onChange={e => setLog({...log, score: parseInt(e.target.value)})}
                   className="text-2xl font-bold bg-transparent focus:outline-none w-14 border-b border-slate-200 text-center text-slate-800"
                 />
                 <span className="text-sm font-bold text-slate-400 pb-1">点</span>
               </div>
             </div>
             
             <button
               onClick={handleSave}
               disabled={saving}
               className={cn(
                 "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-all duration-300",
                 savedMsg 
                   ? "bg-emerald-500 text-white" 
                   : "bg-slate-800 text-white hover:bg-slate-700"
               )}
             >
               {saving ? (
                  <span className="opacity-80">保存中...</span>
               ) : savedMsg ? (
                  <><Check size={16} /> 保存しました</>
               ) : (
                  <><Save size={16} /> しぶんを記録</>
               )}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
