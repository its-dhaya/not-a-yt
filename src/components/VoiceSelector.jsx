import { useState, useRef } from "react";

const VOICES = [
  {
    id: "en-US-JennyNeural",
    label: "Jenny",
    accent: "🇺🇸 US",
    gender: "Female",
  },
  { id: "en-US-GuyNeural", label: "Guy", accent: "🇺🇸 US", gender: "Male" },
  {
    id: "en-GB-SoniaNeural",
    label: "Sonia",
    accent: "🇬🇧 UK",
    gender: "Female",
  },
  { id: "en-GB-RyanNeural", label: "Ryan", accent: "🇬🇧 UK", gender: "Male" },
  {
    id: "en-AU-NatashaNeural",
    label: "Natasha",
    accent: "🇦🇺 AU",
    gender: "Female",
  },
  {
    id: "en-AU-WilliamNeural",
    label: "William",
    accent: "🇦🇺 AU",
    gender: "Male",
  },
  {
    id: "en-IN-NeerjaNeural",
    label: "Neerja",
    accent: "🇮🇳 IN",
    gender: "Female",
  },
  {
    id: "en-IN-PrabhatNeural",
    label: "Prabhat",
    accent: "🇮🇳 IN",
    gender: "Male",
  },
];

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const PREVIEW_TEXT = "Welcome to Not A YT. Let's create your YouTube Short.";

function VoiceSelector({ selectedVoice, onSelect }) {
  const [previewing, setPreviewing] = useState(null); // voice id currently loading/playing
  const audioRef = useRef(null);

  const previewVoice = async (voiceId) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking same voice that's playing — just stop
    if (previewing === voiceId) {
      setPreviewing(null);
      return;
    }

    setPreviewing(voiceId);

    try {
      const res = await fetch(`${BASE_URL}/preview-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceId, text: PREVIEW_TEXT }),
      });

      if (!res.ok) throw new Error("Preview failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.play();
      audio.onended = () => {
        setPreviewing(null);
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Voice preview error:", err);
      setPreviewing(null);
    }
  };

  return (
    <div className="card">
      <p className="card-title">Voice</p>

      <div className="voice-grid">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPreviewing = previewing === voice.id;

          return (
            <div
              key={voice.id}
              className={`voice-card ${
                isSelected ? "voice-card--selected" : ""
              }`}
              onClick={() => onSelect(voice.id)}
            >
              <div className="voice-card-top">
                <span className="voice-accent">{voice.accent}</span>
                <span className="voice-gender">{voice.gender}</span>
              </div>

              <p className="voice-name">{voice.label}</p>

              {/* preview button */}
              <button
                className="voice-preview-btn"
                onClick={(e) => {
                  e.stopPropagation(); // don't trigger card select
                  previewVoice(voice.id);
                }}
                title="Preview voice"
              >
                {isPreviewing ? (
                  // animated bars when playing
                  <span className="voice-playing">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  // play icon
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                  </svg>
                )}
                <span>{isPreviewing ? "Playing..." : "Preview"}</span>
              </button>

              {isSelected && <span className="voice-selected-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { VOICES };
export default VoiceSelector;
