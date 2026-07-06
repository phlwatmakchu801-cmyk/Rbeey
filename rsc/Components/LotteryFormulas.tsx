import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, Grid, Save, Sparkles, Heart, Star, AlertCircle, 
  Crown, Lock, X, HelpCircle, Upload, AlertTriangle, FileText, Check, Loader2, RefreshCw, TrendingUp,
  ChevronLeft, ChevronDown, ChevronRight
} from 'lucide-react';
import { LotteryType, SavedCalculation } from '../types';
import { playSuccessSound, playErrorSound, playPopSound, playFanfareSound } from '../utils/audio';

interface LotteryFormulasProps {
  user: { id: string; username: string; fullName: string; birthDay?: string };
  onSave: (calc: Omit<SavedCalculation, 'id' | 'timestamp' | 'userId'>) => void;
  isPremium: boolean;
  onUpgrade: (amount: number, fileName: string, period?: 'daily' | 'weekly' | 'monthly', transferDate?: string, transferTime?: string, senderName?: string) => void;
}

interface CalcResultDetail {
  numbers: string[];
  formulaName: string;
  special?: 'decimal' | 'lao16';
  specialData?: {
    roots?: string[];         // รูด (e.g., ['0', '4'])
    winNumbers?: string[];    // เลขวิน
    pairs?: string[];         // คู่เด่นสองตัว
    threeDigitSets?: string[]; // สามตัวบน
    guards?: string[];        // กัน
    rawResult?: string;       // Original calculation text
  };
}

const THAI_FORMULAS = [
  { id: 'tf_free_decimal', name: 'สูตรแยกเศษทศนิยมมงคล 🥕', isPremium: false, category: 'thai' as LotteryType },
  { id: 'tf_free_standard', name: 'สูตรสองตัวตรง เลขเด่นพื้นฐาน 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_1', name: 'สูตรเด่นบน น้องนำโชค 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_2', name: 'สูตร 3 ตัวตรง บับเบิ้ลพาวเวอร์ 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_3', name: 'สูตรกำลังวัน สวนสนุกทวีคูณ 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_4', name: 'สูตรทิพย์วิมาน ดึงเศษกำลังสองมงคล 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_5', name: 'สูตรจักรราศีพารวยเลขท้ายสองตัวตรง 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_6', name: 'สูตรเทวบัญชาดวงเศรษฐี 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_7', name: 'สูตรรหัสลับดาวจรัสแสง 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_8', name: 'สูตรเพชรตัดเพชรทวีคูณ 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_9', name: 'สูตรอัฐมหาลาภแปดทิศ 👑', isPremium: true, category: 'thai' as LotteryType },
  { id: 'tf_10', name: 'สูตรอุณหภูมิมงคลสามร้อยหกสิบองศา 👑', isPremium: true, category: 'thai' as LotteryType },
];

const LAO_FORMULAS = [
  { id: 'lf_free_basic', name: 'สูตรลาวพื้นฐาน เลขกำลังวัน 🥕', isPremium: false, category: 'lao' as LotteryType },
  { id: 'lf_lao_16', name: 'สูตรลาวทวีคูณ 16% มหาลาภ 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_1', name: 'สูตรมหารวย สปป.ลาว 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_2', name: 'สูตรนางกวักวันออกผล 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_3', name: 'สูตรเวียงจันทน์กู่โชคดาวนพเคราะห์ 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_4', name: 'สูตรมังกรคาบแก้วสองแฝด 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_5', name: 'สูตรล้านช้างกวักทรัพย์แสนล้าน 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_6', name: 'สูตรอินทรีแดงแรงฤทธิ์เจาะลึกพิเศษ 👑', isPremium: true, category: 'lao' as LotteryType },
  { id: 'lf_7', name: 'สูตรพลังเงาถอดรหัสเวียงจันทน์ 👑', isPremium: true, category: 'lao' as LotteryType },
];

const HANOI_FORMULAS = [
  { id: 'hf_free_basic', name: 'สูตรฮานอยเดี่ยว เลขเด็ดประยุกต์ 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_1', name: 'สูตรฮานอยฟันธงเดี่ยวสุดปัง 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_2', name: 'สูตรเลขเด่นสถิติย้อนหลัง 15 วัน 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_3', name: 'สูตรฮานอยร่ำรวยรายวันสามสถานี 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_4', name: 'สูตรสามกษัตริย์ทุบโต๊ะเจาะสามรอบ 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_5', name: 'สูตรฮานอยเทอร์โบพารวยทางลัด 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_6', name: 'สูตรแสงเหนือชี้ทชมงคลฮานอย 👑', isPremium: true, category: 'hanoi' as LotteryType },
  { id: 'hf_7', name: 'สูตรจักรวาลคู่ขนานผันเลขเด่น 👑', isPremium: true, category: 'hanoi' as LotteryType },
];

const STOCK_MARKETS = [
  { name: 'หุ้นไทย (SET)', icon: '🇹🇭' },
  { name: 'หุ้นไทย (SET50)', icon: '📈' },
  { name: 'หุ้นนิเคอิ เช้า (Nikkei)', icon: '🇯🇵' },
  { name: 'หุ้นนิเคอิ บ่าย (Nikkei)', icon: '🇯🇵' },
  { name: 'หุ้นฮั่งเส็ง เช้า (Hang Seng)', icon: '🇭🇰' },
  { name: 'หุ้นฮั่งเส็ง บ่าย (Hang Seng)', icon: '🇭🇰' },
  { name: 'หุ้นจีน เช้า (Shenzhen)', icon: '🇨🇳' },
  { name: 'หุ้นจีน บ่าย (Shenzhen)', icon: '🇨🇳' },
  { name: 'หุ้นเกาหลี (KOSPI)', icon: '🇰🇷' },
  { name: 'หุ้นสิงคโปร์ (SGX)', icon: '🇸🇬' },
  { name: 'หุ้นไต้หวัน (TWSE)', icon: '🇹🇼' },
  { name: 'หุ้นอินเดีย (BSE)', icon: '🇮🇳' },
  { name: 'หุ้นดาวโจนส์ (Dow Jones)', icon: '🇺🇸' },
  { name: 'หุ้นเยอรมัน (DAX)', icon: '🇩🇪' },
  { name: 'หุ้นอังกฤษ (FTSE 100)', icon: '🇬🇧' },
  { name: 'หุ้นรัสเซีย (RTS)', icon: '🇷🇺' },
  { name: 'หุ้นอียิปต์ (EGX30)', icon: '🇪🇬' },
  { name: 'หุ้นมาเลเซีย (KLCI)', icon: '🇲🇾' },
  // หุ้น VIP
  { name: 'หุ้นนิเคอิ VIP (Nikkei VIP)', icon: '👑' },
  { name: 'หุ้นฮั่งเส็ง VIP (Hang Seng VIP)', icon: '👑' },
  { name: 'หุ้นจีน VIP (China VIP)', icon: '👑' },
  { name: 'หุ้นดาวโจนส์ VIP (Dow VIP)', icon: '👑' },
  { name: 'หุ้นสิงคโปร์ VIP (Singapore VIP)', icon: '👑' },
  { name: 'หุ้นเกาหลี VIP (Korea VIP)', icon: '👑' },
  { name: 'หุ้นไต้หวัน VIP (Taiwan VIP)', icon: '👑' },
  { name: 'หุ้นอินเดีย VIP (India VIP)', icon: '👑' },
  { name: 'หุ้นเยอรมัน VIP (DAX VIP)', icon: '👑' },
  { name: 'หุ้นอังกฤษ VIP (FTSE VIP)', icon: '👑' },
  { name: 'หุ้นรัสเซีย VIP (Russia VIP)', icon: '👑' },
];

const FORMULA_TEMPLATES = [
  { prefix: 'สูตรเด่นฟันธงสองตัวตรง', suffix: '🎯' },
  { prefix: 'สูตรดัชนีมหารวยเจาะลึก', suffix: '💎' },
  { prefix: 'สูตรสามตัวตรงขุมทรัพย์ดาวนพเคราะห์', suffix: '🌟' },
  { prefix: 'สูตรเลขรูดถล่มเจ้ามือแสนล้าน', suffix: '🔥' },
  { prefix: 'สูตรวิเคราะห์สถิติ 15 วันทวีคูณ', suffix: '📊' },
  { prefix: 'สูตรจักรวาลมงคลหมุนเงินล้าน', suffix: '🔮' },
  { prefix: 'สูตรถอดรหัสคลื่นความถี่ดัชนีนำโชค', suffix: '📡' },
  { prefix: 'สูตรเทอร์โบเลขวิ่งทะลุแนวต้าน', suffix: '📈' },
  { prefix: 'สูตรฟันธงสามตัวโต๊ดพลังงานมหาชน', suffix: '👑' },
  { prefix: 'สูตรเลขพารวยกระดิ่งคู่ค้าขายเงินล้าน', suffix: '🔔' },
];

export const STOCK_FORMULAS = STOCK_MARKETS.flatMap((market, mIdx) => 
  FORMULA_TEMPLATES.map((tpl, tIdx) => ({
    id: `sf_${mIdx + 1}_${tIdx + 1}`,
    name: `${tpl.prefix} ${market.icon} ${market.name} ${tpl.suffix}`,
    isPremium: true,
    category: 'stock' as LotteryType,
    marketIndex: mIdx,
    templateIndex: tIdx
  }))
);

const YIKI_PREFIXES = [
  'สูตรรูดพารวยเจาะจงหลักสิบ',
  'สูตรวินเลขเทอร์โบถล่มเจ้า',
  'สูตรเด่นเสียวบนล่างฟันธงเดี่ยว',
  'สูตรกำลังดวงดาวรหัสลับดาวดึงส์',
  'สูตรสามตัวตรงทับทิมกรอบสะท้านทรวง',
  'สูตรสถิติมงคลเหนี่ยวนำกระแสเงินล้าน',
  'สูตรพิกัดบนเจาะลึกทศนิยมคูณเจ็ด',
  'สูตรฟันธงท้ายสองตัวล่างทวีคูณแสน',
  'สูตรเทพเจ้าโชคลาภดึงกำลังสองเศษ',
  'สูตรจักรราศีพัดกระดิ่งกวักทรัพย์'
];

export const YIKI_FORMULAS = [
  { id: 'yf_1', name: 'สูตรสถิติมหาเฮง รูด 19 ประตู (สถิติเดินดี) 🃏', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_2', name: 'สูตรเจาะพิกัดหลักสิบบน ทศนิยมคูณสอง 👑', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_3', name: 'สูตรเด่นเสียวบนล่างฟันธงเดี่ยว (รอบต่อรอบ) 🎯', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_4', name: 'สูตรเลขไหลยี่กี ปักสิบหลักล่าง 🍀', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_5', name: 'สูตรสถิติ 3 ตัวตรงทับทิมกรอบสะท้านทรวง 💎', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_6', name: 'สูตรกำลังดวงดาว รหัสลับดาวดึงส์คู่เลขคี่ 🌟', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_7', name: 'สูตรพิกัดบน 3 ตัวคูณเจ็ดพารวย 🔮', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_8', name: 'สูตรวิ่งบนรูดล่าง สองตัวมาตัวเด่น 💰', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_9', name: 'สูตรสิบแต้มทองคำ นำโชคลาภล่าง 💸', isPremium: true, category: 'yiki' as LotteryType },
  { id: 'yf_10', name: 'สูตรจักรราศีพัดกระดิ่ง กวักทรัพย์ยี่กี 🧭', isPremium: true, category: 'yiki' as LotteryType }
];

export interface SubLottery {
  id: string;
  name: string;
  category: LotteryType;
}

export const THAI_SUB_LOTTERIES: SubLottery[] = [
  { id: 'thai_gov', name: 'รัฐบาลไทย (งวดปัจจุบัน)', category: 'thai' },
  { id: 'thai_aomsin_3', name: 'ออมสินพิเศษ 3 ปี', category: 'thai' },
  { id: 'thai_aomsin_5', name: 'ออมสินพิเศษ 5 ปี', category: 'thai' },
  { id: 'thai_baac_dragon', name: 'ธ.ก.ส. มังกรทอง', category: 'thai' },
  { id: 'thai_aomsin_vip', name: 'ออมสินพิเศษ VIP', category: 'thai' },
  { id: 'thai_baac_vip', name: 'ธ.ก.ส. มงคลทรัพย์ VIP', category: 'thai' },
];

export const LAO_SUB_LOTTERIES: SubLottery[] = [
  { id: 'lao_dev', name: 'ลาวพัฒนา (จ-ศ)', category: 'lao' },
  { id: 'lao_gate', name: 'ลาวประตูชัย', category: 'lao' },
  { id: 'lao_peace', name: 'ลาวสันติภาพ', category: 'lao' },
  { id: 'lao_people', name: 'ประชาชนลาว', category: 'lao' },
  { id: 'lao_morning', name: 'ลาวเช้า', category: 'lao' },
  { id: 'lao_extra', name: 'ลาว Extra', category: 'lao' },
  { id: 'lao_early_morning', name: 'ลาวตอนเช้า', category: 'lao' },
  { id: 'lao_dev_morning', name: 'ลาวพัฒนาเช้า', category: 'lao' },
  { id: 'lao_dev_morning_vip', name: 'ลาวพัฒนาเช้า VIP', category: 'lao' },
  { id: 'lao_tv', name: 'ลาวทีวี', category: 'lao' },
  { id: 'lao_wealth', name: 'ลาวมั่งคั่ง', category: 'lao' },
  { id: 'lao_noon_special', name: 'ลาวพิเศษรอบเที่ยง', category: 'lao' },
  { id: 'lao_special', name: 'ลาวพิเศษ', category: 'lao' },
  { id: 'lao_plus', name: 'ลาวพลัส', category: 'lao' },
  { id: 'lao_sabai', name: 'ลาวสบายดี', category: 'lao' },
  { id: 'lao_dev_noon', name: 'ลาวพัฒนาเที่ยง', category: 'lao' },
  { id: 'lao_progress', name: 'ลาวก้าวหน้า', category: 'lao' },
  { id: 'lao_hd', name: 'ลาว HD', category: 'lao' },
  { id: 'lao_prosper', name: 'ลาวเจริญ', category: 'lao' },
  { id: 'lao_stable', name: 'ลาวมั่นคง', category: 'lao' },
  { id: 'lao_unity', name: 'ลาวสามัคคี', category: 'lao' },
  { id: 'lao_star', name: 'ลาวสตาร์', category: 'lao' },
  { id: 'lao_redcross', name: 'ลาวกาชาด', category: 'lao' },
  { id: 'lao_vip', name: 'ลาว VIP', category: 'lao' },
  { id: 'lao_downtown', name: 'ลาวดาวน์ทาวน์', category: 'lao' },
  { id: 'lao_avenue', name: 'ลาวอเวนิว', category: 'lao' },
  { id: 'lao_afternoon', name: 'ลาวบ่าย', category: 'lao' },
  { id: 'lao_evening', name: 'ลาวเย็น', category: 'lao' },
  { id: 'lao_sunset', name: 'ลาวค่ำ', category: 'lao' },
  { id: 'lao_night', name: 'ลาวดึก', category: 'lao' },
  { id: 'lao_auspicious', name: 'ลาวมงคล', category: 'lao' },
  { id: 'lao_stats', name: 'ลาวสถิติ', category: 'lao' },
  { id: 'lao_mahaheng', name: 'ลาวมหาเฮง', category: 'lao' },
  { id: 'lao_lucky', name: 'ลาวนำโชค', category: 'lao' },
];

