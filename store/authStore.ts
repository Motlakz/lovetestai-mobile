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
  signInWithGoogle: () => Promise<AuthAccount>;
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

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (config: { webClientId?: string; offlineAccess?: boolean }) => Promise<void> | void;
    hasPlayServices: (config?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<{
      idToken?: string;
      data?: { idToken?: string };
    }>;
  };
  statusCodes?: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };
};

let googleSigninModulePromise: Promise<GoogleSigninModule | null> | null = null;

const getGoogleSigninModule = async (): Promise<GoogleSigninModule | null> => {
  if (!googleSigninModulePromise) {
    googleSigninModulePromise = (async () => {
      try {
        const module = await import('@react-native-google-signin/google-signin');
        if (!module.GoogleSignin) {
          return null;
        }
        return {
          GoogleSignin: module.GoogleSignin,
          statusCodes: module.statusCodes,
        } as GoogleSigninModule;
      } catch (error) {
        console.warn('Google Sign-In native module unavailable. Use a development build instead of Expo Go.', error);
        return null;
      }
    })();
  }

  return googleSigninModulePromise;
};

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

  signInWithGoogle: async () => {
    if (!firebaseAuth) throw new Error('Firebase not configured');

    const googleSigninModule = await getGoogleSigninModule();
    if (!googleSigninModule) {
      throw new Error('Google Sign-In requires a development build.');
    }

    const { GoogleSignin, statusCodes } = googleSigninModule;

    try {
      await GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken ?? userInfo.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(firebaseAuth, credential);
      const account = userToAccount(userCred.user);
      await persistAuthAccount(account);
      set({ account });
      return account;
    } catch (error: any) {
      if (statusCodes && error?.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in cancelled');
      }
      if (statusCodes && error?.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in already in progress');
      }
      if (statusCodes && error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }
      throw error;
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
