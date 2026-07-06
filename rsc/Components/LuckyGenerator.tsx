import { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Star, Sparkles, Award, Compass, Heart } from 'lucide-react';
import { SavedCalculation } from '../types';

interface LuckyGeneratorProps {
  user: { id: string; username: string; fullName: string; birthDay?: string };
  onSave: (calc: Omit<SavedCalculation, 'id' | 'timestamp' | 'userId'>) => void;
}

const BIRTHDAY_LABELS: Record<string, string> = {
  sunday: 'วันอาทิตย์ ☀️',
  monday: 'วันจันทร์ 🌙',
  tuesday: 'วันอังคาร 🌸',
  wednesday: 'วันพุธ 🍀',
  thursday: 'วันพฤหัสบดี 🍊',
  friday: 'วันศุกร์ 🐳',
  saturday: 'วันเสาร์ 🍇',
};

// Fortune sticks data
const SIAMESE_STICK_FORTUNES = [
  { id: 1, title: 'ไม้เซียมซีที่ 9: มหาลาภร่ำรวย 🍒', text: 'ช่วงนี้ดวงการเงินโดดเด่นอย่างมาก มีเกณฑ์รับโชคก้อนโตจากคนใกล้ชิด เลขเด่นประจำวันจะส่งเสริมบารมี', nums: ['99', '19', '89'] },
  { id: 2, title: 'ไม้เซียมซีที่ 5: พรหมลิขิตสมหวัง 🍓', text: 'ตัวเลขรอบตัวจะให้คุณสูง ความฝันจะนำพาโชคลาภมาให้ หมั่นทำบุญตักบาตรเพื่อหนุนดวงนำทาง', nums: ['05', '55', '35'] },
  { id: 3, title: 'ไม้เซียมซีที่ 14: ปลอดโปร่งโชคเข้าข้าง 🍦', text: 'สิ่งที่คาดหวังจะสำเร็จช้าๆ แต่ชัวร์ ตัวเลขอายุของมารดาหรือผู้มีพระคุณจะหนุนนำโชคทรัพย์', nums: ['14', '41', '54'] },
  { id: 4, title: 'ไม้เซียมซีที่ 28: เมตตามหานิยม 🧁', text: 'ผู้ใหญ่จะให้ความสนับสนุน มีโอกาสถูกสลากกินแบ่งระดับเล็กถึงปานกลางจากการเดินทาง', nums: ['28', '82', '88'] },
  { id: 5, title: 'ไม้เซียมซีที่ 36: เจริญรุ่งเรืองทรัพย์ 🍧', text: 'ดวงของท่านช่วงนี้เหมาะแก่การเสี่ยงสลากเลขท้ายสองตัวตรง เลขที่ลงท้ายด้วย 6 หรือ 3 จะส่งเสริมบารมี', nums: ['36', '63', '96'] },
];

