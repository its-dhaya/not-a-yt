import { useRef, useEffect, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { fmtTC, BASE_PX_PER_SEC } from "./utils";

const VIDEO_H = 56;
const TEXT_H = 18;
const AUDIO_H = 22;
const SUB_H = 8;
const RULER_H = 22;
const LABEL_W = 72;
const CONTENT_H = RULER_H + VIDEO_H + TEXT_H + AUDIO_H + SUB_H + 4;

/* ═══════════════════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════════════════ */
export function Timeline({ store }) {
  const {
    clips,
    overlays,
    subtitles,
    audioTracks,
    currentTime,
    totalDuration,
    zoom,
    setZoom,
    selectedClipId,
    setSelectedClipId,
    setSelectedOverlayId,
    setActiveLeftTab,
    seekTo,
    clipStartTime,
    trimDrag,
    setTrimDrag,
    applyTrimDelta,
    commitTrim,
    clipDrag,
    setClipDrag,
    reorderClips,
    setCtxMenu,
    addLibraryItemToTimeline,
  } = store;

  const scrollRef = useRef(null);
  const clipEls = useRef({});

  /*
   * wasDragRef: set to true as soon as cursor moves >5px after mousedown.
   * onClick reads this to know whether to select or suppress (it was a drag).
   * This ref approach is synchronous — no stale-closure issues at all.
   */
  const wasDragRef = useRef(false);
  const dragStateRef = useRef(null);

  /* Library drag-over state for the insertion indicator */
  const [libDrop, setLibDrop] = useState(null); // { idx, x } | null

  const pxPerSec = BASE_PX_PER_SEC * zoom;
  const contentW = Math.max(totalDuration * pxPerSec + 200, 800);
  const secCount = Math.ceil(totalDuration) + 3;
  const tickInterval = pxPerSec >= 60 ? 1 : pxPerSec >= 30 ? 2 : 5;

  /* ── Block the browser's default context menu on the scroll container,
     but use a non-capture listener so clip handlers can stopPropagation
     and handle right-clicks themselves. ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const block = (e) => e.preventDefault();
    el.addEventListener("contextmenu", block, { passive: false });
    return () => el.removeEventListener("contextmenu", block);
  }, []);

  /* ── Trim drag ── */
  useEffect(() => {
    if (!trimDrag) return;
    const onMove = (e) => {
      const dx = (e.clientX - trimDrag.startX) / pxPerSec;
      applyTrimDelta(trimDrag.clipId, trimDrag.edge, dx - trimDrag.lastDx);
      setTrimDrag((p) => (p ? { ...p, startX: e.clientX, lastDx: 0 } : null));
    };
    const onUp = () => {
      commitTrim();
      setTrimDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [trimDrag, pxPerSec]);

  /* ── Auto-scroll playhead into view ── */
  useEffect(() => {
    if (!scrollRef.current) return;
    const px = currentTime * pxPerSec;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (px > scrollLeft + clientWidth - 80 || px < scrollLeft + 20) {
      scrollRef.current.scrollLeft = px - clientWidth / 2;
    }
  }, [currentTime, pxPerSec]);

  /*
   * ════════════════════════════════════════════════════════════
   * CLICK  →  handleClipClick   (selection + seek)
   * DRAG   →  handleClipMouseDown (reorder, 5px threshold)
   *
   * WHY TWO HANDLERS:
   *   Doing everything inside onMouseDown + window mouseup was
   *   broken because the onUp closure captured stale values of
   *   seekTo / clipStartTime (they're recreated on every render
   *   because seekTo depends on clips/volume/etc). React's onClick
   *   always has fresh props at call-time — zero stale-closure risk.
   *
   * HOW THE DRAG SUPPRESSION WORKS:
   *   onMouseDown sets wasDragRef = false and starts tracking.
   *   If cursor moves >5px, wasDragRef is set to true immediately.
   *   onClick checks wasDragRef synchronously — if true it skips
   *   selection. This works because browser event order is always:
   *   mousedown → mousemove* → mouseup → click
   * ════════════════════════════════════════════════════════════
   */

  /* onClick — fired AFTER mouseup on the same element, always has fresh props */
  const handleClipClick = useCallback(
    (e, clip, idx) => {
      e.stopPropagation();
      if (wasDragRef.current) return; // drag happened, suppress click
      setSelectedClipId(clip.id);
      seekTo(clipStartTime(idx));
    },
    [setSelectedClipId, seekTo, clipStartTime]
  );

  /* onMouseDown — only tracks drags, never does selection itself */
  const handleClipMouseDown = useCallback(
    (e, clip, idx) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      wasDragRef.current = false;
      const startX = e.clientX;
      const fromIdx = idx;
      let currentOverIdx = idx;

      dragStateRef.current = { clipId: clip.id, fromIdx, overIdx: idx };

      const onMove = (ev) => {
        if (Math.abs(ev.clientX - startX) <= 5) return;

        // Mark as drag so onClick won't also select
        wasDragRef.current = true;

        if (!scrollRef.current) return;
        const r = scrollRef.current.getBoundingClientRect();
        const mouseX =
          ev.clientX - r.left - LABEL_W + scrollRef.current.scrollLeft;
        let acc = 0;
        let newIdx = clips.length - 1;
        for (let j = 0; j < clips.length; j++) {
          const w = (clips[j].trimEnd - clips[j].trimStart) * pxPerSec;
          if (mouseX < acc + w / 2) {
            newIdx = j;
            break;
          }
          acc += w + 4;
        }
        currentOverIdx = newIdx;
        if (dragStateRef.current) dragStateRef.current.overIdx = newIdx;
        setClipDrag({ id: clip.id, fromIdx, overIdx: newIdx });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const state = dragStateRef.current;
        dragStateRef.current = null;
        if (state && wasDragRef.current) {
          reorderClips(state.fromIdx, state.overIdx);
          setClipDrag(null);
        }
        // NOTE: selection is handled by onClick below — we do nothing here for clicks
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [clips, pxPerSec, reorderClips, setClipDrag]
  );

  /* ════════════════════════════════════════════════════════════
     RIGHT-CLICK → CONTEXT MENU
     BUG FIXED: The old code blocked ALL contextmenu events at the
     capture phase on the scroll container, so onContextMenu on
     clips never fired. Now we use a non-capture container listener
     and clips call stopPropagation to intercept their own events.
  ════════════════════════════════════════════════════════════ */
  const handleClipContextMenu = useCallback(
    (e, clip) => {
      e.preventDefault();
      e.stopPropagation(); // prevents the container's non-capture listener
      setSelectedClipId(clip.id);
      setCtxMenu({ x: e.clientX, y: e.clientY, clipId: clip.id });
    },
    [setSelectedClipId, setCtxMenu]
  );

  /* ════════════════════════════════════════════════════════════
     LIBRARY DRAG → TIMELINE DROP
     Accepts HTML5 drag events from the left-panel media library.
     Calculates insertion index from cursor X position and renders
     a glowing indicator line between clips.
  ════════════════════════════════════════════════════════════ */
  const calcLibDropPos = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollL = scrollRef.current?.scrollLeft || 0;
      const mouseX = e.clientX - rect.left + scrollL;

      let acc = 0;
      let insertIdx = clips.length;
      let indX = clips.reduce(
        (s, c) => s + Math.max((c.trimEnd - c.trimStart) * pxPerSec, 16) + 4,
        0
      );

      for (let i = 0; i < clips.length; i++) {
        const w = Math.max(
          (clips[i].trimEnd - clips[i].trimStart) * pxPerSec,
          16
        );
        if (mouseX < acc + w / 2) {
          insertIdx = i;
          indX = Math.max(0, acc);
          break;
        }
        acc += w + 4;
      }
      return { idx: insertIdx, x: indX };
    },
    [clips, pxPerSec]
  );

  const handleLibDragOver = useCallback(
    (e) => {
      if (!e.dataTransfer.types.includes("application/x-library-id")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      /* Only show indicator in the video track zone */
      const rect = e.currentTarget.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      if (relY < RULER_H || relY > RULER_H + VIDEO_H) {
        setLibDrop(null);
        return;
      }
      const pos = calcLibDropPos(e);
      setLibDrop((prev) => (prev?.idx === pos.idx ? prev : pos));
    },
    [calcLibDropPos]
  );

  const handleLibDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setLibDrop(null);
  }, []);

  const handleLibDrop = useCallback(
    (e) => {
      e.preventDefault();
      const libId = e.dataTransfer.getData("application/x-library-id");
      if (!libId) {
        setLibDrop(null);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      if (relY >= RULER_H && relY <= RULER_H + VIDEO_H) {
        const pos = calcLibDropPos(e);
        addLibraryItemToTimeline(libId, pos.idx);
      }
      setLibDrop(null);
    },
    [calcLibDropPos, addLibraryItemToTimeline]
  );

  /* ── Deselect on background click ── */
  const handleBgClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) setSelectedClipId(null);
    },
    [setSelectedClipId]
  );

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div
      className="border-t border-zinc-800/80 bg-[#080809] shrink-0 flex flex-col"
      style={{ height: 160 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mono">
            Timeline
          </span>
          <button
            onClick={() => document.getElementById("clip-inp")?.click()}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 border border-zinc-800
                       px-2 py-0.5 rounded-lg hover:border-zinc-600 hover:text-zinc-300 transition-all"
          >
            <Icon d="M12 5v14M5 12h14" size={10} /> Add Clip
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))
            }
            className="w-5 h-5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 flex items-center justify-center text-sm transition-colors"
          >
            −
          </button>
          <div
            className="relative w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom(
                +(0.25 + ((e.clientX - r.left) / r.width) * 1.75).toFixed(2)
              );
            }}
          >
            <div
              className="h-full bg-emerald-400/60 rounded-full transition-all"
              style={{ width: `${((zoom - 0.25) / 1.75) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
            className="w-5 h-5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 flex items-center justify-center text-sm transition-colors"
          >
            +
          </button>
          <span className="text-[10px] text-zinc-600 mono w-9 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* ── Tracks area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex h-full" style={{ width: contentW + LABEL_W }}>
          {/* ── Label column ── */}
          <div
            className="shrink-0 border-r border-zinc-800/50 flex flex-col bg-[#060608] z-10"
            style={{ width: LABEL_W, minHeight: CONTENT_H }}
          >
            <div
              style={{ height: RULER_H }}
              className="border-b border-zinc-800/50"
            />
            <TrackLbl
              label="Video"
              color="text-emerald-400"
              icon="M15 10l4.553-2.07"
              h={VIDEO_H}
            />
            <TrackLbl
              label="Text"
              color="text-purple-400"
              icon="M4 6h16M4 12h10"
              h={TEXT_H}
            />
            <TrackLbl
              label="Audio"
              color="text-sky-400"
              icon="M9 18V5l12-2v13"
              h={AUDIO_H}
            />
            <TrackLbl
              label="Subs"
              color="text-amber-400"
              icon="M21 15a2 2 0 01-2 2H7l-4 4V5"
              h={SUB_H}
            />
          </div>

          {/* ── Scrollable content ── */}
          <div
            className="relative flex-1"
            style={{ minHeight: CONTENT_H }}
            onDragOver={handleLibDragOver}
            onDragLeave={handleLibDragLeave}
            onDrop={handleLibDrop}
          >
            {/* ══ SEEK overlay — MUST be FIRST in DOM so every track/clip renders on top of it ══
                Root cause of old bug: when this was last in DOM with z-0, it painted OVER clips
                and swallowed all click events, so clips could never be selected. */}
            <div
              className="absolute inset-0 cursor-pointer"
              style={{ zIndex: 0 }}
              onMouseDown={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(
                  (e.clientX -
                    rect.left +
                    (scrollRef.current?.scrollLeft || 0)) /
                    pxPerSec
                );
              }}
            />
            {/* ── Ruler ── */}
            <div
              className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 cursor-pointer"
              style={{ height: RULER_H }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(
                  (e.clientX -
                    rect.left +
                    (scrollRef.current?.scrollLeft || 0)) /
                    pxPerSec
                );
              }}
            >
              {Array.from(
                { length: Math.ceil(secCount / tickInterval) + 1 },
                (_, i) => i * tickInterval
              ).map((sec) => (
                <div
                  key={sec}
                  className="absolute flex flex-col items-start pointer-events-none"
                  style={{ left: sec * pxPerSec }}
                >
                  <div className="w-px h-3 bg-zinc-700/80 mt-2" />
                  <span className="text-[8px] text-zinc-600 mono ml-0.5">
                    {sec}s
                  </span>
                </div>
              ))}
              {Array.from({ length: secCount * 4 }, (_, i) => {
                if (i % 4 === 0) return null;
                return (
                  <div
                    key={`s${i}`}
                    className="absolute w-px h-1 bg-zinc-800 pointer-events-none"
                    style={{ left: i * 0.25 * pxPerSec, top: 10 }}
                  />
                );
              })}
            </div>

            {/* ══ VIDEO TRACK ══ */}
            <div
              className="absolute flex gap-1 items-center"
              style={{
                top: RULER_H,
                height: VIDEO_H,
                left: 0,
                minWidth: contentW,
              }}
              onClick={handleBgClick}
            >
              {/* Library drag-and-drop drop indicator */}
              {libDrop && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{
                    left: libDrop.x,
                    width: 3,
                    background: "rgba(52,211,153,1)",
                    boxShadow: "0 0 10px 4px rgba(52,211,153,0.5)",
                    borderRadius: 2,
                  }}
                />
              )}

              {clips.map((clip, i) => {
                const w = Math.max(
                  (clip.trimEnd - clip.trimStart) * pxPerSec,
                  16
                );
                const isSel = selectedClipId === clip.id;
                const isDrag = clipDrag?.id === clip.id;
                const isDrop =
                  clipDrag && clipDrag.id !== clip.id && clipDrag.overIdx === i;

                return (
                  <div
                    key={clip.id}
                    ref={(el) => {
                      if (el) clipEls.current[clip.id] = el;
                      else delete clipEls.current[clip.id];
                    }}
                    /* Select clip on click — uses fresh props, no stale-closure risk */
                    onClick={(e) => handleClipClick(e, clip, i)}
                    /* Track drag only — never does selection */
                    onMouseDown={(e) => handleClipMouseDown(e, clip, i)}
                    /* Right-click: open context menu */
                    onContextMenu={(e) => handleClipContextMenu(e, clip)}
                    className={`relative flex-shrink-0 h-full rounded-xl overflow-hidden select-none transition-all
                      ${
                        isSel
                          ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/20 opacity-100"
                          : "opacity-80 hover:opacity-100"
                      }
                      ${
                        isDrag
                          ? "opacity-40 scale-[0.97] cursor-grabbing z-20"
                          : "cursor-pointer"
                      }
                      ${isDrop ? "ring-2 ring-blue-400" : ""}`}
                    style={{ width: w, flexShrink: 0 }}
                  >
                    {/* Filmstrip */}
                    {clip.strip?.length ? (
                      <div className="absolute inset-0 flex pointer-events-none">
                        {clip.strip.map((f, fi) => (
                          <div
                            key={fi}
                            className="flex-1 overflow-hidden min-w-0"
                          >
                            {f && (
                              <img
                                src={f}
                                className="h-full w-full object-cover"
                                draggable={false}
                                alt=""
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-zinc-700" />
                    )}

                    {/* Tint overlay */}
                    <div
                      className={`absolute inset-0 pointer-events-none transition-colors ${
                        isSel
                          ? "bg-emerald-400/10"
                          : "bg-black/30 hover:bg-black/15"
                      }`}
                    />

                    {/* Reorder drop indicator bar */}
                    {isDrop && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 z-20 pointer-events-none" />
                    )}

                    {/* Clip label */}
                    <div className="absolute bottom-1 left-2 right-6 pointer-events-none">
                      <p className="text-[8px] font-semibold text-white truncate drop-shadow">
                        {clip.name.replace(/\.[^.]+$/, "")}
                      </p>
                    </div>
                    <div className="absolute bottom-1 right-1.5 pointer-events-none">
                      <span className="text-[8px] text-white/60 mono">
                        {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                      </span>
                    </div>

                    {/* Speed badge */}
                    {clip.speed !== 1 && (
                      <div className="absolute top-1 left-1 bg-black/70 px-1 py-0.5 rounded text-[7px] text-amber-400 mono font-bold pointer-events-none">
                        {clip.speed}×
                      </div>
                    )}

                    {/* Filter badge */}
                    {clip.filter && (
                      <div className="absolute top-1 right-6 bg-violet-600/80 px-1 py-0.5 rounded text-[7px] text-white font-bold pointer-events-none">
                        FX
                      </div>
                    )}

                    {/* Right-click hint (⋮) — shown on unselected hover */}
                    {!isSel && (
                      <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/60 rounded p-0.5">
                          <Icon
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            size={10}
                            className="text-zinc-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Trim handle — left */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setTrimDrag({
                          clipId: clip.id,
                          edge: "start",
                          startX: e.clientX,
                          lastDx: 0,
                        });
                      }}
                      className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center
                                 bg-gradient-to-r from-emerald-400/60 to-transparent hover:from-emerald-400 transition-all"
                    >
                      <div className="w-0.5 h-6 rounded-full bg-emerald-400" />
                    </div>

                    {/* Trim handle — right */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setTrimDrag({
                          clipId: clip.id,
                          edge: "end",
                          startX: e.clientX,
                          lastDx: 0,
                        });
                      }}
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center
                                 bg-gradient-to-l from-emerald-400/60 to-transparent hover:from-emerald-400 transition-all"
                    >
                      <div className="w-0.5 h-6 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                );
              })}

              {/* Empty drop zone when no clips — shows when dragging library item */}
              {clips.length === 0 && libDrop && (
                <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-400/5 mx-1">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Drop here
                  </span>
                </div>
              )}

              {/* Add clip + button at end */}
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("clip-inp")?.click();
                }}
                className="flex-shrink-0 w-8 h-full rounded-xl border-2 border-dashed border-zinc-800 ml-1
                           flex items-center justify-center cursor-pointer hover:border-zinc-600
                           transition-colors text-zinc-700 hover:text-zinc-500"
              >
                <Icon d="M12 5v14M5 12h14" size={13} />
              </div>
            </div>

            {/* ══ TEXT OVERLAY TRACK ══ */}
            <div
              className="absolute left-0 right-0 bg-zinc-950/20 border-b border-zinc-800/40"
              style={{ top: RULER_H + VIDEO_H, height: TEXT_H }}
            >
              {overlays.map((ov) => {
                const l = ov.startTime * pxPerSec;
                const w = Math.max((ov.endTime - ov.startTime) * pxPerSec, 20);
                return (
                  <div
                    key={ov.id}
                    onClick={() => {
                      setSelectedOverlayId(ov.id);
                      setActiveLeftTab("text");
                    }}
                    className="absolute top-1 bottom-1 rounded bg-purple-500/60 hover:bg-purple-400/80
                               border border-purple-400/30 cursor-pointer flex items-center px-1.5
                               overflow-hidden transition-colors"
                    style={{ left: l, width: w }}
                    title={ov.text}
                  >
                    <span className="text-[7px] font-semibold text-white truncate">
                      {ov.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ══ AUDIO TRACK ══ */}
            <div
              className="absolute left-0 right-0 bg-zinc-950/20 border-b border-zinc-800/40"
              style={{ top: RULER_H + VIDEO_H + TEXT_H, height: AUDIO_H }}
            >
              {audioTracks.map((a) => {
                const l = (a.startTime || 0) * pxPerSec;
                const w = Math.max((a.duration || 5) * pxPerSec, 40);
                return (
                  <div
                    key={a.id}
                    className="absolute top-1 bottom-1 rounded bg-sky-500/45 hover:bg-sky-400/60
                               border border-sky-400/30 cursor-pointer overflow-hidden flex items-center transition-colors"
                    style={{ left: l, width: w }}
                    title={a.name}
                  >
                    <div className="flex items-center gap-px h-full py-1 px-1 overflow-hidden flex-1">
                      {Array.from({ length: Math.floor(w / 2.5) }).map(
                        (_, ii) => (
                          <div
                            key={ii}
                            className="w-px bg-sky-300/70 rounded-full shrink-0"
                            style={{
                              height: `${
                                20 +
                                Math.abs(
                                  Math.sin(ii * 0.7 + (a.id.charCodeAt(0) || 0))
                                ) *
                                  60
                              }%`,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ══ SUBTITLE TRACK ══ */}
            <div
              className="absolute left-0 right-0 bg-zinc-950/10"
              style={{
                top: RULER_H + VIDEO_H + TEXT_H + AUDIO_H,
                height: SUB_H,
              }}
            >
              {subtitles.map((s) => (
                <div
                  key={s.id}
                  className="absolute top-1 h-1.5 rounded-full bg-amber-500/60 hover:bg-amber-400 cursor-pointer transition-colors"
                  style={{
                    left: s.startTime * pxPerSec,
                    width: Math.max((s.endTime - s.startTime) * pxPerSec, 8),
                  }}
                  title={s.text}
                />
              ))}
            </div>

            {/* ══ PLAYHEAD ══ */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: currentTime * pxPerSec }}
            >
              <div className="w-px h-full bg-emerald-400/90 relative">
                <div className="absolute -top-px -left-[5px] w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/60" />
                <div className="absolute top-0 left-2 bg-emerald-400 text-black text-[8px] font-bold mono px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg">
                  {fmtTC(currentTime)}
                </div>
              </div>
            </div>

            {/* ══ Library drag-over overlay hint ══ */}
            {libDrop && (
              <div
                className="absolute pointer-events-none z-10 rounded-xl border-2 border-dashed border-emerald-400/40 bg-emerald-400/5"
                style={{
                  top: RULER_H + 2,
                  left: 2,
                  right: 2,
                  height: VIDEO_H - 4,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Track label helper ── */
const TrackLbl = ({ label, color, icon, h }) => (
  <div
    className="flex items-center gap-1.5 px-2 border-b border-zinc-800/40 shrink-0"
    style={{ height: h }}
  >
    <Icon d={icon} size={10} className={color} />
    <span
      className={`text-[8px] font-semibold uppercase tracking-wider ${color} opacity-70 whitespace-nowrap`}
    >
      {label}
    </span>
  </div>
);
