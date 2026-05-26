import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { BottomNav } from "./components/BottomNav";

import Home from "./pages/Home";
import Week from "./pages/Week";
import CalendarPage from "./pages/Calendar";
import Semester from "./pages/Semester";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function ProtectedLayout({ user }: { user: User | null }) {
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 text-slate-800 font-sans selection:bg-blue-100">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        <Route element={<ProtectedLayout user={user} />}>
          <Route path="/" element={<Home />} />
          <Route path="/week" element={<Week />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/semester" element={<Semester />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
