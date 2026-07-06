import { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Calendar, FileText, Bookmark, Info, Hash } from 'lucide-react';
import { SavedCalculation } from '../types';

interface HistoryListProps {
  calculations: SavedCalculation[];
  onDelete: (id: string) => void;
}

export default function HistoryList({ calculations, onDelete }: HistoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'thai':
        return 'bg-pink-50 text-pink-500 border-pink-200';
      case 'lao':
        return 'bg-purple-50 text-purple-500 border-purple-200';
      case 'hanoi':
        return 'bg-rose-50 text-rose-500 border-rose-200';
      case 'yiki':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getLotteryLabel = (type: string) => {
    switch (type) {
      case 'thai': return '🇹🇭 หวยรัฐบาลไทย';
      case 'lao': return '🇱🇦 หวยลาวพัฒนา';
      case 'hanoi': return '🇻🇳 หวยฮานอย';
      case 'yiki': return '🃏 หวยยี่กี 100 รอบ';
      default: return '🔮 หวยทั่วไป';
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-pink-100 pb-5">
        <h2 className="text-xl font-black text-pink-600 flex items-center gap-2">
          <Bookmark className="w-5.5 h-5.5 text-pink-400" />
          สมุดบันทึกสูตรและเลขเด็ดนำโชค 📖
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          รวบรวมประวัติการเสี่ยงสลาก สูตรวิเคราะห์ และชุดเลขนำโชคที่คุณเซฟไว้ย้อนหลังค่ะ ✨
        </p>
      </div>

      {calculations.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-pink-200 rounded-3xl p-10 text-center space-y-4 shadow-sm shadow-pink-100/10">
          <div className="mx-auto w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100">
            <Info className="w-6 h-6 text-pink-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-600">ไม่มีประวัติการบันทึกในระบบในตอนนี้</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
              เมื่อคุณคำนวณสูตรหรือเสี่ยงโชคตัวเลขในหน้าต่างๆ แล้ว สามารถกดปุ่ม บันทึกประวัติ เพื่อเก็บข้อมูลไว้ดูย้อนหลังได้ที่นี่นะคะ
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {calculations.map((calc) => (
            <motion.div
              layout
              key={calc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-pink-100 rounded-3xl p-4 md:p-5 shadow-sm shadow-pink-100/20 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2.5 mb-3.5">
                  <span className={`px-2.5 py-1 border text-[10px] font-black rounded-lg ${getBadgeColor(calc.type)}`}>
                    {getLotteryLabel(calc.type)}
                  </span>
                  
                  {deletingId === calc.id ? (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <span className="text-[10px] text-rose-500 font-bold">ยืนยันลบ?</span>
                      <button
                        onClick={() => {
                          onDelete(calc.id);
                          setDeletingId(null);
                        }}
                        className="px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg cursor-pointer hover:bg-rose-600 transition-colors"
                      >
                        ลบ
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(calc.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-700">{calc.title}</h4>
                  <p className="text-xs text-pink-500 font-bold">{calc.formulaName}</p>
                  {calc.notes && (
                    <p className="text-[11px] text-slate-500 bg-rose-50/30 px-2.5 py-1.5 rounded-xl border border-pink-100/30 mt-1 font-medium leading-relaxed">
                      {calc.notes}
                    </p>
                  )}
                </div>

                {/* Numbers display */}
                <div className="flex flex-wrap gap-2.5 my-4">
                  {calc.generatedNumbers.map((num, i) => (
                    <span
                      key={i}
                      className="w-10 h-10 rounded-full bg-white border-2 border-pink-200 text-pink-500 font-mono text-sm font-black flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-300"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="pt-3 border-t border-pink-100/50 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-2">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>บันทึกเมื่อ {formatDate(calc.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
