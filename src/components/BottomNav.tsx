import { NavLink } from "react-router-dom";
import { Home, Calendar as CalendarIcon, BookOpen, Settings, LayoutList } from "lucide-react";
import { cn } from "../lib/utils";

export function BottomNav() {
  const links = [
    { to: "/", icon: Home, label: "今日" },
    { to: "/week", icon: LayoutList, label: "週間" },
    { to: "/calendar", icon: CalendarIcon, label: "月間" },
    { to: "/semester", icon: BookOpen, label: "学期" },
    { to: "/settings", icon: Settings, label: "設定" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 z-50">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
              isActive ? "text-blue-600 font-medium" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )
          }
        >
          {({ isActive }) => (
            <>
              <link.icon size={isActive ? 22 : 20} className="mb-1 transition-all" />
              <span className="text-[10px]">{link.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
