import { create } from 'zustand';
import {
  clearInbox as dbClearInbox,
  insertInbox,
  listInbox,
  markAllInboxRead as dbMarkAllRead,
  markInboxRead,
  removeInbox,
  type InboxItem,
  type InboxKind,
} from '@/services/db';
import { trackCrud } from '@/services/analytics';
import { loadPrefs as loadNotifPrefs } from '@/services/notifications';
import { playUiSound } from '@/services/sounds';

interface InboxState {
  isLoading: boolean;
  items: InboxItem[];
  init: () => Promise<void>;
  push: (item: Omit<InboxItem, 'id' | 'createdAt' | 'read'> & { id?: string; read?: boolean }) => Promise<InboxItem>;
  markRead: (id: string, read?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

function isDuplicate(items: InboxItem[], next: { kind: InboxKind; title: string; body: string }): boolean {
  const now = Date.now();
  return items.some((it) => {
    if (it.kind !== next.kind || it.title !== next.title || it.body !== next.body) return false;
    const t = Date.parse(it.createdAt);
    return Number.isFinite(t) && now - t < DUPLICATE_WINDOW_MS;
  });
}

export const useInboxStore = create<InboxState>((set, get) => ({
  isLoading: true,
  items: [],

  init: async () => {
    try {
      const items = await listInbox();
      trackCrud('inbox_item', 'read', { count: items.length });
      set({ items, isLoading: false });
    } catch (e) {
      console.log('Inbox init failed:', e);
      set({ isLoading: false });
    }
  },

  push: async (input) => {
    const item: InboxItem = {
      id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: input.kind,
      title: input.title,
      body: input.body,
      icon: input.icon ?? null,
      route: input.route ?? null,
      read: input.read ?? false,
      createdAt: new Date().toISOString(),
    };
    if (isDuplicate(get().items, item)) {
      return item;
    }
    set({ items: [item, ...get().items] });
    trackCrud('inbox_item', 'create', { kind: item.kind });
    void loadNotifPrefs()
      .then((prefs) => {
        if (prefs.enabled && prefs.soundEnabled) void playUiSound('messagePing');
      })
      .catch(() => undefined);
    try {
      await insertInbox(item);
    } catch (e) {
      console.log('Inbox persist failed:', e);
    }
    return item;
  },

  markRead: async (id, read = true) => {
    set({ items: get().items.map(i => i.id === id ? { ...i, read } : i) });
    trackCrud('inbox_item', 'update', { field: 'read', read });
    try { await markInboxRead(id, read); } catch (e) { console.log('Inbox mark read failed:', e); }
  },

  markAllRead: async () => {
    set({ items: get().items.map(i => ({ ...i, read: true })) });
    trackCrud('inbox_item', 'update', { field: 'read_all' });
    try { await dbMarkAllRead(); } catch (e) { console.log('Inbox mark all read failed:', e); }
  },

  remove: async (id) => {
    set({ items: get().items.filter(i => i.id !== id) });
    trackCrud('inbox_item', 'delete');
    try { await removeInbox(id); } catch (e) { console.log('Inbox remove failed:', e); }
  },

  clear: async () => {
    set({ items: [] });
    trackCrud('inbox_item', 'clear');
    try { await dbClearInbox(); } catch (e) { console.log('Inbox clear failed:', e); }
  },
}));

export function unreadCount(items: InboxItem[]): number {
  return items.reduce((n, i) => n + (i.read ? 0 : 1), 0);
}
