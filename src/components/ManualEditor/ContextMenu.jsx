import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon, Sep } from "./Icon";
import { SPEED_OPTIONS, FILTER_OPTIONS } from "./utils";

/* ── Action row button ── */
function ActionBtn({ icon, label, onClick, danger, accent, disabled }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(); }}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed min-w-[52px]
        ${accent  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20"
        : danger  ? "border-transparent text-red-400 hover:bg-red-400/10"
        :           "border-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
    >
      <Icon d={icon} size={16} />
      <span className="text-[9px] font-semibold whitespace-nowrap">{label}</span>
    </button>
  );
}

/* ── Section label ── */
const SectionLabel = ({ children }) => (
  <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500 px-1 mb-1.5">{children}</p>
);

/* ══════════════════════════════════════════════
   MAIN CONTEXT MENU  — renders as a portal dropup
══════════════════════════════════════════════ */
export function ContextMenu({ ctxMenu, store }) {
  const {
    clips, setCtxMenu,
    splitClip, deleteClip, duplicateClip, updateClip,
    addOverlay, currentTime, totalDuration,
    addSubtitle,
  } = store;

  const menuRef = useRef(null);
  const clip    = clips.find((c) => c.id === ctxMenu?.clipId);

  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setCtxMenu(null);
    };
    const esc = (e) => { if (e.key === "Escape") setCtxMenu(null); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", close);
      window.addEventListener("keydown",   esc);
    }, 10);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown",   esc);
    };
  }, []);

  if (!ctxMenu || !clip) return null;

  /* ── Position: dropup (always above cursor) ── */
  const MENU_W = 300;
  const x = Math.min(Math.max(ctxMenu.x - MENU_W / 2, 8), window.innerWidth - MENU_W - 8);
  // Appear above cursor — estimate height ~520px
  const y = Math.max(8, ctxMenu.y - 530);

  const close  = () => setCtxMenu(null);
  const run    = (fn) => { fn(); close(); };

  const clipVol  = clip.volume  ?? 1;
  const clipSpd  = clip.speed   ?? 1;
  const clipFilt = clip.filter  ?? "";

  return createPortal(
    <div
      ref={menuRef}
      className="bg-[#141416]/98 backdrop-blur-2xl border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/80"
      style={{ position: "fixed", left: x, top: y, width: MENU_W, zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Clip header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80">
        {clip.thumb && (
          <img src={clip.thumb} className="w-14 h-8 rounded-lg object-cover shrink-0 ring-1 ring-zinc-700" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-100 truncate">{clip.name.replace(/\.[^.]+$/, "")}</p>
          <p className="text-[10px] text-zinc-500 mono mt-0.5">
            {(clip.trimEnd - clip.trimStart).toFixed(2)}s
            <span className="mx-1.5 text-zinc-700">·</span>
            {Math.round(clipVol * 100)}% vol
            <span className="mx-1.5 text-zinc-700">·</span>
            {clipSpd}× speed
          </p>
        </div>
        <button onClick={close} className="text-zinc-600 hover:text-zinc-400 p-1 transition-colors shrink-0">
          <Icon d="M18 6L6 18M6 6l12 12" size={13} />
        </button>
      </div>

      <div className="p-3 space-y-4">

        {/* ── Quick action buttons row ── */}
        <div className="flex items-center gap-1 bg-zinc-900/60 rounded-xl p-1">
          <ActionBtn
            icon="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
            label="Split" accent
            onClick={() => { splitClip(currentTime); close(); }}
          />
          <ActionBtn
            icon="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"
            label="Trim"
            onClick={() => run(() => {})}
          />
          <ActionBtn
            icon="M8 17l4 4 4-4m-4-5v9M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"
            label="Duplicate"
            onClick={() => run(() => duplicateClip(clip.id))}
          />
          <ActionBtn
            icon="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
            label="Flip"
            onClick={() => run(() => {})}
          />
          <div className="flex-1" />
          <ActionBtn
            icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            label="Delete" danger
            onClick={() => run(() => deleteClip(clip.id))}
          />
        </div>

        {/* ── Volume ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Volume</SectionLabel>
            <span className="text-[10px] mono text-zinc-400">{Math.round(clipVol * 100)}%</span>
          </div>
          <div className="flex items-center gap-3 px-1">
            <button onClick={() => updateClip(clip.id, { volume: 0 })}
              className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
              <Icon d="M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" size={14} />
            </button>
            <div className="relative flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden cursor-pointer group/vol"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                updateClip(clip.id, { volume: Math.round(((e.clientX - r.left) / r.width) * 20) / 20 });
              }}
            >
              <div className="h-full bg-emerald-400 rounded-full pointer-events-none"
                style={{ width: `${clipVol * 100}%` }} />
              <input type="range" min={0} max={1} step={0.05} value={clipVol}
                onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
                className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <button onClick={() => updateClip(clip.id, { volume: 1 })}
              className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
              <Icon d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z" size={14} />
            </button>
          </div>
          {/* Preset dots */}
          <div className="flex justify-between px-1 mt-1.5">
            {[0, 25, 50, 75, 100].map((v) => (
              <button key={v}
                onClick={() => updateClip(clip.id, { volume: v / 100 })}
                className={`text-[9px] mono px-1.5 py-0.5 rounded transition-all
                  ${Math.round(clipVol * 100) === v
                    ? "bg-emerald-400 text-black font-bold"
                    : "text-zinc-600 hover:text-zinc-300"}`}
              >{v}%</button>
            ))}
          </div>
        </div>

        <Sep />

        {/* ── Speed ── */}
        <div>
          <SectionLabel>Playback Speed</SectionLabel>
          <div className="grid grid-cols-7 gap-1">
            {SPEED_OPTIONS.map(({ label, v }) => (
              <button key={v}
                onClick={() => updateClip(clip.id, { speed: v })}
                className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all text-center
                  ${clipSpd === v
                    ? "bg-emerald-400 border-emerald-400 text-black shadow-sm"
                    : "border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Sep />

        {/* ── Filters ── */}
        <div>
          <SectionLabel>Filter</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {FILTER_OPTIONS.map(({ label, css }) => (
              <button key={label}
                onClick={() => updateClip(clip.id, { filter: css })}
                className={`py-2 rounded-xl text-[10px] font-semibold border transition-all
                  ${clipFilt === css
                    ? "bg-emerald-400/15 border-emerald-400/50 text-emerald-400"
                    : "border-zinc-700/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Sep />

        {/* ── Extra actions ── */}
        <div className="flex flex-col gap-0.5">
          <FullRowBtn
            icon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            label="Add caption at playhead"
            onClick={() => run(() => addOverlay(currentTime, totalDuration))}
          />
          <FullRowBtn
            icon="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z"
            label="Extract audio"
            kbd="Ctrl+Shift+E"
            onClick={() => run(() => {})}
          />
          <FullRowBtn
            icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            label="Replace video"
            onClick={() => run(() => document.getElementById("clip-inp")?.click())}
          />
          <FullRowBtn
            icon="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78"
            label="Detach from background"
            onClick={() => run(() => {})}
          />
        </div>

      </div>

      {/* ── Arrow pointer pointing down ── */}
      <div className="flex justify-center pb-1">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px]
                        border-l-transparent border-r-transparent border-t-zinc-700/60" />
      </div>
    </div>,
    document.body
  );
}

/* full-width list row */
function FullRowBtn({ icon, label, kbd, onClick, danger }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all
        ${danger ? "text-red-400 hover:bg-red-400/10" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
    >
      <Icon d={icon} size={13} className={danger ? "text-red-400" : "text-zinc-500"} />
      <span className="flex-1 text-left">{label}</span>
      {kbd && <span className="text-[9px] text-zinc-600 mono">{kbd}</span>}
    </button>
  );
}
