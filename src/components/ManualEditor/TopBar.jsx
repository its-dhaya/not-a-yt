import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon, Tip, Sep } from "./Icon";
import { ASPECT_RATIOS, SPEED_OPTIONS, FILTER_OPTIONS, fmtTime } from "./utils";

/* ══════════════════════════════════════════════════════════
   PORTAL DROPDOWN
   Renders the menu into document.body via React portal so it
   always escapes all stacking contexts (including <video>).
   Position is calculated from getBoundingClientRect.
══════════════════════════════════════════════════════════ */
function Dropdown({ trigger, children, align = "left", minWidth = 168 }) {
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const btnRef            = useRef(null);
  const menuRef           = useRef(null);

  const open_ = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };
  const close_ = () => setOpen(false);
  const toggle = () => (open ? close_() : open_());

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target))
        close_();
    };
    const onKey = (e) => { if (e.key === "Escape") close_(); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Calculate fixed position from button rect
  const menuStyle = rect ? (() => {
    const top  = rect.bottom + 6;
    let   left = align === "right" ? rect.right - minWidth : rect.left;
    // clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - minWidth - 8));
    return { position: "fixed", top, left, minWidth, zIndex: 99999 };
  })() : null;

  return (
    <>
      <div ref={btnRef} className="inline-flex">
        {trigger(open, toggle)}
      </div>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/80 p-1.5"
          style={menuStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children(close_)}
        </div>,
        document.body
      )}
    </>
  );
}

/* ── shared menu item ── */
function MenuItem({ icon, label, onClick, active, kbd, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all
        ${danger  ? "text-red-400 hover:bg-red-400/10"
        : active  ? "bg-emerald-400/10 text-emerald-400"
        :           "text-zinc-200 hover:bg-zinc-700/60 hover:text-white"}`}
    >
      {icon && <Icon d={icon} size={13} className={active ? "text-emerald-400" : "text-zinc-400"} />}
      <span className="flex-1 text-left">{label}</span>
      {active && <Icon d="M9 12l2 2 4-4" size={12} className="text-emerald-400" />}
      {kbd && !active && <span className="text-[10px] text-zinc-500 mono">{kbd}</span>}
    </button>
  );
}

/* ── toolbar button ── */
function ToolBtn({ icon, label, onClick, active, accent, danger, disabled, kbd, children }) {
  return (
    <Tip label={kbd ? `${label}   ${kbd}` : label}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                    border transition-all whitespace-nowrap
                    disabled:opacity-30 disabled:cursor-not-allowed shrink-0
          ${active  ? "bg-zinc-700 border-zinc-600 text-white"
          : accent  ? "bg-emerald-400 border-emerald-400 text-black hover:bg-emerald-300"
          : danger  ? "border-transparent text-red-400 hover:bg-red-400/10 hover:border-red-400/20"
          :           "border-transparent text-zinc-300 hover:bg-zinc-800/80 hover:text-white"}`}
      >
        {icon && <Icon d={icon} size={14} />}
        {children ?? (label && <span>{label}</span>)}
      </button>
    </Tip>
  );
}

