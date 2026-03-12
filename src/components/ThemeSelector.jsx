import { useState } from "react";
import { THEMES } from "../constants/theme";

const TRANSITIONS = [
  { id: "fade", label: "Fade" },
  { id: "slideleft", label: "Slide" },
  { id: "zoomin", label: "Zoom In" },
  { id: "wipeleft", label: "Wipe" },
  { id: "dissolve", label: "Dissolve" },
];

const TEXT_ANIMATIONS = [
  { id: "none", label: "None" },
  { id: "fadeup", label: "Fade Up" },
  { id: "pop", label: "Pop" },
];

const POSITIONS = [
  { id: "bottom", label: "Bottom" },
  { id: "center", label: "Top" },
  { id: "top", label: "Center" },
];

function Slider({ label, value, min, max, step = 1, onChange, suffix = "" }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-zinc-400">{label}</span>
        <span className="text-[12px] font-semibold text-zinc-200">
          {value}
          {suffix}
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

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all
            ${
              value === o.id
                ? "bg-emerald-400 border-emerald-400 text-black font-semibold"
                : "border-zinc-700 text-zinc-400 hover:border-emerald-400/50 hover:text-zinc-200"
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ThemeSelector({
  selectedTheme,
  customSettings,
  onSelect,
  onSettingsChange,
}) {
  const [showTune, setShowTune] = useState(false);
  const current = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
  const settings = customSettings || current.settings;

  const updateSetting = (key, val) => {
    onSettingsChange({ ...settings, [key]: val });
  };

  const handleThemeSelect = (id) => {
    const t = THEMES.find((th) => th.id === id);
    onSelect(id);
    onSettingsChange({ ...t.settings }); // reset to theme defaults
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-7 mb-5 animate-fadeup">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500 mb-1">
            Video Theme
          </p>
          <p className="text-[13px] text-zinc-400">
            Pick a preset then fine-tune to your liking
          </p>
        </div>
        {selectedTheme && (
          <span
            className="text-[12px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20
                           px-3 py-1 rounded-full shrink-0"
          >
            {current.name}
          </span>
        )}
      </div>

      {/* Theme preset cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        {THEMES.map((t) => {
          const active = selectedTheme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              className={`relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden
                ${
                  active
                    ? `${t.activeBorder} ${t.activeBg}`
                    : `${t.border} bg-zinc-800/50 hover:border-zinc-500`
                }`}
            >
              {/* Mini preview */}
              <div
                className={`h-20 bg-gradient-to-b ${t.previewGrad} flex flex-col items-center justify-end pb-2 px-2`}
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className="h-1.5 rounded-full opacity-90"
                    style={{ background: t.previewBar, width: "78%" }}
                  />
                  <div
                    className="h-1.5 rounded-full opacity-50"
                    style={{ background: t.previewBar, width: "52%" }}
                  />
                </div>
              </div>

              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[12px] ${t.iconColor}`}>{t.icon}</span>
                  <span
                    className={`text-[12px] font-semibold ${
                      active ? "text-zinc-100" : "text-zinc-300"
                    }`}
                  >
                    {t.name}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-snug">
                  {t.desc}
                </p>
              </div>

              {active && (
                <div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-400
                                flex items-center justify-center"
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 5l2.5 2.5 4.5-4.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fine-tune toggle */}
      <button
        onClick={() => setShowTune((p) => !p)}
        className="flex items-center gap-2 text-[13px] text-zinc-400 hover:text-emerald-400
                   transition-colors border border-zinc-700 hover:border-emerald-400/50
                   px-4 py-2 rounded-xl w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
          </svg>
          Fine-tune settings
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${showTune ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Fine-tune panel */}
      {showTune && (
        <div className="mt-4 border border-zinc-800 rounded-xl p-5 grid gap-6 animate-fadeup">
          {/* Row 1 — subtitle color + bold */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-[12px] text-zinc-400 mb-2">Subtitle Color</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.subtitleColor}
                  onChange={(e) =>
                    updateSetting("subtitleColor", e.target.value)
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700
                             p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md"
                />
                <span className="text-[13px] font-mono text-zinc-300">
                  {settings.subtitleColor}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[12px] text-zinc-400 mb-2">Bold Text</p>
              <button
                onClick={() => updateSetting("bold", !settings.bold)}
                className={`px-5 py-2 rounded-xl text-[13px] font-semibold border transition-all
                  ${
                    settings.bold
                      ? "bg-emerald-400 border-emerald-400 text-black"
                      : "border-zinc-700 text-zinc-400 hover:border-emerald-400/50"
                  }`}
              >
                {settings.bold ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Row 2 — sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Slider
              label="Font Size"
              value={settings.fontSize}
              min={8}
              max={20}
              step={1}
              onChange={(v) => updateSetting("fontSize", v)}
              suffix="pt"
            />
            <Slider
              label="Outline"
              value={settings.outline}
              min={0}
              max={4}
              step={0.5}
              onChange={(v) => updateSetting("outline", v)}
            />
            <Slider
              label="Shadow"
              value={settings.shadow}
              min={0}
              max={3}
              step={0.5}
              onChange={(v) => updateSetting("shadow", v)}
            />
          </div>

          {/* Row 3 — position */}
          <div>
            <p className="text-[12px] text-zinc-400 mb-2">Subtitle Position</p>
            <ToggleGroup
              options={POSITIONS}
              value={settings.position}
              onChange={(v) => updateSetting("position", v)}
            />
          </div>

          {/* Row 4 — transition */}
          <div>
            <p className="text-[12px] text-zinc-400 mb-2">Clip Transition</p>
            <ToggleGroup
              options={TRANSITIONS}
              value={settings.transition}
              onChange={(v) => updateSetting("transition", v)}
            />
          </div>

          {/* Row 5 — text animation */}
          <div>
            <p className="text-[12px] text-zinc-400 mb-2">Text Animation</p>
            <ToggleGroup
              options={TEXT_ANIMATIONS}
              value={settings.textAnimation}
              onChange={(v) => updateSetting("textAnimation", v)}
            />
          </div>

          {/* Reset to theme defaults */}
          <button
            onClick={() => onSettingsChange({ ...current.settings })}
            className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors self-start"
          >
            ↺ Reset to {current.name} defaults
          </button>
        </div>
      )}
    </div>
  );
}
