import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient, SupportedStorage } from "@supabase/supabase-js";
import Constants from "expo-constants";

/**
 * SecureStore-backed storage adapter for Supabase auth.
 *
 * Without this, Supabase defaults to localStorage which doesn't exist
 * in React Native — so the user would be signed out on every launch.
 * SecureStore writes to the iOS Keychain, which is the right place
 * for a JWT access token anyway.
 */
const ExpoSecureStorage: SupportedStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase credentials — set EXPO_PUBLIC_SUPABASE_URL and " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY in app.json → expo.extra."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
