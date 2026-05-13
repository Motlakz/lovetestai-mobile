import { create } from 'zustand';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/services/firebase';
import { AuthAccount, loadAuthAccount, persistAuthAccount } from '@/services/db';

interface AuthState {
  isLoading: boolean;
  account: AuthAccount | null;
  init: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string, accessToken?: string) => Promise<AuthAccount>;
  signOut: () => Promise<void>;
}

function userToAccount(user: User): AuthAccount {
  return {
    accountId: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider: 'google',
    createdAt: user.metadata.creationTime ?? new Date().toISOString(),
  };
}

let authSubscribed = false;

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  account: null,

  init: async () => {
    try {
      const stored = await loadAuthAccount();
      set({ account: stored, isLoading: false });

      if (firebaseAuth && !authSubscribed) {
        authSubscribed = true;
        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            const account = userToAccount(user);
            await persistAuthAccount(account);
            set({ account });
          } else {
            const current = await loadAuthAccount();
            if (current?.provider === 'google') {
              await persistAuthAccount(null);
              set({ account: null });
            }
          }
        });
      }
    } catch (e) {
      console.log('Auth init failed:', e);
      set({ isLoading: false });
    }
  },

  signInWithGoogleIdToken: async (idToken: string, accessToken?: string) => {
    if (!firebaseAuth) throw new Error('Firebase not configured');
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCred = await signInWithCredential(firebaseAuth, credential);
    const account = userToAccount(userCred.user);
    await persistAuthAccount(account);
    set({ account });
    return account;
  },

  signOut: async () => {
    try {
      if (firebaseAuth) await fbSignOut(firebaseAuth);
    } catch (e) {
      console.log('Firebase signOut failed:', e);
    }
    await persistAuthAccount(null);
    set({ account: null });
  },
}));

export type { AuthAccount } from '@/services/db';
