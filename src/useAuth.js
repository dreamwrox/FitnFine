import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, city }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, city } },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user: session?.user ?? null, loading, signUp, signIn, signOut };
}

// Marks the current user as "seen right now" on mount, and again every
// couple of minutes while the tab stays open. This — plus each user's
// last_seen timestamp — is what the admin tracker uses to show who's
// currently active vs. gone quiet.
export function useHeartbeat(userId) {
  useEffect(() => {
    if (!userId) return;
    const ping = () => {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId).then(() => {});
    };
    ping();
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);
}
