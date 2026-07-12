import React, { useState } from "react";
import { useAuth } from "./useAuth.js";

const COLOR = {
  ink: "#15181B",
  panel: "#1D2124",
  hairline: "#3A3F43",
  text: "#ECE7DA",
  textDim: "#9AA0A6",
  brass: "#D9A441",
  clay: "#C96A4B",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 6,
  border: `1px solid ${COLOR.hairline}`,
  background: "#0F1214",
  color: COLOR.text,
  fontSize: 14,
  marginBottom: 12,
};

export default function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState("signup"); // "signup" | "signin"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,20}$/.test(cleanUsername)) {
      return setError("Username should be 3–20 characters: letters, numbers, dots, dashes or underscores only.");
    }

    setBusy(true);
    if (mode === "signup") {
      if (!displayName.trim()) {
        setBusy(false);
        return setError("Enter a name — your admin will see this to know who's active.");
      }
      const { error: err } = await signUp({
        username: cleanUsername,
        password,
        displayName: displayName.trim(),
        city: city.trim(),
      });
      setBusy(false);
      if (err) {
        if (/registered|exists/i.test(err.message)) {
          return setError("That username is taken. Try another, or sign in instead.");
        }
        return setError(err.message);
      }
      // Email confirmation is switched off in Supabase for this app, so sign-up logs the
      // user straight in — useAuth's onAuthStateChange picks up the new session and the
      // app moves on by itself, no separate "check your email" step needed.
    } else {
      const { error: err } = await signIn({ username: cleanUsername, password });
      setBusy(false);
      if (err) {
        if (/invalid login credentials/i.test(err.message)) {
          return setError("Wrong username or password.");
        }
        return setError(err.message);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 13, color: COLOR.brass, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
          Fitness Freek
        </div>
        <h1 style={{ fontSize: 24, color: COLOR.text, margin: "0 0 20px", fontWeight: 600 }}>
          {mode === "signup" ? "Create your account" : "Sign in"}
        </h1>

        <div style={{ background: COLOR.panel, border: `1px solid ${COLOR.hairline}`, borderRadius: 10, padding: 20 }}>
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <label style={{ fontSize: 12, color: COLOR.textDim, display: "block", marginBottom: 6 }}>Name</label>
                <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                <label style={{ fontSize: 12, color: COLOR.textDim, display: "block", marginBottom: 6 }}>City (optional)</label>
                <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Delhi" />
              </>
            )}
            <label style={{ fontSize: 12, color: COLOR.textDim, display: "block", marginBottom: 6 }}>Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jai_k"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
            <label style={{ fontSize: 12, color: COLOR.textDim, display: "block", marginBottom: 6 }}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

            {error && <div style={{ color: COLOR.clay, fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: COLOR.brass, color: COLOR.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
            </button>
          </form>

          {mode === "signup" && (
            <p style={{ fontSize: 11, color: COLOR.textDim, marginTop: 14, lineHeight: 1.6 }}>
              Your name and city (if you add one) will be visible to your programme admin, so they can see who's
              actively using the app. This is only what you type here — we never capture your GPS location, and we
              never ask for an email address.
            </p>
          )}

          <button
            type="button"
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            style={{ width: "100%", marginTop: 14, background: "transparent", border: "none", color: COLOR.textDim, fontSize: 12, cursor: "pointer" }}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