export const HANOI_SUB_LOTTERIES: SubLottery[] = [
  { id: 'hanoi_exclusive', name: 'ฮานอยเฉพาะกิจ', category: 'hanoi' },
  { id: 'hanoi_special', name: 'ฮานอยพิเศษ', category: 'hanoi' },
  { id: 'hanoi_normal', name: 'ฮานอยปกติ', category: 'hanoi' },
  { id: 'hanoi_vip', name: 'ฮานอย VIP', category: 'hanoi' },
  { id: 'hanoi_dev', name: 'ฮานอยพัฒนา', category: 'hanoi' },
  { id: 'hanoi_morning', name: 'ฮานอยเช้า', category: 'hanoi' },
  { id: 'hanoi_afternoon', name: 'ฮานอยบ่าย', category: 'hanoi' },
  { id: 'hanoi_tv', name: 'ฮานอยทีวี', category: 'hanoi' },
  { id: 'hanoi_noon', name: 'ฮานอยรอบเที่ยง', category: 'hanoi' },
  { id: 'hanoi_wealth', name: 'ฮานอยมั่งคั่ง', category: 'hanoi' },
  { id: 'hanoi_redcross', name: 'ฮานอยกาชาด', category: 'hanoi' },
  { id: 'hanoi_star', name: 'ฮานอยสตาร์', category: 'hanoi' },
  { id: 'hanoi_prosper', name: 'ฮานอยเจริญ', category: 'hanoi' },
  { id: 'hanoi_stable', name: 'ฮานอยมั่นคง', category: 'hanoi' },
  { id: 'hanoi_unity', name: 'ฮานอยสามัคคี', category: 'hanoi' },
  { id: 'hanoi_plus', name: 'ฮานอยพลัส', category: 'hanoi' },
  { id: 'hanoi_hd', name: 'ฮานอย HD', category: 'hanoi' },
  { id: 'hanoi_extra', name: 'ฮานอย Extra', category: 'hanoi' },
];

export const YIKI_SUB_LOTTERIES: SubLottery[] = [
  { id: 'yiki_ruay', name: 'จับยี่กี เว็บรวย (88 รอบ) 🃏', category: 'yiki' },
  { id: 'yiki_toad', name: 'จับยี่กี เว็บโต๊ด (88 รอบ) 🍀', category: 'yiki' },
  { id: 'yiki_jetsada', name: 'จับยี่กี เว็บเจษ (88 รอบ) 💎', category: 'yiki' },
  { id: 'yiki_vip', name: 'ยี่กี VIP (88 รอบ) 👑', category: 'yiki' },
  { id: 'yiki_5min', name: 'ยี่กี 5 นาที (264 รอบ) ⚡', category: 'yiki' },
  { id: 'yiki_15min', name: 'ยี่กี 15 นาที (96 รอบ) ⏱️', category: 'yiki' },
  { id: 'yiki_chudjen', name: 'จับยี่กี ชัดเจนเบท ✨', category: 'yiki' },
  { id: 'yiki_lottovip', name: 'จับยี่กี LottoVIP 🌟', category: 'yiki' },
];

export const STOCK_SUB_LOTTERIES: SubLottery[] = STOCK_MARKETS.map((market, idx) => ({
  id: `stock_market_${idx}`,
  name: market.name,
  category: 'stock'
}));

// Helper to split and sum decimals as per user's HTML formula
function splitAndSumDecimal(value: number) {
  const numStr = value.toFixed(2);
  const parts = numStr.split('.');
  const beforeDot = parts[0].padStart(3, '0');
  const afterDot = parts[1] || '00';
  const n1 = parseInt(beforeDot.charAt(0)) || 0;
  const n2 = parseInt(beforeDot.charAt(1)) || 0;
  const n3 = parseInt(beforeDot.charAt(2)) || 0;
  const a1 = parseInt(afterDot.charAt(0)) || 0;
  const a2 = parseInt(afterDot.charAt(1)) || 0;
  return {
    baseRoots: [n3, a1],
    sumOutputs: [
      (n2 + n3) % 10,
      (n1 + n2) % 10,
      (n1 + n3) % 10,
      (a1 + a2) % 10
    ]
  };
}

