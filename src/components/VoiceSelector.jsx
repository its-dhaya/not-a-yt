import { useState, useRef } from "react";
import { VOICES } from "../constants/voices";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const PREVIEW_TEXT = "Welcome to Not A YT. Let's create your YouTube Short.";

export default function VoiceSelector({ selectedVoice, onSelect }) {
  const [previewing, setPreviewing] = useState(null);
  const audioRef = useRef(null);

  const previewVoice = async (id) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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
        body: JSON.stringify({ voice: id, text: PREVIEW_TEXT }),
      });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPreviewing(null);
    } catch {
      setPreviewing(null);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-5 animate-fadeup">
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500 mb-5">
        Choose Voice
      </p>
      <div className="grid grid-cols-4 gap-3">
        {VOICES.map((v) => {
          const sel = selectedVoice === v.id;
          const prev = previewing === v.id;
          return (
            <div
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${
                  sel
                    ? "border-emerald-400 bg-emerald-400/5"
                    : "border-zinc-700 bg-zinc-800 hover:border-emerald-400/50"
                }`}
            >
              {sel && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-zinc-400">{v.accent}</span>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
                  {v.gender}
                </span>
              </div>
              <p className="text-[16px] font-semibold text-zinc-100 mb-3">
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
  );
}
