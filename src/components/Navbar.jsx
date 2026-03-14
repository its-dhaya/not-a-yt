import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";

const PRODUCTS = [
  {
    id: "shorts-maker",
    label: "Live",
    labelColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    name: "AI Shorts Maker",
    desc: "Topic → script → clips → Short",
  },
  {
    id: "tts",
    label: "Live",
    labelColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
    name: "Text to Speech",
    desc: "Script to voice, download MP3",
  },
  {
    id: "manual-editor",
    label: "Live",
    labelColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    name: "Manual Editor",
    desc: "Frame-by-frame Shorts editing",
  },
  {
    id: "long-to-short",
    label: "Soon",
    labelColor: "text-zinc-500 bg-zinc-800 border-zinc-700",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M9 8l3 3 3-3" />
      </svg>
    ),
    name: "Long → Shorts",
    desc: "Auto-split long videos to Shorts",
  },
];

function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-lg transition-colors
          ${open ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}
      >
        {label}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800
                        rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fadeup"
          style={{ minWidth: "280px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ user, onGoHome, onNavigate, onGetStarted }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const scrollTo = (id) => {
    // Try scroll on current page first, if not found go home then scroll
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      onGoHome?.();
      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  useEffect(() => {
    // Only auto-hide when NOT on landing (landing has no onNavigate)
    if (!onNavigate) return;
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < lastY.current || y < 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onNavigate]);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 py-4
                bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60
                transition-transform duration-300
                ${!visible ? "-translate-y-full" : "translate-y-0"}`}
    >
      {/* Logo */}
      <button
        onClick={() => onGoHome?.()}
        className="font-museo text-emerald-400 font-bold tracking-widest text-sm
                   hover:opacity-70 transition-opacity cursor-pointer"
      >
        NOT A YT
      </button>

      {/* Desktop centre links */}
      <div className="hidden md:flex items-center gap-1">
        <Dropdown label="Products">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (p.label === "Live") {
                  if (user) {
                    onNavigate?.(p.id);
                  } else {
                    onGetStarted?.();
                  }
                }
              }}
              className={`w-full flex items-start gap-3.5 px-4 py-3.5 transition-colors text-left
                ${
                  p.label === "Live"
                    ? "hover:bg-zinc-800 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                }`}
            >
              <span className="text-emerald-400 mt-0.5 shrink-0">{p.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-zinc-200">
                    {p.name}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${p.labelColor}`}
                  >
                    {p.label}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-500 leading-snug mt-0.5">
                  {p.desc}
                </p>
              </div>
            </button>
          ))}
        </Dropdown>

        <button
          onClick={() => scrollTo("solutions")}
          className="text-[13px] text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg transition-colors"
        >
          Solutions
        </button>
        <button
          onClick={() => scrollTo("pricing")}
          className="text-[13px] text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg transition-colors"
        >
          Pricing
        </button>
      </div>

      {/* Mobile links */}
      <div className="flex md:hidden items-center gap-3 text-[12px] text-zinc-500">
        {user ? (
          <>
            <button
              onClick={() => onNavigate?.("shorts-maker")}
              className="hover:text-zinc-300 transition-colors"
            >
              Shorts
            </button>
            <button
              onClick={() => onNavigate?.("tts")}
              className="hover:text-zinc-300 transition-colors"
            >
              TTS
            </button>
          </>
        ) : (
          <button
            onClick={onGetStarted}
            className="hover:text-zinc-300 transition-colors"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Right side — account or get started */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* Account email pill */}
            <div
              className="hidden sm:flex items-center gap-2 text-[12px] text-zinc-500
                            border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {user.email?.split("@")[0]}
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-zinc-500 text-[13px] border border-zinc-800
                         px-4 py-2 rounded-full hover:border-zinc-600 hover:text-zinc-300 transition-all"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={onGetStarted}
            className="text-zinc-400 text-[13px] font-medium border border-zinc-700 px-5 py-2 rounded-full
                       hover:border-emerald-400 hover:text-emerald-400 transition-colors duration-200"
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
}