/* ══════════════════════════════════════════════════════════
   TOP BAR
══════════════════════════════════════════════════════════ */
export function TopBar({ store }) {
  const {
    clips, selectedClip, currentTime,
    aspectRatio, setAspectRatio,
    splitClip, deleteClip, duplicateClip, updateClip,
    addOverlay, totalDuration,
    exporting, exportProgress, exportDone, setExportDone,
    handleExport,
    undo, redo,
    volume, setVolume, muted, setMuted,
  } = store;

  const hasSel = !!selectedClip;
  const dur    = hasSel ? selectedClip.trimEnd - selectedClip.trimStart : 0;

  return (
    <div
      className="flex items-center h-12 px-3 border-b border-zinc-800/80 bg-[#0a0a0c] shrink-0 gap-1 overflow-x-auto"
      style={{ scrollbarWidth: "none", position: "relative", zIndex: 200 }}
    >
      {/* ── Undo / Redo ── */}
      <Tip label="Undo  Ctrl+Z">
        <button onClick={undo}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all shrink-0">
          <Icon d="M3 10h10a8 8 0 010 16H3m0-16l4-4M3 10l4 4" size={14} />
        </button>
      </Tip>
      <Tip label="Redo  Ctrl+Y">
        <button onClick={redo}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all shrink-0">
          <Icon d="M21 10H11a8 8 0 000 16h10m0-16l-4-4m4 4l-4 4" size={14} />
        </button>
      </Tip>

      <Sep vertical />

      {/* ── Clip tools (only when selected) ── */}
      {hasSel ? (
        <>
          {/* Duration badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700/60
                          rounded-lg mono text-[12px] text-zinc-200 shrink-0">
            <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={13} className="text-zinc-500" />
            {fmtTime(dur)}
          </div>

          <Sep vertical />

          {/* Trim */}
          <ToolBtn icon="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3" label="Trim" />

          {/* Crop */}
          <ToolBtn icon="M6.13 1L6 16a2 2 0 002 2h15M1 6.13l15-.13" label="Crop" />

          <Sep vertical />

          {/* Filter dropdown */}
          <Dropdown minWidth={172}
            trigger={(open, toggle) => (
              <ToolBtn
                icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                label={`Filter${selectedClip.filter ? " ●" : ""}`}
                active={open} onClick={toggle}
              />
            )}
          >
            {(close) => (
              <>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest px-3 py-1.5 font-semibold">Video Filter</p>
                {FILTER_OPTIONS.map(({ label, css }) => (
                  <MenuItem key={label} label={label} active={selectedClip.filter === css}
                    onClick={() => { updateClip(selectedClip.id, { filter: css }); close(); }} />
                ))}
              </>
            )}
          </Dropdown>

          {/* Speed dropdown */}
          <Dropdown minWidth={160}
            trigger={(open, toggle) => (
              <ToolBtn
                icon="M13 10V3L4 14h7v7l9-11h-7z"
                label={selectedClip.speed !== 1 ? `${selectedClip.speed}×` : "Speed"}
                active={open} onClick={toggle}
              />
            )}
          >
            {(close) => (
              <>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest px-3 py-1.5 font-semibold">Playback Speed</p>
                {SPEED_OPTIONS.map(({ label, v }) => (
                  <MenuItem key={v} label={label} active={selectedClip.speed === v}
                    onClick={() => { updateClip(selectedClip.id, { speed: v }); close(); }} />
                ))}
              </>
            )}
          </Dropdown>

          {/* Per-clip volume */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800/80 rounded-lg shrink-0">
            <Icon d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z" size={13} className="text-zinc-500" />
            <input type="range" min={0} max={1} step={0.05} value={selectedClip.volume ?? 1}
              onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
              className="w-16 accent-emerald-400" />
            <span className="text-[10px] mono text-zinc-500 w-7">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
          </div>

          <Sep vertical />

          {/* Aspect ratio dropdown (also in clip section for convenience) */}
          <Dropdown align="left" minWidth={180}
            trigger={(open, toggle) => (
              <ToolBtn
                icon="M3 3h18v18H3z"
                label={aspectRatio}
                active={open} onClick={toggle}
              />
            )}
          >
            {(close) => (
              <>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest px-3 py-1.5 font-semibold">Aspect Ratio</p>
                {ASPECT_RATIOS.map((a) => (
                  <MenuItem key={a.id} label={a.id} active={aspectRatio === a.id}
                    onClick={() => { setAspectRatio(a.id); close(); }} />
                ))}
              </>
            )}
          </Dropdown>

          {/* Flip */}
          <ToolBtn icon="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" label="Flip" />

          <Sep vertical />

          {/* Split */}
          <ToolBtn
            icon="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
            label="Split" kbd="Ctrl+K" accent
            onClick={() => splitClip(currentTime)}
          />

          {/* Duplicate */}
          <ToolBtn
            icon="M8 17l4 4 4-4m-4-5v9M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"
            label="Duplicate" kbd="Ctrl+D"
            onClick={() => duplicateClip(selectedClip.id)}
          />

          {/* Delete */}
          <ToolBtn
            icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            label="Delete" kbd="Del" danger
            onClick={() => deleteClip(selectedClip.id)}
          />
        </>
      ) : (
        /* No selection — still show aspect ratio */
        <>
          <Dropdown align="left" minWidth={180}
            trigger={(open, toggle) => (
              <button onClick={toggle}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold mono transition-all shrink-0
                  ${open ? "bg-zinc-800 border-zinc-600 text-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"}`}>
                <Icon d="M3 3h18v18H3z" size={13} />{aspectRatio}
                <Icon d="M19 9l-7 7-7-7" size={11} />
              </button>
            )}
          >
            {(close) => (
              <>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest px-3 py-1.5 font-semibold">Aspect Ratio</p>
                {ASPECT_RATIOS.map((a) => (
                  <MenuItem key={a.id} label={a.id} active={aspectRatio === a.id}
                    onClick={() => { setAspectRatio(a.id); close(); }} />
                ))}
              </>
            )}
          </Dropdown>
          <span className="text-[11px] text-zinc-600 italic px-2 shrink-0">Select a clip to edit</span>
        </>
      )}

      <div className="flex-1" />

      {/* ── Global volume ── */}
      <div className="flex items-center gap-1.5 px-2 shrink-0">
        <button onClick={() => setMuted((m) => !m)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
          <Icon d={muted || volume === 0
            ? "M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            : "M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z"} size={14} />
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
          onChange={(e) => { setVolume(Number(e.target.value)); if (Number(e.target.value) > 0) setMuted(false); }}
          className="w-20 accent-emerald-400" />
      </div>

      <Sep vertical />

      {/* ── Save / Export ── */}
      <button className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 border border-zinc-800
                         px-3 py-1.5 rounded-xl hover:border-zinc-600 hover:text-zinc-200 transition-all whitespace-nowrap shrink-0">
        <Icon d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" size={13} />
        Save Draft
      </button>

      <button onClick={handleExport} disabled={exporting || !clips.length}
        className="flex items-center gap-2 bg-emerald-400 text-black font-bold text-[12px] px-4 py-1.5 rounded-xl
                   hover:bg-emerald-300 transition-all disabled:opacity-40 shadow-lg shadow-emerald-400/20
                   whitespace-nowrap shrink-0">
        {exporting
          ? (<><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>{exportProgress}%</>)
          : (<><Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" size={13} />Export MP4</>)
        }
      </button>

      {/* ── Export done toast (fixed, always on top) ── */}
      {exportDone && createPortal(
        <div className="fixed bottom-6 right-6 bg-zinc-900/98 backdrop-blur-xl border border-emerald-400/20
                        rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4"
          style={{ zIndex: 99999 }}>
          <div className="w-9 h-9 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
            <Icon d="M9 12l2 2 4-4" size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-zinc-100">Export complete!</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Your video is ready</p>
          </div>
          <a href={exportDone} download="edit.mp4"
            className="bg-emerald-400 text-black text-[12px] font-bold px-4 py-2 rounded-xl hover:bg-emerald-300 transition-all">
            Download
          </a>
          <button onClick={() => setExportDone(null)} className="text-zinc-600 hover:text-zinc-400 p-1">
            <Icon d="M18 6L6 18M6 6l12 12" size={13} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
