import { Platform } from 'react-native';
import { trackEvent } from '@/services/analytics';

interface PushReminderPrefs {
  pushEnabled: boolean;
  hour: number;
  minute: number;
  frequency: 'daily' | '3x_week' | 'weekly' | 'monthly';
}

type NotifyKitLoaded = {
  notifyKit: {
    createChannels: (channels: any[]) => Promise<unknown>;
    requestPermission: () => Promise<{ authorizationStatus: number }>;
    createTriggerNotification: (notification: any, trigger: any) => Promise<string>;
    cancelTriggerNotification: (notificationId: string) => Promise<unknown>;
    cancelNotification: (notificationId: string) => Promise<unknown>;
  };
  AndroidImportance: { DEFAULT: number; HIGH: number };
  TriggerType: { TIMESTAMP: number };
  RepeatFrequency: { DAILY: number; WEEKLY: number };
};

const CHANNEL_IDS = {
  DAILY_PROMPTS: 'daily_prompts',
};

const DAILY_PROMPT_NOTIFICATION_IDS = [
  'daily_prompt_daily',
  'daily_prompt_monday',
  'daily_prompt_wednesday',
  'daily_prompt_friday',
  'daily_prompt_weekly',
  'daily_prompt_monthly',
] as const;

let moduleCache: NotifyKitLoaded | null | undefined;
let channelsCreated = false;

function getNotifyKitModule(): NotifyKitLoaded | null {
  if (moduleCache !== undefined) return moduleCache;
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('react-native-notify-kit');
    const notifyKit = (mod.default ?? mod) as NotifyKitLoaded['notifyKit'];
    const { AndroidImportance, TriggerType, RepeatFrequency } = mod;
    if (!AndroidImportance || !TriggerType || !RepeatFrequency) {
      moduleCache = null;
      return moduleCache;
    }
    moduleCache = { notifyKit, AndroidImportance, TriggerType, RepeatFrequency };
    return moduleCache;
  } catch {
    moduleCache = null;
    return null;
  }
}

async function createNotificationChannels(): Promise<void> {
  if (channelsCreated || Platform.OS !== 'android') return;
  const module = getNotifyKitModule();
  if (!module) return;

  await module.notifyKit.createChannels([
    {
      id: CHANNEL_IDS.DAILY_PROMPTS,
      name: 'Daily prompts',
      description: 'Daily prompt reminders from Love Test AI',
      importance: module.AndroidImportance.HIGH,
      sound: 'default',
    },
  ]);
  channelsCreated = true;
}

export async function ensurePushNotificationPermission(): Promise<boolean> {
  try {
    const module = getNotifyKitModule();
    if (!module) {
      trackEvent('push_permission_unavailable', { provider: 'react-native-notify-kit', reason: 'module_missing' });
      return false;
    }

    await createNotificationChannels();
    const settings = await module.notifyKit.requestPermission();
    const granted = settings.authorizationStatus > 0;
    trackEvent('push_permission_result', { provider: 'react-native-notify-kit', granted });
    return granted;
  } catch (e: any) {
    trackEvent('push_permission_failed', { provider: 'react-native-notify-kit', error_code: e?.code ?? 'unknown' });
    return false;
  }
}

async function cancelDailyPromptReminders(): Promise<void> {
  const module = getNotifyKitModule();
  if (!module) return;
  await Promise.all(DAILY_PROMPT_NOTIFICATION_IDS.map(async (id) => {
    await module.notifyKit.cancelTriggerNotification(id).catch(() => undefined);
    await module.notifyKit.cancelNotification(id).catch(() => undefined);
  }));
}

function nextDateForWeekday(targetDay: number, hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  const daysUntilTarget = (targetDay + 7 - next.getDay()) % 7;
  next.setDate(next.getDate() + daysUntilTarget);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

function nextDateForMonthly(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), 1, hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

async function scheduleReminder(id: string, date: Date, repeatFrequency?: number): Promise<void> {
  const module = getNotifyKitModule();
  if (!module) return;
  await module.notifyKit.createTriggerNotification(
    {
      id,
      title: "Today's love prompt is ready",
      body: 'Open Love Test AI to reflect on a fresh daily prompt.',
      data: { type: 'daily_prompt', route: '/(tabs)/daily' },
      android: {
        channelId: CHANNEL_IDS.DAILY_PROMPTS,
        importance: module.AndroidImportance.HIGH,
        sound: 'default',
        pressAction: { id: 'default' },
      },
      ios: { sound: 'default' },
    },
    {
      type: module.TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      ...(repeatFrequency ? { repeatFrequency } : {}),
    },
  );
}

export async function syncPushReminderSchedule(prefs: PushReminderPrefs): Promise<void> {
  await cancelDailyPromptReminders();
  if (!prefs.pushEnabled) return;

  const granted = await ensurePushNotificationPermission();
  if (!granted) return;

  const module = getNotifyKitModule();
  if (!module) return;

  if (prefs.frequency === 'daily') {
    await scheduleReminder('daily_prompt_daily', nextDateForWeekday(new Date().getDay(), prefs.hour, prefs.minute), module.RepeatFrequency.DAILY);
    return;
  }

  if (prefs.frequency === '3x_week') {
    await Promise.all([
      scheduleReminder('daily_prompt_monday', nextDateForWeekday(1, prefs.hour, prefs.minute), module.RepeatFrequency.WEEKLY),
      scheduleReminder('daily_prompt_wednesday', nextDateForWeekday(3, prefs.hour, prefs.minute), module.RepeatFrequency.WEEKLY),
      scheduleReminder('daily_prompt_friday', nextDateForWeekday(5, prefs.hour, prefs.minute), module.RepeatFrequency.WEEKLY),
    ]);
    return;
  }

  if (prefs.frequency === 'weekly') {
    await scheduleReminder('daily_prompt_weekly', nextDateForWeekday(0, prefs.hour, prefs.minute), module.RepeatFrequency.WEEKLY);
    return;
  }

  await scheduleReminder('daily_prompt_monthly', nextDateForMonthly(prefs.hour, prefs.minute));
}
