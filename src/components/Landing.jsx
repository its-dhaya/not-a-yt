import { useEffect, useState, useRef } from "react";

/* ── Data ── */
const PRODUCTS = [
  {
    id: "shorts-maker",
    label: "Live",
    labelColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    name: "AI Shorts Maker",
    desc: "Turn any topic into a full YouTube Short — script, clips, voice, subtitles.",
  },
  {
    id: "manual-editor",
    label: "Soon",
    labelColor: "text-zinc-400 bg-zinc-800 border-zinc-700",
    icon: (
      <svg
        width="22"
        height="22"
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
    desc: "Edit your Shorts frame by frame — trim, reorder, overlay text and music.",
  },
  {
    id: "long-to-short",
    label: "Soon",
    labelColor: "text-zinc-400 bg-zinc-800 border-zinc-700",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 8l3 3 3-3" />
      </svg>
    ),
    name: "Long → Shorts",
    desc: "Upload any long video. AI finds the best moments and exports 3–6 Shorts automatically.",
  },
  {
    id: "tts",
    label: "Live",
    labelColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: (
      <svg
        width="22"
        height="22"
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
    desc: "Script to voice in seconds. 8 neural voices across US, UK, AU and IN accents.",
  },
];

const SOLUTIONS = [
  {
    icon: "🎬",
    title: "Solo Creators",
    subtitle: "Post every day without burning out",
    points: [
      "Generate a Short from any topic in under 5 minutes",
      "No camera, no mic, no editing skills needed",
      "Batch-create a week of content in one sitting",
    ],
  },
  {
    icon: "📱",
    title: "YouTubers & Influencers",
    subtitle: "Repurpose your content at scale",
    points: [
      "Turn your long-form videos into multiple Shorts automatically",
      "Maintain consistent upload frequency across both channels",
      "Grow your Shorts audience alongside your main channel",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Enter a topic",
    desc: "Type anything — a country, concept, or event. AI writes a 10-scene script instantly.",
  },
  {
    n: "02",
    title: "Review & edit",
    desc: "Read each scene, edit any line. Fine-tune keywords before searching for footage.",
  },
  {
    n: "03",
    title: "Pick your clips",
    desc: "Browse Pexels & Pixabay clips per scene. Hover to preview. Click to select.",
  },
  {
    n: "04",
    title: "Pick a theme",
    desc: "Choose subtitle style, color, and clip transitions. Fine-tune or use a preset.",
  },
  {
    n: "05",
    title: "Generate & download",
    desc: "AI stitches clips, adds voiceover, burns subtitles, mixes music. Download MP4.",
  },
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: "$0", yearly: "$0" },
    desc: "Try before you commit. 5 Shorts total, forever.",
    cta: "Start Free",
    ctaStyle:
      "border border-zinc-700 text-zinc-200 hover:border-emerald-400 hover:text-emerald-400",
    highlight: false,
    limits: [
      { text: "5 Shorts lifetime (never resets)", ok: true },
      { text: "AI Shorts Maker only", ok: true },
      { text: "TTS — 200 words max", ok: true },
      { text: "2 voices available", ok: true },
      { text: "3 voice previews per session", ok: true },
      { text: "Manual Editor", ok: false },
      { text: "Long → Shorts converter", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: "$19", yearly: "$25" },
    priceSub: { monthly: "/ month", yearly: "/ mo, billed yearly" },
    badge: "Most Popular",
    desc: "For creators who publish consistently.",
    cta: "Get Pro",
    ctaStyle: "bg-emerald-400 text-black font-bold hover:opacity-85",
    highlight: true,
    yearlyNote: true,
    limits: [
      { text: "Unlimited Shorts", ok: true },
      { text: "AI Shorts Maker", ok: true },
      { text: "TTS — unlimited, all 8 voices", ok: true },
      { text: "Priority rendering speed", ok: true },
      { text: "Manual Editor (yearly only)", ok: true },
      { text: "Long → Shorts (yearly only)", ok: true },
      { text: "Lifetime access", ok: false },
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: { monthly: "$319", yearly: "$319" },
    priceSub: { monthly: "one-time payment", yearly: "one-time payment" },
    desc: "Pay once. Use forever. Every feature, unlimited.",
    cta: "Get Lifetime Access",
    ctaStyle:
      "border border-emerald-400/60 text-emerald-400 hover:bg-emerald-400 hover:text-black",
    highlight: false,
    limits: [
      { text: "Everything in Pro", ok: true },
      { text: "All 4 tools, forever", ok: true },
      { text: "All future tools included", ok: true },
      { text: "Unlimited everything", ok: true },
      { text: "Priority support", ok: true },
      { text: "Early access to new features", ok: true },
      { text: "No recurring charges, ever", ok: true },
    ],
  },
];

/* ── Reusable components ── */

function NavDropdown({ label, items, scrollTo }) {
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
          className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800
                        rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fadeup"
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                scrollTo(item.id ? `#${item.id}` : "#solutions");
              }}
              className="w-full flex items-start gap-3.5 px-4 py-3.5 hover:bg-zinc-800 transition-colors group text-left"
            >
              <span className="text-emerald-400 mt-0.5 shrink-0">
                {item.icon}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-zinc-200">
                    {item.name || item.title}
                  </p>
                  {item.label && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${item.labelColor}`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-zinc-500 leading-snug mt-0.5">
                  {item.desc || item.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Check({ ok }) {
  return ok ? (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0 mt-0.5"
    >
      <circle cx="10" cy="10" r="10" fill="#34d399" fillOpacity="0.12" />
      <path
        d="M6 10l3 3 5-5"
        stroke="#34d399"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0 mt-0.5 opacity-25"
    >
      <circle cx="10" cy="10" r="10" fill="#71717a" fillOpacity="0.12" />
      <path
        d="M7 13l6-6M13 13L7 7"
        stroke="#71717a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Main ── */
export default function Landing({ onGetStarted, onNavigate, user }) {
  const [billing, setBilling] = useState("yearly");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible")
        ),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (href) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 py-4
                      bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60"
      >
        <span className="font-museo text-emerald-400 font-bold tracking-widest text-sm">
          NOT A YT
        </span>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <NavDropdown label="Products" items={PRODUCTS} scrollTo={scrollTo} />
          <NavDropdown
            label="Solutions"
            items={SOLUTIONS}
            scrollTo={scrollTo}
          />
          <button
            onClick={() => scrollTo("#pricing")}
            className="text-[13px] text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg transition-colors"
          >
            Pricing
          </button>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-4 text-[12px] text-zinc-500">
          <button
            onClick={() => scrollTo("#products")}
            className="hover:text-zinc-300 transition-colors"
          >
            Products
          </button>
          <button
            onClick={() => scrollTo("#solutions")}
            className="hover:text-zinc-300 transition-colors"
          >
            Solutions
          </button>
          <button
            onClick={() => scrollTo("#pricing")}
            className="hover:text-zinc-300 transition-colors"
          >
            Pricing
          </button>
        </div>

        {user ? (
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 text-emerald-400 text-[13px] font-medium
                       border border-emerald-400/30 bg-emerald-400/5 px-5 py-2 rounded-full
                       hover:border-emerald-400 hover:bg-emerald-400/10 transition-all duration-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Dashboard
          </button>
        ) : (
          <button
            onClick={onGetStarted}
            className="text-zinc-400 text-[13px] font-medium border border-zinc-700 px-5 py-2 rounded-full
                       hover:border-emerald-400 hover:text-emerald-400 transition-colors duration-200"
          >
            Get Started
          </button>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 overflow-hidden">
        <div className="relative z-10 max-w-2xl pt-24">
          <p className="text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-7">
            AI-Powered · Fully Automated
          </p>
          <h1 className="font-display text-[clamp(48px,6vw,82px)] leading-[1.06] tracking-tight text-zinc-100 mb-7">
            Turn any topic
            <br />
            into a{" "}
            <span className="italic text-emerald-400">YouTube Short</span>
            <br />
            in minutes.
          </h1>
          <p className="text-zinc-400 text-[17px] leading-relaxed max-w-md mb-10">
            Generate a script, pick stock footage, add voiceover and subtitles —
            without touching a video editor.
          </p>
          {user ? (
            /* Logged in — show product cards inline */
            <div className="flex flex-col gap-3 mb-2">
              <p className="text-zinc-500 text-[13px] mb-1">
                Pick a tool to get started:
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {[
                  {
                    id: "shorts-maker",
                    name: "AI Shorts Maker",
                    label: "Live",
                    icon: "▶",
                  },
                  {
                    id: "tts",
                    name: "Text to Speech",
                    label: "Live",
                    icon: "🎙",
                  },
                  {
                    id: "manual-editor",
                    name: "Manual Editor",
                    label: "Soon",
                    icon: "✏",
                  },
                  {
                    id: "long-to-short",
                    name: "Long → Shorts",
                    label: "Soon",
                    icon: "⬇",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => p.label === "Live" && onNavigate?.(p.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all
                      ${
                        p.label === "Live"
                          ? "border-zinc-700 bg-zinc-900 hover:border-emerald-400/50 hover:bg-zinc-800 cursor-pointer"
                          : "border-zinc-800 bg-zinc-900/50 opacity-45 cursor-not-allowed"
                      }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-200 leading-none">
                        {p.name}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          p.label === "Live"
                            ? "text-emerald-400"
                            : "text-zinc-600"
                        }`}
                      >
                        {p.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-3 bg-emerald-400 text-black font-semibold
                           text-sm px-7 py-4 rounded-full hover:opacity-85 hover:-translate-y-px transition-all duration-200"
              >
                Start Creating Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => scrollTo("#pricing")}
                className="text-[14px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                View Pricing →
              </button>
            </div>
          )}
          {!user && (
            <p className="text-zinc-700 text-[12px]">
              No credit card required · 5 free Shorts included
            </p>
          )}
        </div>
        <div
          className="absolute top-0 right-0 w-1/2 h-full grid opacity-[0.035] pointer-events-none"
          style={{ gridTemplateColumns: "repeat(10,1fr)" }}
          aria-hidden="true"
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-white" />
          ))}
        </div>
        <div
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)",
          }}
        />
      </section>

      {/* ── PRODUCTS ── */}
      <section
        id="products"
        className="px-6 md:px-12 py-28 border-t border-zinc-800 scroll-mt-16"
      >
        <div className="max-w-5xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            Products
          </p>
          <h2 className="reveal font-display text-[clamp(32px,4vw,52px)] tracking-tight text-zinc-100 mb-4">
            Four tools. One platform.
          </h2>
          <p className="reveal text-zinc-500 text-[15px] mb-14 max-w-md">
            Everything you need to build and grow a Shorts channel — powered by
            AI.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCTS.map((p, i) => (
              <div
                key={p.id}
                id={p.id}
                className={`reveal group bg-zinc-900 border rounded-2xl p-7 transition-all duration-300
                  ${
                    p.label === "Live"
                      ? "border-zinc-800 hover:border-zinc-600"
                      : "border-zinc-800/40 opacity-70 hover:opacity-85"
                  }`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700
                                  flex items-center justify-center text-emerald-400
                                  group-hover:border-emerald-400/25 transition-colors"
                  >
                    {p.icon}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${p.labelColor}`}
                  >
                    {p.label}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-zinc-100 mb-2">
                  {p.name}
                </h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">
                  {p.desc}
                </p>
                {p.label === "Live" ? (
                  <button
                    onClick={() =>
                      user ? onNavigate?.(p.id) : onGetStarted?.()
                    }
                    className="text-[12px] text-emerald-400 hover:underline"
                  >
                    Try it now →
                  </button>
                ) : (
                  <p className="text-[12px] text-zinc-700">Coming soon</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 md:px-12 py-28 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            How it works
          </p>
          <h2 className="reveal font-display text-[clamp(32px,4vw,52px)] tracking-tight text-zinc-100 mb-16">
            From idea to Short in 5 steps
          </h2>
          <div className="divide-y divide-zinc-800">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="reveal grid gap-6 py-8"
                style={{
                  gridTemplateColumns: "72px 1fr",
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <span className="font-display text-[13px] text-zinc-600 tracking-wide pt-1">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[17px] font-medium text-zinc-100 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-zinc-400 leading-relaxed max-w-lg">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section
        id="solutions"
        className="px-6 md:px-12 py-28 border-t border-zinc-800 scroll-mt-16"
      >
        <div className="max-w-5xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            Solutions
          </p>
          <h2 className="reveal font-display text-[clamp(32px,4vw,52px)] tracking-tight text-zinc-100 mb-4">
            Built for creators who ship.
          </h2>
          <p className="reveal text-zinc-500 text-[15px] mb-14 max-w-lg">
            Whether you're just starting out or already have an audience — NOT A
            YT removes the friction.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOLUTIONS.map((s, i) => (
              <div
                key={i}
                className="reveal bg-zinc-900 border border-zinc-800 rounded-2xl p-8
                                      hover:border-zinc-700 transition-colors duration-200"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-3xl mb-5">{s.icon}</div>
                <h3 className="text-[20px] font-semibold text-zinc-100 mb-1">
                  {s.title}
                </h3>
                <p className="text-[13px] text-emerald-400 mb-6">
                  {s.subtitle}
                </p>
                <ul className="space-y-3">
                  {s.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="text-emerald-400 text-[11px] mt-1 shrink-0">
                        ✦
                      </span>
                      <span className="text-[14px] text-zinc-400 leading-snug">
                        {pt}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        className="px-6 md:px-12 py-28 border-t border-zinc-800 bg-zinc-900/30 scroll-mt-16"
      >
        <div className="max-w-5xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            Pricing
          </p>
          <h2 className="reveal font-display text-[clamp(32px,4vw,52px)] tracking-tight text-zinc-100 mb-4">
            Simple, honest pricing.
          </h2>
          <p className="reveal text-zinc-500 text-[15px] mb-10 max-w-md">
            Start free. No credit card. Upgrade when you're ready to go
            unlimited.
          </p>

          {/* Billing toggle */}
          <div className="reveal flex items-center gap-2 mb-12">
            {["monthly", "yearly"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`flex items-center gap-2 text-[13px] px-4 py-2 rounded-full border transition-all capitalize
                  ${
                    billing === b
                      ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                      : "border-zinc-800 text-zinc-600 hover:text-zinc-400"
                  }`}
              >
                {b}
                {b === "yearly" && (
                  <span
                    className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20
                                   px-1.5 py-0.5 rounded-full font-semibold"
                  >
                    All features
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={`reveal relative rounded-2xl p-7 border
                  ${
                    plan.highlight
                      ? "bg-zinc-900 border-emerald-400/35 shadow-xl shadow-emerald-400/5"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                    <span className="bg-emerald-400 text-black text-[11px] font-bold px-3 py-1 rounded-full shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-500 mb-4">
                  {plan.name}
                </p>

                <div className="mb-1 flex items-end gap-1.5">
                  <span className="font-display text-[44px] leading-none text-zinc-100">
                    {plan.price[billing]}
                  </span>
                  {plan.priceSub && (
                    <span className="text-[12px] text-zinc-600 pb-1">
                      {plan.priceSub[billing]}
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-zinc-500 mb-6 mt-2 min-h-[36px]">
                  {plan.desc}
                </p>

                {/* yearly note for pro plan on monthly billing */}
                {plan.yearlyNote && billing === "monthly" && (
                  <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2.5 mb-5">
                    <p className="text-[11px] text-amber-400 leading-snug">
                      ⚠ Switch to yearly billing to unlock Manual Editor and
                      Long → Shorts
                    </p>
                  </div>
                )}

                <button
                  onClick={plan.id === "free" ? onGetStarted : undefined}
                  className={`w-full py-3 rounded-xl text-[14px] transition-all duration-200 mb-7 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-2.5 border-t border-zinc-800 pt-6">
                  {plan.limits.map((item, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <Check ok={item.ok} />
                      <span
                        className={`text-[13px] leading-snug ${
                          item.ok ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="reveal text-center text-zinc-700 text-[12px] mt-8">
            SSL encrypted · Payments via Stripe · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="px-6 md:px-12 py-28 border-t border-zinc-800 text-center">
        <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-6">
          Get started today
        </p>
        <h2 className="reveal font-display text-[clamp(32px,4vw,52px)] tracking-tight text-zinc-100 mb-5">
          Your first Short is 5 minutes away.
        </h2>
        {user ? (
          <button
            onClick={() => onNavigate?.("shorts-maker")}
            className="reveal inline-flex items-center gap-3 bg-emerald-400 text-black font-semibold
                       text-sm px-8 py-4 rounded-full hover:opacity-85 hover:-translate-y-px transition-all duration-200"
          >
            Open Shorts Maker →
          </button>
        ) : (
          <>
            <p className="reveal text-zinc-600 text-[15px] mb-10">
              No credit card required. 5 free Shorts included.
            </p>
            <button
              onClick={onGetStarted}
              className="reveal inline-flex items-center gap-3 bg-emerald-400 text-black font-semibold
                         text-sm px-8 py-4 rounded-full hover:opacity-85 hover:-translate-y-px transition-all duration-200"
            >
              Start Creating Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-7 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-museo text-emerald-400 font-bold tracking-widest text-sm">
            NOT A YT
          </span>
          <div className="flex items-center gap-6 text-zinc-600 text-[12px]">
            <button
              onClick={() => scrollTo("#products")}
              className="hover:text-zinc-400 transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => scrollTo("#solutions")}
              className="hover:text-zinc-400 transition-colors"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollTo("#pricing")}
              className="hover:text-zinc-400 transition-colors"
            >
              Pricing
            </button>
          </div>
          <span className="text-zinc-700 text-[12px]">
            © 2025 Not A YT. Built for creators.
          </span>
        </div>
      </footer>
    </div>
  );
}