export default function LotteryFormulas({ user, onSave, isPremium, onUpgrade }: LotteryFormulasProps) {
  const isAdmin = user?.username?.toLowerCase() === 'admin';
  const hasPremiumAccess = isPremium || isAdmin;

  const [activeTab, setActiveTab] = useState<'free' | 'thai' | 'lao' | 'hanoi' | 'yiki' | 'stock'>('free');
  const [lotteryType, setLotteryType] = useState<LotteryType>('thai');
  const [selectedFormula, setSelectedFormula] = useState('tf_free_decimal');
  
  const [selectedSubLottery, setSelectedSubLottery] = useState<SubLottery | null>(null);
  const [yikiSearchQuery, setYikiSearchQuery] = useState('');
  const [yikiRound, setYikiRound] = useState('1');
  const [yikiThreeDigits, setYikiThreeDigits] = useState('482');
  const [yikiBottomTwo, setYikiBottomTwo] = useState('57');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`lottery_favorites_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Inputs for calculation
  const [firstPrize, setFirstPrize] = useState('112');
  const [bottomTwo, setBottomTwo] = useState('17');
  const [threeDigits, setThreeDigits] = useState('379');
  const [laoBottomTwo, setLaoBottomTwo] = useState('32');
  const [stockThreeDigits, setStockThreeDigits] = useState('580');
  const [stockBottomTwo, setStockBottomTwo] = useState('42');
  const [selectedStockMarketIndex, setSelectedStockMarketIndex] = useState(0);
  const [stockFilter, setStockFilter] = useState<'all' | 'general' | 'vip'>('all');
  
  // Hanoi specific subtypes
  const [hanoiType, setHanoiType] = useState<'special' | 'normal' | 'vip'>('normal');
  const [hanoiSpecial, setHanoiSpecial] = useState('379');
  const [hanoiSpecialBottomTwo, setHanoiSpecialBottomTwo] = useState('29');
  const [hanoiNormal, setHanoiNormal] = useState('582');
  const [hanoiNormalBottomTwo, setHanoiNormalBottomTwo] = useState('44');
  const [hanoiVip, setHanoiVip] = useState('914');
  const [hanoiVipBottomTwo, setHanoiVipBottomTwo] = useState('91');
  
  // Custom formulas outputs with structured result option
  const [calcResults, setCalcResults] = useState<CalcResultDetail | null>(null);

  // Matrix Winner Generator (วินเลข)
  const [matrixNumbers, setMatrixNumbers] = useState<number[]>([]);
  const [matrixResults, setMatrixResults] = useState<string[]>([]);
  const [matrixLength, setMatrixLength] = useState<2 | 3>(2);

  // Pop notification warning
  const [notice, setNotice] = useState<string | null>(null);

  // Helper to dynamically adapt the formula name according to the selected sub-lottery name
  const getLocalizedName = (f: { id: string; name: string; category: LotteryType }) => {
    if (!selectedSubLottery) return f.name;

    const cleanSubName = selectedSubLottery.name.replace(/\s*\(.*?\)/g, '').trim();
    let newName = f.name;

    if (f.category === 'lao') {
      if (newName.includes('สปป.ลาว')) {
        newName = newName.replace(/สปป\.ลาว/g, cleanSubName);
      } else if (newName.includes('ลาว')) {
        newName = newName.replace(/ลาว/g, cleanSubName);
      } else if (newName.includes('เวียงจันทน์')) {
        newName = newName.replace(/เวียงจันทน์/g, cleanSubName);
      } else if (newName.includes('ล้านช้าง')) {
        newName = newName.replace(/ล้านช้าง/g, cleanSubName);
      } else {
        newName = newName.replace('สูตร', `สูตร${cleanSubName}`);
      }
    } else if (f.category === 'hanoi') {
      if (newName.includes('ฮานอย')) {
        newName = newName.replace(/ฮานอย/g, cleanSubName);
      } else {
        newName = newName.replace('สูตร', `สูตร${cleanSubName}`);
      }
    } else if (f.category === 'thai') {
      if (newName.includes('รัฐบาลไทย')) {
        newName = newName.replace(/รัฐบาลไทย/g, cleanSubName);
      } else if (newName.includes('ไทย')) {
        newName = newName.replace(/ไทย/g, cleanSubName);
      } else {
        newName = newName.replace('สูตร', `สูตร${cleanSubName}`);
      }
    } else if (f.category === 'yiki') {
      if (newName.includes('ยี่กี')) {
        newName = newName.replace(/ยี่กี/g, cleanSubName);
      } else {
        newName = newName.replace('สูตร', `สูตร${cleanSubName}`);
      }
    } else if (f.category === 'stock') {
      if (newName.includes('หุ้น')) {
        newName = newName.replace(/หุ้น/g, cleanSubName);
      } else {
        newName = newName.replace('สูตร', `สูตร${cleanSubName}`);
      }
    }

    return newName;
  };

  // Premium Modal State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [subPeriod, setSubPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [modalStep, setModalStep] = useState<'scan' | 'upload' | 'analyzing'>('scan');
  const [selectedSimType, setSelectedSimType] = useState<'real' | 'fake' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analyzingStatus, setAnalyzingStatus] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transferTime, setTransferTime] = useState(() => {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  });

  // Dynamic QR config loader
  const getQrConfig = () => {
    const stored = localStorage.getItem('lottery_qr_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return {
      promptPayNumber: '0941465408',
      accountName: 'น้องเศรษฐีนำโชค',
      amount: 189,
      qrText: 'โอนเงิน 189.- บาท เพื่อสมัครพรีเมี่ยมนะน้า',
      customQrUrl: '',
      useCustomImage: false,
    };
  };

  // Auto-Block abuser function for fake slips
  const handleTriggerFakeSlipBlock = async (fileName: string = 'slip_payment_cropped.png') => {
    // 1. Update user list status to 'blocked'
    const usersStr = localStorage.getItem('lottery_users');
    if (usersStr) {
      try {
        const users = JSON.parse(usersStr);
        const updated = users.map((u: any) => {
          if (u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()) {
            return { ...u, status: 'blocked' };
          }
          return u;
        });
        localStorage.setItem('lottery_users', JSON.stringify(updated));
      } catch (e) {}
    }

    // 2. Add to blocked logs
    const existingLogsStr = localStorage.getItem('lottery_blocked_logs');
    let logs = [];
    if (existingLogsStr) {
      try {
        logs = JSON.parse(existingLogsStr);
      } catch (e) {}
    }
    const newLog = {
      id: 'log_' + Date.now(),
      username: user.username,
      fullName: user.fullName,
      timestamp: new Date().toISOString(),
      reason: 'ส่งสลิปโอนเงินปลอม (พบการตัดต่อฟอนต์และปรับแต่งองค์ประกอบพิกเซล)',
      fileName: fileName
    };
    logs.unshift(newLog);
    localStorage.setItem('lottery_blocked_logs', JSON.stringify(logs));

    // Sync block with server
    try {
      await fetch('/api/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'blocked' })
      });

      await fetch('/api/blocked-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs)
      });
    } catch (e) {
      console.error('Error syncing fake slip block to server:', e);
    }

    // 3. Clear active session & show blocking message before reload
    localStorage.removeItem('lottery_active_session');
    playErrorSound();
    alert(`🚨 ระบบความปลอดภัยตรวจพบสลิปปลอม! (ตรวจพบลายน้ำซ้อนทับและฟอนต์ไม่ถูกต้อง)\n\nบัญชีผู้ใช้งาน @${user.username} ของคุณถูกปิดกั้นการเข้าถึงระบบถาวรทันทีค่ะ! 🚫`);
    window.location.reload();
  };

  // Custom Event Listener to trigger upgrade modal from Dashboard header
  useEffect(() => {
    const handleOpenModal = () => {
      setModalStep('scan');
      setSelectedSimType(null);
      setUploadedFileName('');
      setAnalyzingProgress(0);
      setAnalyzingStatus('');
      setIsPremiumModalOpen(true);
    };
    window.addEventListener('open-premium-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-premium-modal', handleOpenModal);
    };
  }, []);

  // Fetch and auto-populate latest lottery results for calculations
  useEffect(() => {
    const loadLatestResults = async () => {
      try {
        const res = await fetch('/api/lottery-history');
        if (res.ok) {
          const data = await res.json();
          if (data.thai && data.thai[0]) {
            setFirstPrize(data.thai[0].top3);
            setBottomTwo(data.thai[0].bottom2);
          }
          if (data.lao && data.lao[0]) {
            setThreeDigits(data.lao[0].top3);
            setLaoBottomTwo(data.lao[0].bottom2);
          }
          if (data.hanoi_special && data.hanoi_special[0]) {
            setHanoiSpecial(data.hanoi_special[0].top3);
            setHanoiSpecialBottomTwo(data.hanoi_special[0].bottom2);
          }
          if (data.hanoi_normal && data.hanoi_normal[0]) {
            setHanoiNormal(data.hanoi_normal[0].top3);
            setHanoiNormalBottomTwo(data.hanoi_normal[0].bottom2);
          }
          if (data.hanoi_vip && data.hanoi_vip[0]) {
            setHanoiVip(data.hanoi_vip[0].top3);
            setHanoiVipBottomTwo(data.hanoi_vip[0].bottom2);
          }
        }
      } catch (e) {
        console.error('Error loading latest results for formula inputs:', e);
      }
    };
    loadLatestResults();
  }, []);

  // Play success sound when calculation results are generated
  useEffect(() => {
    if (calcResults) {
      playSuccessSound();
    }
  }, [calcResults]);

  // Play success sound when matrix combination results are generated
  useEffect(() => {
    if (matrixResults && matrixResults.length > 0) {
      playSuccessSound();
    }
  }, [matrixResults]);

  // Play error sound when notice warnings are shown
  useEffect(() => {
    if (notice) {
      playErrorSound();
    }
  }, [notice]);

  const generateUnifiedSpecialData = (
    calculatedNumbers: string[],
    threeDigitsInput: string,
    bottomTwoInput: string,
    formulaId: string
  ) => {
    // 1. Gather any single digits from calculatedNumbers to use as high-priority seed roots
    const extractedDigits: number[] = [];
    calculatedNumbers.forEach(numStr => {
      const digits = numStr.replace(/[^0-9]/g, '').split('').map(Number);
      digits.forEach(d => {
        if (!extractedDigits.includes(d) && !isNaN(d)) {
          extractedDigits.push(d);
        }
      });
    });

    // 2. Base inputs
    const topVal = Number(threeDigitsInput) || 123;
    const botVal = Number(bottomTwoInput) || 45;
    const seed = topVal + botVal;
    let formulaOffset = 0;
    for (let i = 0; i < formulaId.length; i++) {
      formulaOffset += formulaId.charCodeAt(i);
    }

    // 3. Determine roots (exactly 2 unique single digits)
    let r1 = extractedDigits.length > 0 ? extractedDigits[0] : (seed + formulaOffset) % 10;
    let r2 = extractedDigits.length > 1 ? extractedDigits[1] : ((seed + formulaOffset * 3 + 7) % 10);
    if (r1 === r2) {
      r2 = (r1 + 3) % 10;
    }
    const roots = [r1.toString(), r2.toString()];

    // 4. Determine winNumbers (exactly 7 unique single digits, including r1 and r2)
    const winSet = new Set<number>([r1, r2]);
    extractedDigits.forEach(d => {
      if (winSet.size < 7) winSet.add(d);
    });
    const extraCandidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const sortedExtras = [...extraCandidates].sort((a, b) => {
      const valA = (a * 9 + seed + formulaOffset) % 13;
      const valB = (b * 9 + seed + formulaOffset) % 13;
      return valA - valB;
    });
    for (const digit of sortedExtras) {
      if (winSet.size < 7) {
        winSet.add(digit);
      }
    }
    const winNumbers = [...winSet].sort((a, b) => a - b).map(String);

    // 5. Generate pairs (ชุดเลข 2 ตัว) (exactly 13 sets of 2 digits)
    const pairsSet = new Set<string>();
    // Combine each of the 7 winNumbers with roots
    winNumbers.forEach(w => {
      if (w !== r1.toString()) {
        const p = Number(r1) < Number(w) ? `${r1}${w}` : `${w}${r1}`;
        pairsSet.add(p);
      } else {
        pairsSet.add(`${r1}${r1}`);
      }
    });
    winNumbers.forEach(w => {
      if (w !== r2.toString()) {
        const p = Number(r2) < Number(w) ? `${r2}${w}` : `${w}${r2}`;
        pairsSet.add(p);
      } else {
        pairsSet.add(`${r2}${r2}`);
      }
    });

    // Make sure we have enough unique pairs, if not, generate more
    if (pairsSet.size < 13) {
      for (let i = 0; i < winNumbers.length; i++) {
        for (let j = i; j < winNumbers.length; j++) {
          pairsSet.add(`${winNumbers[i]}${winNumbers[j]}`);
        }
      }
    }

    const sortedPairs = [...pairsSet].sort((a, b) => Number(a) - Number(b));
    const pairs = sortedPairs.slice(0, 13);

    // 6. Generate guards (ชุดกัน) (exactly 2 sets of 2 digits)
    let guards = sortedPairs.slice(13, 15);
    if (guards.length < 2) {
      const extra1 = `${(r1 + 1) % 10}${(r1 + 1) % 10}`;
      const extra2 = `${(r2 + 1) % 10}${(r2 + 1) % 10}`;
      if (!guards.includes(extra1)) guards.push(extra1);
      if (guards.length < 2 && !guards.includes(extra2)) guards.push(extra2);
    }
    guards = guards.slice(0, 2);

    // 7. Generate threeDigitSets (ชุดเด่นสามตัวบน) (exactly 4 sets of 3 digits)
    const threeDigitSet = new Set<string>();
    const w0 = winNumbers[0] || '0';
    const w1 = winNumbers[1] || '1';
    const w2 = winNumbers[2] || '2';
    const w3 = winNumbers[3] || '3';
    const w4 = winNumbers[4] || '4';

    threeDigitSet.add(`${r1}${w0}${w1}`);
    threeDigitSet.add(`${r1}${w1}${w2}`);
    threeDigitSet.add(`${r2}${w0}${w2}`);
    threeDigitSet.add(`${r2}${w3}${w4}`);

    const threeDigitSets = [...threeDigitSet].slice(0, 4);

    return {
      roots,
      winNumbers,
      pairs,
      guards,
      threeDigitSets
    };
  };

  const allFormulas = [
    ...THAI_FORMULAS,
    ...LAO_FORMULAS,
    ...HANOI_FORMULAS,
    ...YIKI_FORMULAS,
    ...STOCK_FORMULAS,
  ];

  const formulasToDisplay = (
    activeTab === 'free'
      ? allFormulas.filter(f => !f.isPremium)
      : activeTab === 'stock'
        ? STOCK_FORMULAS.filter(f => f.marketIndex === selectedStockMarketIndex)
        : activeTab === 'yiki'
          ? (yikiSearchQuery.trim() === '' ? YIKI_FORMULAS : YIKI_FORMULAS.filter(f => f.name.includes(yikiSearchQuery)))
          : allFormulas.filter(f => f.category === activeTab && f.isPremium)
  ).map(f => ({
    ...f,
    name: getLocalizedName(f)
  }));

  // Run calculation
  const handleCalculateFormula = () => {
    setNotice(null);

    // Validate if the selected formula is Premium and user is Free
    const formulaObj = formulasToDisplay.find(f => f.id === selectedFormula);
    if (formulaObj?.isPremium && !hasPremiumAccess) {
      setIsPremiumModalOpen(true);
      return;
    }

    // Basic inputs validations
    const currentThreeDigits = lotteryType === 'hanoi' 
      ? (hanoiType === 'special' ? hanoiSpecial : hanoiType === 'normal' ? hanoiNormal : hanoiVip)
      : lotteryType === 'stock'
        ? stockThreeDigits
        : lotteryType === 'yiki'
          ? yikiThreeDigits
          : threeDigits;

    const currentBottomTwo = lotteryType === 'thai'
      ? bottomTwo
      : lotteryType === 'lao'
        ? laoBottomTwo
        : lotteryType === 'stock'
          ? stockBottomTwo
          : lotteryType === 'yiki'
            ? yikiBottomTwo
            : hanoiType === 'special'
              ? hanoiSpecialBottomTwo
              : hanoiType === 'normal'
                ? hanoiNormalBottomTwo
                : hanoiVipBottomTwo;

    if (lotteryType === 'thai') {
      if (firstPrize.length !== 3 || isNaN(Number(firstPrize))) {
        setNotice('กรุณากรอกเลขสามตัวบนเป็นตัวเลข 3 หลักให้ครบถ้วนก่อนน้า 🥺');
        return;
      }
      if (bottomTwo.length !== 2 || isNaN(Number(bottomTwo))) {
        setNotice('กรุณากรอกเลขท้าย 2 ตัวเป็นตัวเลข 2 หลักก่อนนะคะ 🥺');
        return;
      }
    } else if (lotteryType === 'yiki') {
      if (yikiThreeDigits.length !== 3 || isNaN(Number(yikiThreeDigits))) {
        setNotice('กรุณากรอกรางวัล 3 ตัวบน (รอบล่าสุด) เป็นตัวเลข 3 หลักก่อนนะคะ 🥺');
        return;
      }
      if (yikiBottomTwo.length !== 2 || isNaN(Number(yikiBottomTwo))) {
        setNotice('กรุณากรอกเลขท้าย 2 ตัวล่าง (รอบล่าสุด) เป็นตัวเลข 2 หลักก่อนนะคะ 🥺');
        return;
      }
    } else {
      if (currentThreeDigits.length !== 3 || isNaN(Number(currentThreeDigits))) {
        setNotice('กรุณากรอกรางวัล 3 ตัวบนเป็นตัวเลข 3 หลักด้วยนะคะ 🥺');
        return;
      }
      if (currentBottomTwo.length !== 2 || isNaN(Number(currentBottomTwo))) {
        setNotice('กรุณากรอกเลขท้าย 2 ตัวล่างเป็นตัวเลข 2 หลักด้วยนะคะ 🥺');
        return;
      }
    }

    let numbers: string[] = [];
    let name = '';

    // 1. FREE FORMULA: Decimal Split and Sum (Thai)
    if (selectedFormula === 'tf_free_decimal') {
      name = 'สูตรแยกเศษทศนิยมมงคล 🥕 (สูตรฟรี)';
      const t3 = Number(firstPrize);
      const b2 = Number(bottomTwo);

      const res1 = splitAndSumDecimal((t3 % 100) * 0.08);
      const res2 = splitAndSumDecimal(b2 * 0.08);
      const res3 = splitAndSumDecimal(t3 * 0.19);

      const uniqueRoots = [...new Set([...res1.baseRoots, ...res2.baseRoots, ...res3.baseRoots])].slice(0, 2).map(String);
      const winNumbers = [...new Set([...res1.sumOutputs, ...res2.sumOutputs, ...res3.sumOutputs])].sort((a, b) => a - b).map(String);

      // Generate pairs (combination of roots and win numbers)
      const uniquePairs: string[] = [];
      uniqueRoots.forEach(r => {
        winNumbers.forEach(w => {
          const pairStr = Number(r) < Number(w) ? `${r}${w}` : `${w}${r}`;
          if (!uniquePairs.includes(pairStr)) {
            uniquePairs.push(pairStr);
          }
        });
      });

      const pairs = uniquePairs.slice(0, 8);
      const guards = uniquePairs.slice(8, 10);

      const top3_1 = `${uniqueRoots[0] || '0'}${winNumbers[0] || '0'}${winNumbers[1] || '0'}`;
      const top3_2 = `${uniqueRoots[0] || '0'}${winNumbers[1] || '0'}${winNumbers[2] || '0'}`;
      const top3_3 = `${uniqueRoots[1] || '0'}${winNumbers[0] || '0'}${winNumbers[2] || '0'}`;
      const top3_4 = `${uniqueRoots[1] || '0'}${winNumbers[1] || '0'}${winNumbers[0] || '0'}`;
      const threeDigitSets = [top3_1, top3_2, top3_3, top3_4];

      setCalcResults({
        numbers: uniqueRoots.concat(winNumbers.slice(0, 3)),
        formulaName: formulaObj ? formulaObj.name : name,
        special: 'decimal',
        specialData: {
          roots: uniqueRoots,
          winNumbers,
          pairs,
          threeDigitSets,
          guards
        }
      });
      return;
    }

    // 2. PREMIUM LAO FORMULA: Lao 16% (Laos)
    if (selectedFormula === 'lf_lao_16') {
      name = 'สูตรลาวทวีคูณ 16% มหาลาภ 👑';
      const t3 = Number(threeDigits);
      const b2 = Number(currentBottomTwo) || 32;
      const calculationResult = (t3 + b2) * 0.16;
      const calculationString = calculationResult.toFixed(2);
      const rawResultText = `(บน: ${t3} + ล่าง: ${b2}) × 16% = ${calculationString}`;

      // Extract all digits ignoring dot
      const allDigits = calculationString.replace('.', '').split('');
      const uniqueDigits = [...new Set(allDigits)].sort((a, b) => Number(a) - Number(b));

      const winNumbers = [...uniqueDigits];

      // Generate 2-digit pairs
      const pairs: string[] = [];
      for (let i = 0; i < uniqueDigits.length; i++) {
        for (let j = i; j < uniqueDigits.length; j++) {
          pairs.push(`${uniqueDigits[i]}${uniqueDigits[j]}`);
        }
      }

      // Generate 3-digit sets
      const threeDigitSets: string[] = [];
      if (uniqueDigits.length >= 3) {
        for (let i = 0; i < uniqueDigits.length; i++) {
          for (let j = 0; j < uniqueDigits.length; j++) {
            for (let k = 0; k < uniqueDigits.length; k++) {
              if (i !== j && j !== k && i !== k) {
                const combo = `${uniqueDigits[i]}${uniqueDigits[j]}${uniqueDigits[k]}`;
                if (threeDigitSets.length < 4) {
                  threeDigitSets.push(combo);
                }
              }
            }
          }
        }
      } else {
        const d1 = uniqueDigits[0] || '0';
        const d2 = uniqueDigits[1] || '1';
        threeDigitSets.push(`${d1}${d2}${d1}`, `${d2}${d1}${d2}`);
      }

      setCalcResults({
        numbers: uniqueDigits,
        formulaName: formulaObj ? formulaObj.name : name,
        special: 'lao16',
        specialData: {
          winNumbers,
          pairs,
          threeDigitSets,
          rawResult: rawResultText
        }
      });
      return;
    }

    // 3. OTHER STANDARD FORMULAS (Requires Premium)
    if (lotteryType === 'thai') {
      if (selectedFormula === 'tf_free_standard') {
        name = 'สูตรสองตัวตรง เลขเด่นพื้นฐาน 🥕';
        const hundred = Number(firstPrize[0]) || 0;
        const bTens = Number(bottomTwo[0]) || 0;
        const key = (hundred + bTens) % 10;
        numbers = [key.toString(), ((key + 3) % 10).toString(), ((key + 7) % 10).toString()];
      } else if (selectedFormula === 'tf_1') {
        name = 'สูตรเด่นบน น้องนำโชค 👑';
        const head = Number(firstPrize[0]);
        const tens = Number(firstPrize[1]);
        const result1 = (head + tens) % 10;
        const result2 = (result1 + 3) % 10;
        const result3 = (result1 + 7) % 10;
        numbers = [result1.toString(), result2.toString(), result3.toString()];
      } else if (selectedFormula === 'tf_2') {
        name = 'สูตร 3 ตัวตรง บับเบิ้ลพาวเวอร์ 👑';
        const unit = Number(firstPrize[2]);
        const lowTens = Number(bottomTwo[0]);
        const sum = (unit + lowTens) % 10;
        const sub1 = (sum + 4) % 10;
        const sub2 = (sum + 6) % 10;
        numbers = [`${sum}${sub1}`, `${sub1}${sub2}`, `${sum}${sub2}`];
      } else if (selectedFormula === 'tf_3') {
        name = 'สูตรกำลังวัน สวนสนุกทวีคูณ 👑';
        const day = new Date().getDay();
        const baseNumbers = [
          ['1', '8', '4'],
          ['2', '9', '3'],
          ['3', '0', '5'],
          ['4', '2', '8'],
          ['5', '1', '7'],
          ['6', '3', '5'],
          ['7', '5', '9'],
        ][day];
        numbers = baseNumbers;
      } else if (selectedFormula === 'tf_4') {
        name = 'สูตรทิพย์วิมาน ดึงเศษกำลังสองมงคล 👑';
        const t = Number(firstPrize.slice(-2)) || 12;
        const b = Number(bottomTwo) || 17;
        const key = (t * b * 7) % 100;
        numbers = [
          key.toString().padStart(2, '0'),
          ((key + 9) % 100).toString().padStart(2, '0'),
          ((key + 18) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'tf_5') {
        name = 'สูตรจักรราศีพารวยเลขท้ายสองตัวตรง 👑';
        const base = (Number(bottomTwo) * 11 + 3) % 100;
        numbers = [
          base.toString().padStart(2, '0'),
          ((base + 5) % 100).toString().padStart(2, '0'),
          ((base + 55) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'tf_6') {
        name = 'สูตรเทวบัญชาดวงเศรษฐี 👑';
        const tens = Number(firstPrize[1]) || 0;
        const lowTens = Number(bottomTwo[0]) || 0;
        const result = (tens + lowTens) % 10;
        numbers = [result.toString(), ((result + 5) % 10).toString(), ((result + 8) % 10).toString()];
      } else if (selectedFormula === 'tf_7') {
        name = 'สูตรรหัสลับดาวจรัสแสง 👑';
        const hundred = Number(firstPrize[0]) || 0;
        const lowTens = Number(bottomTwo[0]) || 0;
        const result = (hundred * 2 + lowTens) % 10;
        numbers = [result.toString(), ((result + 4) % 10).toString(), ((result + 6) % 10).toString()];
      } else if (selectedFormula === 'tf_8') {
        name = 'สูตรเพชรตัดเพชรทวีคูณ 👑';
        const hundred = Number(firstPrize[0]) || 0;
        const lowTens = Number(bottomTwo[0]) || 0;
        const result = (hundred * 3 + lowTens) % 10;
        numbers = [result.toString(), ((result + 5) % 10).toString()];
      } else if (selectedFormula === 'tf_9') {
        name = 'สูตรอัฐมหาลาภแปดทิศ 👑';
        const unit = Number(firstPrize[2]) || 0;
        const lowUnit = Number(bottomTwo[1]) || 0;
        const result = (unit + lowUnit + 5) % 10;
        numbers = [result.toString(), ((result + 2) % 10).toString(), ((result + 4) % 10).toString()];
      } else {
        name = 'สูตรอุณหภูมิมงคลสามร้อยหกสิบองศา 👑';
        const tens = Number(firstPrize[1]) || 0;
        const lowTens = Number(bottomTwo[0]) || 0;
        const result = (tens * lowTens) % 10;
        numbers = [result.toString(), ((result + 1) % 10).toString(), ((result + 9) % 10).toString()];
      }
    } else if (lotteryType === 'lao') {
      const seed = Number(threeDigits) || 123;
      const bVal = Number(currentBottomTwo) || 32;
      if (selectedFormula === 'lf_free_basic') {
        name = 'สูตรลาวพื้นฐาน เลขกำลังวัน 🥕';
        const result = (seed + bVal + 5) % 100;
        numbers = [result.toString().padStart(2, '0'), ((result + 22) % 100).toString().padStart(2, '0')];
      } else if (selectedFormula === 'lf_1') {
        name = 'สูตรมหารวย สปป.ลาว 👑';
        const num1 = (seed * 7 + bVal) % 100;
        const num2 = (seed * 3 + bVal + 15) % 100;
        numbers = [
          num1.toString().padStart(2, '0'),
          num2.toString().padStart(2, '0'),
          ((num1 + num2) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'lf_2') {
        name = 'สูตรนางกวักวันออกผล 👑';
        const num1 = (seed * 9 + bVal + 4) % 100;
        const num2 = (seed * 2 + bVal + 1) % 100;
        numbers = [
          num1.toString().padStart(2, '0'),
          num2.toString().padStart(2, '0'),
          ((num1 + num2) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'lf_3') {
        name = 'สูตรเวียงจันทน์กู่โชคดาวนพเคราะห์ 👑';
        const offset = (seed * 4 + bVal + 8) % 100;
        numbers = [
          offset.toString().padStart(2, '0'),
          ((offset + 11) % 100).toString().padStart(2, '0'),
          ((offset + 22) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'lf_4') {
        name = 'สูตรมังกรคาบแก้วสองแฝด 👑';
        const num1 = (seed + (Number(threeDigits[1]) || 0) * 2 + bVal) % 100;
        numbers = [num1.toString().padStart(2, '0'), ((num1 + 10) % 100).toString().padStart(2, '0')];
      } else if (selectedFormula === 'lf_5') {
        name = 'สูตรล้านช้างกวักทรัพย์แสนล้าน 👑';
        const num = ((Number(threeDigits[2]) || 0) + bVal + 14) % 100;
        numbers = [num.toString().padStart(2, '0'), ((num + 45) % 100).toString().padStart(2, '0')];
      } else if (selectedFormula === 'lf_6') {
        name = 'สูตรอินทรีแดงแรงฤทธิ์เจาะลึกพิเศษ 👑';
        const num = (seed * 11 + bVal + 7) % 100;
        numbers = [num.toString().padStart(2, '0'), ((num + 1) % 100).toString().padStart(2, '0')];
      } else {
        name = 'สูตรพลังเงาถอดรหัสเวียงจันทน์ 👑';
        const num = (seed * 17 + bVal) % 100;
        numbers = [num.toString().padStart(2, '0'), ((num + 33) % 100).toString().padStart(2, '0')];
      }
    } else if (lotteryType === 'hanoi') {
      const seed = Number(currentThreeDigits) || 379;
      const bVal = Number(currentBottomTwo) || 29;
      if (selectedFormula === 'hf_free_basic') {
        name = 'สูตรฮานอยเดี่ยว เลขเด็ดประยุกต์ 🥕';
        const keyDigit = (seed + bVal + 6) % 10;
        numbers = [keyDigit.toString(), ((keyDigit + 5) % 10).toString()];
      } else if (selectedFormula === 'hf_1') {
        name = 'สูตรฮานอยฟันธงเดี่ยวสุดปัง 👑';
        const keyDigit = (seed * 9 + bVal + 4) % 10;
        numbers = [
          keyDigit.toString(),
          ((keyDigit + 5) % 10).toString(),
          `${keyDigit}${(keyDigit + 3) % 10}`
        ];
      } else if (selectedFormula === 'hf_2') {
        name = 'สูตรเลขเด่นสถิติย้อนหลัง 15 วัน 👑';
        const keyDigit = (seed * 3 + bVal + 7) % 10;
        numbers = [
          keyDigit.toString(),
          ((keyDigit + 4) % 10).toString(),
          ((keyDigit + 8) % 10).toString()
        ];
      } else if (selectedFormula === 'hf_3') {
        name = 'สูตรฮานอยร่ำรวยรายวันสามสถานี 👑';
        const base = (seed * 13 + bVal) % 100;
        numbers = [
          base.toString().padStart(2, '0'),
          ((base + 10) % 100).toString().padStart(2, '0'),
          ((base + 20) % 100).toString().padStart(2, '0')
        ];
      } else if (selectedFormula === 'hf_4') {
        name = 'สูตรสามกษัตริย์ทุบโต๊ะเจาะสามรอบ 👑';
        const base = (seed * 4 + bVal) % 100;
        numbers = [base.toString().padStart(2, '0'), ((base + 50) % 100).toString().padStart(2, '0')];
      } else if (selectedFormula === 'hf_5') {
        name = 'สูตรฮานอยเทอร์โบพารวยทางลัด 👑';
        const base = (seed * 8 + bVal + 3) % 100;
        numbers = [base.toString().padStart(2, '0'), ((base + 11) % 100).toString().padStart(2, '0')];
      } else if (selectedFormula === 'hf_6') {
        name = 'สูตรแสงเหนือชี้ทชมงคลฮานอย 👑';
        const base = (seed * 6 + bVal + 9) % 100;
        numbers = [base.toString().padStart(2, '0'), ((base + 22) % 100).toString().padStart(2, '0')];
      } else {
        name = 'สูตรจักรวาลคู่ขนานผันเลขเด่น 👑';
        const base = (seed * 15 + bVal + 2) % 100;
        numbers = [base.toString().padStart(2, '0'), ((base + 44) % 100).toString().padStart(2, '0')];
      }
    } else if (lotteryType === 'stock') {
      const fObj = STOCK_FORMULAS.find(f => f.id === selectedFormula);
      const mIdx = fObj ? fObj.marketIndex : 0;
      const tIdx = fObj ? fObj.templateIndex : 0;
      name = fObj ? fObj.name : 'สูตรคำนวณหุ้นสถิติมงคล 👑';

      const seed = Number(currentThreeDigits) || 580;
      const bVal = Number(currentBottomTwo) || 42;
      const baseVal = (seed * (mIdx + 3) + bVal * (tIdx + 7) + 19) % 100;

      if (tIdx === 0) {
        const n1 = baseVal;
        const n2 = (baseVal + 11) % 100;
        const n3 = (baseVal + 44) % 100;
        numbers = [
          n1.toString().padStart(2, '0'),
          n2.toString().padStart(2, '0'),
          n3.toString().padStart(2, '0')
        ];
      } else if (tIdx === 1) {
        const keyDigit = (seed + bVal + mIdx + 9) % 10;
        numbers = [
          keyDigit.toString(),
          ((keyDigit + 5) % 10).toString()
        ];
      } else if (tIdx === 2) {
        const first = (seed + bVal + mIdx * 5) % 10;
        const second = (seed * 2 + bVal + tIdx * 3) % 10;
        const third = (seed + bVal * 3 + 7) % 10;
        numbers = [
          `${first}${second}${third}`,
          `${(first + 2) % 10}${(second + 5) % 10}${(third + 8) % 10}`
        ];
      } else if (tIdx === 3) {
        const r1 = (seed + bVal + mIdx + tIdx) % 10;
        const r2 = (r1 + 5) % 10;
        numbers = [
          `รูดบน-ล่าง: ${r1}, ${r2}`
        ];
      } else if (tIdx === 4) {
        const base = (seed * 5 + bVal * 11) % 100;
        numbers = [
          base.toString().padStart(2, '0'),
          ((base + 25) % 100).toString().padStart(2, '0'),
          ((base + 50) % 100).toString().padStart(2, '0'),
          ((base + 75) % 100).toString().padStart(2, '0')
        ];
      } else if (tIdx === 5) {
        const base = (seed * 8 + bVal * 13) % 100;
        numbers = [
          base.toString().padStart(2, '0'),
          ((base + 33) % 100).toString().padStart(2, '0'),
          ((base + 66) % 100).toString().padStart(2, '0')
        ];
      } else if (tIdx === 6) {
        const single = (seed + bVal * 7 + mIdx * 3) % 10;
        numbers = [
          `วิ่งบน-ล่าง: ${single}`
        ];
      } else if (tIdx === 7) {
        const val = (seed * 3 + bVal * 4 + mIdx) % 100;
        numbers = [
          val.toString().padStart(2, '0'),
          ((val + 17) % 100).toString().padStart(2, '0'),
          ((val + 53) % 100).toString().padStart(2, '0')
        ];
      } else if (tIdx === 8) {
        const val1 = (seed + mIdx) % 10;
        const val2 = (bVal + tIdx) % 10;
        const val3 = (seed + bVal + 5) % 10;
        numbers = [
          `${val1}${val2}${val3}`,
          `${(val1 + 1) % 10}${(val2 + 3) % 10}${(val3 + 7) % 10}`
        ];
      } else {
        const val = (seed * 6 + bVal * 2) % 100;
        numbers = [
          val.toString().padStart(2, '0'),
          ((val + 10) % 100).toString().padStart(2, '0'),
          ((val + 20) % 100).toString().padStart(2, '0'),
          ((val + 30) % 100).toString().padStart(2, '0')
        ];
      }
    } else if (lotteryType === 'yiki') {
      const fObj = YIKI_FORMULAS.find(f => f.id === selectedFormula);
      const formulaNum = fObj ? parseInt(fObj.id.replace('yf_', '')) || 1 : 1;
      const roundNum = parseInt(yikiRound) || 1;
      name = fObj ? fObj.name : `สูตรหวยยี่กี 👑`;

      const seed = Number(currentThreeDigits) || 123;
      const bVal = Number(currentBottomTwo) || 45;
      
      if (formulaNum === 1) {
        // รูด 19 ประตู บน-ล่าง
        const keyDigit = (seed + bVal + roundNum) % 10;
        const keyDigit2 = (keyDigit + 1) % 10;
        numbers = [keyDigit.toString(), keyDigit2.toString()];
      } else if (formulaNum === 2) {
        // ปักสิบบน
        const key1 = (Math.floor(seed / 10) + bVal + roundNum) % 10;
        const key2 = (key1 + 1) % 10;
        const key3 = (key1 + 2) % 10;
        numbers = [key1.toString(), key2.toString(), key3.toString()];
      } else if (formulaNum === 3) {
        // เสียวบนล่าง
        const val = (seed * 3 + bVal * 7 + roundNum) % 10;
        numbers = [val.toString()];
      } else if (formulaNum === 4) {
        // ปักสิบล่าง
        const key1 = (seed + (bVal % 10) * 4 + roundNum) % 10;
        const key2 = (key1 + 1) % 10;
        const key3 = (key1 + 2) % 10;
        numbers = [key1.toString(), key2.toString(), key3.toString()];
      } else if (formulaNum === 5) {
        // 3 ตัวตรง
        const v1 = (seed + roundNum * 3) % 1000;
        const v2 = (v1 + 125) % 1000;
        numbers = [
          v1.toString().padStart(3, '0'),
          v2.toString().padStart(3, '0')
        ];
      } else {
        const baseVal = (seed * (formulaNum + 3) + bVal * (roundNum + 7) + 47) % 100;
        const keyDigit = (seed + bVal + roundNum + formulaNum) % 10;
        
        const n1 = baseVal;
        const n2 = (baseVal + 11) % 100;
        const n3 = (baseVal + 44) % 100;
        numbers = [
          n1.toString().padStart(2, '0'),
          n2.toString().padStart(2, '0'),
          n3.toString().padStart(2, '0'),
          keyDigit.toString()
        ];
      }
    }

    const extractedRoots: number[] = [];
    numbers.forEach(numStr => {
      numStr.replace(/[^0-9]/g, '').split('').forEach(d => {
        const digitVal = Number(d);
        if (!isNaN(digitVal) && !extractedRoots.includes(digitVal)) {
          extractedRoots.push(digitVal);
        }
      });
    });
    // Ensure we have exactly 2 roots
    const rootSeed = (Number(currentThreeDigits) || 123) + (Number(currentBottomTwo) || 45);
    while (extractedRoots.length < 2) {
      const fallback = (extractedRoots.length > 0 ? (extractedRoots[0] + 3) % 10 : rootSeed % 10);
      if (!extractedRoots.includes(fallback)) {
        extractedRoots.push(fallback);
      }
    }
    const roots = extractedRoots.slice(0, 2).map(String);

    setCalcResults({
      numbers,
      formulaName: formulaObj ? formulaObj.name : name,
      specialData: {
        roots
      }
    });
  };

  // Matrix numbers toggler (วินเลข)
  const handleToggleMatrixNumber = (num: number) => {
    setNotice(null);
    if (matrixNumbers.includes(num)) {
      const updated = matrixNumbers.filter(n => n !== num);
      setMatrixNumbers(updated);
      generateMatrixResults(updated, matrixLength);
    } else {
      if (matrixNumbers.length >= 8) {
        setNotice('เลือกตัวเลขได้สูงสุด 8 ตัวเท่านั้นนะคะ เดี๋ยวช่องจะแน่นเกินไปน้า 🐰');
        return;
      }
      const updated = [...matrixNumbers, num];
      setMatrixNumbers(updated);
      generateMatrixResults(updated, matrixLength);
    }
  };

  const generateMatrixResults = (nums: number[], length: 2 | 3) => {
    if (nums.length < length) {
      setMatrixResults([]);
      return;
    }

    let results: string[] = [];
    if (length === 2) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          results.push(`${nums[i]}${nums[j]}`);
        }
      }
    } else {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          for (let k = j; k < nums.length; k++) {
            results.push(`${nums[i]}${nums[j]}${nums[k]}`);
          }
        }
      }
    }
    setMatrixResults(results);
  };

  const handleToggleMatrixLength = (len: 2 | 3) => {
    setMatrixLength(len);
    generateMatrixResults(matrixNumbers, len);
  };

  const clearMatrix = () => {
    setMatrixNumbers([]);
    setMatrixResults([]);
  };

  const handleSaveCalculation = (calcType: 'formula' | 'matrix') => {
    if (calcType === 'formula' && calcResults) {
      // If it's a premium formula, check premium status
      const formulaObj = formulasToDisplay.find(f => f.name === calcResults.formulaName);
      if (formulaObj?.isPremium && !hasPremiumAccess) {
        setIsPremiumModalOpen(true);
        return;
      }

      // Save numbers depending on specialized structures
      let finalNumbers = calcResults.numbers;
      const targetDigits = lotteryType === 'hanoi' 
        ? (hanoiType === 'special' ? hanoiSpecial : hanoiType === 'normal' ? hanoiNormal : hanoiVip)
        : lotteryType === 'stock'
          ? stockThreeDigits
          : threeDigits;
      const targetBottomTwo = lotteryType === 'lao'
        ? laoBottomTwo
        : lotteryType === 'hanoi'
          ? (hanoiType === 'special' ? hanoiSpecialBottomTwo : hanoiType === 'normal' ? hanoiNormalBottomTwo : hanoiVipBottomTwo)
          : lotteryType === 'stock'
            ? stockBottomTwo
            : bottomTwo;
      let notes = lotteryType === 'thai' 
        ? `คำนวณจากสามตัวบน: ${firstPrize}, เลขล่าง: ${bottomTwo}` 
        : lotteryType === 'stock'
          ? `คำนวณจากหุ้นล่าสุด สามตัวบน: ${stockThreeDigits}, เลขล่าง: ${stockBottomTwo}`
          : `คำนวณจากสามตัวบน: ${targetDigits}, เลขล่าง: ${targetBottomTwo}`;

      if (calcResults.special === 'decimal' && calcResults.specialData) {
        finalNumbers = [
          ...(calcResults.specialData.roots || []),
          ...(calcResults.specialData.winNumbers || []).slice(0, 3)
        ];
        notes += ` [รูด: ${calcResults.specialData.roots?.join(',')} | วิน: ${calcResults.specialData.winNumbers?.slice(0, 4).join(',')}]`;
      } else if (calcResults.special === 'lao16' && calcResults.specialData) {
        finalNumbers = calcResults.specialData.winNumbers || [];
        notes += ` [ผลคูณ: ${calcResults.specialData.rawResult}]`;
      }

      onSave({
        type: lotteryType,
        title: `สูตรคำนวณหวย (${
          lotteryType === 'thai' 
            ? 'หวยรัฐบาลไทย' 
            : lotteryType === 'lao' 
              ? 'หวยลาว' 
              : lotteryType === 'stock'
                ? 'หวยหุ้นต่างประเทศ'
                : hanoiType === 'special' 
                  ? 'หวยฮานอยพิเศษ' 
                  : hanoiType === 'normal' 
                    ? 'หวยฮานอยปกติ' 
                    : 'หวยฮานอย VIP'
        })`,
        formulaName: calcResults.formulaName,
        generatedNumbers: finalNumbers,
        notes: notes,
      });
      alert('บันทึกผลสูตรหวยเรียบร้อยแล้วค่ะ! แวะดูที่ประวัติได้เสมอน้า 💕');
    } else if (calcType === 'matrix' && matrixResults.length > 0) {
      onSave({
        type: lotteryType,
        title: `สูตรวินเลขเด่น ${matrixLength} ตัวเด็ด 🎀`,
        formulaName: `วินชุดตัวเลข: ${matrixNumbers.sort().join(',')}`,
        generatedNumbers: matrixResults.slice(0, 15), // Save up to 15 top results
        notes: `เลือกเลข: ${matrixNumbers.join(',')} รวมทั้งหมด ${matrixResults.length} คู่โชคดี`,
      });
      alert('บันทึกผลการจับคู่วินเลขเรียบร้อยแล้วค่ะ! ขอให้โดนรางวัลใหญ่ตัวโตๆ นะน้า 🌟');
    }
  };

  const startSimulatedScan = (type: 'real' | 'fake', fileName: string = 'payment_slip.png', file?: File) => {
    setModalStep('analyzing');
    setSelectedSimType(type);
    setUploadedFileName(fileName);
    setAnalyzingProgress(0);
    setAnalyzingStatus('กำลังอัปโหลดและสแกนหลักฐานสลิปโอนเงินเข้าระบบความปลอดภัย...');

    // If a real file is passed, use the real /api/verify-slip Gemini OCR API
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const mimeType = file.type;

        let progress = 0;
        const progressInterval = setInterval(() => {
          if (progress < 90) {
            progress += 5;
            setAnalyzingProgress(progress);
            if (progress === 25) {
              setAnalyzingStatus('ระบบ AI กำลังวิเคราะห์พิกเซล ฟอนต์ตัวเลข และพิกัดสี...');
            } else if (progress === 50) {
              setAnalyzingStatus('ระบบ AI กำลังอ่านข้อความภาษาไทย (OCR) และตรวจสอบยอดเงิน...');
            } else if (progress === 75) {
              setAnalyzingStatus('ระบบ AI กำลังตรวจสอบชื่อบัญชีผู้รับโอนและลายน้ำสลิป...');
            }
          }
        }, 150);

        try {
          const response = await fetch('/api/verify-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Image,
              mimeType,
              fileName: file.name
            })
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();

          if (data.success) {
            setAnalyzingProgress(100);
            setAnalyzingStatus('การตรวจสอบด้วย AI สำเร็จเสร็จสิ้น! 🎉');

            setTimeout(() => {
              if (data.isValidSlip && data.isToTargetRecipient) {
                const finalAmount = data.amount || 189;
                const finalDate = data.transferDate || new Date().toISOString().split('T')[0];
                const finalTime = data.transferTime || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                
                setTransferDate(finalDate);
                setTransferTime(finalTime);
                
                playFanfareSound();
                onUpgrade(finalAmount, file.name, subPeriod, finalDate, finalTime, data.senderName);
                setIsPremiumModalOpen(false);
                
                const isSim = data.isFallback ? " (โหมดสถิติอัจฉริยะแบบออฟไลน์)" : " (สแกนรูปภาพจริงด้วย Gemini AI)";
                const senderDisplay = data.senderName ? `\n• ชื่อผู้โอน: ${data.senderName}` : "";
                alert(`🎉 ปลดล็อกพรีเมี่ยมสำเร็จแล้วค่ะ!${isSim}\n\nข้อมูลจากสลิปที่ตรวจพบ:\n• ยอดเงินโอน: ${finalAmount} บาท\n• วันที่โอน: ${finalDate}\n• เวลาที่โอน: ${finalTime}${senderDisplay}\n• ชื่อผู้รับเงิน: ${data.recipientName}\n\nยินดีต้อนรับคุณ ${data.senderName || 'ผู้ใช้งาน'} เข้าสู่ระบบพรีเมี่ยมเซียนหวยมหาเฮงค่ะ ขอให้เลขงวดนี้เฮงๆ ปังๆ นะน้า! 👑💖🌈`);
              } else {
                playErrorSound();
                setIsPremiumModalOpen(false);
                
                const nameLower = file.name.toLowerCase();
                const isMalicious = nameLower.includes('fake') || nameLower.includes('crop') || nameLower.includes('edit') || nameLower.includes('modified') || (!data.isValidSlip && data.reason.includes('สลิปปลอม'));
                
                if (isMalicious) {
                  handleTriggerFakeSlipBlock(file.name);
                } else {
                  alert(`❌ อัปเกรดไม่สำเร็จ:\n\nเหตุผล: ${data.reason}\n\nกรุณาแนบสลิปโอนเงินจริงของธนาคารที่มีผู้รับเงินชื่อ "นัทธมน จันทร์ประโคน" นะคะ 🥺`);
                }
              }
            }, 800);
          } else {
            throw new Error(data.error || 'Verification failed');
          }
        } catch (err) {
          clearInterval(progressInterval);
          console.error('OCR Verification error, using standard simulation:', err);
          
          // Re-trigger simulation
          let simProgress = 0;
          const simInterval = setInterval(() => {
            simProgress += 10;
            setAnalyzingProgress(simProgress);
            if (simProgress === 30) {
              setAnalyzingStatus('กำลังประมวลผลวิเคราะห์พิกเซล ฟอนต์ตัวเลข และลายน้ำของสลิป...');
            } else if (simProgress === 60) {
              setAnalyzingStatus('กำลังถอดรหัส QR Code และดึงข้อมูลเลขอ้างอิงทำธุรกรรม...');
            } else if (simProgress === 90) {
              setAnalyzingStatus('กำลังจับคู่รหัสธุรกรรมกับระบบกลางธนาคารแห่งประเทศไทย...');
            }

            if (simProgress >= 100) {
              clearInterval(simInterval);
              setTimeout(() => {
                const isFake = file.name.toLowerCase().includes('fake') || file.name.toLowerCase().includes('crop');
                if (isFake) {
                  handleTriggerFakeSlipBlock(file.name);
                } else {
                  handleConfirmUpgrade();
                }
              }, 600);
            }
          }, 200);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Default simulation for non-file prompts
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAnalyzingProgress(progress);
      
      if (progress === 30) {
        setAnalyzingStatus('กำลังประมวลผลวิเคราะห์พิกเซล ฟอนต์ตัวเลข และลายน้ำของสลิป...');
      } else if (progress === 60) {
        setAnalyzingStatus('กำลังถอดรหัส QR Code (Bank mini-QR) และดึงข้อมูลเลขอ้างอิงทำธุรกรรม...');
      } else if (progress === 90) {
        setAnalyzingStatus('กำลังจับคู่รหัสธุรกรรมกับระบบกลางธนาคารแห่งประเทศไทย...');
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (type === 'real') {
            handleConfirmUpgrade();
          } else {
            handleTriggerFakeSlipBlock(fileName);
          }
        }, 600);
      }
    }, 250);
  };

  const handleConfirmUpgrade = () => {
    const activeQr = getQrConfig();
    const isCustom = activeQr.amount !== 199 && activeQr.amount !== 189;
    const monthlyPrice = isCustom ? activeQr.amount : 189;
    const amountToPay = subPeriod === 'daily' ? 19 : subPeriod === 'weekly' ? 59 : monthlyPrice;
    const periodText = subPeriod === 'daily' ? '1 วัน' : subPeriod === 'weekly' ? '7 วัน' : '30 วัน';

    playFanfareSound();
    onUpgrade(amountToPay, uploadedFileName || 'slip_payment_verified.png', subPeriod, transferDate, transferTime);
    setIsPremiumModalOpen(false);
    alert(`ยินดีด้วยค่ะ! คุณได้รับการอัปเกรดเป็นพรีเมี่ยมเซียนหวยเรียบร้อยแล้ว ปลดล็อกสูตรคำนวณแม่นยำทุกสูตรแบบไม่จำกัดตลอด ${periodText} ขอให้เฮงๆ รวยๆ ปังๆ นะคะ! 👑💖🎉`);
  };

  const renderPremiumModal = () => {
    if (!isPremiumModalOpen) return null;
    const activeQr = getQrConfig();
    const isCustom = activeQr.amount !== 199 && activeQr.amount !== 189;
    const monthlyPrice = isCustom ? activeQr.amount : 189;
    const amountToPay = subPeriod === 'daily' ? 19 : subPeriod === 'weekly' ? 59 : monthlyPrice;
    const periodLabel = subPeriod === 'daily' ? 'รายวัน (1 วัน)' : subPeriod === 'weekly' ? 'รายอาทิตย์ (7 วัน)' : 'รายเดือน (30 วัน)';

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white border-4 border-pink-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4.5 shadow-2xl relative overflow-hidden"
        >
          {/* Close button (only show when not analyzing) */}
          {modalStep !== 'analyzing' && (
            <button
              onClick={() => setIsPremiumModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-pink-500 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Step 1: Displaying the Dynamic Payment QR Code */}
          {modalStep === 'scan' && (
            <>
              {/* Premium Icon Header */}
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse">
                <Crown className="w-7 h-7" />
              </div>

              {/* Modal Title */}
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">อัปเกรดเซียนหวย VIP 👑</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide">
                  เลือกแพ็กเกจความคุ้มค่าที่ใช่สำหรับคุณนะคะ ✨
                </p>
              </div>

              {/* Package Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-rose-50/50 border border-pink-100/45 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { playPopSound(); setSubPeriod('daily'); }}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                    subPeriod === 'daily'
                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                      : 'text-slate-500 hover:text-pink-400'
                  }`}
                >
                  <span>รายวัน 19.-</span>
                  <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 1 วัน</span>
                </button>
                <button
                  type="button"
                  onClick={() => { playPopSound(); setSubPeriod('weekly'); }}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                    subPeriod === 'weekly'
                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                      : 'text-slate-500 hover:text-pink-400'
                  }`}
                >
                  <span>รายอาทิตย์ 59.-</span>
                  <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 7 วัน</span>
                </button>
                <button
                  type="button"
                  onClick={() => { playPopSound(); setSubPeriod('monthly'); }}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                    subPeriod === 'monthly'
                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                      : 'text-slate-500 hover:text-pink-400'
                  }`}
                >
                  <span>รายเดือน 189.-</span>
                  <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 30 วัน</span>
                </button>
              </div>

              {/* Payment Details Info */}
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
                ยอดชำระ: <span className="text-pink-500 font-black text-xs">{amountToPay} บาท</span> สำหรับ <span className="text-pink-500 font-black">{periodLabel}</span>
              </p>

              {/* PromptPay Number Display (No QR Code) */}
              <div className="bg-rose-50/45 border border-pink-100 p-5 rounded-3xl max-w-[240px] mx-auto space-y-3 shadow-inner">
                <div className="bg-[#002B66] text-white py-1 px-3 rounded-lg text-[8px] font-black tracking-wider uppercase inline-block mx-auto">
                  PromptPay 💳 พร้อมเพย์
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">เบอร์โทรศัพท์พร้อมเพย์</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeQr.promptPayNumber);
                      alert('📋 คัดลอกเบอร์พร้อมเพย์ ' + activeQr.promptPayNumber + ' เรียบร้อยแล้วค่ะ! คุณสามารถนำไปใช้วางในแอปธนาคารเพื่อโอนเงินได้ทันทีเลยน้า 💕');
                    }}
                    className="w-full text-sm font-black text-slate-800 tracking-wider font-mono bg-white border-2 border-dashed border-pink-200 hover:border-pink-400 py-1.5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:bg-rose-50/20 active:scale-95"
                    title="คลิกเพื่อคัดลอกเบอร์โทรศัพท์"
                  >
                    <span>{activeQr.promptPayNumber}</span>
                    <span className="text-[9px] bg-pink-100 text-pink-500 font-extrabold px-1.5 py-0.5 rounded-lg">คัดลอก 📋</span>
                  </button>
                </div>

                <div className="text-center text-[10px] border-t border-dashed border-slate-200 pt-2 space-y-0.5 font-bold text-slate-500">
                  <p>ชื่อบัญชี: <span className="text-slate-700">{activeQr.accountName}</span></p>
                </div>
              </div>

              <p className="text-[10px] text-pink-500 font-bold">โอนเงินด้วยเบอร์พร้อมเพย์ด้านบนตามยอดเพื่ออัปเกรดพรีเมี่ยมได้เลยค่ะ</p>

              <div className="space-y-2">
                <button
                  onClick={() => setModalStep('upload')}
                  className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-pink-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  ฉันโอนเงินและได้สลิปแล้ว 📂
                </button>
                <button
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                >
                  ไว้คราวหลังนะคะ 🥺
                </button>
              </div>
            </>
          )}

          {/* Step 2: Upload Payment Slip Section */}
          {modalStep === 'upload' && (
            <>
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">ส่งรูปภาพสลิปเพื่อยืนยัน 📂</h3>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                  ระบบใช้<b>เทคโนโลยีตรวจจับสลิปปลอมอัตโนมัติ</b> <br/>
                  <span className="text-rose-500">การส่งสลิปปลอม/สลิปตัดต่อ จะถูกบล็อกบัญชีถาวรทันทีค่ะ 🚫</span>
                </p>
              </div>

              {/* Transfer Date and Time Input Section */}
              <div className="grid grid-cols-2 gap-3 text-left bg-rose-50/20 p-3.5 border border-pink-50 rounded-2xl">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    วันที่โอนเงิน 📅
                  </label>
                  <input 
                    type="date"
                    value={transferDate}
                    onChange={(e) => { playPopSound(); setTransferDate(e.target.value); }}
                    className="w-full px-2.5 py-1.5 bg-white border border-pink-100 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    เวลาที่โอนเงิน ⏰
                  </label>
                  <input 
                    type="time"
                    value={transferTime}
                    onChange={(e) => { playPopSound(); setTransferTime(e.target.value); }}
                    className="w-full px-2.5 py-1.5 bg-white border border-pink-100 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100"
                    required
                  />
                </div>
              </div>

              {/* Drag and Drop Box Area */}
              <div className="border-2 border-dashed border-pink-200 hover:border-pink-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center space-y-2 relative transition-all">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const name = file.name.toLowerCase();
                      const isFakeName = name.includes('fake') || name.includes('crop') || name.includes('edit') || name.includes('modified');
                      
                      if (isFakeName) {
                        startSimulatedScan('fake', file.name);
                        return;
                      }

                      // Check if slip with the exact same name has already been used on the server
                      try {
                        const res = await fetch('/api/premium-purchases');
                        if (res.ok) {
                          const purchases = await res.json();
                          const isDuplicate = purchases.some((p: any) => 
                            p.fileName === file.name && (p.status === 'success' || p.status === 'code_success')
                          );

                          if (isDuplicate) {
                            // Trigger scan and fail due to duplicate
                            setModalStep('analyzing');
                            setSelectedSimType('fake');
                            setUploadedFileName(file.name);
                            setAnalyzingProgress(0);
                            setAnalyzingStatus('กำลังตรวจวิเคราะห์ลายนิ้วมือสลิปและเลขอ้างอิงทำธุรกรรม...');
                            
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 20;
                              setAnalyzingProgress(progress);
                              if (progress === 40) {
                                setAnalyzingStatus('กำลังดึงเลขอ้างอิงธนาคาร (Transaction ID) เพื่อตรวจสอบความซ้ำซ้อน...');
                              } else if (progress === 80) {
                                setAnalyzingStatus('❌ ตรวจพบคีย์อ้างอิงธุรกรรมนี้ถูกใช้งานเปิดพรีเมี่ยมไปแล้ว!');
                              }
                              
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  playErrorSound();
                                  setIsPremiumModalOpen(false);
                                  alert('❌ ขออภัยค่ะ! สลิปโอนเงินใบนี้ (เลขอ้างอิงทำธุรกรรมนี้) ได้ถูกใช้งานเพื่อเปิดพรีเมี่ยมในระบบไปเรียบร้อยแล้วค่ะ ไม่สามารถนำมาใช้ซ้ำได้อีกนะคะ หากมีข้อสงสัยกรุณาติดต่อแอดมินนะคะ 💖');
                                }, 600);
                              }
                            }, 250);
                            return;
                          }
                        }
                      } catch (err) {
                        console.error('Error verifying duplicate slip:', err);
                      }

                      startSimulatedScan('real', file.name, file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileText className="w-8 h-8 text-pink-300" />
                <p className="text-[10px] font-bold text-slate-500">กดเพื่ออัปโหลดไฟล์ภาพสลิปจริง</p>
                <p className="text-[8px] text-slate-400">รองรับนามสกุล .png, .jpg (สูงสุด 5MB)</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setModalStep('scan')}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                >
                  ย้อนกลับ 👈
                </button>
                <button
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 text-slate-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก ❌
                </button>
              </div>
            </>
          )}

          {/* Step 3: Slip Scanning Progress Screen */}
          {modalStep === 'analyzing' && (
            <div className="py-6 space-y-5">
              {/* Scanner Radar Effect */}
              <div className="relative mx-auto w-20 h-20 rounded-full border-4 border-pink-100 flex items-center justify-center overflow-hidden bg-rose-50">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-md shadow-pink-400/50 animate-bounce" style={{ animationDuration: '1.2s' }} />
              </div>

              {/* Dynamic Status */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-800">ระบบ AI กำลังวิเคราะห์สลิป...</h3>
                <p className="text-[10px] text-pink-500 font-bold h-7 flex items-center justify-center leading-relaxed">
                  {analyzingStatus}
                </p>
              </div>

              {/* Linear Progress bar */}
              <div className="space-y-1 max-w-[240px] mx-auto">
                <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-pink-400 to-rose-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${analyzingProgress}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-400 block text-right">
                  {analyzingProgress}% ประมวลผลสำเร็จ
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'thai': return 'หวยรัฐบาลไทย';
      case 'lao': return 'หวยลาว';
      case 'hanoi': return 'หวยฮานอย';
      case 'yiki': return 'หวยยี่กี';
      case 'stock': return 'หวยหุ้น';
      default: return 'คำนวณหวย';
    }
  };

  const getSubLotteries = (): SubLottery[] => {
    switch (activeTab) {
      case 'thai': return THAI_SUB_LOTTERIES;
      case 'lao': return LAO_SUB_LOTTERIES;
      case 'hanoi': return HANOI_SUB_LOTTERIES;
      case 'yiki': return YIKI_SUB_LOTTERIES;
      case 'stock': return STOCK_SUB_LOTTERIES;
      default: return [];
    }
  };

  const currentSubLotteries = getSubLotteries();

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering card select
    playPopSound();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(`lottery_favorites_${user?.id}`, JSON.stringify(next));
      return next;
    });
  };

  if (activeTab !== 'free' && !selectedSubLottery) {
    const title = getHeaderTitle();
    const count = currentSubLotteries.length;
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Tab Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-100 pb-5">
          <div>
            <h2 className="text-xl font-extrabold text-pink-600 flex items-center gap-2">
              <Calculator className="w-5.5 h-5.5 text-pink-400" />
              คำนวณสูตรสถิติ & วินเลขเด็ด ✏️
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">คำนวณสูตรอัจฉริยะตามหลักตัวเลขมงคลและสถิติด้วยระบบบับเบิ้ลสุดน่ารัก</p>
          </div>
          <button
            onClick={async () => {
              setNotice('กำลังดึงผลรางวัลล่าสุดจากเซิร์ฟเวอร์ด้วยปัญญาประดิษฐ์และระบบขูดข้อมูล... กรุณารอสักครู่นะคะ ⏳');
              try {
                const res = await fetch('/api/lottery-history/refresh', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  // Reload the results
                  const histRes = await fetch('/api/lottery-history');
                  if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.thai && histData.thai[0]) {
                      setFirstPrize(histData.thai[0].top3);
                      setBottomTwo(histData.thai[0].bottom2);
                    }
                    if (histData.lao && histData.lao[0]) {
                      setThreeDigits(histData.lao[0].top3);
                      setLaoBottomTwo(histData.lao[0].bottom2);
                    }
                    if (histData.hanoi_special && histData.hanoi_special[0]) {
                      setHanoiSpecial(histData.hanoi_special[0].top3);
                      setHanoiSpecialBottomTwo(histData.hanoi_special[0].bottom2);
                    }
                    if (histData.hanoi_normal && histData.hanoi_normal[0]) {
                      setHanoiNormal(histData.hanoi_normal[0].top3);
                      setHanoiNormalBottomTwo(histData.hanoi_normal[0].bottom2);
                    }
                    if (histData.hanoi_vip && histData.hanoi_vip[0]) {
                      setHanoiVip(histData.hanoi_vip[0].top3);
                      setHanoiVipBottomTwo(histData.hanoi_vip[0].bottom2);
                    }
                  }
                  alert('🎉 ดึงผลหวยย้อนหลังสำเร็จและอัปเดตใส่แอปเรียบร้อยแล้วค่ะ! ข้อมูลอัปเดตล่าสุดพร้อมใช้คำนวณแล้วค่า 💕');
                  setNotice(null);
                } else {
                  alert(`ไม่สามารถอัปเดตผลหวยได้: ${data.error || 'กรุณาลองใหม่อีกครั้งค่ะ'}`);
                  setNotice(null);
                }
              } catch (e: any) {
                alert(`เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${e.message || String(e)}`);
                setNotice(null);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-[11px] rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ดึงข้อมูลผลรางวัลล่าสุด 🔄
          </button>
        </div>

        {/* Lottery Type Picker */}
        <div className="flex flex-wrap bg-rose-50/70 rounded-2xl p-1.5 border border-pink-100/50 shadow-inner gap-1">
          {([
            { id: 'free', label: 'สูตรฟรี 🥕' },
            { id: 'thai', label: 'หวยรัฐบาลไทย 🇹🇭' },
            { id: 'lao', label: 'หวยลาวพัฒนา 🇱🇦' },
            { id: 'hanoi', label: 'หวยฮานอย 🇻🇳' },
            { id: 'yiki', label: 'หวยยี่กี 🃏' },
            { id: 'stock', label: 'หวยหุ้น 📈' }
          ] as { id: 'free' | LotteryType, label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playPopSound();
                setActiveTab(tab.id);
                setSelectedSubLottery(null);
                if (tab.id === 'free') {
                  setLotteryType('thai');
                  setSelectedFormula('tf_free_decimal');
                } else if (tab.id === 'thai') {
                  setLotteryType('thai');
                  setSelectedFormula('tf_1');
                } else if (tab.id === 'lao') {
                  setLotteryType('lao');
                  setSelectedFormula('lf_lao_16');
                } else if (tab.id === 'yiki') {
                  setLotteryType('yiki');
                  setSelectedFormula('yf_1');
                } else if (tab.id === 'stock') {
                  setLotteryType('stock');
                  setSelectedFormula('sf_1_1');
                } else {
                  setLotteryType('hanoi');
                  setSelectedFormula('hf_1');
                }
                setCalcResults(null);
                setNotice(null);
              }}
              className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-pink-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pop Warning Notice */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-pink-200 text-rose-600 text-xs font-bold rounded-2xl"
          >
            <AlertCircle className="w-4.5 h-4.5 text-pink-400 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}

        {/* Free / Premium banner notice */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-300/40 text-amber-500">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-700">
                {isAdmin 
                  ? 'ยินดีต้อนรับคุณแอดมิน! ปลดล็อกทุกสูตรเรียบร้อยแล้วค่ะ 🛠️' 
                  : isPremium 
                    ? 'คุณปลดล็อกสถานะพรีเมี่ยม VIP เรียบร้อยแล้วค่ะ 🎉' 
                    : 'ปลดล็อกเซียนหวยระดับโปร (พรีเมี่ยม 👑) รายอาทิตย์ 59.- / รายเดือน 189.-'}
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isAdmin 
                  ? 'คุณสามารถเข้าถึง ตรวจสอบ และวิเคราะห์สูตรพรีเมี่ยมทุกสูตรในระบบได้เต็มรูปแบบเลยค่ะ ✨' 
                  : isPremium 
                    ? 'ขอบพระคุณที่ร่วมสนับสนุนน้องเศรษฐีนะคะ! ขอให้รวยๆ ปังๆ ทุกงวดเลยค่า 💖' 
                    : 'รับสูตรคำนวณหวยลาวคูณ 16% สดใหม่ และสูตรรัฐบาลพรีเมี่ยมสถิติย้อนหลังแม่นๆ'}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-500 text-slate-900 font-extrabold text-xs rounded-2xl shadow-md hover:scale-[1.03] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {isPremium ? '💎 ดูช่องทางชำระเงิน / อัปเกรด' : 'อัปเกรดความปังเลย ✨'}
            </button>
          )}
        </div>

        {/* Sub-Lottery Window styled EXACTLY like the user's screenshot! */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
          {/* Blue Header: matches screenshot precisely */}
          <div className="bg-[#1E40AF] px-5 py-4 flex items-center justify-between text-white select-none">
            <button 
              onClick={() => { playPopSound(); setActiveTab('free'); }}
              className="p-1 text-white hover:opacity-80 active:scale-90 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold tracking-wide">{title}</span>
            <button 
              onClick={() => { playPopSound(); setActiveTab('free'); }}
              className="p-1 text-white hover:opacity-80 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Collapsible Accordion-style Subsection bar: matches screenshot precisely */}
          <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-[#1E40AF] rounded-full inline-block" />
              <span className="text-[#1E40AF] font-extrabold text-sm">{title} ({count})</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* Grid of blue cards with Star Favorites icons: matches screenshot precisely */}
          <div className="bg-slate-50/50 p-4 pb-10">
            <div className="grid grid-cols-2 gap-3.5">
              {currentSubLotteries.map((sub) => {
                const isFav = favorites.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      playSuccessSound();
                      setSelectedSubLottery(sub);
                      // Auto-select formula to matching round/market if applicable
                      if (activeTab === 'yiki') {
                        setSelectedFormula('yf_1');
                      } else if (activeTab === 'stock') {
                        const marketIdx = Number(sub.id.replace('stock_market_', '')) || 0;
                        setSelectedStockMarketIndex(marketIdx);
                        setSelectedFormula(`sf_${marketIdx + 1}_1`);
                      } else if (activeTab === 'hanoi') {
                        if (sub.id.includes('special')) {
                          setHanoiType('special');
                        } else if (sub.id.includes('vip')) {
                          setHanoiType('vip');
                        } else {
                          setHanoiType('normal');
                        }
                      }
                    }}
                    className="relative bg-[#1E40AF] hover:bg-[#1a3cbd] active:scale-[0.98] transition-all duration-200 cursor-pointer text-white rounded-2xl p-4 flex flex-col justify-between items-center text-center aspect-[15/9] shadow-sm shadow-[#1E40AF]/15 group animate-scaleUp"
                  >
                    {/* Centered sub-lottery name */}
                    <div className="flex items-center justify-center flex-1 w-full text-center text-[13px] font-black leading-snug px-1 select-none">
                      {sub.name}
                    </div>

                    {/* Star icon at top-right */}
                    <button
                      onClick={(e) => toggleFavorite(sub.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    >
                      <Star 
                        className={`w-4.5 h-4.5 ${
                          isFav 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-white/70 group-hover:text-white'
                        }`} 
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Premium upgrade modal render */}
        {renderPremiumModal()}
      </div>
    );
  }

  const activeFormulaObjRaw = allFormulas.find(f => f.id === selectedFormula);
  const activeFormulaObj = activeFormulaObjRaw ? {
    ...activeFormulaObjRaw,
    name: getLocalizedName(activeFormulaObjRaw)
  } : null;

  return (
    <div className="space-y-8">
      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-100 pb-5">
        <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-pink-600 flex items-center gap-2">
              <Calculator className="w-5.5 h-5.5 text-pink-400" />
              คำนวณสูตรสถิติ & วินเลขเด็ด ✏️
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">คำนวณสูตรอัจฉริยะตามหลักตัวเลขมงคลและสถิติด้วยระบบบับเบิ้ลสุดน่ารัก</p>
          </div>
          <button
            onClick={async () => {
              setNotice('กำลังดึงผลรางวัลล่าสุดจากเซิร์ฟเวอร์ด้วยปัญญาประดิษฐ์และระบบขูดข้อมูล... กรุณารอสักครู่นะคะ ⏳');
              try {
                const res = await fetch('/api/lottery-history/refresh', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  // Reload the results
                  const histRes = await fetch('/api/lottery-history');
                  if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.thai && histData.thai[0]) {
                      setFirstPrize(histData.thai[0].top3);
                      setBottomTwo(histData.thai[0].bottom2);
                    }
                    if (histData.lao && histData.lao[0]) {
                      setThreeDigits(histData.lao[0].top3);
                      setLaoBottomTwo(histData.lao[0].bottom2);
                    }
                    if (histData.hanoi_special && histData.hanoi_special[0]) {
                      setHanoiSpecial(histData.hanoi_special[0].top3);
                      setHanoiSpecialBottomTwo(histData.hanoi_special[0].bottom2);
                    }
                    if (histData.hanoi_normal && histData.hanoi_normal[0]) {
                      setHanoiNormal(histData.hanoi_normal[0].top3);
                      setHanoiNormalBottomTwo(histData.hanoi_normal[0].bottom2);
                    }
                    if (histData.hanoi_vip && histData.hanoi_vip[0]) {
                      setHanoiVip(histData.hanoi_vip[0].top3);
                      setHanoiVipBottomTwo(histData.hanoi_vip[0].bottom2);
                    }
                  }
                  alert('🎉 ดึงผลหวยย้อนหลังสำเร็จและอัปเดตใส่แอปเรียบร้อยแล้วค่ะ! ข้อมูลอัปเดตล่าสุดพร้อมใช้คำนวณแล้วค่า 💕');
                  setNotice(null);
                } else {
                  alert(`ไม่สามารถอัปเดตผลหวยได้: ${data.error || 'กรุณาลองใหม่อีกครั้งค่ะ'}`);
                  setNotice(null);
                }
              } catch (e: any) {
                alert(`เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${e.message || String(e)}`);
                setNotice(null);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-[11px] rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ดึงข้อมูลผลรางวัลล่าสุด 🔄
          </button>
        </div>

        {/* Lottery Type Picker */}
        <div className="flex flex-wrap bg-rose-50/70 rounded-2xl p-1.5 border border-pink-100/50 shadow-inner gap-1">
          {([
            { id: 'free', label: 'สูตรฟรี 🥕' },
            { id: 'thai', label: 'หวยรัฐบาลไทย 🇹🇭' },
            { id: 'lao', label: 'หวยลาวพัฒนา 🇱🇦' },
            { id: 'hanoi', label: 'หวยฮานอย 🇻🇳' },
            { id: 'yiki', label: 'หวยยี่กี 🃏' },
            { id: 'stock', label: 'หวยหุ้น 📈' }
          ] as { id: 'free' | LotteryType, label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playPopSound();
                setActiveTab(tab.id);
                setSelectedSubLottery(null); // Reset sub-lottery on tab switch
                // Reset formula selected to first in category
                if (tab.id === 'free') {
                  setLotteryType('thai');
                  setSelectedFormula('tf_free_decimal');
                } else if (tab.id === 'thai') {
                  setLotteryType('thai');
                  setSelectedFormula('tf_1');
                } else if (tab.id === 'lao') {
                  setLotteryType('lao');
                  setSelectedFormula('lf_lao_16');
                } else if (tab.id === 'yiki') {
                  setLotteryType('yiki');
                  setSelectedFormula('yf_1');
                } else if (tab.id === 'stock') {
                  setLotteryType('stock');
                  setSelectedFormula('sf_1_1');
                } else {
                  setLotteryType('hanoi');
                  setSelectedFormula('hf_1');
                }
                setCalcResults(null);
                setNotice(null);
              }}
              className={`px-4.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-pink-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pop Warning Notice */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-pink-200 text-rose-600 text-xs font-bold rounded-2xl"
        >
          <AlertCircle className="w-4.5 h-4.5 text-pink-400 shrink-0" />
          <span>{notice}</span>
        </motion.div>
      )}

      {/* Free / Premium banner notice */}
      <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-300/40 text-amber-500">
            <Crown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-700">
              {isAdmin 
                ? 'ยินดีต้อนรับคุณแอดมิน! ปลดล็อกทุกสูตรเรียบร้อยแล้วค่ะ 🛠️' 
                : isPremium 
                  ? 'คุณปลดล็อกสถานะพรีเมี่ยม VIP เรียบร้อยแล้วค่ะ 🎉' 
                  : 'ปลดล็อกเซียนหวยระดับโปร (พรีเมี่ยม 👑) รายอาทิตย์ 59.- / รายเดือน 189.-'}
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isAdmin 
                ? 'คุณสามารถเข้าถึง ตรวจสอบ และวิเคราะห์สูตรพรีเมี่ยมทุกสูตรในระบบได้เต็มรูปแบบเลยค่ะ ✨' 
                : isPremium 
                  ? 'ขอบพระคุณที่ร่วมสนับสนุนน้องเศรษฐีนะคะ! ขอให้รวยๆ ปังๆ ทุกงวดเลยค่า 💖' 
                  : 'รับสูตรคำนวณหวยลาวคูณ 16% สดใหม่ และสูตรรัฐบาลพรีเมี่ยมสถิติย้อนหลังแม่นๆ'}
            </p>
          </div>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-500 text-slate-900 font-extrabold text-xs rounded-2xl shadow-md hover:scale-[1.03] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            {isPremium ? '💎 ดูช่องทางชำระเงิน / อัปเกรด' : 'อัปเกรดความปังเลย ✨'}
          </button>
        )}
      </div>

      {/* Active Sub-Lottery Banner */}
      {selectedSubLottery && (
        <div className="bg-gradient-to-r from-blue-500 to-[#1E40AF] text-white p-4.5 rounded-3xl shadow-md flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <TrendingUp className="w-5.5 h-5.5 text-white" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/70">กำลังวิเคราะห์ข้อมูล</span>
              <h3 className="text-base font-black leading-tight mt-0.5">{selectedSubLottery.name}</h3>
            </div>
          </div>
          <button
            onClick={() => { playPopSound(); setSelectedSubLottery(null); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E40AF] hover:bg-slate-100 font-extrabold text-xs rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            เปลี่ยนประเภทหวยอื่นๆ ↩
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Formula Calculations */}
        <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-md shadow-pink-100/35 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4.5 h-4.5 text-pink-400" />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">คำนวณสูตรลับมงคล 🥕</h3>
            </div>

            {/* Active Formula Header (Matches Replit Screenshot) */}
            <div className="bg-pink-50/40 border border-pink-100 rounded-3xl p-5 mb-5 text-left relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-3 translate-x-3">
                <Sparkles className="w-24 h-24 text-pink-400" />
              </div>
              <h3 className="text-sm font-black text-pink-600 flex items-center gap-1.5 leading-tight">
                {activeFormulaObj ? activeFormulaObj.name : 'สูตรคำนวณหวยมงคล 🔮'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                {activeFormulaObj?.isPremium ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>สูตรพิเศษพรีเมี่ยมสำหรับสมาชิก VIP 👑</span>
                  </>
                ) : (
                  <>
                    <span>ใช้ได้ฟรีสำหรับทุกคน 🐰</span>
                  </>
                )}
              </p>
            </div>

            {/* Inputs based on type */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {lotteryType === 'thai' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลขสามตัวบน (งวดล่าสุด)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={firstPrize}
                      onChange={(e) => setFirstPrize(e.target.value)}
                      placeholder="เช่น 112"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลขสองตัวล่าง (งวดล่าสุด)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={bottomTwo}
                      onChange={(e) => setBottomTwo(e.target.value)}
                      placeholder="เช่น 17"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </>
              ) : lotteryType === 'yiki' ? (
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">สามตัวบน (ล่าสุด)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={yikiThreeDigits}
                      onChange={(e) => setYikiThreeDigits(e.target.value)}
                      placeholder="เช่น 482"
                      className="w-full px-3 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">สองตัวล่าง (ล่าสุด)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={yikiBottomTwo}
                      onChange={(e) => setYikiBottomTwo(e.target.value)}
                      placeholder="เช่น 57"
                      className="w-full px-3 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">คำนวณรอบที่ 🎯</label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={yikiRound}
                      onChange={(e) => setYikiRound(e.target.value)}
                      placeholder="รอบที่"
                      className="w-full px-3 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </div>
              ) : lotteryType === 'lao' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลข 3 ตัวบน หวยลาว ล่าสุด</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={threeDigits}
                      onChange={(e) => setThreeDigits(e.target.value)}
                      placeholder="เช่น 379"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลข 2 ตัวล่าง หวยลาว ล่าสุด</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={laoBottomTwo}
                      onChange={(e) => setLaoBottomTwo(e.target.value)}
                      placeholder="เช่น 32"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </>
              ) : lotteryType === 'stock' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลข 3 ตัวบน หุ้นล่าสุด</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={stockThreeDigits}
                      onChange={(e) => setStockThreeDigits(e.target.value)}
                      placeholder="เช่น 580"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">เลข 2 ตัวล่าง หุ้นล่าสุด</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={stockBottomTwo}
                      onChange={(e) => setStockBottomTwo(e.target.value)}
                      placeholder="เช่น 42"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        เลข 3 ตัวบน {selectedSubLottery ? selectedSubLottery.name : (hanoiType === 'special' ? 'ฮานอยพิเศษ 🌟' : hanoiType === 'normal' ? 'ฮานอยปกติ 🏆' : 'ฮานอย VIP 👑')} ล่าสุด
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={hanoiType === 'special' ? hanoiSpecial : hanoiType === 'normal' ? hanoiNormal : hanoiVip}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (hanoiType === 'special') setHanoiSpecial(val);
                          else if (hanoiType === 'normal') setHanoiNormal(val);
                          else setHanoiVip(val);
                        }}
                        placeholder="เช่น 379"
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        เลข 2 ตัวล่าง {selectedSubLottery ? selectedSubLottery.name : (hanoiType === 'special' ? 'ฮานอยพิเศษ 🌟' : hanoiType === 'normal' ? 'ฮานอยปกติ 🏆' : 'ฮานอย VIP 👑')} ล่าสุด
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={hanoiType === 'special' ? hanoiSpecialBottomTwo : hanoiType === 'normal' ? hanoiNormalBottomTwo : hanoiVipBottomTwo}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (hanoiType === 'special') setHanoiSpecialBottomTwo(val);
                          else if (hanoiType === 'normal') setHanoiNormalBottomTwo(val);
                          else setHanoiVipBottomTwo(val);
                        }}
                        placeholder="เช่น 29"
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* If Stock Lottery, show the beautiful grid of Stock Markets first */}
            {activeTab === 'stock' && (
              <div className="space-y-3 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pl-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-pink-500" />
                    <label className="block text-xs font-black text-pink-600">วิเคราะห์แยกกระดานหุ้น (กดเพื่อเลือกตลาดหุ้น) 📈</label>
                  </div>
                  {/* Stock Filter tabs */}
                  <div className="flex bg-rose-50/70 p-1 rounded-xl border border-pink-100/30 gap-1 text-[10px] font-extrabold shadow-sm">
                    {(['all', 'general', 'vip'] as const).map((filter) => {
                      const label = filter === 'all' ? 'ทั้งหมด 🌍' : filter === 'general' ? 'ตลาดทั่วไป 📈' : 'ตลาด VIP 👑';
                      const isFilterActive = stockFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setStockFilter(filter)}
                          className={`px-2 py-1 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            isFilterActive
                              ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-pink-100/40 bg-pink-50/15 p-2 rounded-2xl max-h-[170px] overflow-y-auto pr-1">
                  {STOCK_MARKETS.map((market, idx) => {
                    const isVip = market.name.includes('VIP');
                    if (stockFilter === 'general' && isVip) return null;
                    if (stockFilter === 'vip' && !isVip) return null;
                    const isSelected = selectedStockMarketIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedStockMarketIndex(idx);
                          // Reset the selected formula to the first template of this market
                          setSelectedFormula(`sf_${idx + 1}_1`);
                          setCalcResults(null);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-pink-400 shadow-sm font-bold scale-[1.02]'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="text-base shrink-0">{market.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] truncate leading-tight">{market.name}</p>
                          <p className={`text-[8px] ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>10 สูตรคำนวณ 🔮</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formula Selector Card List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-1.5 pl-1">
                {activeTab === 'free' ? (
                  <>
                    <span className="text-sm font-black text-pink-500">🥕</span>
                    <label className="block text-xs font-black text-pink-600">เลือกสูตรคำนวณฟรี (สำหรับสมาชิกทุกคน) 🥕</label>
                  </>
                ) : activeTab === 'stock' ? (
                  <>
                    <span className="text-sm font-black text-amber-500">👑</span>
                    <label className="block text-xs font-black text-amber-600">
                      สูตรเจาะลึกมงคล {STOCK_MARKETS[selectedStockMarketIndex].icon} {STOCK_MARKETS[selectedStockMarketIndex].name} (มี 10 สูตรเด็ด) 👑
                    </label>
                  </>
                ) : activeTab === 'yiki' ? (
                  <>
                    <span className="text-sm font-black text-amber-500">👑</span>
                    <label className="block text-xs font-black text-amber-600">
                      เลือกสูตรหวยยี่กีพรีเมี่ยม (มี 10 สูตรเด่น) 👑
                    </label>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-black text-amber-500">👑</span>
                    <label className="block text-xs font-black text-amber-600">เลือกสูตรเด่นระดับพรีเมี่ยม VIP (ความแม่นยำสูง) 👑</label>
                  </>
                )}
              </div>
              
              {activeTab === 'yiki' && (
                <div className="relative mb-3 pl-1 pr-1">
                  <input
                    type="text"
                    value={yikiSearchQuery}
                    onChange={(e) => setYikiSearchQuery(e.target.value)}
                    placeholder="🔎 ค้นหาชื่อสูตรยี่กี (เช่น: รูด 19 ประตู, ปักสิบ...)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-pink-100 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 focus:outline-none rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400"
                  />
                  {yikiSearchQuery && (
                    <button
                      onClick={() => setYikiSearchQuery('')}
                      className="absolute right-3.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ล้าง ↩
                    </button>
                  )}
                </div>
              )}
              
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                {formulasToDisplay.map((formula) => {
                  const isLocked = formula.isPremium && !hasPremiumAccess;
                  const isSelected = selectedFormula === formula.id;
                  return (
                    <div
                      key={formula.id}
                      onClick={() => {
                        setSelectedFormula(formula.id);
                        setLotteryType(formula.category);
                        if (isLocked) {
                          setIsPremiumModalOpen(true);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-50 to-rose-50/80 border-pink-300 shadow-sm shadow-pink-100'
                          : 'bg-slate-50/40 border-pink-100/50 hover:bg-rose-50/30 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          {formula.name}
                          {formula.isPremium ? (
                            <span className="px-1 py-0.5 bg-amber-100 text-amber-600 border border-amber-200 text-[8px] font-black rounded flex items-center gap-0.5">
                              VIP 👑
                            </span>
                          ) : (
                            <span className="px-1 py-0.5 bg-pink-100 text-pink-600 border border-pink-200 text-[8px] font-black rounded">
                              Free 🥕
                            </span>
                          )}
                        </p>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shrink-0 animate-pulse" />
                        )}
                      </div>
                      
                      {isLocked && (
                        <div className="absolute inset-0 bg-white/45 backdrop-blur-[0.5px] rounded-2xl flex items-center justify-end pr-4">
                          <span className="p-1.5 bg-white border border-pink-100 rounded-xl shadow-sm text-pink-500">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleCalculateFormula}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold rounded-2xl shadow-md shadow-pink-200 hover:shadow-pink-300 active:scale-[0.98] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              คำนวณตามสูตรเสี่ยงโชค ✨
            </button>
          </div>

          {/* Output Results with custom high-fidelity styling for Free & Premium requests */}
          {calcResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4.5 bg-pink-50/30 border border-pink-100 rounded-3xl space-y-4"
            >
              {/* Header and Save Option */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-pink-500 bg-pink-100/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  {calcResults.special ? '✨ วิเคราะห์เจาะลึกสำเร็จ' : 'ผลลัพธ์เลขเด่นหลัก 🌸'}
                </span>
                <button
                  onClick={() => handleSaveCalculation('formula')}
                  className="flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  บันทึกดวงชุดนี้ 💕
                </button>
              </div>

              {/* 1. Specialized Output for FREE Decimal Formula */}
              {calcResults.special === 'decimal' && calcResults.specialData && (
                <div className="space-y-5 text-left bg-[#FFF5F7]/30 border border-pink-100 rounded-3xl p-5 shadow-inner">
                  {/* 1. รูด */}
                  {calcResults.specialData.roots && calcResults.specialData.roots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-2">
                        <span>✨</span>
                        <span>รูด</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {calcResults.specialData.roots.map((num, i) => (
                          <div
                            key={i}
                            className="w-14 h-11 border-2 border-pink-400 bg-white rounded-2xl flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. เลขวิน */}
                  {calcResults.specialData.winNumbers && calcResults.specialData.winNumbers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-2">
                        <span>💖</span>
                        <span>เลขวิน</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {calcResults.specialData.winNumbers.map((num, i) => (
                          <div
                            key={i}
                            className="w-14 h-11 border-2 border-pink-400 bg-white rounded-2xl flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. ชุดเด่นสามตัวบน */}
                  {calcResults.specialData.threeDigitSets && calcResults.specialData.threeDigitSets.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-2">
                        <span>⭐</span>
                        <span>ชุดเด่นสามตัวบน</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {calcResults.specialData.threeDigitSets.map((set, i) => (
                          <div
                            key={i}
                            className="w-20 h-11 border-2 border-pink-400 bg-white rounded-2xl flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
                          >
                            {set}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. ชุดเลข 2 ตัว */}
                  {calcResults.specialData.pairs && calcResults.specialData.pairs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-2">
                        <span>🎯</span>
                        <span>ชุดเลข 2 ตัว</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                        {calcResults.specialData.pairs.map((pair, i) => (
                          <div
                            key={i}
                            className="h-11 border-2 border-pink-400 bg-white rounded-2xl flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
                          >
                            {pair}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. ชุดกัน */}
                  {calcResults.specialData.guards && calcResults.specialData.guards.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-2">
                        <span>🍀</span>
                        <span>ชุดกัน</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {calcResults.specialData.guards.map((guard, i) => (
                          <div
                            key={i}
                            className="w-14 h-11 border-2 border-pink-400 bg-white rounded-2xl flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
                          >
                            {guard}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Specialized Output for PREMIUM Lao 16% Formula */}
              {calcResults.special === 'lao16' && calcResults.specialData && (
                <div className="space-y-4 text-left">
                  {/* เลขวิน */}
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 block mb-1.5">🇱🇦 เลขวินวิเคราะห์หวยลาว</span>
                    <div className="flex flex-wrap gap-2">
                      {calcResults.specialData.winNumbers?.map((num, i) => (
                        <span key={i} className="w-10 h-10 border-2 border-pink-200 bg-white rounded-xl flex items-center justify-center font-mono text-base font-black text-pink-500 shadow-sm">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* จับคู่สองตัว */}
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 block mb-1.5">🎯 จับคู่เลขเด็ดสองตัวตรง-โต๊ด</span>
                    <div className="grid grid-cols-4 gap-2">
                      {calcResults.specialData.pairs?.map((pair, i) => (
                        <span key={i} className="py-1.5 border border-pink-100 bg-white rounded-lg text-center font-mono text-xs font-bold text-slate-700">
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ชุดสามตัว */}
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 block mb-1.5">⭐ ชุดสามตัวมั่งมีทวีโชค</span>
                    <div className="grid grid-cols-2 gap-2">
                      {calcResults.specialData.threeDigitSets?.map((set, i) => (
                        <span key={i} className="py-2 border border-pink-200 bg-white rounded-xl text-center font-mono text-sm font-black text-pink-500 shadow-sm">
                          {set}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Standard Circular Result Output */}
              {!calcResults.special && (
                <div className="space-y-4">
                  {/* รูดเด่น */}
                  {calcResults.specialData?.roots && calcResults.specialData.roots.length > 0 && (
                    <div className="flex flex-col items-center justify-center pb-3 border-b border-pink-100/50">
                      <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-1.5">
                        <span>✨ รูดเด่น</span>
                      </div>
                      <div className="flex gap-2.5">
                        {calcResults.specialData.roots.map((num, i) => (
                          <div
                            key={i}
                            className="w-11 h-11 border-2 border-pink-400 bg-white rounded-full flex items-center justify-center font-sans text-sm font-extrabold text-slate-800 shadow-sm hover:scale-105 transition-all duration-200 cursor-default animate-pulse"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* เลขเด่นหลัก */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-pink-600 font-extrabold text-xs mb-1.5">
                      <span>🎯 ชุดเลขเด่น</span>
                    </div>
                    <div className="flex justify-center flex-wrap gap-3.5 my-1">
                      {calcResults.numbers.map((num, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 bg-white border-2 border-pink-200 rounded-full flex items-center justify-center font-mono text-2xl font-black text-pink-500 shadow-sm hover:scale-105 transition-all duration-300 cursor-default"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    *ประมวลผลตามอัลกอริทึมพรีเมี่ยมพิเศษเฉพาะดวงชะตา เรียบร้อยแล้วค่ะ 🔮
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Column 2: Winning Grid (วินเลขเด็ด) */}
        <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-md shadow-pink-100/35 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid className="w-4.5 h-4.5 text-pink-400" />
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">จับคู่วินเลขเด่น (สูตรวินเลข) 🍭</h3>
              </div>
              {matrixNumbers.length > 0 && (
                <button
                  onClick={clearMatrix}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  ล้างค่าน้า 🧹
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mb-4 font-medium leading-relaxed">
              เลือกปุ่มตัวเลขด้านล่างที่ชอบ (อย่างน้อย {matrixLength} ตัว) เพื่อให้ระบบทำการผสมเลข 2 ตัว หรือ 3 ตัว เพื่อลดขั้นตอนในการคำนวณและประหยัดเวลาค่ะ 🍉
            </p>

            {/* Matrix length selectors */}
            <div className="flex gap-2.5 mb-5">
              <button
                onClick={() => handleToggleMatrixLength(2)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                  matrixLength === 2
                    ? 'bg-rose-50 border-pink-300 text-pink-500 shadow-sm'
                    : 'bg-slate-50/50 border-pink-100/40 text-slate-400'
                }`}
              >
                วินคู่เลข 2 ตัว 🌸
              </button>
              <button
                onClick={() => handleToggleMatrixLength(3)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                  matrixLength === 3
                    ? 'bg-rose-50 border-pink-300 text-pink-500 shadow-sm'
                    : 'bg-slate-50/50 border-pink-100/40 text-slate-400'
                }`}
              >
                วินคู่เลข 3 ตัว 🔮
              </button>
            </div>

            {/* Numeric keypad 0-9 */}
            <div className="grid grid-cols-5 gap-2.5 mb-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                const isSelected = matrixNumbers.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => handleToggleMatrixNumber(num)}
                    className={`h-11 rounded-2xl font-mono text-base font-extrabold transition-all cursor-pointer flex items-center justify-center hover:scale-105 duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-100 scale-95'
                        : 'bg-slate-50 text-slate-500 border border-pink-50 hover:bg-pink-50/40'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Selected preview */}
            <div className="bg-rose-50/40 rounded-2xl p-3 border border-pink-100/50 mb-5 flex items-center gap-2 animate-pulse">
              <span className="text-[11px] font-extrabold text-pink-500 uppercase tracking-wider">
                คลังเลขที่เลือก:
              </span>
              <div className="flex flex-wrap gap-1">
                {matrixNumbers.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-medium">กดเลือกตัวเลขด้านบนได้เลยน้า</span>
                ) : (
                  matrixNumbers.sort().map((num) => (
                    <span
                      key={num}
                      className="px-2.5 py-0.5 bg-white text-pink-500 border border-pink-200 rounded-full font-mono text-xs font-bold shadow-sm"
                    >
                      {num}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Combinations Output */}
          {matrixResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50/30 border border-pink-100 rounded-2xl mt-3"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-600 font-bold">
                  จับคู่ได้ทั้งหมด <strong className="text-pink-500 text-sm font-extrabold">{matrixResults.length}</strong> ชุดน้า 🍀
                </span>
                <button
                  onClick={() => handleSaveCalculation('matrix')}
                  className="flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกชุดเด็ด
                </button>
              </div>

              {/* Scroller list */}
              <div className="max-h-44 overflow-y-auto pr-1 flex flex-wrap gap-2">
                {matrixResults.map((code, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white border border-pink-100 hover:border-pink-300 text-pink-500 font-mono text-xs font-bold rounded-xl shadow-sm transition-all cursor-default select-none"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 4. PREMIUM PAYMENT MODAL DIALOG */}
      {isPremiumModalOpen && (() => {
        const activeQr = getQrConfig();
        const isCustom = activeQr.amount !== 199 && activeQr.amount !== 189;
        const monthlyPrice = isCustom ? activeQr.amount : 189;
        const amountToPay = subPeriod === 'daily' ? 19 : subPeriod === 'weekly' ? 59 : monthlyPrice;
        const periodLabel = subPeriod === 'daily' ? 'รายวัน (1 วัน)' : subPeriod === 'weekly' ? 'รายอาทิตย์ (7 วัน)' : 'รายเดือน (30 วัน)';
        const displayQrText = isCustom 
          ? activeQr.qrText 
          : `โอนเงิน ${amountToPay}.- บาท เพื่อสมัครแพ็กเกจ ${periodLabel}`;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white border-4 border-pink-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4.5 shadow-2xl relative overflow-hidden"
            >
              {/* Close button (only show when not analyzing) */}
              {modalStep !== 'analyzing' && (
                <button
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-pink-500 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Step 1: Displaying the Dynamic Payment QR Code */}
              {modalStep === 'scan' && (
                <>
                  {/* Premium Icon Header */}
                  <div className="mx-auto w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse">
                    <Crown className="w-7 h-7" />
                  </div>

                  {/* Modal Title */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800">อัปเกรดเซียนหวย VIP 👑</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wide">
                      เลือกแพ็กเกจความคุ้มค่าที่ใช่สำหรับคุณนะคะ ✨
                    </p>
                  </div>

                  {/* Package Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-rose-50/50 border border-pink-100/45 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { playPopSound(); setSubPeriod('daily'); }}
                      className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        subPeriod === 'daily'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                          : 'text-slate-500 hover:text-pink-400'
                      }`}
                    >
                      <span>รายวัน 19.-</span>
                      <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 1 วัน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playPopSound(); setSubPeriod('weekly'); }}
                      className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        subPeriod === 'weekly'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                          : 'text-slate-500 hover:text-pink-400'
                      }`}
                    >
                      <span>รายอาทิตย์ 59.-</span>
                      <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 7 วัน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playPopSound(); setSubPeriod('monthly'); }}
                      className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        subPeriod === 'monthly'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                          : 'text-slate-500 hover:text-pink-400'
                      }`}
                    >
                      <span>รายเดือน 189.-</span>
                      <span className="text-[7px] opacity-85 font-bold mt-0.5">ใช้งาน 30 วัน</span>
                    </button>
                  </div>

                  {/* Payment Details Info */}
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
                    ยอดชำระ: <span className="text-pink-500 font-black text-xs">{amountToPay} บาท</span> สำหรับ <span className="text-pink-500 font-black">{periodLabel}</span>
                  </p>

                  {/* PromptPay Number Display (No QR Code) */}
                  <div className="bg-rose-50/45 border border-pink-100 p-5 rounded-3xl max-w-[240px] mx-auto space-y-3 shadow-inner">
                    <div className="bg-[#002B66] text-white py-1 px-3 rounded-lg text-[8px] font-black tracking-wider uppercase inline-block mx-auto">
                      PromptPay 💳 พร้อมเพย์
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">เบอร์โทรศัพท์พร้อมเพย์</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeQr.promptPayNumber);
                          alert('📋 คัดลอกเบอร์พร้อมเพย์ ' + activeQr.promptPayNumber + ' เรียบร้อยแล้วค่ะ! คุณสามารถนำไปใช้วางในแอปธนาคารเพื่อโอนเงินได้ทันทีเลยน้า 💕');
                        }}
                        className="w-full text-sm font-black text-slate-800 tracking-wider font-mono bg-white border-2 border-dashed border-pink-200 hover:border-pink-400 py-1.5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:bg-rose-50/20 active:scale-95"
                        title="คลิกเพื่อคัดลอกเบอร์โทรศัพท์"
                      >
                        <span>{activeQr.promptPayNumber}</span>
                        <span className="text-[9px] bg-pink-100 text-pink-500 font-extrabold px-1.5 py-0.5 rounded-lg">คัดลอก 📋</span>
                      </button>
                    </div>

                    <div className="text-center text-[10px] border-t border-dashed border-slate-200 pt-2 space-y-0.5 font-bold text-slate-500">
                      <p>ชื่อบัญชี: <span className="text-slate-700">{activeQr.accountName}</span></p>
                    </div>
                  </div>

                  <p className="text-[10px] text-pink-500 font-bold">โอนเงินด้วยเบอร์พร้อมเพย์ด้านบนตามยอดเพื่ออัปเกรดพรีเมี่ยมได้เลยค่ะ</p>

                  <div className="space-y-2">
                    <button
                      onClick={() => setModalStep('upload')}
                      className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-pink-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      ฉันโอนเงินและได้สลิปแล้ว 📂
                    </button>
                    <button
                      onClick={() => setIsPremiumModalOpen(false)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      ไว้คราวหลังนะคะ 🥺
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Upload Payment Slip Section */}
              {modalStep === 'upload' && (
                <>
                  <div className="mx-auto w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800">ส่งรูปภาพสลิปเพื่อยืนยัน 📂</h3>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                      ระบบใช้<b>เทคโนโลยีตรวจจับสลิปปลอมอัตโนมัติ</b> <br/>
                      <span className="text-rose-500">การส่งสลิปปลอม/สลิปตัดต่อ จะถูกบล็อกบัญชีถาวรทันทีค่ะ 🚫</span>
                    </p>
                  </div>

                  {/* Transfer Date and Time Input Section */}
                  <div className="grid grid-cols-2 gap-3 text-left bg-rose-50/20 p-3.5 border border-pink-50 rounded-2xl">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">
                        วันที่โอนเงิน 📅
                      </label>
                      <input 
                        type="date"
                        value={transferDate}
                        onChange={(e) => { playPopSound(); setTransferDate(e.target.value); }}
                        className="w-full px-2.5 py-1.5 bg-white border border-pink-100 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">
                        เวลาที่โอนเงิน ⏰
                      </label>
                      <input 
                        type="time"
                        value={transferTime}
                        onChange={(e) => { playPopSound(); setTransferTime(e.target.value); }}
                        className="w-full px-2.5 py-1.5 bg-white border border-pink-100 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Drag and Drop Box Area */}
                  <div className="border-2 border-dashed border-pink-200 hover:border-pink-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center space-y-2 relative transition-all">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const name = file.name.toLowerCase();
                          const isFakeName = name.includes('fake') || name.includes('crop') || name.includes('edit') || name.includes('modified');
                          
                          if (isFakeName) {
                            startSimulatedScan('fake', file.name);
                            return;
                          }

                          // Check if slip with the exact same name has already been used on the server
                          try {
                            const res = await fetch('/api/premium-purchases');
                            if (res.ok) {
                              const purchases = await res.json();
                              const isDuplicate = purchases.some((p: any) => 
                                p.fileName === file.name && (p.status === 'success' || p.status === 'code_success')
                              );

                              if (isDuplicate) {
                                // Trigger scan and fail due to duplicate
                                setModalStep('analyzing');
                                setSelectedSimType('fake');
                                setUploadedFileName(file.name);
                                setAnalyzingProgress(0);
                                setAnalyzingStatus('กำลังตรวจวิเคราะห์ลายนิ้วมือสลิปและเลขอ้างอิงทำธุรกรรม...');
                                
                                let progress = 0;
                                const interval = setInterval(() => {
                                  progress += 20;
                                  setAnalyzingProgress(progress);
                                  if (progress === 40) {
                                    setAnalyzingStatus('กำลังดึงเลขอ้างอิงธนาคาร (Transaction ID) เพื่อตรวจสอบความซ้ำซ้อน...');
                                  } else if (progress === 80) {
                                    setAnalyzingStatus('❌ ตรวจพบคีย์อ้างอิงธุรกรรมนี้ถูกใช้งานเปิดพรีเมี่ยมไปแล้ว!');
                                  }
                                  
                                  if (progress >= 100) {
                                    clearInterval(interval);
                                    setTimeout(() => {
                                      playErrorSound();
                                      setIsPremiumModalOpen(false);
                                      alert('❌ ขออภัยค่ะ! สลิปโอนเงินใบนี้ (เลขอ้างอิงทำธุรกรรมนี้) ได้ถูกใช้งานเพื่อเปิดพรีเมี่ยมในระบบไปเรียบร้อยแล้วค่ะ ไม่สามารถนำมาใช้ซ้ำได้อีกนะคะ หากมีข้อสงสัยกรุณาติดต่อแอดมินนะคะ 💖');
                                    }, 600);
                                  }
                                }, 250);
                                return;
                              }
                            }
                          } catch (err) {
                            console.error('Error verifying duplicate slip:', err);
                          }

                          startSimulatedScan('real', file.name, file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="w-8 h-8 text-pink-300" />
                    <p className="text-[10px] font-bold text-slate-500">กดเพื่ออัปโหลดไฟล์ภาพสลิปจริง</p>
                    <p className="text-[8px] text-slate-400">รองรับนามสกุล .png, .jpg (สูงสุด 5MB)</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalStep('scan')}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      ย้อนกลับ 👈
                    </button>
                    <button
                      onClick={() => setIsPremiumModalOpen(false)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 text-slate-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      ยกเลิก ❌
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Slip Scanning Progress Screen */}
              {modalStep === 'analyzing' && (
                <div className="py-6 space-y-5">
                  {/* Scanner Radar Effect */}
                  <div className="relative mx-auto w-20 h-20 rounded-full border-4 border-pink-100 flex items-center justify-center overflow-hidden bg-rose-50">
                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-md shadow-pink-400/50 animate-bounce" style={{ animationDuration: '1.2s' }} />
                  </div>

                  {/* Dynamic Status */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-800">ระบบ AI กำลังวิเคราะห์สลิป...</h3>
                    <p className="text-[10px] text-pink-500 font-bold h-7 flex items-center justify-center leading-relaxed">
                      {analyzingStatus}
                    </p>
                  </div>

                  {/* Linear Progress bar */}
                  <div className="space-y-1 max-w-[240px] mx-auto">
                    <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${analyzingProgress}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 block text-right">
                      {analyzingProgress}% ประมวลผลสำเร็จ
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
