import { useEffect } from "react";

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
    title: "Generate & download",
    desc: "AI stitches clips, adds voiceover, burns subtitles, mixes music. Download MP4.",
  },
];

const FEATURES = [
  {
    icon: "✦",
    title: "AI Script Generation",
    desc: "Groq LLM writes a punchy 10-scene facts script in seconds.",
  },
  {
    icon: "◈",
    title: "Stock Footage Search",
    desc: "Pexels + Pixabay searched simultaneously for best matching clips.",
  },
  {
    icon: "◎",
    title: "Neural Voiceover",
    desc: "8 Edge TTS voices across US, UK, AU and IN accents.",
  },
  {
    icon: "⬡",
    title: "Auto Subtitles",
    desc: "Whisper transcribes and burns in accurate subtitles automatically.",
  },
  {
    icon: "⟡",
    title: "Background Music",
    desc: "Subtle background track auto-mixed at the right volume.",
  },
  {
    icon: "◻",
    title: "9:16 Format Ready",
    desc: "Every clip scaled and cropped to vertical Shorts format.",
  },
];

export default function Landing({ onGetStarted }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible")
        ),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      {/* NAV */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-12 py-4
                      bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800"
      >
        <span className="font-museo text-emerald-400 text-2xl font-bold tracking-wide">
          NOT A YT
        </span>
        <button
          onClick={onGetStarted}
          className="text-zinc-400 text-[13px] font-medium border border-zinc-700 px-5 py-2 rounded-full
                     hover:border-emerald-400 hover:text-emerald-400 transition-colors duration-200"
        >
          Get Started
        </button>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-12 overflow-hidden">
        <div className="relative z-10 max-w-2xl pt-24">
          <p className="text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-7">
            AI-Powered · Fully Automated
          </p>
          <h1 className="font-display text-[clamp(52px,6vw,82px)] leading-[1.06] tracking-tight text-zinc-100 mb-7">
            Turn any topic
            <br />
            into a{" "}
            <span className="italic text-emerald-400">YouTube Short</span>
            <br />
            in minutes.
          </h1>
          <p className="text-zinc-400 text-[17px] leading-relaxed max-w-md mb-12">
            Generate a script, pick stock footage, add voiceover and subtitles —
            without touching a video editor.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-emerald-400 text-black font-semibold
                       text-sm px-7 py-4 rounded-full hover:opacity-85 hover:-translate-y-px
                       transition-all duration-200"
          >
            Start Creating
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
        </div>

        {/* grid decoration */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full grid opacity-[0.04] pointer-events-none"
          style={{ gridTemplateColumns: "repeat(10,1fr)" }}
          aria-hidden="true"
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-white" />
          ))}
        </div>
        {/* glow */}
        <div
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)",
          }}
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="px-12 py-28 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            How it works
          </p>
          <h2 className="reveal font-display text-[clamp(34px,4vw,52px)] tracking-tight text-zinc-100 mb-16">
            Four steps to a finished video
          </h2>
          <div className="divide-y divide-zinc-800">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="reveal grid gap-6 py-8"
                style={{
                  gridTemplateColumns: "72px 1fr",
                  animationDelay: `${i * 0.1}s`,
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

      {/* FEATURES */}
      <section className="px-12 py-28 border-t border-zinc-800 bg-zinc-900/40">
        <div className="max-w-4xl mx-auto">
          <p className="reveal text-emerald-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            Features
          </p>
          <h2 className="reveal font-display text-[clamp(34px,4vw,52px)] tracking-tight text-zinc-100 mb-16">
            Everything included
          </h2>
          <div className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="reveal bg-zinc-950 hover:bg-zinc-900 p-9 transition-colors duration-200"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="block text-emerald-400 text-xl mb-4">
                  {f.icon}
                </span>
                <h3 className="text-[15px] font-semibold text-zinc-100 mb-2">
                  {f.title}
                </h3>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="px-12 py-28 border-t border-zinc-800 text-center">
        <h2 className="reveal font-display text-[clamp(34px,4vw,52px)] tracking-tight text-zinc-100 mb-10">
          Ready to make your first Short?
        </h2>
        <button
          onClick={onGetStarted}
          className="reveal inline-flex items-center gap-3 bg-emerald-400 text-black font-semibold
                     text-sm px-7 py-4 rounded-full hover:opacity-85 hover:-translate-y-px transition-all duration-200"
        >
          Get Started Free
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
      </section>

      {/* FOOTER */}
      <footer className="px-12 py-7 border-t border-zinc-800 flex items-center justify-between">
        <span className="font-museo text-emerald-400 text-2xl font-bold tracking-wide">
          NOT A YT
        </span>
        <span className="text-zinc-600 text-[13px]">
          Built for creators who move fast.
        </span>
      </footer>
    </div>
  );
}
