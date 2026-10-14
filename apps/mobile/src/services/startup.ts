import Constants from 'expo-constants';
import { setApiBaseUrl } from '@task/core/services/config';
import { configureAuthStorage } from '@task/core/features/auth/store/useAuthStore';

import { secureStorage } from './secureStorage';

// Fallback only — the real value comes from app.json's extra.apiUrl. It points
// at the live server so the app works on any network (Wi-Fi or mobile data).
// For local testing against your own backend, change it in app.json to
// http://<your machine's IP>:5013/api (and don't commit that change).
const DEFAULT_API_URL = 'https://clickup.cissegypt.net/api';

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
