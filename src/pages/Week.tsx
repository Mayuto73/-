import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { DailyLog, DaySchedule, WeekCheck } from "../types";
import { getWeekSchedules, getAllDailyLogs, getWeekCheck, saveWeekCheck } from "../lib/api";
import { auth } from "../firebase";
import { cn } from "../lib/utils";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CHECK_ITEMS = [
  "朝決まった時間に起きた",
  "遅刻しなかった",
  "宿題を出した",
  "提出物を忘れなかった",
  "時間を守れた"
];

export default function Week() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>({});
  const [weekChecks, setWeekChecks] = useState<Record<string, boolean>>({});

  const startStr = format(currentWeekStart, "yyyy-MM-dd");
  const endStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  useEffect(() => {
    async function load() {
      // In a real app we'd query by date range, but here we'll just fetch all or filter locally for MVP
      const allLogs = await getAllDailyLogs();
      const logsMap: Record<string, DailyLog> = {};
      allLogs.forEach(l => logsMap[l.date] = l);
      
      const scheds = await getWeekSchedules(startStr, endStr);
      const schedsMap: Record<string, DaySchedule> = {};
      scheds.forEach(s => schedsMap[s.date] = s);

      const check = await getWeekCheck(startStr);

      setLogs(logsMap);
      setSchedules(schedsMap);
      setWeekChecks(check?.checks || {});
    }
    load();
  }, [currentWeekStart, startStr, endStr]);

  const handleCheck = async (item: string) => {
    if (!auth.currentUser) return;
    const newChecks = { ...weekChecks, [item]: !weekChecks[item] };
    setWeekChecks(newChecks);
    await saveWeekCheck({
      userId: auth.currentUser.uid,
      weekStartDate: startStr,
      checks: newChecks
    });
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setCurrentWeekStart(d => addDays(d, -7))}
          className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            {format(currentWeekStart, "M月d日")} - {format(addDays(currentWeekStart, 6), "M月d日")}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">WEEKLY VIEW</p>
        </div>
        <button 
          onClick={() => setCurrentWeekStart(d => addDays(d, 7))}
          className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {days.map((date) => {
          const dStr = format(date, "yyyy-MM-dd");
          const log = logs[dStr];
          const schedule = schedules[dStr];
          const dayIdx = getDay(date);

          return (
            <div key={dStr} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex gap-4">
              <div className="flex flex-col items-center shrink-0 w-10">
                <span className={cn(
                  "text-[10px] font-bold mb-1",
                  dayIdx === 0 ? "text-red-500" : dayIdx === 6 ? "text-blue-500" : "text-slate-500"
                )}>
                  {DAYS[dayIdx]}
                </span>
                <span className="text-xl font-bold text-slate-800">{format(date, "d")}</span>
                {log?.mood && <span className="text-xl mt-2">{log.mood}</span>}
              </div>
              
              <div className="flex-1 flex flex-col justify-center border-l border-slate-100 pl-4 py-1">
                {schedule?.periods && schedule.periods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {schedule.periods.map((p, i) => (
                      <span key={i} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-100">{p}</span>
                    ))}
                  </div>
                )}
                
                {log?.diary ? (
                  <p className="text-sm text-slate-700 leading-snug line-clamp-2">{log.diary}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic">記録なし</p>
                )}
                
                {log?.photos && log.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {log.photos.slice(0,3).map((u, i) => (
                      <img key={i} src={u} className="w-10 h-10 object-cover rounded-xl shadow-sm" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50">
        <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          今週できたこと Check!
        </h3>
        <div className="space-y-3">
          {CHECK_ITEMS.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center border transition-colors",
                weekChecks[item] 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-white border-slate-200 text-transparent group-hover:border-emerald-300"
              )}>
                <Check size={14} strokeWidth={3} />
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                weekChecks[item] ? "text-slate-800" : "text-slate-600"
              )}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
