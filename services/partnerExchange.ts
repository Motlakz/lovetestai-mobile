import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  limit as fsLimit,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import type { AuthAccount } from '@/store/authStore';
import { decryptText, derivePairKey, encryptText, isEncrypted } from '@/services/encryption';
import { usePartnerStore } from '@/store/partnerStore';
import { useAuthStore } from '@/store/authStore';
import { useInboxStore } from '@/store/inboxStore';
import { trackCrud, trackShare } from '@/services/analytics';

export type ExchangeResponse = {
  displayName?: string | null;
  text?: string;
};

export type PartnerExchange = {
  promptText?: string;
  promptCategory?: string | null;
  promptSharedBy?: string;
  responses?: Record<string, ExchangeResponse>;
};

export function todayExchangeKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function exchangeRef(pairId: string, exchangeId: string) {
  if (!firestore) throw new Error('Firebase is not configured.');
  return doc(firestore, 'pairs', pairId, 'exchanges', exchangeId);
}

async function pairKey(pairId: string): Promise<Uint8Array> {
  const link = usePartnerStore.getState().link;
  return derivePairKey(pairId, link?.inviteCode ?? null, link?.partnerCode ?? null);
}

async function encryptIfPossible(pairId: string, plaintext: string): Promise<string> {
  const key = await pairKey(pairId);
  return await encryptText(plaintext, key);
}

async function decryptIfNeeded(pairId: string, value: string | undefined): Promise<string | undefined> {
  if (!value) return value;
  if (!isEncrypted(value)) return value;
  try {
    const key = await pairKey(pairId);
    const plain = await decryptText(value, key);
    return plain ?? value;
  } catch {
    return value;
  }
}

export async function decryptExchange(pairId: string, raw: PartnerExchange | null): Promise<PartnerExchange | null> {
  if (!raw) return null;
  const promptText = await decryptIfNeeded(pairId, raw.promptText);
  let responses = raw.responses;
  if (responses) {
    const entries = await Promise.all(
      Object.entries(responses).map(async ([uid, r]) => {
        const text = await decryptIfNeeded(pairId, r.text);
        return [uid, { ...r, text }] as const;
      }),
    );
    responses = Object.fromEntries(entries);
  }
  return { ...raw, promptText, responses };
}

export function subscribeToPartnerExchange(
  pairId: string,
  exchangeId: string,
  onNext: (exchange: PartnerExchange | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    exchangeRef(pairId, exchangeId),
    async (snap) => {
      const raw = snap.exists() ? (snap.data() as PartnerExchange) : null;
      const decrypted = await decryptExchange(pairId, raw);
      onNext(decrypted);
      if (decrypted) emitExchangeInbox(decrypted);
    },
    onError,
  );
}

function emitExchangeInbox(exchange: PartnerExchange) {
  const selfUid = useAuthStore.getState().account?.accountId;
  if (!selfUid) return;
  const inbox = useInboxStore.getState();
  if (exchange.promptSharedBy && exchange.promptSharedBy !== selfUid && exchange.promptText) {
    void inbox.push({
      kind: 'partner_prompt',
      title: 'New partner prompt',
      body: exchange.promptText.slice(0, 140),
      route: '/(tabs)/partner',
    });
  }
  if (exchange.responses) {
    for (const [uid, r] of Object.entries(exchange.responses)) {
      if (uid === selfUid || !r?.text) continue;
      const name = r.displayName ?? 'Your partner';
      void inbox.push({
        kind: 'partner_reflection',
        title: `${name} reflected`,
        body: r.text.slice(0, 140),
        route: '/(tabs)/partner',
      });
    }
  }
}

export async function sharePartnerPrompt(params: {
  pairId: string;
  exchangeId: string;
  promptText: string;
  promptCategory?: string | null;
  account: AuthAccount;
}) {
  const promptText = await encryptIfPossible(params.pairId, params.promptText);
  await setDoc(
    exchangeRef(params.pairId, params.exchangeId),
    {
      promptText,
      promptCategory: params.promptCategory ?? null,
      promptSharedBy: params.account.accountId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  trackShare('partner_prompt', 'partner_mode', 'success');
  trackCrud('partner_exchange', 'create', { kind: 'prompt' });
}

export type PartnerShareKind = 'test-result' | 'creation';

export type PartnerShare = {
  id: string;
  kind: PartnerShareKind;
  title: string;
  body: string;
  score?: number | null;
  senderUid: string;
  senderName: string | null;
  createdAt?: unknown;
};

function sharesCollection(pairId: string) {
  if (!firestore) throw new Error('Firebase is not configured.');
  return collection(firestore, 'pairs', pairId, 'shares');
}

export async function sharePartnerItem(params: {
  pairId: string;
  kind: PartnerShareKind;
  title: string;
  body: string;
  score?: number | null;
  account: AuthAccount;
  senderName: string | null;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = await encryptIfPossible(params.pairId, params.body);
  await setDoc(doc(sharesCollection(params.pairId), id), {
    kind: params.kind,
    title: params.title,
    body,
    score: params.score ?? null,
    senderUid: params.account.accountId,
    senderName: params.senderName,
    createdAt: serverTimestamp(),
  });
  trackShare(params.kind, 'partner_mode', 'success');
  trackCrud('partner_share', 'create', { kind: params.kind, has_score: params.score != null });
}

export function subscribeToPartnerShares(
  pairId: string,
  onNext: (shares: PartnerShare[]) => void,
  onError: (error: unknown) => void,
  max = 20,
): Unsubscribe {
  const q = query(sharesCollection(pairId), orderBy('createdAt', 'desc'), fsLimit(max));
  return onSnapshot(
    q,
    async (snap) => {
      const raw: PartnerShare[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartnerShare, 'id'>) }));
      const items = await Promise.all(
        raw.map(async (s) => ({ ...s, body: (await decryptIfNeeded(pairId, s.body)) ?? s.body })),
      );
      onNext(items);
      const selfUid = useAuthStore.getState().account?.accountId;
      if (selfUid) {
        const inbox = useInboxStore.getState();
        for (const s of items) {
          if (s.senderUid === selfUid) continue;
          const name = s.senderName ?? 'Your partner';
          void inbox.push({
            kind: 'partner_response',
            title: `${name} shared a ${s.kind === 'test-result' ? 'test result' : 'creation'}`,
            body: s.title,
            route: '/(tabs)/partner',
          });
        }
      }
    },
    onError,
  );
}

export async function sharePartnerReflection(params: {
  pairId: string;
  exchangeId: string;
  promptText: string;
  promptCategory?: string | null;
  account: AuthAccount;
  displayName: string;
  text: string;
}) {
  const [promptText, text] = await Promise.all([
    encryptIfPossible(params.pairId, params.promptText),
    encryptIfPossible(params.pairId, params.text),
  ]);
  await setDoc(
    exchangeRef(params.pairId, params.exchangeId),
    {
      promptText,
      promptCategory: params.promptCategory ?? null,
      responses: {
        [params.account.accountId]: {
          displayName: params.displayName,
          text,
          updatedAt: serverTimestamp(),
        },
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  trackShare('partner_reflection', 'partner_mode', 'success');
  trackCrud('partner_exchange', 'update', { kind: 'reflection' });
}
