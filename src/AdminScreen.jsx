import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { useAuth } from "./useAuth.js";

const COLOR = {
  ink: "#15181B",
  panel: "#1D2124",
  hairline: "#3A3F43",
  text: "#ECE7DA",
  textDim: "#9AA0A6",
  brass: "#D9A441",
  sage: "#7BAE83",
  clay: "#C96A4B",
};

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function activityStatus(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = diffMs / 60000;
  if (mins < 10) return { label: "Active now", color: COLOR.sage };
  if (mins < 60 * 24) return { label: "Active today", color: COLOR.brass };
  if (mins < 60 * 24 * 7) return { label: "This week", color: COLOR.textDim };
  return { label: "Inactive", color: COLOR.clay };
}

export default function AdminScreen() {
  const { user, signOut } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (cancelled) return;
      setIsAdmin(!!me?.is_admin);
      if (!me?.is_admin) return;
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, display_name, city, current_streak, last_seen, created_at")
        .order("last_seen", { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows(data);
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  if (isAdmin === null) {
    return <div style={{ color: COLOR.textDim, padding: 40 }}>Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: COLOR.ink, color: COLOR.text, padding: 40 }}>
        <p>This account doesn't have admin access.</p>
        <button onClick={signOut} style={{ marginTop: 12, background: "transparent", border: `1px solid ${COLOR.hairline}`, color: COLOR.textDim, borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    );
  }

  const activeNow = rows?.filter((r) => activityStatus(r.last_seen).label === "Active now").length ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: COLOR.ink, color: COLOR.text, padding: "28px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: COLOR.brass, textTransform: "uppercase", letterSpacing: "0.14em" }}>Admin</div>
            <h1 style={{ fontSize: 26, fontWeight: 600, margin: "2px 0 0" }}>User activity</h1>
          </div>
          <button onClick={signOut} style={{ background: "transparent", border: `1px solid ${COLOR.hairline}`, color: COLOR.textDim, borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>
            Sign out
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ background: COLOR.panel, border: `1px solid ${COLOR.hairline}`, borderRadius: 10, padding: "14px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{rows?.length ?? "—"}</div>
            <div style={{ fontSize: 11, color: COLOR.textDim, textTransform: "uppercase" }}>Total users</div>
          </div>
          <div style={{ background: COLOR.panel, border: `1px solid ${COLOR.hairline}`, borderRadius: 10, padding: "14px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: COLOR.sage }}>{activeNow}</div>
            <div style={{ fontSize: 11, color: COLOR.textDim, textTransform: "uppercase" }}>Active now</div>
          </div>
        </div>

        {error && <div style={{ color: COLOR.clay, marginBottom: 16 }}>{error}</div>}

        <div style={{ background: COLOR.panel, border: `1px solid ${COLOR.hairline}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "10px 16px", fontSize: 11, color: COLOR.textDim, textTransform: "uppercase", borderBottom: `1px solid ${COLOR.hairline}` }}>
            <span>Name</span>
            <span>City</span>
            <span>Streak</span>
            <span>Status</span>
          </div>
          {rows === null && <div style={{ padding: 16, color: COLOR.textDim }}>Loading…</div>}
          {rows?.length === 0 && <div style={{ padding: 16, color: COLOR.textDim }}>No users yet.</div>}
          {rows?.map((r) => {
            const status = activityStatus(r.last_seen);
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "12px 16px", fontSize: 13, borderBottom: `1px solid ${COLOR.hairline}`, alignItems: "center" }}>
                <span>{r.display_name || "—"}</span>
                <span style={{ color: COLOR.textDim }}>{r.city || "—"}</span>
                <span>{r.current_streak ?? 0} 🔥</span>
                <span style={{ color: status.color, fontSize: 12 }}>
                  {status.label} <span style={{ color: COLOR.textDim }}>· {relativeTime(r.last_seen)}</span>
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: COLOR.textDim, marginTop: 16, lineHeight: 1.6 }}>
          "Active now" = seen in the last 10 minutes. Users only appear here after they sign up and agree to the
          notice shown at signup — nobody is added to this list silently.
        </p>
      </div>
    </div>
  );
}
