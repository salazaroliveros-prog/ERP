import { auth } from './firebaseService';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const STORAGE_KEY = 'constructerp_auth_user';

export async function googleSignIn(): Promise<{ user: User } | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  try {
    const result = await signInWithPopup(auth, provider);
    if (result?.user && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
    }
    return result;
  } catch (error: any) {
    // If popup is closed by user or domain requires new tab in iframe, return null gracefully
    if (
      error?.code === 'auth/api-key-not-valid' ||
      error?.code === 'auth/unauthorized-domain' ||
      error?.code === 'auth/popup-closed-by-user'
    ) {
      console.warn(
        'Firebase auth notice: Google Sign-In cancelled or unavailable. Returning null.'
      );
      return null;
    }

    console.error('Google Sign-In Error:', error);
    return null;
  }
}

export async function googleSignOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Firebase Sign-Out notice:', error);
  }
}

export function initAuth(onUser: (user: User | null) => void, onNull: () => void): () => void {
  // Check local session first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        onUser(parsed);
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  try {
    return onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          }
          onUser(user);
        } else {
          // If no Firebase user, check if local fallback session exists
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try {
                onUser(JSON.parse(stored));
                return;
              } catch (e) {
                // ignore
              }
            }
          }
          onNull();
        }
      },
      (err) => {
        console.warn('Firebase auth listener notice (using local storage fallback):', err?.message);
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              onUser(JSON.parse(stored));
              return;
            } catch (e) {
              // ignore
            }
          }
        }
        onNull();
      }
    );
  } catch (err) {
    console.warn('Auth listener fallback active:', err);
    return () => {};
  }
}
