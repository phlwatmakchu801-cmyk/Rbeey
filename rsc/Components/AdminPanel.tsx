import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, Users, FileText, Save, CheckCircle2, Ban, ShieldAlert, 
  Crown, Search, RefreshCw, Sparkles, Check, AlertTriangle, ShieldCheck,
  UploadCloud, Image, Key, Clock, Copy, Plus, Trash2
} from 'lucide-react';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

interface QrConfig {
  promptPayNumber: string;
  accountName: string;
  amount: number;
  qrText: string;
  customQrUrl?: string;
  useCustomImage: boolean;
}

const DEFAULT_QR_CONFIG: QrConfig = {
  promptPayNumber: '0941465408',
  accountName: 'น้องเศรษฐีนำโชค',
  amount: 189,
  qrText: 'โอนเงิน 189.- บาท เพื่อปลดล็อกทันที',
  customQrUrl: '',
  useCustomImage: false,
};

interface BlockedLog {
  id: string;
  username: string;
  fullName: string;
  timestamp: string;
  reason: string;
  fileName?: string;
}

interface PremiumCode {
  code: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  durationDays: number;
}

export default function AdminPanel() {
  const [activeSubTab, setActiveSubTab] = useState<'qr' | 'users' | 'logs' | 'purchases' | 'codes'>('qr');
  
  // QR Config State
  const [qrConfig, setQrConfig] = useState<QrConfig>(DEFAULT_QR_CONFIG);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Logs State
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([]);
  const [premiumPurchases, setPremiumPurchases] = useState<any[]>([]);

  // Premium Codes State
  const [premiumCodes, setPremiumCodes] = useState<PremiumCode[]>([]);

  // Load everything on mount
  useEffect(() => {
    // Helper to load blocked logs from server or local
    const loadBlockedLogs = () => {
      fetch(`/api/blocked-logs?t=${Date.now()}`)
        .then(res => res.json())
        .then(serverLogs => {
          if (Array.isArray(serverLogs)) {
            setBlockedLogs(serverLogs);
            localStorage.setItem('lottery_blocked_logs', JSON.stringify(serverLogs));
          }
        })
        .catch(() => {
          const storedLogs = localStorage.getItem('lottery_blocked_logs');
          if (storedLogs) {
            try {
              setBlockedLogs(JSON.parse(storedLogs));
            } catch (e) {
              setBlockedLogs([]);
            }
          }
        });
    };

    // 1. Load QR Config
    fetch(`/api/qr-config?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverConfig => {
        if (serverConfig) {
          setQrConfig(serverConfig);
          localStorage.setItem('lottery_qr_config', JSON.stringify(serverConfig));
        }
      })
      .catch(() => {
        const storedConfig = localStorage.getItem('lottery_qr_config');
        if (storedConfig) {
          try {
            setQrConfig(JSON.parse(storedConfig));
          } catch (e) {
            setQrConfig(DEFAULT_QR_CONFIG);
          }
        } else {
          localStorage.setItem('lottery_qr_config', JSON.stringify(DEFAULT_QR_CONFIG));
        }
      });

    // 2. Load Users
    loadUsersFromStore();

    // 3. Load Blocked Logs
    loadBlockedLogs();

    // 4. Load Purchases
    loadPurchasesFromStore();

    // Load Premium Codes
    loadPremiumCodes();

    // Setup BroadcastChannel for instant cross-tab sync
    const syncChannel = new BroadcastChannel('lottery_sync');
    syncChannel.onmessage = (event) => {
      if (event.data.type === 'refresh_users') {
        loadUsersFromStore();
        loadPurchasesFromStore();
      }
    };

    // 5. Setup live polling every 5 seconds for registrations, blocked logs, and purchases
    const intervalId = setInterval(() => {
      loadUsersFromStore();
      loadBlockedLogs();
      loadPurchasesFromStore();
      loadPremiumCodes();
    }, 5000);

    return () => {
      clearInterval(intervalId);
      syncChannel.close();
    };
  }, []);

  const loadPremiumCodes = () => {
    fetch(`/api/premium-codes?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverCodes => {
        if (Array.isArray(serverCodes)) {
          setPremiumCodes(serverCodes);
        }
      })
      .catch(err => {
        console.error("Error loading premium codes:", err);
      });
  };

  const loadPurchasesFromStore = () => {
    fetch(`/api/premium-purchases?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverPurchases => {
        if (Array.isArray(serverPurchases)) {
          setPremiumPurchases(serverPurchases);
          localStorage.setItem('lottery_premium_purchases', JSON.stringify(serverPurchases));
        }
      })
      .catch(() => {
        const storedPurchases = localStorage.getItem('lottery_premium_purchases');
        if (storedPurchases) {
          try {
            setPremiumPurchases(JSON.parse(storedPurchases));
          } catch (e) {
            setPremiumPurchases([]);
          }
        } else {
          setPremiumPurchases([]);
        }
      });
  };

  const loadUsersFromStore = () => {
    fetch(`/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverUsers => {
        if (Array.isArray(serverUsers)) {
          setUsers(serverUsers);
          localStorage.setItem('lottery_users', JSON.stringify(serverUsers));

          // Sync premium statuses locally for the frontend checks
          serverUsers.forEach((u: any) => {
            if (u.isPremium) {
              localStorage.setItem(`lottery_premium_${u.id}`, 'true');
            } else {
              localStorage.removeItem(`lottery_premium_${u.id}`);
            }
          });
        }
      })
      .catch(() => {
        const usersStr = localStorage.getItem('lottery_users');
        if (usersStr) {
          try {
            setUsers(JSON.parse(usersStr));
          } catch (e) {
            setUsers([]);
          }
        }
      });
  };

  const handleSaveQrConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lottery_qr_config', JSON.stringify(qrConfig));
    
    try {
      await fetch('/api/qr-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrConfig)
      });
    } catch (e) {
      console.error('Error saving QR config to server:', e);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrConfig({
          ...qrConfig,
          customQrUrl: reader.result as string,
          useCustomImage: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'blocked') => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('lottery_users', JSON.stringify(updatedUsers));
    playSuccessSound();

    try {
      await fetch('/api/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus })
      });

      // Broadcast update cross-tab instantly
      try {
        const syncChannel = new BroadcastChannel('lottery_sync');
        syncChannel.postMessage({ type: 'refresh_users' });
        syncChannel.close();
      } catch (bcErr) {
        console.warn(bcErr);
      }
    } catch (e) {
      console.error('Error updating status on server:', e);
    }
    
    // If we blocked a user, remove their active session if it matches their ID
    const activeSession = localStorage.getItem('lottery_active_session');
    if (activeSession) {
      try {
        const sessionData = JSON.parse(activeSession);
        if (sessionData.id === userId && newStatus === 'blocked') {
          localStorage.removeItem('lottery_active_session');
          // Reload page to force logout
          window.location.reload();
        }
      } catch (e) {}
    }
  };

  const handleTogglePremium = async (userId: string, currentPremium: boolean) => {
    const userToChange = users.find(u => u.id === userId);
    const userFullName = userToChange ? (userToChange.fullName || userToChange.fullname || userToChange.username) : 'ไม่ระบุชื่อ';
    const userUsername = userToChange ? userToChange.username : 'unknown';

    const newLog = {
      id: 'purch_manual_' + Date.now(),
      userId: userId,
      username: userUsername,
      fullName: userFullName,
      amount: currentPremium ? 0 : 189,
      fileName: currentPremium ? 'ยกเลิกสิทธิ์โดยแอดมิน 🛠️' : 'แต่งตั้งสิทธิ์โดยแอดมิน 🛠️',
      timestamp: new Date().toISOString(),
      status: currentPremium ? 'revoked' : 'manual_success'
    };

    if (currentPremium) {
      localStorage.removeItem(`lottery_premium_${userId}`);
    } else {
      localStorage.setItem(`lottery_premium_${userId}`, 'true');
    }
    playSuccessSound();

    try {
      await fetch('/api/users/toggle-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isPremium: !currentPremium })
      });

      await fetch('/api/premium-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });

      // Broadcast update cross-tab instantly
      try {
        const syncChannel = new BroadcastChannel('lottery_sync');
        syncChannel.postMessage({ type: 'refresh_users' });
        syncChannel.close();
      } catch (bcErr) {
        console.warn(bcErr);
      }
    } catch (e) {
      console.error('Error toggling premium on server:', e);
    }

    // Save log locally
    const existingLogsStr = localStorage.getItem('lottery_premium_purchases');
    let logs = [];
    if (existingLogsStr) {
      try {
        logs = JSON.parse(existingLogsStr);
      } catch (e) {}
    }
    logs.unshift(newLog);
    localStorage.setItem('lottery_premium_purchases', JSON.stringify(logs));
    setPremiumPurchases(logs);

    // Force reload/refresh list
    loadUsersFromStore();
    // Dispatch custom event to notify premium changes globally
    window.dispatchEvent(new Event('premium-status-changed'));
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    playPopSound();
    if (username.toLowerCase() === 'admin') {
      playErrorSound();
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (admin) ได้ค่ะ 🚫');
      return;
    }
    if (!confirm(`คุณแน่ใจหรือไม่คะว่าจะลบผู้ใช้งาน @${username} ออกจากระบบถาวร? การกระทำนี้ไม่สามารถย้อนคืนได้ค่ะ 🥺`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSuccessSound();
        alert(`ลบผู้ใช้งาน @${username} ออกจากระบบเรียบร้อยแล้วค่ะ! 🗑️`);
        loadUsersFromStore();
        // Remove local premium cache
        localStorage.removeItem(`lottery_premium_${userId}`);
        // Broadcast update cross-tab instantly
        try {
          const syncChannel = new BroadcastChannel('lottery_sync');
          syncChannel.postMessage({ type: 'refresh_users' });
          syncChannel.close();
        } catch (bcErr) {
          console.warn(bcErr);
        }
      } else {
        const errData = await res.json();
        playErrorSound();
        alert(errData.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้ค่ะ');
      }
    } catch (e) {
      console.error('Error deleting user:', e);
      playErrorSound();
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ค่ะ');
    }
  };

  const handleGenerateCode = async (durationDays: number) => {
    try {
      const res = await fetch('/api/premium-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationDays })
      });
      if (res.ok) {
        const data = await res.json();
        const pkgText = durationDays === 1 ? 'รายวัน 1 วัน' : durationDays === 7 ? 'รายอาทิตย์ 7 วัน' : 'รายเดือน 30 วัน';
        const durationText = durationDays === 1 ? '24 ชั่วโมง' : durationDays === 7 ? '7 วัน' : '30 วัน';
        playSuccessSound();
        alert(`🎉 สร้างโค้ดเปิดพรีเมี่ยม (${pkgText}) สำเร็จแล้วค่ะ!\n\nรหัส: ${data.code.code}\nกรุณาคัดลอกส่งต่อให้ลูกค้านะคะ รหัสนี้หมดอายุภายใน ${durationText} ค่ะ ⏰`);
        loadPremiumCodes();
      } else {
        playErrorSound();
        alert('ไม่สามารถสร้างรหัสได้ กรุณาลองใหม่อีกครั้งค่ะ');
      }
    } catch (e) {
      console.error('Error generating premium code:', e);
      playErrorSound();
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ค่ะ');
    }
  };

  const handleDeleteCode = async (code: string) => {
    playPopSound();
    if (!confirm(`คุณแน่ใจหรือไม่คะว่าจะลบรหัส ${code} ออกจากระบบ? 🥺`)) {
      return;
    }
    try {
      const res = await fetch(`/api/premium-codes/${code}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSuccessSound();
        alert(`ลบรหัส ${code} สำเร็จแล้วค่ะ! 🗑️`);
        loadPremiumCodes();
      } else {
        const errData = await res.json();
        playErrorSound();
        alert(errData.error || 'เกิดข้อผิดพลาดในการลบรหัสค่ะ');
      }
    } catch (e) {
      console.error('Error deleting premium code:', e);
      playErrorSound();
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ค่ะ');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const uname = (u.username || '').toLowerCase();
    const fname = (u.fullName || u.fullname || u.username || '').toLowerCase();
    return uname.includes(q) || fname.includes(q);
  });

  const isUserPremium = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    if (userObj) {
      return !!userObj.isPremium;
    }
    return localStorage.getItem(`lottery_premium_${userId}`) === 'true';
  };

  return (
    <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-xl glow-cute space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-pink-50 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-pink-600 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-pink-400" />
            แผงควบคุมผู้ดูแลระบบหลังบ้าน (Admin Console) 🛠️
          </h2>
          <p className="text-slate-450 text-xs mt-1 font-medium">
            จัดการข้อมูลผู้ใช้งาน ตั้งค่าบัญชีและหน้าชำระเงิน ตรวจสอบประวัติพฤติกรรมสลิปปลอม
          </p>
        </div>

        {/* Sub tabs navigation */}
        <div className="flex bg-rose-50/60 p-1 rounded-xl border border-pink-100/35 flex-wrap gap-1">
          <button
            onClick={() => { playPopSound(); setActiveSubTab('qr'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'qr'
                ? 'bg-pink-400 text-white shadow-sm'
                : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            แก้ไขเบอร์พร้อมเพย์
          </button>
          <button
            onClick={() => { playPopSound(); setActiveSubTab('users'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'users'
                ? 'bg-pink-400 text-white shadow-sm'
                : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            จัดการสมาชิก ({users.length})
          </button>
          <button
            onClick={() => {
              playPopSound();
              setActiveSubTab('purchases');
              loadPurchasesFromStore();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'purchases'
                ? 'bg-pink-400 text-white shadow-sm'
                : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            ประวัติการซื้อพรีเมี่ยม
          </button>
          <button
            onClick={() => { playPopSound(); setActiveSubTab('logs'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
              activeSubTab === 'logs'
                ? 'bg-pink-400 text-white shadow-sm'
                : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            สลิปปลอมที่ถูกบล็อก
            {blockedLogs.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {blockedLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub tab contents rendering */}
      {activeSubTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <form onSubmit={handleSaveQrConfig} className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              แก้ไขหน้าชำระเงินพร้อมเพย์พรีเมี่ยม
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  เบอร์โทรศัพท์พร้อมเพย์ (PromptPay ID)
                </label>
                <input
                  type="text"
                  value={qrConfig.promptPayNumber}
                  onChange={e => setQrConfig({ ...qrConfig, promptPayNumber: e.target.value })}
                  placeholder="เช่น 095-123-4567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-pink-100/70 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  ชื่อบัญชีรับโอนเงิน
                </label>
                <input
                  type="text"
                  value={qrConfig.accountName}
                  onChange={e => setQrConfig({ ...qrConfig, accountName: e.target.value })}
                  placeholder="เช่น หจก. น้องเศรษฐีรวย"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-pink-100/70 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 rounded-xl text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  ยอดเงินค่าบริการ (บาท)
                </label>
                <input
                  type="number"
                  value={qrConfig.amount}
                  onChange={e => setQrConfig({ ...qrConfig, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-pink-100/70 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  ข้อความแนะนำสำหรับโอนเงิน
                </label>
                <input
                  type="text"
                  value={qrConfig.qrText}
                  onChange={e => setQrConfig({ ...qrConfig, qrText: e.target.value })}
                  placeholder="เช่น โอนเงิน 189.- บาท เพื่อปลดล็อกทันที"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-pink-100/70 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 rounded-xl text-sm font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 animate-scaleUp" />
                  บันทึกความเปลี่ยนแปลงสําเร็จแล้วน้า! 🎉
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  บันทึกการตั้งค่าพร้อมเพย์ 💾
                </>
              )}
            </button>
          </form>

          {/* Real-time Preview */}
          <div className="lg:col-span-5 bg-rose-50/30 border border-pink-100 p-5 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
            <div>
              <span className="px-2.5 py-1 bg-pink-100 text-pink-600 font-extrabold text-[10px] rounded-full">
                มุมมองฝั่งลูกค้า (Live Preview) 👀
              </span>
            </div>

            <div className="bg-white p-5 border border-pink-100 rounded-3xl max-w-[210px] w-full shadow-md space-y-3.5 animate-fadeIn">
              <div className="bg-[#002B66] text-white py-1 px-2.5 rounded-lg text-[8px] font-black tracking-wider uppercase flex items-center justify-center">
                PromptPay 💳
              </div>

              {/* PromptPay Number Card (No QR Code) */}
              <div className="bg-rose-50/35 border border-pink-50 p-3 rounded-2xl space-y-2">
                <span className="text-[9px] font-bold text-slate-400 block">เบอร์พร้อมเพย์รับเงิน</span>
                <span className="text-base font-black text-slate-800 tracking-wider font-mono bg-slate-50 border border-slate-100 py-1 px-2 rounded-xl block">
                  {qrConfig.promptPayNumber}
                </span>
                <span className="text-[8px] text-pink-400 font-bold block">โอนเข้าเบอร์นี้ได้เลยค่ะ</span>
              </div>
              
              <div className="text-left text-[10px] space-y-1 border-t border-dashed border-slate-100 pt-2.5">
                <p className="text-slate-500 font-bold">ชื่อบัญชี: <span className="text-slate-700">{qrConfig.accountName}</span></p>
                <p className="text-slate-500 font-bold">ราคาโอน: <span className="text-pink-500 font-black">{qrConfig.amount}.- บาท</span></p>
              </div>
            </div>
            <p className="text-[10px] text-pink-500/85 font-semibold mt-1">"{qrConfig.qrText}"</p>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm bg-slate-50 px-3.5 py-2.5 rounded-xl border border-pink-100/50">
            <Search className="w-4 h-4 text-pink-300" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้ใช้งาน หรือ ชื่อจริง..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="overflow-x-auto border border-pink-50 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/55 border-b border-pink-100/60 font-bold text-slate-500">
                  <th className="p-3.5">ชื่อผู้ใช้งาน</th>
                  <th className="p-3.5">ชื่อ-นามสกุล</th>
                  <th className="p-3.5">วันเกิดดวงดี</th>
                  <th className="p-3.5">สถานะบัญชี</th>
                  <th className="p-3.5">สิทธิ์ VIP</th>
                  <th className="p-3.5 text-center">จัดการบัญชี</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-slate-400 font-medium">
                      ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหาเลยค่ะ 🐰
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isPremium = isUserPremium(u.id);
                    const isSystemAdmin = u.username.toLowerCase() === 'admin';
                    
                    return (
                      <tr key={u.id} className="hover:bg-rose-50/15 transition-colors font-medium">
                        <td className="p-3.5 font-bold text-slate-700">{u.username}</td>
                        <td className="p-3.5 text-slate-600">{u.fullName || u.fullname || u.username}</td>
                        <td className="p-3.5 text-slate-550 capitalize">{u.birthDay || '-'}</td>
                        <td className="p-3.5">
                          {u.status === 'blocked' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full font-bold text-[10px]">
                              <Ban className="w-3 h-3" />
                              ระงับถาวร 🚫
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              ปกติ 🟢
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isPremium ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold text-[10px] w-fit">
                                <Crown className="w-3 h-3" />
                                VIP ระดับส้ม 👑
                              </span>
                              {u.premiumUntil && (
                                <span className="text-[9px] text-slate-450 block font-medium">
                                  หมดอายุ: {new Date(u.premiumUntil).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-450 border border-slate-100 rounded-full text-[10px]">
                              ทั่วไป 🍉
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 flex items-center justify-center gap-2">
                          {isSystemAdmin ? (
                            <span className="text-[10px] text-pink-400 font-bold bg-pink-50 px-2.5 py-1 rounded-lg">
                              เป็นผู้ดูแลระบบ
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleTogglePremium(u.id, isPremium)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all ${
                                  isPremium
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                    : 'bg-rose-50 hover:bg-pink-100 text-pink-500'
                                }`}
                                disabled={u.status === 'blocked'}
                              >
                                <Crown className="w-3 h-3" />
                                {isPremium ? 'ยกเลิก VIP' : 'แต่งตั้ง VIP'}
                              </button>
                              
                              {u.status === 'blocked' ? (
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, 'active')}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-150 rounded-lg cursor-pointer transition-all"
                                >
                                  ปลดแบน 🔓
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, 'blocked')}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-lg cursor-pointer transition-all"
                                >
                                  บล็อคบัญชี 🚫
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 rounded-lg cursor-pointer transition-all flex items-center gap-0.5"
                                title="ลบชื่อผู้ใช้งานนี้ออกจากระบบถาวร"
                              >
                                <Trash2 className="w-3 h-3" />
                                ลบบัญชี 🗑️
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="p-4.5 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-slate-800">ระบบคัดกรองสลิปปลอมแบบ AI อัตโนมัติ 🚨</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-0.5">
                รายการด้านล่างคือบัญชีผู้ใช้ที่พยายามอัปโหลดสลิปปลอม สลิปที่ผ่านการดัดแปลงยอดโอนเงิน หรือการนำสลิปเก่ามาวนซ้ำ 
                ซึ่งทางระบบตรวจพบสิ่งผิดปกติและได้ทำการ<b>ล็อกบัญชี (Auto-Blocked) ทันที</b>เพื่อความปลอดภัยสูงสุดของระบบค่ะ
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {blockedLogs.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium text-xs">
                ไม่มีประวัติการส่งสลิปปลอมเข้ามาเลยค่ะ ปลอดภัยหายห่วง 🍉
              </div>
            ) : (
              blockedLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 bg-white border border-red-100 hover:border-red-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">คุณ {log.fullName || log.fullname || log.username}</span>
                      <span className="px-2 py-0.5 bg-rose-50 text-red-500 font-mono text-[9px] font-black rounded border border-red-100">
                        @{log.username}
                      </span>
                    </div>
                    <p className="text-[10px] text-red-500 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ตรวจพบ: {log.reason} (ไฟล์: {log.fileName || 'slip_payment_test.png'})
                    </p>
                    <p className="text-[9px] text-slate-450 font-semibold font-mono">
                      เวลาที่ถูกระงับ: {new Date(log.timestamp).toLocaleString('th-TH')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">
                      สถานะ: ถูกบล็อกทันที 🚫
                    </span>
                    <button
                      onClick={async () => {
                        // Unban log from user list
                        const userList = localStorage.getItem('lottery_users');
                        let targetUserId = '';
                        if (userList) {
                          try {
                            const parsed = JSON.parse(userList);
                            const updated = parsed.map((u: any) => {
                              if (u.username.toLowerCase() === log.username.toLowerCase()) {
                                targetUserId = u.id;
                                return { ...u, status: 'active' };
                              }
                              return u;
                            });
                            localStorage.setItem('lottery_users', JSON.stringify(updated));
                          } catch (e) {}
                        }
                        
                        // Remove from logs list
                        const newLogs = blockedLogs.filter(l => l.id !== log.id);
                        setBlockedLogs(newLogs);
                        localStorage.setItem('lottery_blocked_logs', JSON.stringify(newLogs));

                        try {
                          if (targetUserId) {
                            await fetch('/api/users/update-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: targetUserId, status: 'active' })
                            });
                          }
                          await fetch('/api/blocked-logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newLogs)
                          });
                        } catch (e) {
                          console.error('Error syncing unblock on server:', e);
                        }

                        loadUsersFromStore();
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                    >
                      ปลดบล็อค & อภัยโทษ 🔓
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'purchases' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Statistics widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-100 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ยอดเงินรวมจำลอง 💰</span>
              <span className="text-2xl font-black text-pink-600 mt-1 block font-mono">
                {premiumPurchases
                  .filter(p => p.status === 'success' || p.status === 'manual_success')
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
                  .toLocaleString()}.- บาท
              </span>
              <span className="text-[9px] text-slate-400 font-semibold mt-1 block">*จากยอดการอัปเกรด VIP ทั้งหมด</span>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-150 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">สิทธิ์ VIP ปัจจุบัน 👑</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {users.filter(u => isUserPremium(u.id)).length} บัญชี
              </span>
              <span className="text-[9px] text-slate-400 font-semibold mt-1 block">จากบัญชีผู้สมัครใช้งานทั้งหมด {users.length} คน</span>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-100 p-4.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ธุรกรรมทั้งหมด 📄</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                {premiumPurchases.length} รายการ
              </span>
              <button
                onClick={async () => {
                  if (confirm('คุณต้องการลบประวัติการซื้อขายทั้งหมดหรือไม่คะ?')) {
                    localStorage.removeItem('lottery_premium_purchases');
                    setPremiumPurchases([]);
                    try {
                      await fetch('/api/premium-purchases/clear', { method: 'POST' });
                    } catch (e) {
                      console.error('Error clearing purchases on server:', e);
                    }
                  }
                }}
                className="text-[9px] text-rose-500 font-bold hover:underline mt-1 block text-left cursor-pointer"
              >
                เคลียร์ประวัติทำรายการทั้งหมด 🧹
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 max-w-sm bg-slate-50 px-3.5 py-2.5 rounded-xl border border-pink-100/50">
            <Search className="w-4 h-4 text-pink-300" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อลูกค้า หรือ ชื่อผู้ใช้..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="overflow-x-auto border border-pink-50 rounded-2xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/55 border-b border-pink-100/60 font-bold text-slate-500">
                  <th className="p-3.5">ชื่อ-นามสกุล</th>
                  <th className="p-3.5">ชื่อผู้ใช้ (@username)</th>
                  <th className="p-3.5">ยอดเงินที่ชำระ</th>
                  <th className="p-3.5">ภาพสลิป / ช่องทาง</th>
                  <th className="p-3.5">วันเวลาที่สมัคร</th>
                  <th className="p-3.5">สถานะสิทธิ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {premiumPurchases.filter(p => {
                  const q = searchQuery.toLowerCase();
                  const name = (p.fullName || p.fullname || p.username || '').toLowerCase();
                  const username = (p.username || '').toLowerCase();
                  return name.includes(q) || username.includes(q);
                }).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400 font-medium animate-fadeIn">
                      ไม่มีประวัติการซื้อขายพรีเมี่ยมเลยค่ะ 🐰
                    </td>
                  </tr>
                ) : (
                  premiumPurchases.filter(p => {
                    const q = searchQuery.toLowerCase();
                    const name = (p.fullName || p.fullname || p.username || '').toLowerCase();
                    const username = (p.username || '').toLowerCase();
                    return name.includes(q) || username.includes(q);
                  }).map((p) => (
                    <tr key={p.id} className="hover:bg-rose-50/15 transition-colors font-medium">
                      <td className="p-3.5 font-bold text-slate-700">คุณ {p.fullName || p.fullname || p.username}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-rose-50 border border-pink-100 text-pink-600 rounded-md font-mono text-[10px]">
                          @{p.username}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-600">
                        {p.amount > 0 ? `${p.amount}.- บาท` : '0.- บาท'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col space-y-1">
                          <span className="inline-flex items-center gap-1 text-slate-500 italic max-w-[150px] truncate">
                            <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                            {p.fileName || 'slip_verified.png'}
                          </span>
                          {(p.transferDate || p.transferTime) && (
                            <span className="text-[10px] text-pink-600 font-extrabold bg-pink-50/50 border border-pink-100/50 rounded px-1.5 py-0.5 inline-block w-fit">
                              โอนเมื่อ: {p.transferDate} @ {p.transferTime} ⏰
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-450 font-mono">
                        {new Date(p.timestamp).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3.5">
                        {p.status === 'success' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-[10px] inline-flex items-center gap-0.5">
                            ชำระเงินสำเร็จ 🟢
                          </span>
                        ) : p.status === 'manual_success' ? (
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold text-[10px] inline-flex items-center gap-0.5">
                            แอดมินแต่งตั้ง 👑
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-500 border border-red-150 rounded-full font-bold text-[10px] inline-flex items-center gap-0.5">
                            ยกเลิกสิทธิ์แล้ว 🚫
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  );
}
