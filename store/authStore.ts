import { create } from 'zustand';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously as fbSignInAnonymously,
  signInWithCredential,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/services/firebase';
import { AuthAccount, getOrCreateDeviceId, loadAuthAccount, persistAuthAccount } from '@/services/db';

interface AuthState {
  isLoading: boolean;
  account: AuthAccount | null;
  init: () => Promise<void>;
  signInAnonymously: () => Promise<AuthAccount>;
  signInWithGoogle: () => Promise<AuthAccount>;
  signInWithGoogleIdToken: (idToken: string, accessToken?: string) => Promise<AuthAccount>;
  signOut: () => Promise<void>;
}

let cachedDeviceId: string | null = null;

async function ensureDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = await getOrCreateDeviceId();
  return cachedDeviceId;
}

function userToAccount(user: User): AuthAccount {
  return {
    accountId: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider: user.isAnonymous ? 'anonymous' : 'google',
    createdAt: user.metadata.creationTime ?? new Date().toISOString(),
    deviceId: cachedDeviceId ?? undefined,
  };
}

let authSubscribed = false;
let authInitPromise: Promise<void> | null = null;
let guestSignInPromise: Promise<AuthAccount> | null = null;
let googleSignInPromise: Promise<AuthAccount> | null = null;

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
    if (authInitPromise) return authInitPromise;
    authInitPromise = (async () => {
    try {
      await ensureDeviceId();

      if (firebaseAuth) {
        const auth = firebaseAuth;
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (!authSubscribed) {
              authSubscribed = true;
              onAuthStateChanged(auth, async (nextUser) => {
                if (nextUser) {
                  const account = userToAccount(nextUser);
                  await persistAuthAccount(account);
                  set({ account });
                } else {
                  await persistAuthAccount(null);
                  set({ account: null });
                }
              });
            }

          if (user) {
            const account = userToAccount(user);
            await persistAuthAccount(account);
            set({ account, isLoading: false });
          } else if (guestSignInPromise) {
            try {
              const account = await guestSignInPromise;
              set({ account, isLoading: false });
            } catch {
              set({ account: null, isLoading: false });
            }
          } else {
            guestSignInPromise = (async () => {
              const cred = await fbSignInAnonymously(auth);
              await cred.user.getIdToken(true);
              const account = userToAccount(cred.user);
              await persistAuthAccount(account);
              return account;
            })();
            try {
              const account = await guestSignInPromise;
              set({ account, isLoading: false });
            } catch (signInError) {
              console.log('Auto guest sign-in failed:', signInError);
              await persistAuthAccount(null);
              set({ account: null, isLoading: false });
            } finally {
              guestSignInPromise = null;
            }
          }
            resolve();
          });
        });
        return;
      }

      const stored = await loadAuthAccount();
      set({ account: stored, isLoading: false });
    } catch (e) {
      console.log('Auth init failed:', e);
      set({ isLoading: false });
    }
    })();
    return authInitPromise;
  },

  signInAnonymously: async () => {
    if (!firebaseAuth) throw new Error('Firebase not configured');
    const existing = firebaseAuth.currentUser;
    if (existing && existing.isAnonymous) {
      const account = userToAccount(existing);
      await persistAuthAccount(account);
      set({ account });
      return account;
    }
    if (guestSignInPromise) return guestSignInPromise;
    guestSignInPromise = (async () => {
      try {
        const userCred = await fbSignInAnonymously(firebaseAuth);
        await userCred.user.getIdToken(true);
        const account = userToAccount(userCred.user);
        await persistAuthAccount(account);
        set({ account });
        return account;
      } finally {
        guestSignInPromise = null;
      }
    })();
    return guestSignInPromise;
  },

  signInWithGoogle: async () => {
    if (!firebaseAuth) throw new Error('Firebase not configured');
    const auth = firebaseAuth;
    if (googleSignInPromise) return googleSignInPromise;
    googleSignInPromise = (async () => {
      try {
        return await doGoogleSignIn();
      } finally {
        googleSignInPromise = null;
      }
    })();
    return googleSignInPromise;

    async function doGoogleSignIn(): Promise<AuthAccount> {
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
      const userCred = await signInWithCredential(auth, credential);
      await userCred.user.getIdToken(true);
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
    }
  },

  signInWithGoogleIdToken: async (idToken: string, accessToken?: string) => {
    if (!firebaseAuth) throw new Error('Firebase not configured');
    if (googleSignInPromise) return googleSignInPromise;
    googleSignInPromise = (async () => {
      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        const userCred = await signInWithCredential(firebaseAuth, credential);
        await userCred.user.getIdToken(true);
        const account = userToAccount(userCred.user);
        await persistAuthAccount(account);
        set({ account });
        return account;
      } finally {
        googleSignInPromise = null;
      }
    })();
    return googleSignInPromise;
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
