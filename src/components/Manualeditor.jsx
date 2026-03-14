import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const FONTS = [
  "Arial",
  "Georgia",
  "Impact",
  "Verdana",
  "Courier New",
  "Trebuchet MS",
];
const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16", w: 270, h: 480, desc: "Shorts / Reels" },
  { id: "16:9", label: "16:9", w: 480, h: 270, desc: "YouTube / Landscape" },
];
const MUSIC_PRESETS = [
  { id: "bg", name: "Chill BG", url: null, preset: true },
  { id: "none", name: "No Music", url: null, preset: true },
];

let overlayCounter = 0;
let subtitleCounter = 0;

/* ── helpers ── */
const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
};

const uid = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ── Icons ── */
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────── */
export default function ManualEditor() {
  /* ── state ── */
  const [clips, setClips] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [music, setMusic] = useState({ type: "bg", url: null, volume: 0.15 });
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePanel, setActivePanel] = useState("clips"); // clips | text | subtitles | music
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [draggingOverlay, setDraggingOverlay] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(null);
  const [trimming, setTrimming] = useState(null); // { clipId, edge: 'start'|'end', startX, origVal }
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const timelineRef = useRef(null);
  const rafRef = useRef(null);
  const playStartRef = useRef({ wallTime: 0, mediaTime: 0 });

  const ar = ASPECT_RATIOS.find((a) => a.id === aspectRatio);

  /* ── derived ── */
  const totalDuration = clips.reduce(
    (s, c) => s + (c.trimEnd - c.trimStart),
    0
  );

  // Map global time → { clipIndex, localTime }
  const resolveTime = useCallback(
    (t) => {
      let acc = 0;
      for (let i = 0; i < clips.length; i++) {
        const dur = clips[i].trimEnd - clips[i].trimStart;
        if (t <= acc + dur) return { idx: i, local: t - acc };
        acc += dur;
      }
      return {
        idx: clips.length - 1,
        local:
          clips[clips.length - 1]?.trimEnd -
            clips[clips.length - 1]?.trimStart || 0,
      };
    },
    [clips]
  );

  const currentClipIdx = clips.length ? resolveTime(currentTime).idx : -1;

  /* ── playback ── */
  useEffect(() => {
    if (!playing || !clips.length) return;
    const tick = () => {
      const elapsed =
        (performance.now() - playStartRef.current.wallTime) / 1000;
      const t = Math.min(
        playStartRef.current.mediaTime + elapsed,
        totalDuration
      );
      setCurrentTime(t);
      if (t >= totalDuration) {
        setPlaying(false);
        return;
      }
      const { idx, local } = resolveTime(t);
      const clip = clips[idx];
      if (videoRef.current) {
        const targetSrc = clip.url;
        if (videoRef.current.src !== targetSrc) {
          videoRef.current.src = targetSrc;
          videoRef.current.load();
        }
        const want = clip.trimStart + local;
        if (Math.abs(videoRef.current.currentTime - want) > 0.3) {
          videoRef.current.currentTime = want;
        }
        if (videoRef.current.paused) videoRef.current.play().catch(() => {});
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    playStartRef.current = {
      wallTime: performance.now(),
      mediaTime: currentTime,
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
    };
  }, [playing, clips, resolveTime, totalDuration]);

  const togglePlay = () => {
    if (!clips.length) return;
    if (playing) {
      setPlaying(false);
    } else {
      if (currentTime >= totalDuration) setCurrentTime(0);
      setPlaying(true);
    }
  };

  const seekTo = (t) => {
    setCurrentTime(Math.max(0, Math.min(t, totalDuration)));
    setPlaying(false);
    const { idx, local } = resolveTime(Math.max(0, Math.min(t, totalDuration)));
    const clip = clips[idx];
    if (clip && videoRef.current) {
      videoRef.current.src = clip.url;
      videoRef.current.currentTime = clip.trimStart + local;
    }
  };

  /* ── clip upload ── */
  const handleFilesDrop = async (files) => {
    const videoFiles = Array.from(files).filter((f) =>
      f.type.startsWith("video/")
    );
    const newClips = await Promise.all(
      videoFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const duration = await getVideoDuration(url);
        return {
          id: uid("clip"),
          file,
          url,
          name: file.name,
          duration,
          trimStart: 0,
          trimEnd: duration,
        };
      })
    );
    setClips((prev) => [...prev, ...newClips]);
  };

  const getVideoDuration = (url) =>
    new Promise((res) => {
      const v = document.createElement("video");
      v.src = url;
      v.onloadedmetadata = () => res(v.duration);
      v.onerror = () => res(10);
    });

  const removeClip = (id) =>
    setClips((prev) => prev.filter((c) => c.id !== id));

  const moveClip = (id, dir) => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  /* ── text overlays ── */
  const addOverlay = () => {
    const ov = {
      id: uid("ov"),
      text: "Your text here",
      x: 50,
      y: 50, // % of preview
      fontSize: 24,
      fontFamily: "Arial",
      color: "#ffffff",
      bgBox: false,
      bgColor: "rgba(0,0,0,0.5)",
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration || 3),
    };
    setOverlays((prev) => [...prev, ov]);
    setSelectedOverlay(ov.id);
    setActivePanel("text");
  };

  const updateOverlay = (id, patch) =>
    setOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
  const removeOverlay = (id) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedOverlay === id) setSelectedOverlay(null);
  };

  /* ── overlay drag ── */
  const handleOverlayDragStart = (e, id) => {
    e.stopPropagation();
    const rect = previewRef.current.getBoundingClientRect();
    const ov = overlays.find((o) => o.id === id);
    setDraggingOverlay({
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: ov.x,
      origY: ov.y,
      rect,
    });
  };

  const handlePreviewMouseMove = useCallback(
    (e) => {
      if (!draggingOverlay) return;
      const { rect, startX, startY, origX, origY, id } = draggingOverlay;
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      updateOverlay(id, {
        x: Math.max(0, Math.min(100, origX + dx)),
        y: Math.max(0, Math.min(100, origY + dy)),
      });
    },
    [draggingOverlay]
  );

  const handlePreviewMouseUp = useCallback(() => setDraggingOverlay(null), []);

  /* ── subtitles ── */
  const addSubtitle = () => {
    setSubtitles((prev) => [
      ...prev,
      {
        id: uid("sub"),
        text: "Subtitle text",
        startTime: currentTime,
        endTime: Math.min(currentTime + 2, totalDuration || 2),
      },
    ]);
  };
  const updateSubtitle = (id, patch) =>
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  const removeSubtitle = (id) =>
    setSubtitles((prev) => prev.filter((s) => s.id !== id));

  /* ── timeline trim drag ── */
  const handleTrimStart = (e, clipId, edge) => {
    e.stopPropagation();
    const clip = clips.find((c) => c.id === clipId);
    setTrimming({
      clipId,
      edge,
      startX: e.clientX,
      origVal: edge === "start" ? clip.trimStart : clip.trimEnd,
    });
  };

  useEffect(() => {
    if (!trimming) return;
    const PX_PER_SEC = 60;
    const onMove = (e) => {
      const dx = (e.clientX - trimming.startX) / PX_PER_SEC;
      setClips((prev) =>
        prev.map((c) => {
          if (c.id !== trimming.clipId) return c;
          if (trimming.edge === "start")
            return {
              ...c,
              trimStart: Math.max(
                0,
                Math.min(c.trimEnd - 0.5, trimming.origVal + dx)
              ),
            };
          return {
            ...c,
            trimEnd: Math.max(
              c.trimStart + 0.5,
              Math.min(c.duration, trimming.origVal + dx)
            ),
          };
        })
      );
    };
    const onUp = () => setTrimming(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [trimming]);

  /* ── export ── */
  const handleExport = async () => {
    if (!clips.length) return;
    setExporting(true);
    setExportProgress(5);
    setExportDone(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const form = new FormData();
      clips.forEach((c, i) => form.append(`clip_${i}`, c.file, c.name));
      if (music.type !== "none" && music.file)
        form.append("music", music.file, "music.mp3");

      const meta = {
        aspectRatio,
        clips: clips.map((c, i) => ({
          index: i,
          name: c.name,
          trimStart: c.trimStart,
          trimEnd: c.trimEnd,
        })),
        overlays: overlays.map((o) => ({ ...o })),
        subtitles: subtitles.map((s) => ({ ...s })),
        music: { type: music.type, volume: music.volume },
      };
      form.append("meta", JSON.stringify(meta));

      setExportProgress(15);

      const res = await fetch(`${BASE_URL}/export-video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      setExportProgress(90);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setExportDone(url);
      setExportProgress(100);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  /* ── active overlays at currentTime ── */
  const visibleOverlays = overlays.filter(
    (o) => currentTime >= o.startTime && currentTime <= o.endTime
  );
  const visibleSubtitles = subtitles.filter(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const selOv = overlays.find((o) => o.id === selectedOverlay);

  /* ────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans flex flex-col pt-16 select-none">
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
            Manual Editor
          </p>
          <span className="text-zinc-700">·</span>
          <p className="text-[12px] text-zinc-400">
            {fmtTime(totalDuration)} total
          </p>
        </div>

        {/* Aspect ratio */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.id}
              onClick={() => setAspectRatio(ar.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all
                ${
                  aspectRatio === ar.id
                    ? "bg-emerald-400 text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              {ar.label}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting || !clips.length}
          className="flex items-center gap-2 bg-emerald-400 text-black font-semibold text-[13px]
                     px-5 py-2 rounded-xl hover:opacity-85 transition-all disabled:opacity-40"
        >
          {exporting ? (
            <>
              <svg
                className="animate-spin w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              {exportProgress}%
            </>
          ) : (
            "Export MP4"
          )}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {/* LEFT PANEL */}
        <div className="w-64 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950">
          {/* Panel tabs */}
          <div className="flex border-b border-zinc-800">
            {[
              {
                id: "clips",
                icon: "M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
                label: "Clips",
              },
              { id: "text", icon: "M4 6h16M4 12h10M4 18h6", label: "Text" },
              {
                id: "subtitles",
                icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
                label: "Subs",
              },
              {
                id: "music",
                icon: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z",
                label: "Music",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-semibold
                            uppercase tracking-wider transition-colors
                  ${
                    activePanel === tab.id
                      ? "text-emerald-400 border-b-2 border-emerald-400"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
              >
                <Icon d={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* CLIPS PANEL */}
            {activePanel === "clips" && (
              <div className="flex flex-col gap-2">
                {/* Upload zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFilesDrop(e.dataTransfer.files);
                  }}
                  onClick={() => document.getElementById("clip-upload").click()}
                  className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all
                    ${
                      dragOver
                        ? "border-emerald-400 bg-emerald-400/5"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                >
                  <Icon
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    size={20}
                  />
                  <p className="text-[12px] text-zinc-400 text-center leading-snug">
                    Drop videos here
                    <br />
                    or click to browse
                  </p>
                  <input
                    id="clip-upload"
                    type="file"
                    multiple
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFilesDrop(e.target.files)}
                  />
                </div>

                {clips.map((clip, i) => (
                  <div
                    key={clip.id}
                    onClick={() => setSelectedClip(clip.id)}
                    className={`group rounded-xl border p-3 cursor-pointer transition-all
                      ${
                        selectedClip === clip.id
                          ? "border-emerald-400/50 bg-emerald-400/5"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[12px] font-medium text-zinc-200 truncate max-w-[120px]">
                        {clip.name}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClip(clip.id);
                        }}
                        className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-600">
                        {fmtTime(clip.trimEnd - clip.trimStart)}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClip(clip.id, -1);
                          }}
                          disabled={i === 0}
                          className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                        >
                          <Icon d="M18 15l-6-6-6 6" size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClip(clip.id, 1);
                          }}
                          disabled={i === clips.length - 1}
                          className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                        >
                          <Icon d="M6 9l6 6 6-6" size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TEXT PANEL */}
            {activePanel === "text" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={addOverlay}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             border border-dashed border-zinc-700 text-[12px] text-zinc-400
                             hover:border-emerald-400/50 hover:text-emerald-400 transition-all"
                >
                  <Icon d="M12 5v14M5 12h14" size={14} />
                  Add Text Overlay
                </button>

                {overlays.map((ov) => (
                  <div
                    key={ov.id}
                    onClick={() => setSelectedOverlay(ov.id)}
                    className={`group rounded-xl border p-3 cursor-pointer transition-all
                      ${
                        selectedOverlay === ov.id
                          ? "border-emerald-400/50 bg-emerald-400/5"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] text-zinc-200 truncate max-w-[140px]">
                        {ov.text}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOverlay(ov.id);
                        }}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      {fmtTime(ov.startTime)} → {fmtTime(ov.endTime)}
                    </p>
                  </div>
                ))}

                {/* Selected overlay properties */}
                {selOv && (
                  <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900 flex flex-col gap-3 mt-1">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Properties
                    </p>

                    <div>
                      <label className="text-[11px] text-zinc-500 mb-1 block">
                        Text
                      </label>
                      <textarea
                        value={selOv.text}
                        rows={2}
                        onChange={(e) =>
                          updateOverlay(selOv.id, { text: e.target.value })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[13px]
                                   text-zinc-200 resize-none focus:outline-none focus:border-emerald-400/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">
                          Font
                        </label>
                        <select
                          value={selOv.fontFamily}
                          onChange={(e) =>
                            updateOverlay(selOv.id, {
                              fontFamily: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                                     text-[12px] text-zinc-200 focus:outline-none"
                        >
                          {FONTS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">
                          Size
                        </label>
                        <input
                          type="number"
                          value={selOv.fontSize}
                          min={10}
                          max={80}
                          onChange={(e) =>
                            updateOverlay(selOv.id, {
                              fontSize: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                                     text-[12px] text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">
                          Color
                        </label>
                        <input
                          type="color"
                          value={selOv.color}
                          onChange={(e) =>
                            updateOverlay(selOv.id, { color: e.target.value })
                          }
                          className="w-full h-9 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700
                                     p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch-wrapper]:p-0"
                        />
                      </div>
                      <div className="flex flex-col justify-between">
                        <label className="text-[11px] text-zinc-500">
                          BG Box
                        </label>
                        <button
                          onClick={() =>
                            updateOverlay(selOv.id, { bgBox: !selOv.bgBox })
                          }
                          className={`h-9 rounded-lg text-[12px] font-semibold border transition-all
                            ${
                              selOv.bgBox
                                ? "bg-emerald-400 border-emerald-400 text-black"
                                : "border-zinc-700 text-zinc-400"
                            }`}
                        >
                          {selOv.bgBox ? "On" : "Off"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">
                          Start
                        </label>
                        <input
                          type="number"
                          value={selOv.startTime.toFixed(1)}
                          min={0}
                          max={selOv.endTime}
                          step={0.1}
                          onChange={(e) =>
                            updateOverlay(selOv.id, {
                              startTime: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">
                          End
                        </label>
                        <input
                          type="number"
                          value={selOv.endTime.toFixed(1)}
                          min={selOv.startTime}
                          max={totalDuration || 999}
                          step={0.1}
                          onChange={(e) =>
                            updateOverlay(selOv.id, {
                              endTime: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      Drag text on preview to reposition
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SUBTITLES PANEL */}
            {activePanel === "subtitles" && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={addSubtitle}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             border border-dashed border-zinc-700 text-[12px] text-zinc-400
                             hover:border-emerald-400/50 hover:text-emerald-400 transition-all"
                >
                  <Icon d="M12 5v14M5 12h14" size={14} />
                  Add Subtitle
                </button>
                {subtitles.map((s, i) => (
                  <div
                    key={s.id}
                    className="group border border-zinc-800 bg-zinc-900 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-zinc-600">
                        #{i + 1}
                      </span>
                      <button
                        onClick={() => removeSubtitle(s.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} />
                      </button>
                    </div>
                    <textarea
                      value={s.text}
                      rows={2}
                      onChange={(e) =>
                        updateSubtitle(s.id, { text: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px]
                                 text-zinc-200 resize-none focus:outline-none mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">
                          Start
                        </label>
                        <input
                          type="number"
                          value={s.startTime.toFixed(1)}
                          step={0.1}
                          min={0}
                          onChange={(e) =>
                            updateSubtitle(s.id, {
                              startTime: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[12px] text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">
                          End
                        </label>
                        <input
                          type="number"
                          value={s.endTime.toFixed(1)}
                          step={0.1}
                          min={0}
                          onChange={(e) =>
                            updateSubtitle(s.id, {
                              endTime: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[12px] text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MUSIC PANEL */}
            {activePanel === "music" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {MUSIC_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        setMusic((prev) => ({
                          ...prev,
                          type: p.id,
                          file: null,
                        }))
                      }
                      className={`py-2.5 rounded-xl text-[12px] font-semibold border transition-all
                        ${
                          music.type === p.id
                            ? "bg-emerald-400 border-emerald-400 text-black"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div
                  className="border border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-zinc-500 transition-colors"
                  onClick={() =>
                    document.getElementById("music-upload").click()
                  }
                >
                  <Icon
                    d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z"
                    size={18}
                  />
                  <p className="text-[12px] text-zinc-400 text-center">
                    Upload MP3
                  </p>
                  {music.type === "custom" && (
                    <p className="text-[11px] text-emerald-400">
                      {music.file?.name}
                    </p>
                  )}
                  <input
                    id="music-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f)
                        setMusic({
                          type: "custom",
                          file: f,
                          url: URL.createObjectURL(f),
                          volume: 0.15,
                        });
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] text-zinc-500">Volume</label>
                    <span className="text-[11px] text-zinc-300">
                      {Math.round(music.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={music.volume}
                    onChange={(e) =>
                      setMusic((prev) => ({
                        ...prev,
                        volume: Number(e.target.value),
                      }))
                    }
                    className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                               [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-emerald-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER — PREVIEW */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d0d] gap-5 overflow-hidden p-6">
          {clips.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <Icon
                  d="M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                  size={28}
                />
              </div>
              <p className="text-zinc-500 text-[14px]">
                Upload clips to get started
              </p>
            </div>
          ) : (
            <div
              ref={previewRef}
              onMouseMove={handlePreviewMouseMove}
              onMouseUp={handlePreviewMouseUp}
              className="relative bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-zinc-800"
              style={{
                width: ar.w,
                height: ar.h,
                cursor: draggingOverlay ? "grabbing" : "default",
              }}
            >
              {/* Video */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={clips[0]?.url}
                muted={false}
              />

              {/* Text overlays */}
              {visibleOverlays.map((ov) => (
                <div
                  key={ov.id}
                  onMouseDown={(e) => handleOverlayDragStart(e, ov.id)}
                  onClick={() => {
                    setSelectedOverlay(ov.id);
                    setActivePanel("text");
                  }}
                  style={{
                    position: "absolute",
                    left: `${ov.x}%`,
                    top: `${ov.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontFamily: ov.fontFamily,
                    fontSize: ov.fontSize,
                    color: ov.color,
                    background: ov.bgBox ? ov.bgColor : "transparent",
                    padding: ov.bgBox ? "4px 10px" : 0,
                    borderRadius: ov.bgBox ? 6 : 0,
                    cursor: "grab",
                    userSelect: "none",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    border:
                      selectedOverlay === ov.id
                        ? "1px dashed rgba(52,211,153,0.6)"
                        : "1px dashed transparent",
                    whiteSpace: "nowrap",
                    maxWidth: "90%",
                    zIndex: 10,
                  }}
                >
                  {ov.text}
                </div>
              ))}

              {/* Subtitles */}
              {visibleSubtitles.map((s) => (
                <div
                  key={s.id}
                  style={{
                    position: "absolute",
                    bottom: 24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    background: "rgba(0,0,0,0.6)",
                    padding: "4px 12px",
                    borderRadius: 6,
                    textAlign: "center",
                    maxWidth: "90%",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                    zIndex: 9,
                  }}
                >
                  {s.text}
                </div>
              ))}

              {/* Aspect ratio label */}
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-zinc-400">
                {aspectRatio}
              </div>
            </div>
          )}

          {/* Playback controls */}
          {clips.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => seekTo(0)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Icon d="M19 20L9 12l10-8v16zM5 19V5" size={16} />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-emerald-400 text-black flex items-center justify-center
                           hover:opacity-85 transition-all shadow-lg shadow-emerald-400/20"
              >
                {playing ? (
                  <Icon d="M6 4h4v16H6zM14 4h4v16h-4z" size={16} />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                  </svg>
                )}
              </button>
              <span className="text-[12px] text-zinc-500 tabular-nums">
                {fmtTime(currentTime)} / {fmtTime(totalDuration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── TIMELINE ── */}
      <div className="h-36 border-t border-zinc-800 bg-zinc-950 flex flex-col">
        {/* Timeline header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800/60">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">
            Timeline
          </p>
          {selectedClip && clips.find((c) => c.id === selectedClip) && (
            <span className="text-[11px] text-zinc-500">
              Selected:{" "}
              <span className="text-zinc-300">
                {clips.find((c) => c.id === selectedClip)?.name}
              </span>
            </span>
          )}
        </div>

        {/* Timeline tracks */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-3"
        >
          {clips.length === 0 ? (
            <p className="text-[12px] text-zinc-700 italic">
              Add clips to see them in the timeline
            </p>
          ) : (
            <div
              className="relative h-full"
              style={{ minWidth: totalDuration * 60 + 40 }}
            >
              {/* Time ruler */}
              <div className="absolute top-0 left-0 right-0 h-4 flex items-center">
                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center"
                      style={{ left: i * 60 }}
                    >
                      <div className="w-px h-2 bg-zinc-700" />
                      <span className="text-[9px] text-zinc-700 mt-0.5">
                        {i}s
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Clip blocks */}
              <div className="absolute top-5 left-0 flex h-14">
                {clips.map((clip, i) => {
                  const w = (clip.trimEnd - clip.trimStart) * 60;
                  const left = clips
                    .slice(0, i)
                    .reduce((s, c) => s + (c.trimEnd - c.trimStart) * 60, 0);
                  return (
                    <div
                      key={clip.id}
                      onClick={() => {
                        setSelectedClip(clip.id);
                        seekTo(left / 60);
                      }}
                      className="absolute h-full rounded-lg overflow-hidden cursor-pointer group transition-all"
                      style={{ left, width: Math.max(w, 20), marginRight: 2 }}
                    >
                      <div
                        className={`w-full h-full border rounded-lg transition-all flex items-center px-2
                        ${
                          selectedClip === clip.id
                            ? "border-emerald-400 bg-emerald-400/10"
                            : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <p className="text-[11px] text-zinc-300 truncate font-medium">
                          {clip.name}
                        </p>
                      </div>
                      {/* Trim handles */}
                      <div
                        onMouseDown={(e) =>
                          handleTrimStart(e, clip.id, "start")
                        }
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-emerald-400/40 hover:bg-emerald-400/80 rounded-l-lg transition-colors"
                      />
                      <div
                        onMouseDown={(e) => handleTrimStart(e, clip.id, "end")}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-emerald-400/40 hover:bg-emerald-400/80 rounded-r-lg transition-colors"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-emerald-400 z-20 pointer-events-none"
                style={{ left: currentTime * 60 }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 -translate-x-1/2 -translate-y-0.5 shadow-lg shadow-emerald-400/50" />
              </div>

              {/* Click to seek */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo((e.clientX - rect.left) / 60);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Export download */}
      {exportDone && (
        <div
          className="fixed bottom-6 right-6 bg-zinc-900 border border-emerald-400/30 rounded-2xl px-5 py-4
                        shadow-2xl shadow-black/60 flex items-center gap-4 z-50 animate-fadeup"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center">
            <Icon
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              size={16}
            />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-zinc-100">
              Export complete!
            </p>
            <p className="text-[11px] text-zinc-500">
              Your video is ready to download
            </p>
          </div>
          <a
            href={exportDone}
            download="not-a-yt-edit.mp4"
            className="bg-emerald-400 text-black text-[13px] font-semibold px-4 py-2 rounded-xl hover:opacity-85 transition-opacity"
          >
            Download
          </a>
          <button
            onClick={() => setExportDone(null)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Icon d="M18 6L6 18M6 6l12 12" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
