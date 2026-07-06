import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [session, setSession] = useState<{ id: string; username: string; fullName: string; birthDay?: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [checkingConnection, setCheckingConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Dynamic polling fallback just in case
    const interval = setInterval(() => {
      if (navigator.onLine && isOffline) {
        setIsOffline(false);
      } else if (!navigator.onLine && !isOffline) {
        setIsOffline(true);
      }
    }, 3000);

    // Check session on mount
    const storedSession = localStorage.getItem('lottery_active_session');
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem('lottery_active_session');
      }
    }
    setCheckingSession(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline]);

  const handleRetryConnection = () => {
    setCheckingConnection(true);
    setTimeout(() => {
      setIsOffline(!navigator.onLine);
      setCheckingConnection(false);
    }, 800);
  };

  const handleLoginSuccess = (user: { id: string; username: string; fullName: string; birthDay?: string }) => {
    setSession(user);
    localStorage.setItem('lottery_active_session', JSON.stringify(user));
  };

  const handleUpdateUser = (updatedFields: { fullName: string }) => {
    if (session) {
      const updated = { ...session, ...updatedFields };
      setSession(updated);
      localStorage.setItem('lottery_active_session', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('lottery_active_session');
  };

  // Theme Management
  const [theme, setTheme] = useState<'pastel' | 'light' | 'night' | 'warm' | 'purple' | 'blue' | 'orange' | 'brown' | 'green' | 'yellow'>(() => {
    return (localStorage.getItem('lottery_theme') as any) || 'pastel';
  });

  useEffect(() => {
    document.body.className = 'theme-' + theme;
    localStorage.setItem('lottery_theme', theme);
  }, [theme]);

  // Offline Blocking View
  if (isOffline) {
    return (
      <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px] opacity-70" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 max-w-md w-full bg-white border-2 border-red-100 rounded-3xl p-6 md:p-8 text-center shadow-xl space-y-6"
        >
          {/* Glowing offline icon container */}
          <div className="mx-auto w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 animate-bounce" style={{ animationDuration: '2s' }}>
            <WifiOff className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              ไม่มีการเชื่อมต่ออินเทอร์เน็ต 🚨
            </h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-sm mx-auto">
              แอปพลิเคชันสูตรหวยน้องเศรษฐี <span className="text-pink-500">จำเป็นต้องใช้งานออนไลน์เท่านั้น</span> เพื่อเชื่อมต่อระบบวิเคราะห์ฐานข้อมูลแบบเรียลไทม์ และระบบความปลอดภัยป้องกันการส่งสลิปปลอมค่ะ
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              กรุณาเชื่อมต่อ Wi-Fi หรือเปิดข้อมูลมือถือ (Mobile Data) แล้วลองอีกครั้งนะคะ 💖
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRetryConnection}
              disabled={checkingConnection}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-pink-150 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {checkingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลังตรวจสอบการเชื่อมต่อ...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  ตรวจสอบและเชื่อมต่อใหม่ 🔄
                </>
              )}
            </button>

            <button
              onClick={() => setIsOffline(false)}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-500 hover:text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-1 text-[11px] cursor-pointer border border-slate-200"
            >
              ข้ามการตรวจสอบ (เข้าใช้งานแอปเลย) 🚀
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-pink-400 font-bold text-sm">กำลังโหลดความโชคดีน้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-700">
      {session ? (
        <Dashboard user={session} onLogout={handleLogout} theme={theme} setTheme={setTheme} onUpdateUser={handleUpdateUser} />
      ) : (
        <div className="relative min-h-screen overflow-hidden">
          {/* Custom cosmic grid background decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fbcfe822_1px,transparent_1px),linear-gradient(to_bottom,#fbcfe822_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
            <Auth onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

