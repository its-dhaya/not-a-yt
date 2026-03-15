import { useRef, useEffect } from "react";
import { Icon } from "./Icon";
import { fmtTime, ASPECT_RATIOS } from "./utils";

export function Preview({ store, videoRef }) {
  const previewRef = useRef(null);

  const {
    clips, overlays, subtitles,
    currentTime, totalDuration, playing, volume, muted,
    setVolume, setMuted, seekTo, togglePlay,
    showControls, setShowControls,
    selectedOverlayId, setSelectedOverlayId, setActiveLeftTab,
    splitClip, aspectRatio,
    ovDrag, setOvDrag, setOverlays,
  } = store;

  /* ── Expose previewRef for overlay dragging ── */
  useEffect(() => {
    store._previewRef = previewRef;
  });

  /* ── CSS filter for active clip ── */
  const activeClip = (() => {
    if (!clips.length) return null;
    let acc = 0;
    for (const c of clips) {
      const d = c.trimEnd - c.trimStart;
      if (currentTime <= acc + d) return c;
      acc += d;
    }
    return clips[clips.length - 1];
  })();

  const videoFilter = activeClip?.filter || "";

  const arDef  = ASPECT_RATIOS.find((a) => a.id === aspectRatio) || ASPECT_RATIOS[0];
  const is916  = arDef.ar < 1;
  const isPort = arDef.ar <= 1;

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const visOv  = overlays.filter((o) => currentTime >= o.startTime && currentTime <= o.endTime);
  const visSub = subtitles.filter((s) => currentTime >= s.startTime && currentTime <= s.endTime);

  /* ── Auto-hide controls ── */
  const hideTimer = useRef(null);
  const bumpControls = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 2800);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  /* ── Overlay drag ── */
  const startOvDrag = (e, id) => {
    e.stopPropagation();
    const rect = previewRef.current?.getBoundingClientRect();
    const ov   = overlays.find((o) => o.id === id);
    if (!rect || !ov) return;
    setOvDrag({ id, sx: e.clientX, sy: e.clientY, ox: ov.x, oy: ov.y, rect });
  };

  const onMouseMove = (e) => {
    bumpControls();
    if (!ovDrag) return;
    const dx = ((e.clientX - ovDrag.sx) / ovDrag.rect.width)  * 100;
    const dy = ((e.clientY - ovDrag.sy) / ovDrag.rect.height) * 100;
    setOverlays((prev) => prev.map((o) => o.id === ovDrag.id
      ? { ...o, x: Math.max(2, Math.min(98, ovDrag.ox + dx)), y: Math.max(2, Math.min(98, ovDrag.oy + dy)) }
      : o
    ));
  };

  if (!clips.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050507]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
            <Icon d="M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" size={32} />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-semibold">Ready to edit</p>
            <p className="text-zinc-600 text-[12px] mt-1">Upload clips from the left panel</p>
          </div>
          <button onClick={() => document.getElementById("clip-inp")?.click()}
            className="bg-emerald-400 text-black font-bold text-[13px] px-6 py-2.5 rounded-xl hover:bg-emerald-300 transition-all shadow-xl shadow-emerald-400/25">
            Upload Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex items-center justify-center bg-[#050507] overflow-hidden"
      style={{ minWidth: 0, minHeight: 0 }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setOvDrag(null)}
      onClick={bumpControls}
    >
      {/* Video box — height-driven, aspect-ratio sets width */}
      <div
        ref={previewRef}
        className="relative bg-black overflow-hidden shadow-2xl shadow-black border border-zinc-800/20"
        style={{
          height: "100%",
          aspectRatio: aspectRatio.replace(":", "/"),
          maxWidth: "100%",
          cursor: ovDrag ? "grabbing" : "default",
        }}
      >
        {/* ── Video ── */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: videoFilter || undefined }}
          playsInline preload="metadata"
        />

        {/* ── Text overlays ── */}
        {visOv.map((ov) => (
          <div
            key={ov.id}
            onMouseDown={(e) => startOvDrag(e, ov.id)}
            onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(ov.id); setActiveLeftTab("text"); }}
            style={{
              position: "absolute",
              left: `${ov.x}%`, top: `${ov.y}%`,
              transform: "translate(-50%,-50%)",
              fontFamily: ov.fontFamily,
              fontSize: `clamp(12px, ${ov.fontSize * 0.05}vw + ${ov.fontSize * 0.05}vh, ${ov.fontSize * 2}px)`,
              fontWeight: ov.bold   ? 700 : 400,
              fontStyle:  ov.italic ? "italic" : "normal",
              textAlign:  ov.align  || "center",
              color: ov.color,
              cursor: "grab",
              zIndex: 10,
              background: ov.bgBox ? ov.bgColor || "rgba(0,0,0,0.55)" : "transparent",
              padding: ov.bgBox ? "6px 18px" : "2px",
              borderRadius: ov.bgBox ? 10 : 0,
              textShadow: ov.shadow ? "0 2px 14px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,0.9)" : "none",
              userSelect: "none", whiteSpace: "nowrap",
              outline: selectedOverlayId === ov.id ? "1.5px dashed rgba(52,211,153,0.9)" : "none",
              outlineOffset: 4,
              maxWidth: "90%",
            }}
          >
            {ov.text}
          </div>
        ))}

        {/* ── Subtitles ── */}
        {visSub.map((s) => (
          <div key={s.id} style={{
            position: "absolute", bottom: "6%", left: "50%", transform: "translateX(-50%)",
            color: s.color || "#fff",
            fontSize: s.fontSize || 20,
            fontWeight: 700,
            background: s.bgBox !== false ? "rgba(0,0,0,0.72)" : "transparent",
            padding: "6px 22px", borderRadius: 8,
            textAlign: "center", maxWidth: "88%", zIndex: 9,
            textShadow: "0 2px 8px rgba(0,0,0,1)",
            letterSpacing: "0.01em",
          }}>
            {s.text}
          </div>
        ))}

        {/* ── Badges ── */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] text-zinc-400 mono border border-zinc-700/40 z-20 select-none">
          {aspectRatio}
        </div>
        {playing && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-zinc-700/40 z-20 select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] text-zinc-400 mono">LIVE</span>
          </div>
        )}

        {/* ── Overlay controls ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 select-none"
          style={{
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)",
            paddingTop: 56,
          }}
        >
          {/* Progress scrubber */}
          <div className="px-4 mb-3">
            <div
              className="relative w-full h-1.5 bg-white/15 rounded-full cursor-pointer group/bar"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - rect.left) / rect.width) * totalDuration);
              }}
            >
              {/* Buffered visual (faked) */}
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              {/* Played */}
              <div className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full pointer-events-none transition-none"
                style={{ width: `${progressPct}%` }} />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 pointer-events-none
                            opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 8px)` }}
              />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1.5 px-3 pb-3">
            <Btn fn={() => seekTo(0)} icon="M19 20L9 12l10-8v16zM5 19V5" />
            <Btn fn={() => seekTo(Math.max(0, currentTime - 0.033))} icon="M15 18l-6-6 6-6" />

            {/* Play/Pause */}
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-emerald-400 text-black flex items-center justify-center hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-400/30 mx-0.5 shrink-0">
              {playing
                ? <Icon d="M6 4h4v16H6zM14 4h4v16h-4z" size={13} className="text-black" />
                : <svg width="13" height="13" viewBox="0 0 12 12" fill="black" style={{ marginLeft: 2 }}><path d="M2 1.5l9 4.5-9 4.5V1.5z" /></svg>
              }
            </button>

            <Btn fn={() => seekTo(Math.min(totalDuration, currentTime + 0.033))} icon="M9 18l6-6-6-6" />
            <Btn fn={() => seekTo(totalDuration)} icon="M5 4l10 8-10 8V4zM19 5v14" />

            {/* Timecode */}
            <span className="text-[11px] text-white/80 mono tabular-nums ml-1.5 shrink-0">
              {fmtTime(currentTime)}<span className="text-white/30"> / </span>{fmtTime(totalDuration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <button onClick={() => setMuted((m) => !m)} className="p-1.5 text-white/60 hover:text-white transition-colors">
              <Icon d={muted || volume === 0
                ? "M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                : "M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z"} size={14} />
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { setVolume(Number(e.target.value)); if (Number(e.target.value) > 0) setMuted(false); }}
              className="w-18 accent-emerald-400 h-1" style={{ width: 72 }} />

            <div className="w-px h-4 bg-white/20 mx-1.5" />

            {/* Split */}
            <button onClick={() => splitClip(currentTime)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 border border-white/20
                         px-3 py-1.5 rounded-lg hover:border-emerald-400/60 hover:text-emerald-400 transition-all bg-black/20 backdrop-blur-sm">
              <Icon d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" size={12} />
              Split
            </button>

            {/* Fullscreen */}
            <button onClick={() => previewRef.current?.requestFullscreen?.()}
              className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/10">
              <Icon d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* tiny transport button */
const Btn = ({ fn, icon }) => (
  <button onClick={fn} className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all">
    <Icon d={icon} size={14} />
  </button>
);
