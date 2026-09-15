import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

// Keychain (iOS) / Keystore (Android) backed storage for the session.
// AsyncStorage would keep the tokens in plain text on the device, so anything
// holding a token belongs here; theme, language and filters do not.
//
// SecureStore warns above ~2KB per value. The persisted slice is the two JWTs
// plus a small user object, which sits under that — but if the access token
// ever grows, split the tokens into their own keys rather than raising it.
export const secureStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};
