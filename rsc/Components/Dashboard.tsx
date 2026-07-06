import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, BarChart2, Star, Bookmark, LogOut, User as UserIcon, Sparkles, Heart, ShieldCheck,
  Palette, Sun, Eye, Moon, Menu, X, Home, Settings, Crown
} from 'lucide-react';
import { SavedCalculation } from '../types';
import LotteryFormulas from './LotteryFormulas';
import LuckyGenerator from './LuckyGenerator';
import HistoryList from './HistoryList';
import AdminPanel from './AdminPanel';

interface DashboardProps {
  user: { id: string; username: string; fullName: string; birthDay?: string };
  onLogout: () => void;
  theme: 'pastel' | 'light' | 'night' | 'warm' | 'purple' | 'blue' | 'orange' | 'brown' | 'green' | 'yellow';
  setTheme: (theme: 'pastel' | 'light' | 'night' | 'warm' | 'purple' | 'blue' | 'orange' | 'brown' | 'green' | 'yellow') => void;
  onUpdateUser?: (updatedFields: { fullName: string }) => void;
}

const WEEKDAY_NAMES_TH: Record<string, string> = {
  sunday: 'วันอาทิตย์ ☀️',
  monday: 'วันจันทร์ 🌙',
  tuesday: 'วันอังคาร 🌸',
  wednesday: 'วันพุธ 🍀',
  thursday: 'วันพฤหัสบดี 🍁',
  friday: 'วันศุกร์ 🐳',
  saturday: 'วันเสาร์ 🔮',
};

const WEEKDAY_COLORS: Record<string, string> = {
  sunday: 'bg-red-50 text-red-600 border-red-100',
  monday: 'bg-yellow-50 text-yellow-600 border-yellow-150',
  tuesday: 'bg-pink-50 text-pink-600 border-pink-100',
  wednesday: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  thursday: 'bg-orange-50 text-orange-600 border-orange-100',
  friday: 'bg-sky-50 text-sky-600 border-sky-100',
  saturday: 'bg-purple-50 text-purple-600 border-purple-100',
};

