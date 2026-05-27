export interface DailyTask {
  id: string;
  text: string;
  done: boolean;
}

export interface DailyLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: string; // 😀 | 🙂 | 😐 | 😢 | 😡
  diary: string;
  score: number; // 0-100
  goodThings: string[]; // up to 3
  difficultThings: string;
  tomorrowMemo: string;
  dailyQuestion?: string;
  dailyAnswer?: string;
  photos: string[];
  tasks?: DailyTask[];
  createdAt: number;
}

export interface DaySchedule {
  id?: string;
  userId: string; // to keep it separate per user
  date: string; // YYYY-MM-DD
  periods: string[];
  events: string[];
}

export interface WeekCheck {
  id?: string;
  userId: string;
  weekStartDate: string; // YYYY-MM-DD of Monday
  checks: Record<string, boolean>; // e.g. "朝決まった時間に起きた": true
}

export interface SemesterGoal {
  id?: string;
  userId: string;
  semesterId: string; // e.g. "2026-1"
  category: string; // 勉強, 生活, 人間関係, 部活, チャレンジ
  goal: string;
  evaluation: string; // text or 1-5
  comment: string;
}
