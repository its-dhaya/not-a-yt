import { useState, useRef } from "react";
import { VOICES } from "../constants/voices";
import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const getAuthHeader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${session.access_token}` };
};

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-zinc-400">{label}</span>
        <span className="text-[12px] font-semibold text-zinc-200">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

export default function TtsPage() {
  const [text, setText] = useState("");
  const [selectedVoice, setVoice] = useState("en-US-JennyNeural");
  const [speed, setSpeed] = useState(0); // -50 to +50 (% offset)
  const [pitch, setPitch] = useState(0); // -50 to +50 (Hz offset)
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const audioRef = useRef(null);

  const MAX_CHARS = 5000;

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setText(val);
      setCharCount(val.length);
    }
  };

  const speedDisplay =
    speed === 0 ? "Normal" : speed > 0 ? `+${speed}%` : `${speed}%`;
  const pitchDisplay =
    pitch === 0 ? "Normal" : pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`;

  const generate = async () => {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }
    setError(null);
    setLoading(true);
    setAudioUrl(null);

    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${BASE_URL}/generate-tts`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice, speed, pitch }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate audio");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "not-a-yt-tts.mp3";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const [previewing, setPreviewing] = useState(null);
  const previewAudioRef = useRef(null);

  const previewVoice = async (id) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewing === id) {
      setPreviewing(null);
      return;
    }
    setPreviewing(id);
    try {
      const res = await fetch(`${BASE_URL}/preview-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: id,
          text: "Welcome to Not A YT. Let's create your YouTube Short.",
        }),
      });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      previewAudioRef.current = audio;
      audio.play();
      audio.onended = () => setPreviewing(null);
    } catch {
      setPreviewing(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans pt-20 px-4 sm:px-8 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-2">
            Text to Speech
          </p>
          <h1 className="font-display text-[28px] text-zinc-100 tracking-tight">
            Script to Voice
          </h1>
          <p className="text-zinc-500 text-[13px] mt-1">
            Paste your script, pick a voice, download the MP3.
          </p>
        </div>

        {/* Text input */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500">
              Your Script
            </p>
            <span
              className={`text-[12px] ${
                charCount > MAX_CHARS * 0.9 ? "text-amber-400" : "text-zinc-600"
              }`}
            >
              {charCount} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Type or paste your script here..."
            rows={8}
            className="w-full bg-transparent text-zinc-200 text-[14px] leading-relaxed resize-none
                       placeholder:text-zinc-700 focus:outline-none"
          />
        </div>

        {/* Voice selector */}
        {/* Voice selector with preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Voice
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VOICES.map((v) => {
              const active = selectedVoice === v.id;
              const prev = previewing === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`relative p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200
            ${
              active
                ? "border-emerald-400 bg-emerald-400/5"
                : "border-zinc-700 bg-zinc-800 hover:border-emerald-400/50"
            }`}
                >
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400">
                      {v.accent}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
                      {v.gender}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-zinc-100 mb-2.5">
                    {v.label}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewVoice(v.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 border border-zinc-700
                       px-2.5 py-1 rounded-full hover:border-emerald-400 hover:text-emerald-400 transition-colors"
                  >
                    {prev ? (
                      <span className="vbar inline-flex items-end gap-[2px] h-3">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                      </svg>
                    )}
                    {prev ? "Playing" : "Preview"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Speed + Pitch */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-5">
            Adjustments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Slider
              label="Speed"
              value={speed}
              min={-50}
              max={50}
              step={5}
              display={speedDisplay}
              onChange={setSpeed}
            />
            <Slider
              label="Pitch"
              value={pitch}
              min={-50}
              max={50}
              step={5}
              display={pitchDisplay}
              onChange={setPitch}
            />
          </div>
          {(speed !== 0 || pitch !== 0) && (
            <button
              onClick={() => {
                setSpeed(0);
                setPitch(0);
              }}
              className="mt-4 text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ↺ Reset to defaults
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-[13px] text-red-400">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading || !text.trim()}
          className="w-full py-4 rounded-2xl font-semibold text-[15px] transition-all mb-5
                     bg-emerald-400 text-black hover:opacity-85 hover:-translate-y-px
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.2"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Voice"
          )}
        </button>

        {/* Audio player + download */}
        {audioUrl && (
          <div className="bg-zinc-900 border border-emerald-400/20 rounded-2xl p-5 animate-fadeup">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-emerald-400">
                Ready to download
              </p>
              <button
                onClick={download}
                className="flex items-center gap-2 bg-emerald-400 text-black text-[13px] font-semibold
                           px-4 py-2 rounded-xl hover:opacity-85 transition-opacity"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download MP3
              </button>
            </div>
            <audio
              ref={audioRef}
              controls
              src={audioUrl}
              className="w-full h-10
              [&::-webkit-media-controls-panel]:bg-zinc-800
              [&::-webkit-media-controls-current-time-display]:text-zinc-300
              [&::-webkit-media-controls-time-remaining-display]:text-zinc-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
