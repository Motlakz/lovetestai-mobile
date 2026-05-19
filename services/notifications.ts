import { loadNotifPrefs, persistNotifPrefs, getDailyPromptLock, setDailyPromptLock } from '@/services/db';
import { syncPushReminderSchedule } from '@/services/pushNotifications';

export type NotifFrequency = 'daily' | '3x_week' | 'weekly' | 'monthly';

export interface NotifPrefs {
  enabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  hour: number;
  minute: number;
  frequency: NotifFrequency;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  enabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  hour: 9,
  minute: 0,
  frequency: 'daily',
};

export const NOTIF_TIME_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '7:00 PM', hour: 19, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

// Richer grid of slots for a calendar-style picker, grouped by period.
export const NOTIF_TIME_GRID: { label: string; hour: number; minute: number; period: 'morning' | 'afternoon' | 'evening' | 'night' }[] = [
  // Morning
  { label: '5:00 AM',  hour: 5,  minute: 0,  period: 'morning' },
  { label: '5:30 AM',  hour: 5,  minute: 30, period: 'morning' },
  { label: '6:00 AM',  hour: 6,  minute: 0,  period: 'morning' },
  { label: '6:30 AM',  hour: 6,  minute: 30, period: 'morning' },
  { label: '7:00 AM',  hour: 7,  minute: 0,  period: 'morning' },
  { label: '7:30 AM',  hour: 7,  minute: 30, period: 'morning' },
  { label: '8:00 AM',  hour: 8,  minute: 0,  period: 'morning' },
  { label: '8:30 AM',  hour: 8,  minute: 30, period: 'morning' },
  { label: '9:00 AM',  hour: 9,  minute: 0,  period: 'morning' },
  { label: '9:30 AM',  hour: 9,  minute: 30, period: 'morning' },
  { label: '10:00 AM', hour: 10, minute: 0,  period: 'morning' },
  { label: '10:30 AM', hour: 10, minute: 30, period: 'morning' },
  { label: '11:00 AM', hour: 11, minute: 0,  period: 'morning' },
  { label: '11:30 AM', hour: 11, minute: 30, period: 'morning' },
  // Afternoon
  { label: '12:00 PM', hour: 12, minute: 0,  period: 'afternoon' },
  { label: '12:30 PM', hour: 12, minute: 30, period: 'afternoon' },
  { label: '1:00 PM',  hour: 13, minute: 0,  period: 'afternoon' },
  { label: '1:30 PM',  hour: 13, minute: 30, period: 'afternoon' },
  { label: '2:00 PM',  hour: 14, minute: 0,  period: 'afternoon' },
  { label: '2:30 PM',  hour: 14, minute: 30, period: 'afternoon' },
  { label: '3:00 PM',  hour: 15, minute: 0,  period: 'afternoon' },
  { label: '3:30 PM',  hour: 15, minute: 30, period: 'afternoon' },
  { label: '4:00 PM',  hour: 16, minute: 0,  period: 'afternoon' },
  { label: '4:30 PM',  hour: 16, minute: 30, period: 'afternoon' },
  // Evening
  { label: '5:00 PM',  hour: 17, minute: 0,  period: 'evening' },
  { label: '5:30 PM',  hour: 17, minute: 30, period: 'evening' },
  { label: '6:00 PM',  hour: 18, minute: 0,  period: 'evening' },
  { label: '6:30 PM',  hour: 18, minute: 30, period: 'evening' },
  { label: '7:00 PM',  hour: 19, minute: 0,  period: 'evening' },
  { label: '7:30 PM',  hour: 19, minute: 30, period: 'evening' },
  { label: '8:00 PM',  hour: 20, minute: 0,  period: 'evening' },
  { label: '8:30 PM',  hour: 20, minute: 30, period: 'evening' },
  // Night
  { label: '9:00 PM',  hour: 21, minute: 0,  period: 'night' },
  { label: '9:30 PM',  hour: 21, minute: 30, period: 'night' },
  { label: '10:00 PM', hour: 22, minute: 0,  period: 'night' },
  { label: '10:30 PM', hour: 22, minute: 30, period: 'night' },
  { label: '11:00 PM', hour: 23, minute: 0,  period: 'night' },
  { label: '11:30 PM', hour: 23, minute: 30, period: 'night' },
  { label: '12:00 AM', hour: 0,  minute: 0,  period: 'night' },
  { label: '1:00 AM',  hour: 1,  minute: 0,  period: 'night' },
  { label: '2:00 AM',  hour: 2,  minute: 0,  period: 'night' },
  { label: '3:00 AM',  hour: 3,  minute: 0,  period: 'night' },
  { label: '4:00 AM',  hour: 4,  minute: 0,  period: 'night' },
];

export const NOTIF_FREQUENCY_OPTIONS: { value: NotifFrequency; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: '3x_week', label: '3x a week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isFrequencyDay(frequency: NotifFrequency, date: Date): boolean {
  if (frequency === 'daily') return true;
  if (frequency === '3x_week') {
    const dow = date.getDay();
    return dow === 1 || dow === 3 || dow === 5; // Mon/Wed/Fri
  }
  if (frequency === 'weekly') return date.getDay() === 0; // Sundays
  if (frequency === 'monthly') return date.getDate() === 1;
  return false;
}

export async function loadPrefs(): Promise<NotifPrefs> {
  const stored = await loadNotifPrefs();
  if (!stored) return DEFAULT_NOTIF_PREFS;
  const enabled = stored.enabled ?? DEFAULT_NOTIF_PREFS.enabled;
  return {
    ...DEFAULT_NOTIF_PREFS,
    ...stored,
    enabled,
    pushEnabled: stored.pushEnabled ?? enabled,
    inAppEnabled: stored.inAppEnabled ?? enabled,
  };
}

export async function savePrefs(prefs: NotifPrefs): Promise<void> {
  const next = {
    ...prefs,
    enabled: prefs.pushEnabled || prefs.inAppEnabled,
  };
  await persistNotifPrefs(next);
  await syncPushReminderSchedule(next);
}

/**
 * Decide whether to fire today's prompt right now and, if so, claim the daily slot.
 * Returns true at most once per local day, only when the user is opted in,
 * the current frequency matches today, and the local time is at or past the preferred hour:minute.
 */
export async function claimDailyPromptSlot(): Promise<boolean> {
  const prefs = await loadPrefs();
  if (!prefs.enabled || !prefs.inAppEnabled) return false;

  const now = new Date();
  if (!isFrequencyDay(prefs.frequency, now)) return false;

  const scheduled = new Date(now);
  scheduled.setHours(prefs.hour, prefs.minute, 0, 0);
  if (now.getTime() < scheduled.getTime()) return false;

  const last = await getDailyPromptLock();
  const key = todayKey();
  if (last === key) return false;

  await setDailyPromptLock(key);
  return true;
}
