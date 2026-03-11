import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Auth({ onLogin, onBack }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleKey = (e) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(
          "Account created! Check your email to confirm, then log in."
        );
        setMode("login");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        onLogin(data.user);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* back to landing */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted-md)",
              fontSize: "13px",
              cursor: "pointer",
              padding: "0",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-body)",
            }}
          >
            ← Back
          </button>
        )}

        <p className="auth-logo">NOT A YT</p>

        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to continue generating videos."
            : "Sign up to start creating YouTube Shorts with AI."}
        </p>

        {/* error / success messages */}
        {error && (
          <p
            style={{
              fontSize: "13px",
              color: "#ff5f5f",
              background: "#ff5f5f11",
              border: "1px solid #ff5f5f33",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--accent)",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)33",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
            }}
          >
            {success}
          </p>
        )}

        <input
          className="auth-input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccess("");
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