export default function LuckyGenerator({ user, onSave }: LuckyGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'birthday' | 'siamese' | 'wheel'>('birthday');
  
  // Birthday states
  const [isGeneratingBirth, setIsGeneratingBirth] = useState(false);
  const [birthLuckyNumbers, setBirthLuckyNumbers] = useState<string[] | null>(null);

  // Siamese states
  const [isShaking, setIsShaking] = useState(false);
  const [stickFortune, setStickFortune] = useState<typeof SIAMESE_STICK_FORTUNES[0] | null>(null);

  // Wheel states
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Generate Birthday Lucky
  const handleGenerateBirthdayLucky = () => {
    setIsGeneratingBirth(true);
    setTimeout(() => {
      // Deterministic based on weekday + day of month/year
      const dayHash = user.birthDay ? user.birthDay.charCodeAt(0) : 100;
      const today = new Date().getDate();
      const num1 = ((dayHash * today) % 90 + 10).toString();
      const num2 = (((dayHash + today) * 7) % 90 + 10).toString();
      const num3 = `${num1[0]}${num2[1]}`;
      
      setBirthLuckyNumbers([num1, num2, num3]);
      setIsGeneratingBirth(false);
    }, 800);
  };

  // Shake Siamese Sticks
  const handleShakeSiamese = () => {
    setIsShaking(true);
    setStickFortune(null);
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * SIAMESE_STICK_FORTUNES.length);
      setStickFortune(SIAMESE_STICK_FORTUNES[randomIdx]);
      setIsShaking(false);
    }, 1200);
  };

  // Spin Lucky Wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWheelResult(null);

    // Spin multiple rounds
    const targetDegrees = wheelRotation + 1440 + Math.floor(Math.random() * 360);
    setWheelRotation(targetDegrees);

    setTimeout(() => {
      // Calculate resulting lucky 2-digit number based on final rotation angle
      const finalAngle = targetDegrees % 360;
      const step = 360 / 8;
      const numbersList = ['08', '17', '26', '35', '44', '53', '62', '99'];
      const index = Math.floor(finalAngle / step) % 8;
      const result = numbersList[index];

      setWheelResult(result);
      setIsSpinning(false);
    }, 3000);
  };

  const handleSaveLuckyResult = (source: string, nums: string[]) => {
    onSave({
      type: 'thai',
      title: `เลขเด็ดดวงชะตา (${source}) 🌟`,
      formulaName: source,
      generatedNumbers: nums,
      notes: `เสี่ยงทายโดยคุณ ${user.fullName} ดวงวันเกิด: ${BIRTHDAY_LABELS[user.birthDay || 'monday']}`,
    });
    alert('บันทึกหมายเลขนำโชคนี้ในประวัติเรียบร้อยแล้วค่ะ ขอให้เฮงๆ น้า! 🍒');
  };

  return (
    <div className="space-y-8">
      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-100 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-pink-600 flex items-center gap-2">
            <Star className="w-5.5 h-5.5 text-pink-400" />
            สุ่มเลขเด็ดนำโชคชะตา 🪄
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            เปิดดวงชะตานำทางเสี่ยงโชคลาภ และทดสอบพลังวงล้อมหามงคลประจำวันกันค่ะ 💕
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex bg-rose-50/70 rounded-2xl p-1.5 border border-pink-100/50 shadow-inner">
          <button
            onClick={() => setActiveTab('birthday')}
            className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'birthday' ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md' : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            เลขคู่บุญวันเกิด 🌙
          </button>
          <button
            onClick={() => setActiveTab('siamese')}
            className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'siamese' ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md' : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            เซียมซีนำทางโชค 🔮
          </button>
          <button
            onClick={() => setActiveTab('wheel')}
            className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'wheel' ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md' : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            วงล้อกู่มหาลาภ 🎡
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'birthday' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-md shadow-pink-100/35 max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="mx-auto w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100">
            <Star className="w-6 h-6 text-pink-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-700">เลขเด็ดดวงคู่บุญประจำตัว 🌸</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
              คำนวณเลขเด็ดพลังดาวนพเคราะห์หลักจากวันเกิดของท่าน{' '}
              <strong className="text-pink-500 font-extrabold">({BIRTHDAY_LABELS[user.birthDay || 'monday']})</strong>{' '}
              อิงกับรอบจักรราศีในวันเสี่ยงสลาก
            </p>
          </div>

          <div className="bg-rose-50/40 border border-pink-100/50 p-5 rounded-2xl max-w-sm mx-auto">
            {birthLuckyNumbers ? (
              <div className="space-y-4">
                <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">
                  เลขโชคดีพิเศษของคุณวันนี้ 🐰
                </p>
                <div className="flex justify-center gap-3.5">
                  {birthLuckyNumbers.map((num, idx) => (
                    <span
                      key={idx}
                      className="w-14 h-14 bg-white text-pink-500 border-2 border-pink-200 font-mono text-2xl font-black rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-300"
                    >
                      {num}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleSaveLuckyResult(`ดวงวันเกิด (${BIRTHDAY_LABELS[user.birthDay || 'monday']})`, birthLuckyNumbers)}
                  className="text-xs text-pink-500 font-extrabold hover:text-pink-600 hover:underline cursor-pointer"
                >
                  บันทึกความจำชุดนี้ 💕
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic">กดปุ่มสีชมพูด้านล่างเพื่อคำนวณพลังดวงชะตานะคะ ✨</p>
            )}
          </div>

          <button
            onClick={handleGenerateBirthdayLucky}
            disabled={isGeneratingBirth}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300 transition-all cursor-pointer disabled:opacity-75"
          >
            {isGeneratingBirth ? 'กำลังประกอบพิธีอัญเชิญดวงชะตา...' : 'คำนวณเลขมงคลเฉพาะตัวปังๆ ✨'}
          </button>
        </motion.div>
      )}

      {activeTab === 'siamese' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-md shadow-pink-100/35 max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="mx-auto w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100">
            <Compass className="w-6 h-6 text-pink-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-700">เสี่ยงติ้วเขย่าเซียมซีนำโชคลาภ 🔮</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
              หลับตาอธิษฐานจิตถึงสิ่งที่อยากสัมผัส แล้วลองกดเขย่าเซียมซีดิจิทัลด้านล่างกันค่ะ
            </p>
          </div>

          {/* Shaking animation mockup visual */}
          <div className="relative py-4 max-w-xs mx-auto">
            <motion.div
              animate={isShaking ? {
                rotate: [-6, 6, -6, 6, -6, 6, 0],
                x: [-3, 3, -3, 3, -3, 3, 0],
              } : {}}
              transition={{ repeat: isShaking ? Infinity : 0, duration: 0.12 }}
              className="w-20 h-32 bg-rose-50 border-2 border-pink-200 rounded-b-3xl rounded-t-lg mx-auto flex flex-col justify-end p-2.5 relative shadow-inner shadow-pink-100/30"
            >
              {/* Bamboo Stick tops protruding */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 items-end">
                <span className="w-1.5 h-7 bg-pink-400 rounded-t-full" />
                <span className="w-1.5 h-9 bg-rose-400 rounded-t-full" />
                <span className="w-1.5 h-8 bg-pink-300 rounded-t-full" />
                <span className="w-1.5 h-6 bg-rose-300 rounded-t-full" />
              </div>
              <span className="text-[9px] font-extrabold text-pink-400 tracking-wider">เซียมซีนำโชค</span>
            </motion.div>
          </div>

          {stickFortune ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50/20 p-4.5 rounded-2xl border border-pink-100 max-w-md mx-auto text-left space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-pink-500">{stickFortune.title}</h4>
                <button
                  onClick={() => handleSaveLuckyResult(stickFortune.title, stickFortune.nums)}
                  className="text-xs font-bold text-pink-400 hover:text-pink-600 cursor-pointer"
                >
                  บันทึกเซียมซีนี้ 💕
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{stickFortune.text}</p>
              
              <div className="pt-3 border-t border-pink-100/60 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">เลขเด็ดเด่นทาง:</span>
                <div className="flex gap-1.5">
                  {stickFortune.nums.map((num) => (
                    <span
                      key={num}
                      className="px-2.5 py-1 bg-white border border-pink-200 text-pink-500 font-mono text-xs font-black rounded-lg shadow-sm"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          <button
            onClick={handleShakeSiamese}
            disabled={isShaking}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300 transition-all cursor-pointer disabled:opacity-75"
          >
            {isShaking ? 'กึกกัก... กำลังเสี่ยงติ้วสลากเซียมซี' : 'คลิกเขย่าเสี่ยงทายใบนำโชค 🍀'}
          </button>
        </motion.div>
      )}

      {activeTab === 'wheel' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-md shadow-pink-100/35 max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="mx-auto w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100">
            <Compass className="w-6 h-6 text-pink-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-700">วงล้อมหาลาภรวยรวย 🎡</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
              หมุนวงล้อแห่งสายฝันของคุณ เพื่อมองหาคู่เลขโฉลกเด็ดขาดในนาทีทองนี้กันค่ะ!
            </p>
          </div>

          {/* Graphical Spin Wheel (CSS styled) */}
          <div className="relative py-4 flex justify-center">
            <div className="relative w-48 h-48 border-4 border-pink-200 rounded-full flex items-center justify-center overflow-hidden shadow-md shadow-pink-100">
              <motion.div
                style={{ rotate: wheelRotation }}
                transition={{ type: 'spring', damping: 15, stiffness: 20 }}
                className="absolute inset-0 w-full h-full rounded-full bg-[conic-gradient(from_0deg,#ffb3c1_0deg_45deg,#ffe5ec_45deg_90deg,#ffb3c1_90deg_135deg,#ffe5ec_135deg_180deg,#ffb3c1_180deg_225deg,#ffe5ec_225deg_270deg,#ffb3c1_270deg_315deg,#ffe5ec_315deg_360deg)] flex items-center justify-center"
              >
                {/* Visual sectors */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="absolute transform rotate-22 translate-y-16 text-xs text-pink-600 font-extrabold font-mono">08</span>
                  <span className="absolute transform rotate-67 translate-y-16 text-xs text-rose-500 font-extrabold font-mono">17</span>
                  <span className="absolute transform rotate-112 translate-y-16 text-xs text-pink-600 font-extrabold font-mono">26</span>
                  <span className="absolute transform rotate-157 translate-y-16 text-xs text-rose-500 font-extrabold font-mono">35</span>
                  <span className="absolute transform rotate-202 translate-y-16 text-xs text-pink-600 font-extrabold font-mono">44</span>
                  <span className="absolute transform rotate-247 translate-y-16 text-xs text-rose-500 font-extrabold font-mono">53</span>
                  <span className="absolute transform rotate-292 translate-y-16 text-xs text-pink-600 font-extrabold font-mono">62</span>
                  <span className="absolute transform rotate-337 translate-y-16 text-xs text-rose-500 font-extrabold font-mono">99</span>
                </div>
              </motion.div>
              {/* Wheel Center Pin */}
              <div className="absolute w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full border border-pink-100 flex items-center justify-center shadow-md z-10">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              {/* Top arrow pointer */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-400 rotate-45 border-l border-t border-pink-200 z-20" />
            </div>
          </div>

          {wheelResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pink-50/20 p-4 rounded-2xl border border-pink-100 max-w-xs mx-auto text-center shadow-sm"
            >
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                หมายเลขมหาโชครวยๆ ที่สุ่มได้คือ
              </p>
              <p className="font-mono text-3xl font-black text-pink-500 my-2 tracking-wide animate-bounce">
                {wheelResult}
              </p>
              <button
                onClick={() => handleSaveLuckyResult('สุ่มวงล้อกู่มหาลาภ', [wheelResult])}
                className="text-xs text-pink-500 font-extrabold hover:text-pink-600 hover:underline cursor-pointer"
              >
                บันทึกหมายเลขสลากนี้ 💕
              </button>
            </motion.div>
          ) : null}

          <button
            onClick={handleSpinWheel}
            disabled={isSpinning}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300 transition-all cursor-pointer disabled:opacity-75"
          >
            {isSpinning ? 'ฟรุ้งฟริ้ง... กำลังหมุนวงล้อแห่งสายสตรีม' : 'คลิกหมุนดวงมหาเศรษฐี 🎡'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
