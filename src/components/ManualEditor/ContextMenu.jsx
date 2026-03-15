import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon, KBD, Sep } from "./Icon";
import { SPEED_OPTIONS } from "./utils";

function CItem({ icon, label, kbd, onClick, danger, disabled, arrow }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(); }}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium
                  transition-all cursor-pointer group/ci
        ${danger   ? "text-red-400 hover:bg-red-400/10 hover:text-red-300"
                   : "text-zinc-200 hover:bg-zinc-700/50 hover:text-white"}
        ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {icon && (
        <Icon d={icon} size={13}
          className={`shrink-0 ${danger ? "text-red-400" : "text-zinc-400 group-hover/ci:text-zinc-300"}`} />
      )}
      <span className="flex-1 text-left">{label}</span>
      {kbd   && <KBD k={kbd} />}
      {arrow && <Icon d="M9 18l6-6-6-6" size={11} className="text-zinc-500" />}
    </button>
  );
}

export function ContextMenu({ ctxMenu, store }) {
  const {
    clips, setCtxMenu,
    splitClip, deleteClip, duplicateClip, updateClip,
    addOverlay, currentTime, totalDuration,
  } = store;

  const clip = clips.find((c) => c.id === ctxMenu?.clipId);

  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest("[data-ctxmenu]")) setCtxMenu(null);
    };
    const esc = (e) => { if (e.key === "Escape") setCtxMenu(null); };
    // Delay slightly so the right-click that opened it doesn't instantly close it
    const t = setTimeout(() => {
      window.addEventListener("mousedown", close);
      window.addEventListener("keydown", esc);
    }, 10);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, []);

  if (!ctxMenu || !clip) return null;

  /* Clamp to viewport */
  const W = 224, H = 520;
  const x = Math.min(ctxMenu.x, window.innerWidth  - W - 8);
  const y = Math.min(ctxMenu.y, window.innerHeight - H - 8);

  const close = () => setCtxMenu(null);
  const run   = (fn) => () => { fn(); close(); };

  return createPortal(
    <div
      data-ctxmenu
      className="bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/80 p-1.5"
      style={{ position: "fixed", left: x, top: y, width: W, zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="px-3 py-2.5 mb-0.5 border-b border-zinc-800/80">
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Video clip</p>
        <p className="text-[12px] text-zinc-100 font-semibold truncate mt-0.5">
          {clip.name.replace(/\.[^.]+$/, "")}
        </p>
        <p className="text-[10px] text-zinc-600 mono">
          {(clip.trimEnd - clip.trimStart).toFixed(2)}s · {clip.speed}×
        </p>
      </div>

      {/* ── Edit ── */}
      <CItem
        icon="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"
        label="Copy" kbd="Ctrl+C" onClick={run(() => {})} />
      <CItem
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        label="Paste" kbd="Ctrl+V" onClick={run(() => {})} />
      <CItem
        icon="M8 17l4 4 4-4m-4-5v9M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"
        label="Duplicate" kbd="Ctrl+D"
        onClick={run(() => duplicateClip(ctxMenu.clipId))} />

      <Sep />

      {/* ── Trim / Split ── */}
      <CItem
        icon="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"
        label="Trim clip" onClick={run(() => {})} />
      <CItem
        icon="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
        label="Split here" kbd="Ctrl+K"
        onClick={run(() => splitClip(currentTime))} />

      {/* ── Speed submenu (hover) ── */}
      <div className="relative group/speed">
        <CItem
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          label={`Speed  (${clip.speed}×)`}
          arrow />
        {/* Speed submenu — also fixed position */}
        <div className="invisible group-hover/speed:visible opacity-0 group-hover/speed:opacity-100 transition-all">
          <div className="absolute left-full top-0 ml-1 bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/60
                          rounded-2xl shadow-2xl shadow-black/80 p-1.5 w-36"
            style={{ zIndex: 99999 }}>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest px-2.5 py-1.5 font-semibold">Speed</p>
            {SPEED_OPTIONS.map(({ label, v }) => (
              <button key={v}
                onClick={(e) => { e.stopPropagation(); updateClip(ctxMenu.clipId, { speed: v }); close(); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] cursor-pointer transition-all
                  ${clip.speed === v ? "bg-emerald-400/10 text-emerald-400" : "text-zinc-300 hover:bg-zinc-700/50"}`}>
                {label}
                {clip.speed === v && <Icon d="M9 12l2 2 4-4" size={12} className="text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Sep />

      {/* ── Video-specific ── */}
      <CItem
        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        label="Replace video" arrow
        onClick={run(() => document.getElementById("clip-inp")?.click())} />
      <CItem
        icon="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z"
        label="Extract audio" kbd="Ctrl+Shift+E"
        onClick={run(() => {})} />
      <CItem
        icon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        label="Add caption here"
        onClick={run(() => addOverlay(currentTime, totalDuration))} />
      <CItem
        icon="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78"
        label="Detach from BG"
        onClick={run(() => {})} />

      <Sep />

      {/* ── Danger ── */}
      <CItem
        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        label="Delete clip" kbd="Del" danger
        onClick={run(() => deleteClip(ctxMenu.clipId))} />
    </div>,
    document.body
  );
}
