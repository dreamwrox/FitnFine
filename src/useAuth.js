import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

// Supabase Auth needs a unique identifier per account. This app never collects
// or confirms a real email address, so we build a stable internal address from
// the name someone signs up with. It's never shown to the user and never
// receives mail — it only exists so Supabase Auth can tell accounts apart.
// Note: this must be a normal-looking domain (a real TLD like .com). Reserved
// suffixes such as .local, .test, .invalid, or .example get rejected by
// Supabase's own signup validation before the request even reaches your app.
const INTERNAL_EMAIL_DOMAIN = "users.fitnessfreek.com";
function nameToInternalEmail(name) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user";
  return `${slug}@${INTERNAL_EMAIL_DOMAIN}`;
}

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

  const signUp = useCallback(async ({ name, password, city }) => {
    const { data, error } = await supabase.auth.signUp({
      email: nameToInternalEmail(name),
      password,
      options: { data: { display_name: name, city } },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async ({ name, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: nameToInternalEmail(name),
      password,
    });
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
