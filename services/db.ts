import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Profile {
  name: string;
  relationshipStatus: string;
  dateOfBirth: string;
  intent: string;
}

export interface SavedCreation {
  id: string;
  type: string;
  content: string;
  toName: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  promptText: string;
  entry: string;
  date: string;
}

export interface SavedPrompt {
  id: string;
  text: string;
  savedAt: string;
}

export interface StreakData {
  streak: number;
  lastCompleted: string;
  completedDays: string[];
}

export interface AppSnapshot {
  onboardingComplete: boolean;
  profile: Profile;
  savedCreations: SavedCreation[];
  journalEntries: JournalEntry[];
  savedPrompts: SavedPrompt[];
  streak: StreakData;
  completedTests: number;
}

export interface AuthAccount {
  accountId: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: 'google' | 'anonymous' | 'guest' | string;
  createdAt: string;
  deviceId?: string;
}

const EMPTY_PROFILE: Profile = { name: '', relationshipStatus: '', dateOfBirth: '', intent: '' };
const EMPTY_STREAK: StreakData = { streak: 0, lastCompleted: '', completedDays: [] };

const USE_SQLITE = Platform.OS !== 'web';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('lovetest.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS creations (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          to_name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS journal (
          id TEXT PRIMARY KEY NOT NULL,
          prompt_text TEXT NOT NULL,
          entry TEXT NOT NULL,
          date TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          saved_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_journal_date ON journal(date DESC);
        CREATE INDEX IF NOT EXISTS idx_prompts_saved_at ON prompts(saved_at DESC);
      `);
      await migrateFromAsyncStorage(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrateFromAsyncStorage(db: SQLite.SQLiteDatabase) {
  const flag = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    'migrated_v1'
  );
  if (flag) return;

  try {
    const keys = ['onboarding_complete', 'profile', 'saved_creations', 'journal_entries', 'streak_data', 'saved_prompts', 'completed_tests'];
    const pairs = await AsyncStorage.multiGet(keys);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    if (map.onboarding_complete) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'onboarding_complete', map.onboarding_complete);
    }
    if (map.profile) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'profile', map.profile);
    }
    if (map.streak_data) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'streak_data', map.streak_data);
    }
    if (map.completed_tests) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'completed_tests', map.completed_tests);
    }
    if (map.saved_creations) {
      const arr = JSON.parse(map.saved_creations) as SavedCreation[];
      for (const c of arr) {
        await db.runAsync(
          'INSERT OR REPLACE INTO creations (id, type, content, to_name, created_at) VALUES (?, ?, ?, ?, ?)',
          c.id, c.type, c.content, c.toName ?? '', c.createdAt
        );
      }
    }
    if (map.journal_entries) {
      const arr = JSON.parse(map.journal_entries) as JournalEntry[];
      for (const e of arr) {
        await db.runAsync(
          'INSERT OR REPLACE INTO journal (id, prompt_text, entry, date) VALUES (?, ?, ?, ?)',
          e.id, e.promptText, e.entry, e.date
        );
      }
    }
    if (map.saved_prompts) {
      const arr = JSON.parse(map.saved_prompts) as SavedPrompt[];
      for (const p of arr) {
        await db.runAsync(
          'INSERT OR REPLACE INTO prompts (id, text, saved_at) VALUES (?, ?, ?)',
          p.id, p.text, p.savedAt
        );
      }
    }
  } catch (e) {
    console.log('Legacy AsyncStorage migration failed (non-fatal):', e);
  }

  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'migrated_v1', '1');
}

async function getSetting<T>(key: string): Promise<T | null> {
  if (USE_SQLITE) {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      key
    );
    if (!row) return null;
    try { return JSON.parse(row.value) as T; } catch { return null; }
  }
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

async function setSetting<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      key, serialized
    );
    return;
  }
  await AsyncStorage.setItem(key, serialized);
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  if (USE_SQLITE) {
    const db = await getDb();
    const [obFlag, profStr, streakStr, testsStr, creationsRows, journalRows, promptsRows] = await Promise.all([
      db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'onboarding_complete'),
      db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'profile'),
      db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'streak_data'),
      db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'completed_tests'),
      db.getAllAsync<{ id: string; type: string; content: string; to_name: string; created_at: string }>(
        'SELECT id, type, content, to_name, created_at FROM creations ORDER BY created_at DESC'
      ),
      db.getAllAsync<{ id: string; prompt_text: string; entry: string; date: string }>(
        'SELECT id, prompt_text, entry, date FROM journal ORDER BY date DESC'
      ),
      db.getAllAsync<{ id: string; text: string; saved_at: string }>(
        'SELECT id, text, saved_at FROM prompts ORDER BY saved_at DESC'
      ),
    ]);

    return {
      onboardingComplete: obFlag ? JSON.parse(obFlag.value) === true : false,
      profile: profStr ? { ...EMPTY_PROFILE, ...JSON.parse(profStr.value) } : EMPTY_PROFILE,
      streak: streakStr ? JSON.parse(streakStr.value) : EMPTY_STREAK,
      completedTests: testsStr ? JSON.parse(testsStr.value) : 0,
      savedCreations: creationsRows.map(r => ({ id: r.id, type: r.type, content: r.content, toName: r.to_name, createdAt: r.created_at })),
      journalEntries: journalRows.map(r => ({ id: r.id, promptText: r.prompt_text, entry: r.entry, date: r.date })),
      savedPrompts: promptsRows.map(r => ({ id: r.id, text: r.text, savedAt: r.saved_at })),
    };
  }

  const [ob, prof, saved, journal, streak, prompts, tests] = await Promise.all([
    getSetting<boolean>('onboarding_complete'),
    getSetting<Profile>('profile'),
    getSetting<SavedCreation[]>('saved_creations'),
    getSetting<JournalEntry[]>('journal_entries'),
    getSetting<StreakData>('streak_data'),
    getSetting<SavedPrompt[]>('saved_prompts'),
    getSetting<number>('completed_tests'),
  ]);
  return {
    onboardingComplete: ob ?? false,
    profile: prof ? { ...EMPTY_PROFILE, ...prof } : EMPTY_PROFILE,
    savedCreations: saved ?? [],
    journalEntries: journal ?? [],
    savedPrompts: prompts ?? [],
    streak: streak ?? EMPTY_STREAK,
    completedTests: tests ?? 0,
  };
}

export async function persistOnboardingComplete(value: boolean): Promise<void> {
  await setSetting('onboarding_complete', value);
}

export async function persistProfile(profile: Profile): Promise<void> {
  await setSetting('profile', profile);
}

export async function persistStreak(streak: StreakData): Promise<void> {
  await setSetting('streak_data', streak);
}

export async function persistCompletedTests(count: number): Promise<void> {
  await setSetting('completed_tests', count);
}

export async function loadAuthAccount(): Promise<AuthAccount | null> {
  return getSetting<AuthAccount>('auth_account');
}

export async function persistAuthAccount(account: AuthAccount | null): Promise<void> {
  await setSetting('auth_account', account);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getSetting<string>('device_id');
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await setSetting('device_id', id);
  return id;
}

export interface PartnerLink {
  inviteCode: string;
  partnerCode: string | null;
  partnerLabel: string | null;
  pairedAt: string | null;
  pairId?: string | null;
  partnerUid?: string | null;
  partnerEmail?: string | null;
}

export async function loadPartnerLink(): Promise<PartnerLink | null> {
  return getSetting<PartnerLink>('partner_link');
}

export async function persistPartnerLink(link: PartnerLink | null): Promise<void> {
  await setSetting('partner_link', link);
}

export interface PersistedNotifPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
  frequency: 'daily' | '3x_week' | 'weekly' | 'monthly';
}

export async function loadNotifPrefs(): Promise<PersistedNotifPrefs | null> {
  return getSetting<PersistedNotifPrefs>('notif_prefs');
}

export async function persistNotifPrefs(prefs: PersistedNotifPrefs | null): Promise<void> {
  await setSetting('notif_prefs', prefs);
}

export async function getDailyPromptLock(): Promise<string | null> {
  return getSetting<string>('daily_prompt_lock');
}

export async function setDailyPromptLock(dateKey: string): Promise<void> {
  await setSetting('daily_prompt_lock', dateKey);
}

export async function insertCreation(c: SavedCreation): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO creations (id, type, content, to_name, created_at) VALUES (?, ?, ?, ?, ?)',
      c.id, c.type, c.content, c.toName ?? '', c.createdAt
    );
    return;
  }
  const cur = (await getSetting<SavedCreation[]>('saved_creations')) ?? [];
  await setSetting('saved_creations', [c, ...cur]);
}

export async function removeCreation(id: string): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync('DELETE FROM creations WHERE id = ?', id);
    return;
  }
  const cur = (await getSetting<SavedCreation[]>('saved_creations')) ?? [];
  await setSetting('saved_creations', cur.filter(c => c.id !== id));
}

export async function removeCreations(ids: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  if (USE_SQLITE) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const id of uniqueIds) {
        await db.runAsync('DELETE FROM creations WHERE id = ?', id);
      }
    });
    return;
  }

  const removeSet = new Set(uniqueIds);
  const cur = (await getSetting<SavedCreation[]>('saved_creations')) ?? [];
  await setSetting('saved_creations', cur.filter(c => !removeSet.has(c.id)));
}

export async function insertJournalEntry(e: JournalEntry): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO journal (id, prompt_text, entry, date) VALUES (?, ?, ?, ?)',
      e.id, e.promptText, e.entry, e.date
    );
    return;
  }
  const cur = (await getSetting<JournalEntry[]>('journal_entries')) ?? [];
  await setSetting('journal_entries', [e, ...cur]);
}

export async function removeJournalEntry(id: string): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync('DELETE FROM journal WHERE id = ?', id);
    return;
  }
  const cur = (await getSetting<JournalEntry[]>('journal_entries')) ?? [];
  await setSetting('journal_entries', cur.filter(e => e.id !== id));
}

export async function insertPrompt(p: SavedPrompt): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO prompts (id, text, saved_at) VALUES (?, ?, ?)',
      p.id, p.text, p.savedAt
    );
    return;
  }
  const cur = (await getSetting<SavedPrompt[]>('saved_prompts')) ?? [];
  await setSetting('saved_prompts', [p, ...cur]);
}

export async function removePrompt(id: string): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.runAsync('DELETE FROM prompts WHERE id = ?', id);
    return;
  }
  const cur = (await getSetting<SavedPrompt[]>('saved_prompts')) ?? [];
  await setSetting('saved_prompts', cur.filter(p => p.id !== id));
}

export async function clearAll(): Promise<void> {
  if (USE_SQLITE) {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM creations;
      DELETE FROM journal;
      DELETE FROM prompts;
      DELETE FROM settings WHERE key != 'migrated_v1';
    `);
    return;
  }
  await Promise.all([
    setSetting('onboarding_complete', false),
    setSetting('profile', EMPTY_PROFILE),
    setSetting('saved_creations', []),
    setSetting('journal_entries', []),
    setSetting('streak_data', EMPTY_STREAK),
    setSetting('saved_prompts', []),
    setSetting('completed_tests', 0),
  ]);
}

export { EMPTY_PROFILE, EMPTY_STREAK };
