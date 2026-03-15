import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

/**
 * Platform-aware storage adapter.
 *
 * During Expo's static web render (Node.js), `window` doesn't exist so
 * AsyncStorage crashes. We use a no-op in-memory store for SSR and the
 * real AsyncStorage only on native + client-side web.
 */
function makeStorage() {
  // Server-side render (Node.js): window is not defined
  const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

  if (isSSR) {
    // In-memory no-op — session won't persist but the render won't crash
    const mem: Record<string, string> = {};
    return {
      getItem: (key: string) => Promise.resolve(mem[key] ?? null),
      setItem: (key: string, value: string) => { mem[key] = value; return Promise.resolve(); },
      removeItem: (key: string) => { delete mem[key]; return Promise.resolve(); },
    };
  }

  if (Platform.OS === 'web') {
    // Client-side web: use localStorage directly
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => { window.localStorage.setItem(key, value); return Promise.resolve(); },
      removeItem: (key: string) => { window.localStorage.removeItem(key); return Promise.resolve(); },
    };
  }

  // Native (iOS / Android): use AsyncStorage
  // Lazy import so it's never evaluated during SSR
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: makeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});