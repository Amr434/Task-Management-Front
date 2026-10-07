import Constants from 'expo-constants';
import { setApiBaseUrl } from '@task/core/services/config';
import { configureAuthStorage } from '@task/core/features/auth/store/useAuthStore';

import { secureStorage } from './secureStorage';

// Fallback only — the real value comes from app.json's extra.apiUrl, which is a
// developer-machine LAN address and changes per network. Update it there.
const DEFAULT_API_URL = 'http://10.10.2.197:5013/api';

// The base URL has to be set before anything fires a request, and the session
// has to be read out of the Keychain before the first guarded screen decides
// whether to redirect to /login. Both happen here, once, during startup.
//
// Note the API URL is plain HTTP today. Android blocks cleartext traffic in
// release builds, so this must become https:// before shipping a real build.
export async function startApp(): Promise<void> {
  const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? DEFAULT_API_URL;
  setApiBaseUrl(apiUrl);

  // Swaps zustand's default (localStorage, which does not exist here) for the
  // Keychain, then re-runs rehydration so a stored session is picked up.
  await configureAuthStorage(secureStorage);
}
