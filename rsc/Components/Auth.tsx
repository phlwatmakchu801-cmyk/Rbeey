import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

interface AuthProps {
  onLoginSuccess: (user: { id: string; username: string; fullName: string; birthDay?: string }) => void;
  initialMode?: 'login' | 'signup';
}

export default function Auth({ onLoginSuccess, initialMode = 'login' }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDay, setBirthDay] = useState('monday');

  // Forgot password states
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotFullName, setForgotFullName] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync users with server on mount
  useEffect(() => {
    fetch(`/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(serverUsers => {
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          localStorage.setItem('lottery_users', JSON.stringify(serverUsers));
          
          // Sync premium status
          serverUsers.forEach((u: any) => {
            if (u.isPremium) {
              localStorage.setItem(`lottery_premium_${u.id}`, 'true');
            } else {
              localStorage.removeItem(`lottery_premium_${u.id}`);
            }
          });
        }
      })
      .catch(err => console.error("Error syncing users on mount:", err));
  }, []);

  // Initialize accounts with new Admin requirements
  const getStoredUsers = () => {
    const usersStr = localStorage.getItem('lottery_users');
    const defaultUsers = [
      { id: 'demo-1', username: 'admin', password: '0858565703pp', fullName: 'แอดมินมหาเฮง 🛠️', birthDay: 'wednesday', status: 'active' }
    ];
    if (!usersStr) {
      localStorage.setItem('lottery_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      const users = JSON.parse(usersStr);
      const hasAdmin = users.find((u: any) => u.username.toLowerCase() === 'admin');
      if (hasAdmin) {
        if (hasAdmin.password !== '0858565703pp') {
          hasAdmin.password = '0858565703pp';
        }
      } else {
        users.push(defaultUsers[0]);
      }
      // Remove ruay99 and filter users
      const cleanedUsers = users.filter((u: any) => u.username.toLowerCase() !== 'ruay99');
      localStorage.setItem('lottery_users', JSON.stringify(cleanedUsers));
      return cleanedUsers;
    } catch (e) {
      localStorage.setItem('lottery_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านนะคะ');
      playErrorSound();
      setLoading(false);
      return;
    }

    try {
      // Fetch latest users from server
      const res = await fetch(`/api/users?t=${Date.now()}`);
      const users = await res.json();
      if (Array.isArray(users)) {
        localStorage.setItem('lottery_users', JSON.stringify(users));
        // Sync premium status
        users.forEach((u: any) => {
          if (u.isPremium) {
            localStorage.setItem(`lottery_premium_${u.id}`, 'true');
          } else {
            localStorage.removeItem(`lottery_premium_${u.id}`);
          }
        });
      }

      const activeUsers = Array.isArray(users) ? users : getStoredUsers();
      const user = activeUsers.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

      if (user) {
        if (user.status === 'blocked') {
          setError('บัญชีนี้ถูกระงับถาวรเนื่องจากตรวจพบพฤติกรรมการส่งสลิปปลอมในระบบค่ะ! 🚫');
          playErrorSound();
          setLoading(false);
          return;
        }
        setSuccess('ยินดีต้อนรับกลับมาค่ะ! เตรียมตัวรวยกันเลยนะคะ 💖');
        playSuccessSound();
        setTimeout(() => {
          onLoginSuccess({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            birthDay: user.birthDay
          });
        }, 800);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้องนะคะ ลองใหม่อีกครั้งน้า 🥺');
        playErrorSound();
        setLoading(false);
      }
    } catch (err) {
      // Fallback
      const users = getStoredUsers();
      const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        if (user.status === 'blocked') {
          setError('บัญชีนี้ถูกระงับถาวรเนื่องจากตรวจพบพฤติกรรมการส่งสลิปปลอมในระบบค่ะ! 🚫');
          playErrorSound();
          setLoading(false);
          return;
        }
        setSuccess('ยินดีต้อนรับกลับมาค่ะ! เตรียมตัวรวยกันเลยนะคะ 💖');
        playSuccessSound();
        setTimeout(() => {
          onLoginSuccess({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            birthDay: user.birthDay
          });
        }, 800);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้องนะคะ ลองใหม่อีกครั้งน้า 🥺');
        playErrorSound();
        setLoading(false);
      }
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องเลยน้า');
      playErrorSound();
      setLoading(false);
      return;
    }

    if (username.length < 4) {
      setError('ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษรนะคะ');
      playErrorSound();
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัยค่ะ');
      playErrorSound();
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกันน้า');
      playErrorSound();
      setLoading(false);
      return;
    }

    let usersList = [];
    try {
      const getRes = await fetch(`/api/users?t=${Date.now()}`);
      if (getRes.ok) {
        usersList = await getRes.json();
      } else {
        usersList = getStoredUsers();
      }
    } catch (err) {
      usersList = getStoredUsers();
    }

    if (!Array.isArray(usersList)) {
      usersList = getStoredUsers();
    }

    const trimmedUsername = username.trim();
    const userExists = usersList.some((u: any) => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (userExists) {
      setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบค่ะ');
      playErrorSound();
      setLoading(false);
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username: trimmedUsername,
      password,
      fullName: trimmedUsername,
      birthDay,
      status: 'active',
      isPremium: false
    };

    // Save locally first to guarantee success
    const updatedUsers = [...usersList, newUser];
    localStorage.setItem('lottery_users', JSON.stringify(updatedUsers));

    // Blocking sync with server to guarantee data integrity across all devices
    try {
      const syncRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!syncRes.ok) {
        console.warn('Server sync failed, falling back to local storage only');
      } else {
        // Broadcast new user registration across tabs instantly
        try {
          const syncChannel = new BroadcastChannel('lottery_sync');
          syncChannel.postMessage({ type: 'refresh_users' });
          syncChannel.close();
        } catch (bcErr) {
          console.warn('BroadcastChannel failed:', bcErr);
        }
      }
    } catch (err) {
      console.warn('Network error during server sync:', err);
    }

    setSuccess('สมัครสมาชิกสำเร็จแล้วค่ะ! ยินดีต้อนรับเข้าสู่อาณาจักรโชคดีน้า 🎉');
    playSuccessSound();
    setLoading(false);
    
    setTimeout(() => {
      onLoginSuccess({
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        birthDay: newUser.birthDay
      });
    }, 1000);
  };

  const handleForgotPassword = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRecoveredPassword('');
    setLoading(true);

    setTimeout(() => {
      if (!forgotUsername) {
        setError('กรุณากรอกชื่อผู้ใช้ให้ครบถ้วนนะคะ');
        setLoading(false);
        return;
      }

      const users = getStoredUsers();
      const matchedUser = users.find(
        (u: any) =>
          u.username.toLowerCase() === forgotUsername.trim().toLowerCase()
      );

      if (matchedUser) {
        setSuccess('ตรวจสอบข้อมูลสำเร็จแล้วค่ะ! 🎉');
        setRecoveredPassword(matchedUser.password);
      } else {
        setError('ไม่พบชื่อผู้ใช้ในระบบเลยค่ะ 🥺');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-pink-400 via-rose-300 to-amber-200 rounded-2xl shadow-md mb-4 bouncy-hover">
          <Heart className="w-8 h-8 text-white fill-white/20" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
          น้องเศรษฐี คำนวณหวยสุดน่ารัก ✨
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-sm font-medium">
          ระบบคำนวณหวย ลุ้นตัวเลขมงคล นำโชคน่ารักๆ สำหรับคนรักตัวเลข 🌸
        </p>
      </motion.div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/95 border border-pink-100 rounded-3xl p-6 md:p-8 shadow-xl glow-cute"
      >
        {/* Toggle tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-rose-50/60 rounded-2xl p-1 mb-6 border border-pink-100/50">
            <button
              type="button"
              onClick={() => { playPopSound(); setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-pink-400'
              }`}
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบน้า
            </button>
            <button
              type="button"
              onClick={() => { playPopSound(); setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-pink-400'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              สมัครสมาชิกใหม่
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium mb-5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-medium mb-5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Auth Forms */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-sm font-black text-pink-500 mb-1 flex items-center gap-1.5 justify-center">
                <span>🌸 กู้คืนรหัสผ่านมงคล</span>
              </h3>
              <p className="text-[11px] text-slate-450 leading-relaxed max-w-[260px] mx-auto">
                กรุณากรอกชื่อผู้ใช้ที่ลงทะเบียนไว้ ระบบจะตรวจสอบและแจ้งรหัสผ่านทันทีค่ะ
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="เช่น admin, user99"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            {recoveredPassword && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1 mt-4"
              >
                <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block">🔑 รหัสผ่านของคุณคือ</span>
                <span className="text-lg font-black text-slate-800 font-mono tracking-wider bg-white/80 px-3 py-1.5 rounded-lg border border-amber-150 inline-block mt-1 selection:bg-amber-100">{recoveredPassword}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 hover:opacity-95 active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300/40 transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'ค้นหารหัสผ่าน 🌸'
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); setRecoveredPassword(''); }}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-pink-500 font-semibold transition-colors mt-2 text-center block"
            >
              ← ย้อนกลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, user99"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  รหัสผ่าน (Password)
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); setRecoveredPassword(''); }}
                  className="text-xs text-pink-450 hover:text-pink-600 font-bold transition-colors focus:outline-none"
                >
                  ลืมรหัสผ่าน? 🥺
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-pink-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 hover:opacity-95 active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300/40 transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  เข้าสู่สวนสนุกหวยมงคล 🌸
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                ชื่อผู้ใช้งาน (Username) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ภาษาอังกฤษหรือตัวเลข 4 ตัวขึ้นไป"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                วันเกิด (เพื่อคำนวณเลขมงคลเฉพาะวันเกิด)
              </label>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 focus:outline-none transition-all text-sm appearance-none cursor-pointer font-medium"
                disabled={loading}
              >
                <option value="sunday">วันอาทิตย์ ☀️</option>
                <option value="monday">วันจันทร์ 🌙</option>
                <option value="tuesday">วันอังคาร 🌸</option>
                <option value="wednesday">วันพุธ 🍀</option>
                <option value="thursday">วันพฤหัสบดี 🍁</option>
                <option value="friday">วันศุกร์ 🐳</option>
                <option value="saturday">วันเสาร์ 🔮</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                รหัสผ่าน (Password) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-pink-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                ยืนยันรหัสผ่านอีกครั้ง <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-300">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเหมือนด้านบน"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-pink-100/80 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 hover:opacity-95 active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300/40 transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4.5 h-4.5" />
                  ลงทะเบียนเศรษฐีใหม่ 🍭
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

