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

export function subscribeToPartnerExchange(
  pairId: string,
  exchangeId: string,
  onNext: (exchange: PartnerExchange | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    exchangeRef(pairId, exchangeId),
    (snap) => onNext(snap.exists() ? (snap.data() as PartnerExchange) : null),
    onError,
  );
}

export async function sharePartnerPrompt(params: {
  pairId: string;
  exchangeId: string;
  promptText: string;
  promptCategory?: string | null;
  account: AuthAccount;
}) {
  await setDoc(
    exchangeRef(params.pairId, params.exchangeId),
    {
      promptText: params.promptText,
      promptCategory: params.promptCategory ?? null,
      promptSharedBy: params.account.accountId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
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
  await setDoc(doc(sharesCollection(params.pairId), id), {
    kind: params.kind,
    title: params.title,
    body: params.body,
    score: params.score ?? null,
    senderUid: params.account.accountId,
    senderName: params.senderName,
    createdAt: serverTimestamp(),
  });
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
    (snap) => {
      const items: PartnerShare[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartnerShare, 'id'>) }));
      onNext(items);
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
  await setDoc(
    exchangeRef(params.pairId, params.exchangeId),
    {
      promptText: params.promptText,
      promptCategory: params.promptCategory ?? null,
      responses: {
        [params.account.accountId]: {
          displayName: params.displayName,
          text: params.text,
          updatedAt: serverTimestamp(),
        },
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
