import { useRef, useEffect } from "react";
import { Icon } from "./Icon";
import { fmtTC, BASE_PX_PER_SEC, clamp } from "./utils";

const VIDEO_H = 54;
const TEXT_H  = 18;
const AUDIO_H = 22;
const SUB_H   = 8;
const RULER_H = 22;
const LABEL_W = 72;
const CONTENT_H = RULER_H + VIDEO_H + TEXT_H + AUDIO_H + SUB_H + 4; // +4 padding

export function Timeline({ store }) {
  const {
    clips, overlays, subtitles, audioTracks,
    currentTime, totalDuration,
    zoom, setZoom,
    selectedClipId, setSelectedClipId,
    setSelectedOverlayId, setActiveLeftTab,
    seekTo, clipStartTime,
    trimDrag, setTrimDrag, applyTrimDelta, commitTrim,
    clipDrag, setClipDrag, reorderClips,
    ctxMenu, setCtxMenu,
    setClips,
  } = store;

  const scrollRef = useRef(null);
  const pxPerSec  = BASE_PX_PER_SEC * zoom;
  const contentW  = Math.max(totalDuration * pxPerSec + 200, 800);

  /* ── Trim drag (window-level) ── */
  useEffect(() => {
    if (!trimDrag) return;
    const onMove = (e) => {
      const dx = (e.clientX - trimDrag.startX) / pxPerSec;
      applyTrimDelta(trimDrag.clipId, trimDrag.edge, dx - trimDrag.lastDx);
      setTrimDrag((p) => p ? { ...p, lastDx: dx } : null);
    };
    const onUp = () => { commitTrim(); setTrimDrag(null); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",  onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trimDrag, pxPerSec]);

  /* ── Clip drag-reorder (inline handler sets window listeners) ── */
  const startClipDrag = (e, clipId, fromIdx) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    let overIdx = fromIdx;
    setClipDrag({ id: clipId, fromIdx, overIdx });

    const onMove = (ev) => {
      if (!scrollRef.current) return;
      const rect   = scrollRef.current.getBoundingClientRect();
      const scroll = scrollRef.current.scrollLeft;
      const mouseX = ev.clientX - rect.left - LABEL_W + scroll;
      let acc = 0, idx = clips.length - 1;
      for (let i = 0; i < clips.length; i++) {
        const w = (clips[i].trimEnd - clips[i].trimStart) * pxPerSec;
        if (mouseX < acc + w / 2) { idx = i; break; }
        acc += w + 4;
      }
      overIdx = idx;
      setClipDrag({ id: clipId, fromIdx, overIdx });
    };
    const onUp = () => {
      reorderClips(fromIdx, overIdx);
      setClipDrag(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  /* ── Auto-scroll playhead into view during playback ── */
  useEffect(() => {
    if (!scrollRef.current) return;
    const px = currentTime * pxPerSec + LABEL_W;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (px > scrollLeft + clientWidth - 60 || px < scrollLeft + LABEL_W) {
      scrollRef.current.scrollLeft = px - LABEL_W - clientWidth / 2;
    }
  }, [currentTime, pxPerSec]);

  /* ── Ruler tick generator ── */
  const secCount = Math.ceil(totalDuration) + 3;
  // Adaptive tick interval
  const tickInterval = pxPerSec >= 60 ? 1 : pxPerSec >= 30 ? 2 : 5;

  return (
    <div className="border-t border-zinc-800/80 bg-[#080809] shrink-0 flex flex-col"
      style={{ height: 160 }}>

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mono">Timeline</span>
          <button onClick={() => document.getElementById("clip-inp")?.click()}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-lg hover:border-zinc-600 hover:text-zinc-300 transition-all">
            <Icon d="M12 5v14M5 12h14" size={10} /> Add Clip
          </button>
        </div>
        {/* Zoom */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
            className="w-5 h-5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 flex items-center justify-center text-sm">−</button>
          <div className="relative w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom(+(0.25 + ((e.clientX - r.left) / r.width) * 1.75).toFixed(2));
            }}>
            <div className="h-full bg-emerald-400/60 rounded-full transition-all"
              style={{ width: `${((zoom - 0.25) / 1.75) * 100}%` }} />
          </div>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
            className="w-5 h-5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 flex items-center justify-center text-sm">+</button>
          <span className="text-[10px] text-zinc-600 mono w-9 text-right">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* ── Tracks ── */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden relative"
        style={{ scrollbarWidth: "thin" }}>
        <div className="flex h-full" style={{ width: contentW + LABEL_W }}>

          {/* Fixed label column */}
          <div className="shrink-0 border-r border-zinc-800/50 flex flex-col bg-[#060608] z-10"
            style={{ width: LABEL_W, minHeight: CONTENT_H }}>
            <div style={{ height: RULER_H }} className="border-b border-zinc-800/50" />
            <TrackLbl label="Video"  color="text-emerald-400" icon="M15 10l4.553-2.07" h={VIDEO_H} />
            <TrackLbl label="Text"   color="text-purple-400"  icon="M4 6h16M4 12h10"  h={TEXT_H}  />
            <TrackLbl label="Audio"  color="text-sky-400"     icon="M9 18V5l12-2v13"  h={AUDIO_H} />
            <TrackLbl label="Subs"   color="text-amber-400"   icon="M21 15a2 2 0 01-2 2H7l-4 4V5" h={SUB_H} />
          </div>

          {/* Scrollable content */}
          <div className="relative flex-1" style={{ minHeight: CONTENT_H }}>

            {/* ── Ruler ── */}
            <div
              className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50"
              style={{ height: RULER_H }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo((e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)) / pxPerSec);
              }}
            >
              {Array.from({ length: Math.ceil(secCount / tickInterval) + 1 }, (_, i) => i * tickInterval).map((sec) => (
                <div key={sec} className="absolute flex flex-col items-start pointer-events-none"
                  style={{ left: sec * pxPerSec }}>
                  <div className="w-px h-3 bg-zinc-700/80 mt-2" />
                  <span className="text-[8px] text-zinc-600 mono ml-0.5">{sec}s</span>
                </div>
              ))}
              {/* Sub-ticks */}
              {Array.from({ length: secCount * 4 }, (_, i) => {
                if (i % 4 === 0) return null;
                return (
                  <div key={`s${i}`} className="absolute w-px h-1 bg-zinc-800 pointer-events-none"
                    style={{ left: (i * 0.25) * pxPerSec, top: 10 }} />
                );
              })}
            </div>

            {/* ── Video track ── */}
            <div className="absolute flex gap-1 items-center"
              style={{ top: RULER_H, height: VIDEO_H, left: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo((e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)) / pxPerSec);
                }
              }}
            >
              {clips.map((clip, i) => {
                const w       = Math.max((clip.trimEnd - clip.trimStart) * pxPerSec, 16);
                const isSel   = selectedClipId === clip.id;
                const isDrag  = clipDrag?.id === clip.id;
                const isDrop  = clipDrag && clipDrag.id !== clip.id && clipDrag.overIdx === i;

                return (
                  <div key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!clipDrag) { setSelectedClipId(clip.id); seekTo(clipStartTime(i)); }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setSelectedClipId(clip.id); seekTo(clipStartTime(i));
                      setCtxMenu({ x: e.clientX, y: e.clientY, clipId: clip.id, clipIdx: i });
                    }}
                    onMouseDown={(e) => startClipDrag(e, clip.id, i)}
                    className={`relative flex-shrink-0 h-full rounded-xl overflow-hidden select-none transition-all
                      ${isSel  ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/15" : "opacity-80 hover:opacity-100"}
                      ${isDrag ? "opacity-40 scale-[0.97] cursor-grabbing z-20" : "cursor-grab"}
                      ${isDrop ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                    style={{ width: w, flexShrink: 0 }}
                  >
                    {/* Filmstrip */}
                    {clip.strip?.length
                      ? <div className="absolute inset-0 flex pointer-events-none">
                          {clip.strip.map((f, fi) => (
                            <div key={fi} className="flex-1 overflow-hidden min-w-0">
                              {f && <img src={f} className="h-full w-full object-cover" draggable={false} alt="" />}
                            </div>
                          ))}
                        </div>
                      : <div className="absolute inset-0 bg-zinc-700" />
                    }
                    {/* Tint overlay */}
                    <div className={`absolute inset-0 pointer-events-none ${isSel ? "bg-emerald-400/8" : "bg-black/30"}`} />
                    {/* Drop indicator */}
                    {isDrop && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-full z-20 pointer-events-none" />}
                    {/* Labels */}
                    <div className="absolute bottom-1 left-2 right-7 pointer-events-none">
                      <p className="text-[8px] font-semibold text-white truncate drop-shadow-sm">{clip.name.replace(/\.[^.]+$/, "")}</p>
                    </div>
                    <div className="absolute bottom-1 right-1.5 pointer-events-none">
                      <span className="text-[8px] text-white/60 mono">{(clip.trimEnd - clip.trimStart).toFixed(1)}s</span>
                    </div>
                    {clip.speed !== 1 && (
                      <div className="absolute top-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[7px] text-amber-400 mono font-bold pointer-events-none">{clip.speed}×</div>
                    )}

                    {/* ── Trim handles ── */}
                    <TrimHandle edge="start" onDown={(e) => { e.stopPropagation(); setTrimDrag({ clipId: clip.id, edge: "start", startX: e.clientX, lastDx: 0 }); }} />
                    <TrimHandle edge="end"   onDown={(e) => { e.stopPropagation(); setTrimDrag({ clipId: clip.id, edge: "end",   startX: e.clientX, lastDx: 0 }); }} />
                  </div>
                );
              })}

              {/* Add clip */}
              <div onClick={(e) => { e.stopPropagation(); document.getElementById("clip-inp")?.click(); }}
                className="flex-shrink-0 w-8 h-full rounded-xl border-2 border-dashed border-zinc-800 ml-1
                           flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors text-zinc-700 hover:text-zinc-500">
                <Icon d="M12 5v14M5 12h14" size={13} />
              </div>
            </div>

            {/* ── Text overlay track ── */}
            <div className="absolute left-0 right-0 bg-zinc-950/20 border-b border-zinc-800/40"
              style={{ top: RULER_H + VIDEO_H, height: TEXT_H }}>
              {overlays.map((ov) => {
                const l = ov.startTime * pxPerSec;
                const w = Math.max((ov.endTime - ov.startTime) * pxPerSec, 20);
                return (
                  <div key={ov.id}
                    onClick={() => { setSelectedOverlayId(ov.id); setActiveLeftTab("text"); }}
                    className="absolute top-1 bottom-1 rounded bg-purple-500/60 hover:bg-purple-400/80 border border-purple-400/30 cursor-pointer flex items-center px-1.5 overflow-hidden transition-colors"
                    style={{ left: l, width: w }} title={ov.text}>
                    <span className="text-[7px] font-semibold text-white truncate">{ov.text}</span>
                  </div>
                );
              })}
            </div>

            {/* ── Audio track ── */}
            <div className="absolute left-0 right-0 bg-zinc-950/20 border-b border-zinc-800/40"
              style={{ top: RULER_H + VIDEO_H + TEXT_H, height: AUDIO_H }}>
              {audioTracks.map((a) => {
                const l = (a.startTime || 0) * pxPerSec;
                const w = Math.max((a.duration || 5) * pxPerSec, 40);
                return (
                  <div key={a.id}
                    className="absolute top-1 bottom-1 rounded bg-sky-500/45 hover:bg-sky-400/65 border border-sky-400/30 cursor-pointer overflow-hidden transition-colors flex items-center"
                    style={{ left: l, width: w }} title={a.name}>
                    {/* Mini waveform */}
                    <div className="flex items-center gap-px h-full py-1 px-1 overflow-hidden flex-1">
                      {Array.from({ length: Math.floor(w / 2.5) }).map((_, i) => (
                        <div key={i} className="w-px bg-sky-300/70 rounded-full shrink-0"
                          style={{ height: `${20 + Math.abs(Math.sin(i * 0.7 + a.id.charCodeAt(0))) * 60}%` }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Subtitle indicators ── */}
            <div className="absolute left-0 right-0 bg-zinc-950/10"
              style={{ top: RULER_H + VIDEO_H + TEXT_H + AUDIO_H, height: SUB_H }}>
              {subtitles.map((s) => (
                <div key={s.id}
                  className="absolute top-1 h-1.5 rounded-full bg-amber-500/60 hover:bg-amber-400 cursor-pointer transition-colors"
                  style={{ left: s.startTime * pxPerSec, width: Math.max((s.endTime - s.startTime) * pxPerSec, 8) }}
                  title={s.text} />
              ))}
            </div>

            {/* ── Playhead ── */}
            <div className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: currentTime * pxPerSec }}>
              <div className="w-px h-full bg-emerald-400/90 relative">
                <div className="absolute -top-px -left-[5px] w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/60" />
                {/* Timecode bubble */}
                <div className="absolute top-0 left-2 bg-emerald-400 text-black text-[8px] font-bold mono px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg">
                  {fmtTC(currentTime)}
                </div>
              </div>
            </div>

            {/* Seek overlay (behind clips z-0) */}
            <div className="absolute inset-0 z-0 cursor-pointer"
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo((e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0)) / pxPerSec);
              }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── subcomponents ── */
const TrackLbl = ({ label, color, icon, h }) => (
  <div className={`flex items-center gap-1.5 px-2 border-b border-zinc-800/40 shrink-0`}
    style={{ height: h }}>
    <Icon d={icon} size={10} className={color} />
    <span className={`text-[8px] font-semibold uppercase tracking-wider ${color} opacity-70 whitespace-nowrap`}>{label}</span>
  </div>
);

const TrimHandle = ({ edge, onDown }) => (
  <div
    onMouseDown={onDown}
    className={`absolute top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center
                ${edge === "start"
                  ? "left-0 bg-gradient-to-r from-emerald-400/55 to-transparent hover:from-emerald-400/90"
                  : "right-0 bg-gradient-to-l from-emerald-400/55 to-transparent hover:from-emerald-400/90"}
                transition-all`}
  >
    <div className="w-0.5 h-6 rounded-full bg-emerald-400" />
  </div>
);
