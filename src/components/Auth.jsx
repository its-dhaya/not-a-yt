import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Auth({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
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
      if (error) setError(error.message);
      else {
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
      if (error)
        setError(
          error.message.toLowerCase().includes("email not confirmed")
            ? "Please confirm your email before logging in. Check your inbox."
            : error.message
        );
      else onLogin(data.user);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 text-[13px] mb-7 hover:text-zinc-200 transition-colors"
          >
            ← Back
          </button>
        )}
        <p className="text-emerald-400 text-[12px] font-semibold tracking-widest mb-7">
          NOT A YT
        </p>
        <h1 className="font-display text-[28px] text-zinc-100 mb-2">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-zinc-400 text-[14px] mb-8">
          {mode === "login"
            ? "Sign in to continue generating videos."
            : "Sign up to start creating YouTube Shorts with AI."}
        </p>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[13px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-5">
            {success}
          </p>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                     rounded-xl px-4 py-3 text-[14px] outline-none focus:border-emerald-400
                     transition-colors mb-3 disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                     rounded-xl px-4 py-3 text-[14px] outline-none focus:border-emerald-400
                     transition-colors mb-4 disabled:opacity-50"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-400 text-black font-semibold text-[14px] py-3 rounded-xl
                     hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>

        <p className="text-center text-[13px] text-zinc-500 mt-6">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setSuccess("");
            }}
            className="text-emerald-400 underline hover:opacity-80 transition-opacity"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
