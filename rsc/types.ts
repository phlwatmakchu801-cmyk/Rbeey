export type LotteryType = 'thai' | 'lao' | 'hanoi' | 'yiki' | 'stock';

export interface SavedCalculation {
  id: string;
  userId: string;
  type: LotteryType;
  title: string;
  formulaName: string;
  generatedNumbers: string[];
  notes?: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  birthDay?: string; // e.g., 'monday', 'tuesday', etc. for lucky birthday number
}

export interface Formula {
  id: string;
  name: string;
  description: string;
  category: LotteryType;
  type: '2digit' | '3digit' | 'ruay';
}

export interface HistoryDraw {
  drawDate: string;
  top3: string;
  bottom2: string;
  top2: string;
}
