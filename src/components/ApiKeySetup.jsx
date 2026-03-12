import { useState } from "react";
import { supabase } from "../supabaseClient";

const FIELDS = [
  {
    key: "groqKey",
    label: "Groq API Key",
    placeholder: "gsk_...",
    link: "https://console.groq.com/keys",
  },
  {
    key: "pexelsKey",
    label: "Pexels API Key",
    placeholder: "Pexels key",
    link: "https://www.pexels.com/api/",
  },
  {
    key: "pixabayKey",
    label: "Pixabay API Key",
    placeholder: "Pixabay key",
    link: "https://pixabay.com/api/docs/",
  },
];

export default function ApiKeySetup({ onSave }) {
  const [keys, setKeys] = useState({
    groqKey: "",
    pexelsKey: "",
    pixabayKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!keys.groqKey || !keys.pexelsKey || !keys.pixabayKey) {
      setError("Please enter all three API keys.");
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }
      const { error: dbError } = await supabase.from("api_keys").upsert(
        {
          user_id: user.id,
          groq_key: keys.groqKey,
          pexels_key: keys.pexelsKey,
          pixabay_key: keys.pixabayKey,
        },
        { onConflict: "user_id" }
      );
      if (dbError) {
        setError(dbError.message);
        return;
      }
      onSave();
    } catch {
      setError("Failed to save keys. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
        <p className="text-emerald-400 text-[12px] font-semibold tracking-widest mb-7">
          NOT A YT
        </p>
        <h1 className="font-display text-[28px] text-zinc-100 mb-2">
          Setup API Keys
        </h1>
        <p className="text-zinc-400 text-[14px] mb-8">
          Your keys are stored securely and never shared.
        </p>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
            {error}
          </p>
        )}

        {FIELDS.map((f) => (
          <div key={f.key} className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-zinc-400 tracking-wide">
                {f.label}
              </label>
              <a
                href={f.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:opacity-75 transition-opacity"
              >
                Get key →
              </a>
            </div>
            <input
              type="password"
              placeholder={f.placeholder}
              value={keys[f.key]}
              onChange={(e) =>
                setKeys((p) => ({ ...p, [f.key]: e.target.value }))
              }
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                         rounded-xl px-4 py-3 text-[14px] outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-4 bg-emerald-400 text-black font-semibold text-[14px] py-3 rounded-xl
                     hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Keys"}
        </button>
      </div>
    </div>
  );
}
