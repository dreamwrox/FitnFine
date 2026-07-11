import "./storage-polyfill.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthScreen from "./AuthScreen.jsx";
import AdminScreen from "./AdminScreen.jsx";
import { useAuth, useHeartbeat } from "./useAuth.js";

function Root() {
  const { user, loading } = useAuth();
  useHeartbeat(user?.id);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#15181B", color: "#9AA0A6", padding: 40 }}>Loading…</div>;
  }
  if (!user) {
    return <AuthScreen />;
  }
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminScreen />;
  }
  return <App userId={user.id} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
