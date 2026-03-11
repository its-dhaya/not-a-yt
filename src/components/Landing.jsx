import { useEffect, useRef } from "react";

function Landing({ onGetStarted }) {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav className="land-nav">
        <span className="land-logo">NOT A YT</span>
        <button className="land-nav-btn" onClick={onGetStarted}>
          Get Started
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="land-hero" ref={heroRef}>
        <div className="land-hero-inner">
          <p className="land-eyebrow">AI-Powered · Fully Automated</p>
          <h1 className="land-headline">
            Turn any topic into a<br />
            <span className="land-accent">YouTube Short</span>
            <br />
            in minutes.
          </h1>
          <p className="land-sub">
            Generate a script, pick stock footage, add voiceover and subtitles —
            all without touching a video editor.
          </p>
          <button className="land-cta" onClick={onGetStarted}>
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

        {/* decorative grid */}
        <div className="land-grid-bg" aria-hidden="true">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="land-grid-cell" />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-section">
        <div className="land-section-inner">
          <p className="land-label reveal">How it works</p>
          <h2 className="land-section-title reveal">
            Four steps to a finished video
          </h2>

          <div className="land-steps">
            {[
              {
                num: "01",
                title: "Enter a topic",
                desc: "Type anything — a country, a person, a scientific concept. Our AI writes a punchy 10-scene facts script instantly.",
              },
              {
                num: "02",
                title: "Review & edit keywords",
                desc: "Each scene gets an auto-suggested stock footage keyword. Edit any of them before searching.",
              },
              {
                num: "03",
                title: "Pick your clips",
                desc: "Browse clips from Pexels and Pixabay for each scene. Select the one that fits best.",
              },
              {
                num: "04",
                title: "Generate & download",
                desc: "We stitch the clips, add an AI voiceover, burn in subtitles, and mix background music. Download the final MP4.",
              },
            ].map((step, i) => (
              <div
                className="land-step reveal"
                key={i}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="land-step-num">{step.num}</span>
                <div>
                  <h3 className="land-step-title">{step.title}</h3>
                  <p className="land-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="land-section land-section--alt">
        <div className="land-section-inner">
          <p className="land-label reveal">Features</p>
          <h2 className="land-section-title reveal">Everything included</h2>

          <div className="land-features">
            {[
              {
                icon: "✦",
                title: "AI Script Generation",
                desc: "Groq-powered LLM writes a 10-scene facts script in seconds.",
              },
              {
                icon: "◈",
                title: "Stock Footage Search",
                desc: "Searches Pexels and Pixabay simultaneously for the best matching clips.",
              },
              {
                icon: "◎",
                title: "Neural Voiceover",
                desc: "Edge TTS with natural-sounding voices. No recording needed.",
              },
              {
                icon: "⬡",
                title: "Auto Subtitles",
                desc: "Whisper transcribes and burns in accurate subtitles automatically.",
              },
              {
                icon: "⟡",
                title: "Background Music",
                desc: "Subtle background track mixed at the right volume automatically.",
              },
              {
                icon: "◻",
                title: "9:16 Format Ready",
                desc: "Every clip is scaled and cropped to vertical short format.",
              },
            ].map((f, i) => (
              <div
                className="land-feature reveal"
                key={i}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="land-feature-icon">{f.icon}</span>
                <h3 className="land-feature-title">{f.title}</h3>
                <p className="land-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="land-footer-cta">
        <div className="land-section-inner" style={{ textAlign: "center" }}>
          <h2 className="land-section-title reveal">
            Ready to make your first Short?
          </h2>
          <button
            className="land-cta reveal"
            onClick={onGetStarted}
            style={{ margin: "0 auto" }}
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
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <span className="land-logo">NOT A YT</span>
        <span className="land-footer-copy">
          Built for creators who move fast.
        </span>
      </footer>
    </div>
  );
}

export default Landing;
