import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DailyLog } from "../types";
import { getAllDailyLogs } from "../lib/api";
import { cn } from "../lib/utils";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [allLogsList, setAllLogsList] = useState<DailyLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const allLogs = await getAllDailyLogs();
      const map: Record<string, DailyLog> = {};
      allLogs.forEach(l => map[l.date] = l);
      setLogs(map);
      setAllLogsList(allLogs);
    }
    load();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - getDay(startDate));
  const endDate = new Date(monthEnd);
  if (getDay(endDate) !== 6) {
    endDate.setDate(endDate.getDate() + (6 - getDay(endDate)));
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const searchResults = searchQuery.trim() === "" ? [] : allLogsList.filter(log => {
      const q = searchQuery.toLowerCase();
      if (log.diary?.toLowerCase().includes(q)) return true;
      if (log.mood?.includes(q)) return true;
      if (log.goodThings?.some(g => g.toLowerCase().includes(q))) return true;
      if (log.difficultThings?.toLowerCase().includes(q)) return true;
      if (log.date === q) return true;
      return false;
  });

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="flex justify-center mb-6">
         <div className="w-full relative">
            <input 
              type="text"
              placeholder="検索（気持、日記、日付など）..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full py-3 px-12 text-sm shadow-sm border border-slate-100 focus:outline-none focus:border-blue-300"
            />
            <SearchIcon className="absolute left-4 top-3 text-slate-400" size={18} />
         </div>
      </div>

      {searchQuery.trim() !== "" ? (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500 mb-2">{searchResults.length}件見つかりました</p>
          {searchResults.map(log => (
            <div key={log.date} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
               <div className="text-xs font-bold text-blue-500 mb-2">{log.date} {log.mood}</div>
               <p className="text-sm text-slate-700 leading-snug line-clamp-2">{log.diary}</p>
            </div>
          ))}
          {searchResults.length === 0 && (
             <div className="text-center text-sm text-slate-500 mt-10">該当する記録がありません</div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setCurrentMonth(d => subMonths(d, 1))}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {format(currentMonth, "yyyy年 M月")}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">CALENDAR</p>
            </div>
            <button 
              onClick={() => setCurrentMonth(d => addMonths(d, 1))}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="grid grid-cols-7 gap-y-4 mb-4">
              {DAYS.map((day, i) => (
                <div key={day} className={cn(
                  "text-center text-[10px] font-bold",
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
                )}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {days.map(day => {
                const dStr = format(day, "yyyy-MM-dd");
                const log = logs[dStr];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTdy = isToday(day);

                return (
                  <div 
                    key={dStr} 
                    onClick={() => {
                      // navigate(`/?date=${dStr}`);
                    }}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-start py-1 rounded-xl cursor-default transition-all duration-200 relative",
                      isCurrentMonth ? "text-slate-700" : "text-slate-300",
                      isTdy && "bg-blue-50/50 ring-1 ring-blue-100"
                    )}
                  >
                    {isTdy && (
                       <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full drop-shadow-sm"></div>
                    )}
                    <span className="text-xs font-medium">{format(day, "d")}</span>
                    
                    {log?.mood && (
                      <span className="text-lg mt-0.5 leading-none">{log.mood}</span>
                    )}
                    {!log?.mood && log && (
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
