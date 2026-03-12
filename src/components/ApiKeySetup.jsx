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
    placeholder: "Enter Pexels key...",
    link: "https://www.pexels.com/api/",
  },
  {
    key: "pixabayKey",
    label: "Pixabay API Key",
    placeholder: "Enter Pixabay key...",
    link: "https://pixabay.com/api/docs/",
  },
];

const GUIDES = [
  {
    name: "Groq",
    link: "https://console.groq.com/keys",
    domain: "console.groq.com",
    color: "text-orange-400",
    border: "border-orange-400/20",
    bg: "bg-orange-400/5",
    dot: "bg-orange-400",
    steps: [
      "Go to console.groq.com",
      "Sign up or log in",
      'Click "API Keys" in the sidebar',
      'Click "Create API Key"',
      "Copy the key starting with gsk_",
    ],
    note: "Free tier — 14,400 requests/day",
  },
  {
    name: "Pexels",
    link: "https://www.pexels.com/api/",
    domain: "pexels.com/api",
    color: "text-green-400",
    border: "border-green-400/20",
    bg: "bg-green-400/5",
    dot: "bg-green-400",
    steps: [
      "Go to pexels.com/api",
      "Sign up or log in",
      'Click "Your API Key"',
      "Fill in the form and submit",
      "Copy your API key",
    ],
    note: "Free — 200 requests/hour",
  },
  {
    name: "Pixabay",
    link: "https://pixabay.com/api/docs/",
    domain: "pixabay.com/api/docs",
    color: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
    dot: "bg-blue-400",
    steps: [
      "Go to pixabay.com/api/docs",
      "Sign up or log in",
      "Your API key appears at the top",
      "Copy it directly from the page",
    ],
    note: "Free — 100 requests/minute",
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
  const [show, setShow] = useState({
    groqKey: false,
    pexelsKey: false,
    pixabayKey: false,
  });

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
    <div className="min-h-screen bg-zinc-950 font-sans flex flex-col">
      {/* TOP BAR */}
      <div className="px-10 py-5 border-b border-zinc-800 flex items-center gap-3">
        <span className="font-museo text-emerald-400 text-2xl font-bold tracking-wide">
          NOT A YT
        </span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-500 text-[13px]">API Key Setup</span>
      </div>

      <div className="flex flex-1">
        {/* LEFT — FORM */}
        <div className="w-[480px] shrink-0 border-r border-zinc-800 px-12 py-14 flex flex-col">
          <div className="mb-10">
            <h1 className="font-display text-[32px] text-zinc-100 mb-2">
              Connect your APIs
            </h1>
            <p className="text-zinc-400 text-[14px] leading-relaxed">
              Your keys are stored securely in Supabase and never sent anywhere
              except the official APIs.
            </p>
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-5 flex-1">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-semibold text-zinc-300 tracking-wider uppercase">
                    {f.label}
                  </label>
                  <a
                    href={f.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:opacity-75 transition-opacity flex items-center gap-1"
                  >
                    Get key
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 9.5l7-7M9.5 2.5H4M9.5 2.5v5.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={show[f.key] ? "text" : "password"}
                    placeholder={f.placeholder}
                    value={keys[f.key]}
                    onChange={(e) =>
                      setKeys((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                               rounded-xl px-4 py-3 pr-11 text-[14px] outline-none focus:border-emerald-400
                               transition-colors"
                  />
                  <button
                    onClick={() =>
                      setShow((p) => ({ ...p, [f.key]: !p[f.key] }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {show[f.key] ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {keys[f.key] && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Key entered
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-10 w-full bg-emerald-400 text-black font-semibold text-[14px] py-3.5 rounded-xl
                       hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue →"
            )}
          </button>
        </div>

        {/* RIGHT — GUIDES */}
        <div className="flex-1 px-12 py-14 overflow-y-auto">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-8">
            How to get your keys
          </p>

          <div className="flex flex-col gap-6">
            {GUIDES.map((g) => (
              <div
                key={g.name}
                className={`border ${g.border} ${g.bg} rounded-2xl p-7`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span
                      className={`text-[11px] font-semibold tracking-widest uppercase ${g.color} mb-1 block`}
                    >
                      {g.name}
                    </span>
                    <a
                      href={g.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 text-[13px] hover:text-zinc-200 transition-colors flex items-center gap-1.5"
                    >
                      {g.domain}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 9.5l7-7M9.5 2.5H4M9.5 2.5v5.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </a>
                  </div>
                  <a
                    href={g.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-[12px] font-medium border ${g.border} ${g.color} px-4 py-1.5 rounded-full
                               hover:opacity-75 transition-opacity whitespace-nowrap`}
                  >
                    Open →
                  </a>
                </div>

                <ol className="flex flex-col gap-2.5 mb-4">
                  {g.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[13px] text-zinc-400"
                    >
                      <span
                        className={`w-5 h-5 rounded-full ${g.dot} text-black text-[10px] font-bold
                                       flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                <p className="text-[11px] text-zinc-600 border-t border-zinc-700/50 pt-4">
                  {g.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
