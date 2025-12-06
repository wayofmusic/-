export interface Lap {
  id: string;
  time: number; // Duration of the lap in milliseconds
  splitTime: number; // Total time when lap was recorded
  lapNumber: number;
}

export enum WorkoutType {
  RUNNING = '跑步',
  CYCLING = '骑行',
  HIIT = '高强度间歇',
  PLANK = '平板支撑',
  YOGA = '瑜伽',
  MEDITATION = '冥想',
  OTHER = '其他',
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  type: WorkoutType;
  totalTime: number; // milliseconds
  laps: Lap[];
  notes?: string;
}

export interface AIAnalysisResult {
  summary: string;
  advice: string;
  encouragement: string;
}