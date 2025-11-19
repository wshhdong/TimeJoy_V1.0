
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Replaced static Enum with dynamic configuration interface
export interface MoodOption {
  id: string;
  label: string;
  value: number; // 1-10 scale for backend calculation if needed, or just order
  icon: 'smile' | 'meh' | 'frown' | 'angry' | 'excited' | 'tired'; 
  color: string; // Tailwind color name prefix (e.g., 'green', 'red')
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface WorkType {
  id: string;
  label: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  workTypeId: string;
  moodId: string; // Links to MoodOption.id
  comment?: string;
}

export interface AppState {
  user: User | null;
  users: User[];
  workTypes: WorkType[];
  moodOptions: MoodOption[];
  entries: TimeEntry[];
}