export default function Dashboard({ user, onLogout, theme, setTheme, onUpdateUser }: DashboardProps) {
  const isAdminUser = user.username.toLowerCase() === 'admin';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'formulas' | 'lucky' | 'history' | 'admin'>(
    isAdminUser ? 'admin' : 'formulas'
  );
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem(`lottery_premium_${user.id}`) === 'true';
  });
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);

  const handleUpgrade = async (
    amount: number = 189, 
    fileName: string = 'payment_slip.png', 
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    transferDate?: string,
    transferTime?: string,
    senderName?: string
  ) => {
    setIsPremium(true);
    localStorage.setItem(`lottery_premium_${user.id}`, 'true');

    if (senderName && onUpdateUser) {
      onUpdateUser({ fullName: senderName });
    }

    const durationDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

    // Save to premium purchase history!
    const purchaseLog = {
      id: 'purch_' + Date.now(),
      userId: user.id,
      username: user.username,
      fullName: senderName || user.fullName,
      amount: amount,
      fileName: fileName,
      transferDate: transferDate || new Date().toISOString().split('T')[0],
      transferTime: transferTime || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    // Sync to server-side persistence
    try {
      await fetch('/api/premium-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseLog)
      });

      await fetch('/api/users/toggle-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isPremium: true, durationDays, fullName: senderName || user.fullName })
      });
    } catch (e) {
      console.error('Error syncing purchase / premium upgrade with server:', e);
    }

    const existingLogsStr = localStorage.getItem('lottery_premium_purchases');
    let logs = [];
    if (existingLogsStr) {
      try {
        logs = JSON.parse(existingLogsStr);
      } catch (e) {}
    }
    logs.unshift(purchaseLog);
    localStorage.setItem('lottery_premium_purchases', JSON.stringify(logs));
  };

  // Load calculations on mount
  useEffect(() => {
    const stored = localStorage.getItem(`lottery_calcs_${user.id}`);
    if (stored) {
      try {
        setCalculations(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored calculations', e);
      }
    }

    // Refresh premium state when updated elsewhere (e.g., from Admin Panel)
    const handlePremiumChange = () => {
      setIsPremium(localStorage.getItem(`lottery_premium_${user.id}`) === 'true');
    };

    // Sync premium status from server on mount
    fetch(`/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverUsers => {
        if (Array.isArray(serverUsers)) {
          const currentUser = serverUsers.find((u: any) => u.id === user.id);
          if (currentUser) {
            const serverPremium = !!currentUser.isPremium;
            setIsPremium(serverPremium);
            setPremiumUntil(currentUser.premiumUntil || null);
            if (serverPremium) {
               localStorage.setItem(`lottery_premium_${user.id}`, 'true');
            } else {
               localStorage.removeItem(`lottery_premium_${user.id}`);
            }
          }
        }
      })
      .catch(err => console.warn("Error syncing user status on mount:", err));

    window.addEventListener('premium-status-changed', handlePremiumChange);
    return () => {
      window.removeEventListener('premium-status-changed', handlePremiumChange);
    };
  }, [user.id]);

  // Save changes helper
  const saveCalculationsToStore = (updated: SavedCalculation[]) => {
    setCalculations(updated);
    localStorage.setItem(`lottery_calcs_${user.id}`, JSON.stringify(updated));
  };

  // Add new calculation
  const handleAddCalculation = (calcInput: Omit<SavedCalculation, 'id' | 'timestamp' | 'userId'>) => {
    const newCalc: SavedCalculation = {
      ...calcInput,
      id: 'calc_' + Date.now(),
      userId: user.id,
      timestamp: new Date().toISOString(),
    };
    const updated = [newCalc, ...calculations];
    saveCalculationsToStore(updated);
  };

  // Delete calculation
  const handleDeleteCalculation = (id: string) => {
    const updated = calculations.filter((c) => c.id !== id);
    saveCalculationsToStore(updated);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-700 flex flex-col lg:flex-row pb-16 lg:pb-0">
      {/* 1. SIDEBAR - PERSISTENT ON DESKTOP, DRAWER ON MOBILE */}
      {/* Backdrop overlay on mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-md shadow-2xl border-r border-pink-100/40 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:shadow-none lg:bg-white/80 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Profile Card Header with Pink Gradient */}
        <div className="p-5 bg-gradient-to-br from-pink-500 via-pink-400 to-rose-400 text-white relative">
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-all lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-3">
            {/* Cute Rabbit Face Avatar */}
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-pink-200">
              <span className="text-2xl">🐰</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black truncate flex items-center gap-1">
                {isAdminUser ? 'แอดมินสุดหล่อ 👑' : `คุณ${user.fullName}`}
              </h2>
              <p className="text-[10px] text-pink-100 font-medium truncate">@{user.username}</p>
              
              {/* Premium Badge */}
              <div className="mt-1.5 flex flex-col gap-1">
                {isAdminUser ? (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black text-[9px] rounded-full shadow-sm w-fit">
                    🛠️ แอดมินระบบ
                  </span>
                ) : isPremium ? (
                  <>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black text-[9px] rounded-full shadow-sm flex items-center gap-0.5 w-fit">
                      💎 พรีเมี่ยม VIP
                    </span>
                    {premiumUntil && (
                      <span className="text-[9px] text-pink-50 font-bold block truncate max-w-[150px]">
                        ⏰ VIP ถึง: {new Date(premiumUntil).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const event = new CustomEvent('open-premium-modal');
                      window.dispatchEvent(event);
                      setIsSidebarOpen(false);
                    }}
                    className="px-2 py-0.5 bg-white text-pink-500 font-black text-[9px] rounded-full shadow-sm hover:scale-105 transition-all cursor-pointer w-fit"
                  >
                    💎 อัปเกรดพรีเมี่ยม
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {isAdminUser && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              แผงควบคุมแอดมิน 🛠️
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('formulas');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'formulas'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            สูตรหวย & วินเลข ✏️
          </button>

          <button
            onClick={() => {
              setActiveTab('lucky');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lucky'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-4 h-4" />
            เสี่ยงดวงนำโชค ✨
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'history'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            ประวัติของฉัน 🎀
            {calculations.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-pink-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {calculations.length}
              </span>
            )}
          </button>

          {/* Premium Special Nav Button */}
          {!isPremium && !isAdminUser && (
            <button
              onClick={() => {
                const event = new CustomEvent('open-premium-modal');
                window.dispatchEvent(event);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer mt-4"
            >
              <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
              อัปเกรด VIP สิทธิพิเศษ
            </button>
          )}
        </nav>

        {/* Sidebar Bottom Widget - Themes and Quick Controls */}
        <div className="p-4 border-t border-slate-100 space-y-4">
          {/* Theme Title */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-400" />
              เลือกสีมงคลเสริมโชคลาภ 🎨
            </span>
            <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setTheme('pastel')}
                title="โหมดพาสเทล 🌸"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'pastel' ? 'border-pink-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #fff5f5, #f3f0ff)' }}
              >
                <span className="text-xs">🌸</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="โหมดแสงขาว ☀️"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'light' ? 'border-slate-800 scale-110 shadow-sm border-dashed' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: '#ffffff' }}
              >
                <span className="text-xs">☀️</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('warm')}
                title="โหมดถนอมสายตา 👓"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'warm' ? 'border-amber-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: '#faf5e6' }}
              >
                <span className="text-xs">👓</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('night')}
                title="โหมดกลางคืน 🌙"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'night' ? 'border-indigo-400 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: '#1e293b' }}
              >
                <span className="text-xs">🌙</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('purple')}
                title="สีม่วงมงคล 💜"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'purple' ? 'border-purple-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #faf5ff, #e9d5ff)' }}
              >
                <span className="text-xs">💜</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('blue')}
                title="สีฟ้านำโชค 💙"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'blue' ? 'border-blue-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #f0f9ff, #bae6fd)' }}
              >
                <span className="text-xs">💙</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('orange')}
                title="สีส้มร่ำรวย 🧡"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'orange' ? 'border-orange-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}
              >
                <span className="text-xs">🧡</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('brown')}
                title="สีน้ำตาลเศรษฐี 🤎"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'brown' ? 'border-amber-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #fafaf9, #e7e5e4)' }}
              >
                <span className="text-xs">🤎</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('green')}
                title="สีเขียวเหนี่ยวทรัพย์ 💚"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'green' ? 'border-emerald-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}
              >
                <span className="text-xs">💚</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('yellow')}
                title="สีเหลืองทองคำ 💛"
                className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center border-2 ${
                  theme === 'yellow' ? 'border-yellow-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}
              >
                <span className="text-xs">💛</span>
              </button>
            </div>
          </div>

          {/* Quick Mode Button */}
          <button
            type="button"
            onClick={() => {
              if (theme === 'night') setTheme('pastel');
              else setTheme('night');
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-xs text-slate-500 font-bold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              โหมดกลางคืน
            </span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-md font-mono">
              {theme === 'night' ? 'เปิด' : 'ปิด'}
            </span>
          </button>

          {/* Logout Action */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 justify-center py-2 bg-rose-50 hover:bg-rose-100 text-pink-500 text-xs font-bold rounded-xl border border-pink-100 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ 👋
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* COMPACT STICKY HEADER */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100/70 shadow-sm shadow-pink-100/10">
          <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between">
            
            {/* Hamburger + Title info */}
            <div className="flex items-center gap-2">
              {/* Mobile Sidebar Trigger */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-pink-50 text-pink-500 hover:bg-pink-100 lg:hidden transition-all cursor-pointer"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg shadow-sm text-white">
                  <Heart className="w-4 h-4 fill-white/10" />
                </span>
                <div>
                  <h1 className="text-xs sm:text-sm font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    น้องเศรษฐี คำนวณหวย
                  </h1>
                </div>
              </div>
            </div>

            {/* Quick Profile Status & Quick Upgraders */}
            <div className="flex items-center gap-2">
              {/* Birthday status */}
              {user.birthDay && !isAdminUser && (
                <span className={`hidden sm:inline-block text-[9px] border px-2 py-0.5 rounded-full font-bold ${WEEKDAY_COLORS[user.birthDay] || 'bg-slate-50'}`}>
                  วันเกิด: {WEEKDAY_NAMES_TH[user.birthDay]}
                </span>
              )}

              {/* Status Indicator */}
              {isAdminUser ? (
                <span className="px-2 py-0.5 bg-pink-100 text-pink-600 font-extrabold text-[9px] rounded-full shadow-xs">
                  🛠️ Admin
                </span>
              ) : isPremium ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-extrabold text-[9px] rounded-full shadow-xs">
                  👑 VIP
                </span>
              ) : (
                <button
                  onClick={() => {
                    const event = new CustomEvent('open-premium-modal');
                    window.dispatchEvent(event);
                  }}
                  className="px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-[9px] font-black rounded-full shadow-xs cursor-pointer hover:scale-105 transition-all"
                >
                  👑 อัป VIP 59.-
                </button>
              )}

              {/* Tiny Logout */}
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </header>

        {/* MAIN BODY WINDOW */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 space-y-4">
          {/* Main Tab Rendering Switcher */}
          <div className="bg-transparent animate-fadeIn">
            {activeTab === 'admin' && isAdminUser && (
              <AdminPanel />
            )}
            {activeTab === 'formulas' && (
              <LotteryFormulas user={user} onSave={handleAddCalculation} isPremium={isPremium} onUpgrade={handleUpgrade} />
            )}
            {activeTab === 'lucky' && (
              <LuckyGenerator user={user} onSave={handleAddCalculation} />
            )}
            {activeTab === 'history' && (
              <HistoryList calculations={calculations} onDelete={handleDeleteCalculation} />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-pink-100/40 bg-white/20 py-4 text-center text-slate-400 text-[10px] mt-8 font-medium">
          <p>© 2026 น้องเศรษฐีคำนวณหวย. สงวนลิขสิทธิ์ทั้งหมดเพื่อความบันเทิงทางสถิติและการเสี่ยงทายตัวเลขเท่านั้น 🍭</p>
        </footer>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (Matches Replit/Native Screenshot) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 flex items-center justify-around py-1.5 px-3 z-40 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => setActiveTab('formulas')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'formulas' ? 'text-pink-500 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">หน้าแรก</span>
        </button>

        <button
          onClick={() => setActiveTab('lucky')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'lucky' ? 'text-pink-500 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px]">วงล้อนำโชค</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'history' ? 'text-pink-500 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-5 h-5" />
            {calculations.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white font-mono text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {calculations.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">ประวัติ</span>
        </button>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-pink-500 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">ตั้งค่า/สี</span>
        </button>
      </div>
    </div>
  );
}
