import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";

/**
 * Session context — exposes the current Supabase auth state to
 * every screen via the `useSession()` hook.
 *
 * We subscribe to `onAuthStateChange` once at the root so every
 * screen re-renders the moment a user signs in or out, without
 * anyone needing to plumb callbacks down the tree.
 *
 * Also tracks whether the user has completed profile setup
 * (stored in Supabase user_metadata). Screens can check
 * `hasProfile` to decide whether to redirect to the wizard.
 */

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  hasProfile: boolean;
  profileChecked: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
  hasProfile: false,
  profileChecked: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const checkProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasProfile(false);
        return;
      }
      const meta = user.user_metadata;
      // Gate only on display_name — matches the web app. Requiring
      // art_movements too caused users who completed the wizard to
      // be re-prompted on every login when any step's array failed
      // to round-trip cleanly through the RN → Supabase JSONB path.
      // Display name is the one field we can rely on; refining
      // preferences lives in the Profile tab.
      setHasProfile(!!meta?.display_name);
    } catch {
      setHasProfile(false);
    } finally {
      setProfileChecked(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Reset the profile-check flag so downstream effects don't
      // fire on stale `hasProfile=false` left over from the pre-login
      // state. Without this, SignedIn mounts with profileChecked=true
      // (from the pre-login null-user check) and hasProfile=false,
      // which pushes the user straight into the wizard before the
      // fresh checkProfile() has a chance to flip hasProfile to true.
      setProfileChecked(false);
      setHasProfile(false);
      checkProfile();
    });

    // Initial profile check
    checkProfile();

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [checkProfile]);

  async function signOut() {
    await supabase.auth.signOut();
    setHasProfile(false);
  }

  return (
    <SessionContext.Provider
      value={{ session, loading, hasProfile, profileChecked, refreshProfile: checkProfile, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
