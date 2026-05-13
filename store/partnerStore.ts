import { create } from 'zustand';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { PartnerLink, loadPartnerLink, persistPartnerLink } from '@/services/db';
import { useAuthStore } from '@/store/authStore';

interface PartnerState {
  isLoading: boolean;
  link: PartnerLink | null;
  init: () => Promise<void>;
  ensureInviteCode: () => Promise<string>;
  acceptCode: (code: string, label?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToPair: () => void;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function pairIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

let pairUnsubscribe: Unsubscribe | null = null;
let inviteUnsubscribe: Unsubscribe | null = null;

export const usePartnerStore = create<PartnerState>((set, get) => ({
  isLoading: true,
  link: null,

  init: async () => {
    try {
      const stored = await loadPartnerLink();
      set({ link: stored, isLoading: false });
      get().subscribeToPair();
    } catch (e) {
      console.log('Partner init failed:', e);
      set({ isLoading: false });
    }
  },

  ensureInviteCode: async () => {
    const account = useAuthStore.getState().account;
    const current = get().link;
    if (current?.inviteCode) {
      if (firestore && account) {
        try {
          await setDoc(
            doc(firestore, 'invites', current.inviteCode),
            {
              ownerUid: account.accountId,
              ownerEmail: account.email,
              ownerName: account.displayName ?? null,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch (e) { console.log('invite refresh failed:', e); }
      }
      return current.inviteCode;
    }

    const code = generateInviteCode();
    const link: PartnerLink = {
      inviteCode: code,
      partnerCode: null,
      partnerLabel: null,
      pairedAt: null,
      pairId: null,
      partnerUid: null,
      partnerEmail: null,
    };
    set({ link });
    await persistPartnerLink(link);

    if (firestore && account) {
      try {
        await setDoc(doc(firestore, 'invites', code), {
          ownerUid: account.accountId,
          ownerEmail: account.email,
          ownerName: account.displayName ?? null,
          createdAt: serverTimestamp(),
          claimedBy: null,
        });
        get().subscribeToPair();
      } catch (e) { console.log('invite write failed:', e); }
    }

    return code;
  },

  acceptCode: async (code: string, label?: string) => {
    const normalized = code.trim().toUpperCase();
    const account = useAuthStore.getState().account;
    const current = get().link ?? {
      inviteCode: generateInviteCode(),
      partnerCode: null,
      partnerLabel: null,
      pairedAt: null,
      pairId: null,
      partnerUid: null,
      partnerEmail: null,
    };

    let partnerUid: string | null = null;
    let partnerEmail: string | null = null;
    let pairId: string | null = null;

    if (firestore && account) {
      const inviteRef = doc(firestore, 'invites', normalized);
      const snap = await getDoc(inviteRef);
      if (!snap.exists()) {
        throw new Error('That code does not exist. Ask them to open Partner mode first.');
      }
      const data = snap.data() as { ownerUid?: string; ownerEmail?: string };
      partnerUid = data.ownerUid ?? null;
      partnerEmail = data.ownerEmail ?? null;

      if (partnerUid === account.accountId) {
        throw new Error('That\'s your own code.');
      }

      if (partnerUid) {
        pairId = pairIdFor(account.accountId, partnerUid);
        await setDoc(
          doc(firestore, 'pairs', pairId),
          {
            members: [account.accountId, partnerUid].sort(),
            createdAt: serverTimestamp(),
            [`labels.${account.accountId}`]: label?.trim() || null,
          },
          { merge: true },
        );
        await setDoc(inviteRef, {
          claimedBy: account.accountId,
          claimedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    const next: PartnerLink = {
      ...current,
      partnerCode: normalized,
      partnerLabel: label?.trim() || null,
      pairedAt: new Date().toISOString(),
      pairId,
      partnerUid,
      partnerEmail,
    };
    set({ link: next });
    await persistPartnerLink(next);
    get().subscribeToPair();
  },

  disconnect: async () => {
    const current = get().link;
    if (!current) return;
    const account = useAuthStore.getState().account;

    if (firestore && account && current.pairId) {
      try {
        await setDoc(
          doc(firestore, 'pairs', current.pairId),
          { [`disconnectedBy.${account.accountId}`]: serverTimestamp() },
          { merge: true },
        );
      } catch (e) { console.log('disconnect write failed:', e); }
    }

    if (pairUnsubscribe) { pairUnsubscribe(); pairUnsubscribe = null; }

    const next: PartnerLink = {
      inviteCode: current.inviteCode,
      partnerCode: null,
      partnerLabel: null,
      pairedAt: null,
      pairId: null,
      partnerUid: null,
      partnerEmail: null,
    };
    set({ link: next });
    await persistPartnerLink(next);
  },

  subscribeToPair: () => {
    const account = useAuthStore.getState().account;
    const link = get().link;
    if (!firestore || !account) return;

    if (pairUnsubscribe) { pairUnsubscribe(); pairUnsubscribe = null; }
    if (inviteUnsubscribe) { inviteUnsubscribe(); inviteUnsubscribe = null; }

    if (link?.inviteCode && !link.pairId) {
      const inviteRef = doc(firestore, 'invites', link.inviteCode);
      inviteUnsubscribe = onSnapshot(inviteRef, async (snap) => {
        const data = snap.data() as { claimedBy?: string | null } | undefined;
        if (data?.claimedBy && data.claimedBy !== account.accountId) {
          const pairId = pairIdFor(account.accountId, data.claimedBy);
          const pairSnap = await getDoc(doc(firestore!, 'pairs', pairId));
          const pair = pairSnap.data() as { labels?: Record<string, string | null> } | undefined;
          const remoteLabel = pair?.labels?.[data.claimedBy] ?? null;
          const next: PartnerLink = {
            ...get().link!,
            partnerCode: link.inviteCode,
            partnerLabel: remoteLabel,
            pairedAt: new Date().toISOString(),
            pairId,
            partnerUid: data.claimedBy,
            partnerEmail: null,
          };
          set({ link: next });
          await persistPartnerLink(next);
        }
      }, (e) => console.log('invite listener:', e));
    }

    if (link?.pairId) {
      pairUnsubscribe = onSnapshot(doc(firestore, 'pairs', link.pairId), async (snap) => {
        const data = snap.data() as { disconnectedBy?: Record<string, unknown> } | undefined;
        if (data?.disconnectedBy) {
          const others = Object.keys(data.disconnectedBy).filter((k) => k !== account.accountId);
          if (others.length > 0) {
            const current = get().link;
            if (!current) return;
            const next: PartnerLink = {
              inviteCode: current.inviteCode,
              partnerCode: null,
              partnerLabel: null,
              pairedAt: null,
              pairId: null,
              partnerUid: null,
              partnerEmail: null,
            };
            set({ link: next });
            await persistPartnerLink(next);
          }
        }
      }, (e) => console.log('pair listener:', e));
    }
  },
}));
