import { useState, useRef, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env?.VITE_SERVER_URL || "http://localhost:3000";

const FONTS = [
  "Arial",
  "Georgia",
  "Impact",
  "Verdana",
  "Courier New",
  "Trebuchet MS",
  "Helvetica",
  "Times New Roman",
];
const ASPECT_RATIOS = [
  { id: "9:16", fw: 1080, fh: 1920 },
  { id: "16:9", fw: 1920, fh: 1080 },
  { id: "1:1", fw: 1080, fh: 1080 },
];
const BASE_PX_PER_SEC = 90;

const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return "0:00.0";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
};

const getVideoDuration = (url) =>
  new Promise((res) => {
    const v = document.createElement("video");
    v.src = url;
    v.onloadedmetadata = () => res(v.duration);
    v.onerror = () => res(10);
  });

const captureThumbnail = (url, t = 0.5) =>
  new Promise((res) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.src = url;
    v.muted = true;
    v.onloadeddata = () => {
      v.currentTime = Math.min(t, v.duration * 0.1);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 90;
      try {
        c.getContext("2d").drawImage(v, 0, 0, 160, 90);
        res(c.toDataURL("image/jpeg", 0.5));
      } catch {
        res(null);
      }
    };
    v.onerror = () => res(null);
  });

const captureStrip = async (url, count = 10) => {
  const dur = await getVideoDuration(url);
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = (dur / count) * i + dur / count / 2;
    frames.push(await captureThumbnail(url, t));
  }
  return frames;
};

const Icon = ({ d, size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const Tip = ({ label, children }) => (
  <div className="group/tip relative inline-flex">
    {children}
    <div
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                    bg-zinc-800 text-zinc-200 text-[10px] font-medium px-2 py-1 rounded-md
                    whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity
                    border border-zinc-700 z-[100] shadow-lg"
    >
      {label}
    </div>
  </div>
);

const TBtn = ({ icon, label, onClick, accent, danger, disabled }) => (
  <Tip label={label}>
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed
        ${
          accent
            ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/60"
            : danger
            ? "border-transparent text-red-400 hover:bg-red-400/10 hover:border-red-400/20"
            : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        }`}
    >
      <Icon d={icon} size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  </Tip>
);

/* ═══════════════════════════════════════════════════ */
export default function ManualEditor() {
  const [clips, setClips] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [music, setMusic] = useState({
    type: "none",
    file: null,
    volume: 0.15,
  });
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePanel, setActivePanel] = useState("clips");
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [draggingOv, setDraggingOv] = useState(null);
  const [trimDrag, setTrimDrag] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const timelineRef = useRef(null);
  const rafRef = useRef(null);
  const playStart = useRef({ wall: 0, media: 0 });
  const hideTimer = useRef(null);

  // Heights: nav=64, topbar=48, timeline=130
  const TIMELINE_H = 130;
  const TOPBAR_H = 48;
  const NAV_H = 64;
  // Available height for the preview area
  const PREVIEW_AREA_H = `calc(100vh - ${NAV_H}px - ${TOPBAR_H}px - ${TIMELINE_H}px)`;

  const pxPerSec = BASE_PX_PER_SEC * zoom;
  const totalDuration = clips.reduce(
    (s, c) => s + (c.trimEnd - c.trimStart),
    0
  );

  const resolveTime = useCallback(
    (t) => {
      let acc = 0;
      for (let i = 0; i < clips.length; i++) {
        const d = clips[i].trimEnd - clips[i].trimStart;
        if (t < acc + d || i === clips.length - 1)
          return { idx: i, local: t - acc };
        acc += d;
      }
      return { idx: 0, local: 0 };
    },
    [clips]
  );

  const clipStartTime = useCallback(
    (idx) =>
      clips.slice(0, idx).reduce((s, c) => s + (c.trimEnd - c.trimStart), 0),
    [clips]
  );

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const selOv = overlays.find((o) => o.id === selectedOverlay) || null;

  /* ── Playback ── */
  useEffect(() => {
    if (!playing || !clips.length) return;
    const tick = () => {
      const elapsed = (performance.now() - playStart.current.wall) / 1000;
      const t = Math.min(playStart.current.media + elapsed, totalDuration);
      setCurrentTime(t);
      if (t >= totalDuration) {
        setPlaying(false);
        videoRef.current?.pause();
        return;
      }
      const { idx, local } = resolveTime(t);
      const clip = clips[idx];
      if (videoRef.current) {
        if (videoRef.current.dataset.clipId !== clip.id) {
          videoRef.current.pause();
          videoRef.current.src = clip.url;
          videoRef.current.dataset.clipId = clip.id;
          videoRef.current.currentTime = clip.trimStart + local;
          videoRef.current.play().catch(() => {});
          playStart.current = { wall: performance.now(), media: t };
        } else {
          const want = clip.trimStart + local;
          if (Math.abs(videoRef.current.currentTime - want) > 0.5)
            videoRef.current.currentTime = want;
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            playStart.current = { wall: performance.now(), media: t };
          }
        }
      }
      if (timelineRef.current) {
        const px = t * pxPerSec;
        const { scrollLeft, clientWidth } = timelineRef.current;
        if (px > scrollLeft + clientWidth - 80 || px < scrollLeft)
          timelineRef.current.scrollLeft = px - clientWidth / 2;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    playStart.current = { wall: performance.now(), media: currentTime };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
    };
  }, [playing]);

  const seekTo = useCallback(
    (t) => {
      const ct = Math.max(0, Math.min(t, Math.max(totalDuration, 0.01)));
      setCurrentTime(ct);
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
      if (!clips.length) return;
      const { idx, local } = resolveTime(ct);
      const clip = clips[idx];
      if (clip && videoRef.current) {
        if (videoRef.current.dataset.clipId !== clip.id) {
          videoRef.current.src = clip.url;
          videoRef.current.dataset.clipId = clip.id;
          videoRef.current.addEventListener(
            "loadeddata",
            () => {
              videoRef.current.currentTime = clip.trimStart + local;
            },
            { once: true }
          );
        } else {
          videoRef.current.currentTime = clip.trimStart + local;
        }
      }
    },
    [clips, totalDuration, resolveTime]
  );

  useEffect(() => {
    if (
      clips.length > 0 &&
      videoRef.current &&
      !videoRef.current.dataset.clipId
    ) {
      const clip = clips[0];
      videoRef.current.src = clip.url;
      videoRef.current.dataset.clipId = clip.id;
      videoRef.current.currentTime = clip.trimStart;
    }
  }, [clips]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /* ── Auto-hide controls ── */
  const showCtrl = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing)
      hideTimer.current = setTimeout(() => setShowControls(false), 2800);
  };
  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      clearTimeout(hideTimer.current);
    } else showCtrl();
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  const togglePlay = () => {
    if (!clips.length) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (currentTime >= totalDuration) {
      seekTo(0);
      setTimeout(() => setPlaying(true), 50);
      return;
    }
    setPlaying(true);
  };

  const handleFiles = async (files) => {
    const vids = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (!vids.length) return;
    setLoading(true);
    const newClips = await Promise.all(
      vids.map(async (file) => {
        const url = URL.createObjectURL(file);
        const duration = await getVideoDuration(url);
        const thumb = await captureThumbnail(url);
        const strip = await captureStrip(url, 10);
        return {
          id: uid(),
          file,
          url,
          name: file.name,
          duration,
          trimStart: 0,
          trimEnd: duration,
          thumb,
          strip,
        };
      })
    );
    setClips((prev) => [...prev, ...newClips]);
    if (!selectedClipId && newClips.length) setSelectedClipId(newClips[0].id);
    setLoading(false);
  };

  const splitClip = () => {
    if (!clips.length) return;
    const { idx, local } = resolveTime(currentTime);
    const clip = clips[idx];
    const splitPoint = clip.trimStart + local;
    if (local < 0.15 || clip.trimEnd - splitPoint < 0.15) return;
    const left = { ...clip, id: uid(), trimEnd: splitPoint };
    const right = { ...clip, id: uid(), trimStart: splitPoint };
    setClips((prev) => {
      const n = [...prev];
      n.splice(idx, 1, left, right);
      return n;
    });
    setSelectedClipId(right.id);
  };

  const deleteClip = (id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  };
  const duplicateClip = (id) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const n = [...prev];
      n.splice(i + 1, 0, { ...clip, id: uid() });
      return n;
    });
  };

  useEffect(() => {
    if (!trimDrag) return;
    const onMove = (e) => {
      const dx = (e.clientX - trimDrag.startX) / pxPerSec;
      setClips((prev) =>
        prev.map((c) => {
          if (c.id !== trimDrag.clipId) return c;
          if (trimDrag.edge === "start")
            return {
              ...c,
              trimStart: Math.max(
                0,
                Math.min(c.trimEnd - 0.2, trimDrag.orig + dx)
              ),
            };
          return {
            ...c,
            trimEnd: Math.max(
              c.trimStart + 0.2,
              Math.min(c.duration, trimDrag.orig + dx)
            ),
          };
        })
      );
    };
    const onUp = () => setTrimDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [trimDrag, pxPerSec]);

  const startOvDrag = (e, id) => {
    e.stopPropagation();
    const rect = previewRef.current.getBoundingClientRect();
    const ov = overlays.find((o) => o.id === id);
    setDraggingOv({
      id,
      sx: e.clientX,
      sy: e.clientY,
      ox: ov.x,
      oy: ov.y,
      rect,
    });
  };

  const onPreviewMove = (e) => {
    showCtrl();
    if (!draggingOv) return;
    const dx = ((e.clientX - draggingOv.sx) / draggingOv.rect.width) * 100;
    const dy = ((e.clientY - draggingOv.sy) / draggingOv.rect.height) * 100;
    setOverlays((prev) =>
      prev.map((o) =>
        o.id === draggingOv.id
          ? {
              ...o,
              x: Math.max(2, Math.min(98, draggingOv.ox + dx)),
              y: Math.max(2, Math.min(98, draggingOv.oy + dy)),
            }
          : o
      )
    );
  };

  const addOverlay = () => {
    const ov = {
      id: uid(),
      text: "Your text here",
      x: 50,
      y: 40,
      fontSize: 36,
      fontFamily: "Arial",
      color: "#ffffff",
      bgBox: false,
      bold: false,
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration || 5),
    };
    setOverlays((p) => [...p, ov]);
    setSelectedOverlay(ov.id);
    setActivePanel("text");
  };

  const addSubtitle = () =>
    setSubtitles((p) => [
      ...p,
      {
        id: uid(),
        text: "Subtitle text",
        startTime: currentTime,
        endTime: Math.min(currentTime + 2, totalDuration || 3),
      },
    ]);
  const updOv = (id, patch) =>
    setOverlays((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const updSub = (id, patch) =>
    setSubtitles((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleExport = async () => {
    if (!clips.length) return;
    setExporting(true);
    setExportProgress(5);
    setExportDone(null);
    try {
      const form = new FormData();
      clips.forEach((c, i) => form.append(`clip_${i}`, c.file, c.name));
      if (music.type === "custom" && music.file)
        form.append("music", music.file);
      form.append(
        "meta",
        JSON.stringify({
          aspectRatio,
          clips: clips.map((c, i) => ({
            index: i,
            name: c.name,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
          })),
          overlays,
          subtitles,
          music: { type: music.type, volume: music.volume },
        })
      );
      setExportProgress(20);
      const res = await fetch(`${BASE_URL}/export-video`, {
        method: "POST",
        body: form,
      });
      setExportProgress(90);
      if (!res.ok) throw new Error("Export failed");
      setExportDone(URL.createObjectURL(await res.blob()));
      setExportProgress(100);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const visOv = overlays.filter(
    (o) => currentTime >= o.startTime && currentTime <= o.endTime
  );
  const visSub = subtitles.filter(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const is916 = aspectRatio === "9:16";
  const is11 = aspectRatio === "1:1";

  // Progress % for scrubber
  const progressPct =
    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  /* ═══════════ RENDER ═══════════ */
  return (
    <div
      className="flex flex-col bg-[#0c0c0e] font-sans overflow-hidden select-none text-zinc-200"
      style={{ height: "100vh", paddingTop: NAV_H }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }
        input[type=range].rng { -webkit-appearance: none; background: transparent; }
        input[type=range].rng::-webkit-slider-runnable-track { height: 3px; border-radius: 99px; background: rgba(255,255,255,0.15); }
        input[type=range].rng::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #34d399; margin-top: -4.5px; cursor: pointer; }
        input[type=range].rng-bar::-webkit-slider-runnable-track { background: linear-gradient(to right, #34d399 var(--p, 0%), rgba(255,255,255,0.12) var(--p, 0%)); }
        @keyframes fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadeup { animation: fadeup 0.22s ease forwards; }
        .ctrl-fade { transition: opacity 0.3s ease; }
      `}</style>

      {/* ══ TOP BAR ══ */}
      <div
        className="flex items-center justify-between px-4 shrink-0 gap-3 border-b border-zinc-800/80 bg-[#0a0a0c]"
        style={{ height: TOPBAR_H }}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {selectedClip ? (
            <div className="flex items-center gap-1">
              <span className="mono text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-lg mr-1 shrink-0">
                {(selectedClip.trimEnd - selectedClip.trimStart).toFixed(2)}s
              </span>
              <div className="w-px h-5 bg-zinc-800 mx-0.5" />
              <TBtn
                icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                label="Trim"
              />
              <TBtn
                icon="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                label="Split"
                onClick={splitClip}
                accent
              />
              <TBtn icon="M13 10V3L4 14h7v7l9-11h-7z" label="Speed" />
              <TBtn
                icon="M8 17l4 4 4-4m-4-5v9M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"
                label="Duplicate"
                onClick={() => duplicateClip(selectedClipId)}
              />
              <div className="w-px h-5 bg-zinc-800 mx-0.5" />
              <TBtn
                icon="M18 6L6 18M6 6l12 12"
                label="Delete"
                onClick={() => deleteClip(selectedClipId)}
                danger
              />
            </div>
          ) : (
            <span className="text-[11px] text-zinc-600 italic">
              Select a clip to edit
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shrink-0">
          {ASPECT_RATIOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAspectRatio(a.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all mono
                ${
                  aspectRatio === a.id
                    ? "bg-emerald-400 text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              {a.id}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-xl hover:border-zinc-600 hover:text-zinc-200 transition-all">
            <Icon
              d="M8 17l4 4 4-4m-4-5v9M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"
              size={13}
            />{" "}
            Save Draft
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !clips.length}
            className="flex items-center gap-2 bg-emerald-400 text-black font-bold text-[12px] px-4 py-1.5 rounded-xl hover:bg-emerald-300 transition-all disabled:opacity-40 shadow-lg shadow-emerald-400/20"
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
              <>
                <Icon
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  size={13}
                />{" "}
                Export MP4
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div
        className="flex min-h-0"
        style={{
          height: `calc(100vh - ${NAV_H}px - ${TOPBAR_H}px - ${TIMELINE_H}px)`,
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          className={`shrink-0 border-r border-zinc-800/80 flex flex-col bg-[#080809] transition-all duration-200 ${
            leftCollapsed ? "w-12" : "w-60"
          }`}
        >
          {/* Collapse btn */}
          <div className="flex justify-end px-1.5 pt-2">
            <button
              onClick={() => setLeftCollapsed((v) => !v)}
              className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <Icon
                d={leftCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}
                size={12}
              />
            </button>
          </div>

          {/* Tab icons (always shown) */}
          <div
            className={`flex shrink-0 px-1 gap-0.5 ${
              leftCollapsed
                ? "flex-col items-center py-1"
                : "border-b border-zinc-800/80 pt-1"
            }`}
          >
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
                icon: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z",
                label: "Audio",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActivePanel(t.id);
                  if (leftCollapsed) setLeftCollapsed(false);
                }}
                className={`${
                  leftCollapsed
                    ? "w-8 h-8 rounded-lg mb-1"
                    : "flex-1 rounded-t-lg py-2"
                } 
                  flex flex-col items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-all
                  ${
                    activePanel === t.id
                      ? leftCollapsed
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "text-emerald-400 bg-zinc-900/80 border-t border-x border-zinc-800/80 -mb-px"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
              >
                <Icon d={t.icon} size={13} />
                {!leftCollapsed && t.label}
              </button>
            ))}
          </div>

          {!leftCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* CLIPS */}
              {activePanel === "clips" && (
                <div className="space-y-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => document.getElementById("clip-inp").click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all text-center
                      ${
                        dragOver
                          ? "border-emerald-400 bg-emerald-400/5"
                          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30"
                      }`}
                  >
                    {loading ? (
                      <svg
                        className="animate-spin w-5 h-5 text-emerald-400"
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
                    ) : (
                      <Icon
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        size={20}
                        className="text-zinc-500"
                      />
                    )}
                    <div>
                      <p className="text-[11px] font-medium text-zinc-300">
                        Drop video files
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        or click to browse
                      </p>
                    </div>
                    <input
                      id="clip-inp"
                      type="file"
                      multiple
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                  {clips.map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClipId(c.id);
                        seekTo(clipStartTime(i));
                      }}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all
                        ${
                          selectedClipId === c.id
                            ? "border-emerald-400/40 bg-emerald-400/5"
                            : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                        }`}
                    >
                      {c.thumb ? (
                        <img
                          src={c.thumb}
                          className="w-14 h-8 rounded-lg object-cover shrink-0 ring-1 ring-zinc-700/50"
                        />
                      ) : (
                        <div className="w-14 h-8 rounded-lg bg-zinc-800 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-zinc-200 truncate">
                          {c.name.replace(/\.[^.]+$/, "")}
                        </p>
                        <p className="text-[10px] text-zinc-600 mono mt-0.5">
                          {fmtTime(c.trimEnd - c.trimStart)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-1 transition-all"
                      >
                        <Icon d="M18 6L6 18M6 6l12 12" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TEXT */}
              {activePanel === "text" && (
                <div className="space-y-2">
                  <button
                    onClick={addOverlay}
                    className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 text-[11px] text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon d="M12 5v14M5 12h14" size={13} /> Add Text Layer
                  </button>
                  {overlays.map((ov) => (
                    <div
                      key={ov.id}
                      onClick={() => setSelectedOverlay(ov.id)}
                      className={`group p-2.5 rounded-xl border cursor-pointer transition-all
                        ${
                          selectedOverlay === ov.id
                            ? "border-emerald-400/40 bg-emerald-400/5"
                            : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-zinc-200 truncate max-w-[120px]">
                          {ov.text}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOverlays((p) => p.filter((o) => o.id !== ov.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5"
                        >
                          <Icon d="M18 6L6 18M6 6l12 12" size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-600 mono mt-0.5">
                        {fmtTime(ov.startTime)} → {fmtTime(ov.endTime)}
                      </p>
                    </div>
                  ))}
                  {selOv && (
                    <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60 space-y-3">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">
                        Properties
                      </p>
                      <textarea
                        value={selOv.text}
                        rows={2}
                        onChange={(e) =>
                          updOv(selOv.id, { text: e.target.value })
                        }
                        className="bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2.5 py-2 text-[12px] text-zinc-200 resize-none focus:outline-none w-full focus:border-emerald-400/50"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                            Font
                          </label>
                          <select
                            value={selOv.fontFamily}
                            onChange={(e) =>
                              updOv(selOv.id, { fontFamily: e.target.value })
                            }
                            className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none"
                          >
                            {FONTS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                            Size
                          </label>
                          <input
                            type="number"
                            value={selOv.fontSize}
                            min={8}
                            max={180}
                            onChange={(e) =>
                              updOv(selOv.id, {
                                fontSize: Number(e.target.value),
                              })
                            }
                            className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                            Color
                          </label>
                          <input
                            type="color"
                            value={selOv.color}
                            onChange={(e) =>
                              updOv(selOv.id, { color: e.target.value })
                            }
                            className="w-full h-8 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700/80 p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch-wrapper]:p-0"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                            Bold
                          </label>
                          <button
                            onClick={() =>
                              updOv(selOv.id, { bold: !selOv.bold })
                            }
                            className={`w-full h-8 rounded-lg text-[12px] font-bold border transition-all ${
                              selOv.bold
                                ? "bg-emerald-400 border-emerald-400 text-black"
                                : "border-zinc-700/80 text-zinc-400"
                            }`}
                          >
                            B
                          </button>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                            BG
                          </label>
                          <button
                            onClick={() =>
                              updOv(selOv.id, { bgBox: !selOv.bgBox })
                            }
                            className={`w-full h-8 rounded-lg text-[11px] font-semibold border transition-all ${
                              selOv.bgBox
                                ? "bg-emerald-400 border-emerald-400 text-black"
                                : "border-zinc-700/80 text-zinc-400"
                            }`}
                          >
                            BG
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {["startTime", "endTime"].map((k) => (
                          <div key={k}>
                            <label className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                              {k === "startTime" ? "Show at" : "Hide at"}
                            </label>
                            <input
                              type="number"
                              value={selOv[k].toFixed(1)}
                              step={0.1}
                              min={0}
                              onChange={(e) =>
                                updOv(selOv.id, { [k]: Number(e.target.value) })
                              }
                              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none mono"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-zinc-600 text-center">
                        Drag text on preview to reposition
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SUBS */}
              {activePanel === "subtitles" && (
                <div className="space-y-2">
                  <button
                    onClick={addSubtitle}
                    className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 text-[11px] text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon d="M12 5v14M5 12h14" size={13} /> Add Subtitle
                  </button>
                  {subtitles.map((s, i) => (
                    <div
                      key={s.id}
                      className="group border border-zinc-800/80 bg-zinc-900/40 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-600 mono">
                          #{String(i + 1).padStart(2, "0")}
                        </span>
                        <button
                          onClick={() =>
                            setSubtitles((p) => p.filter((x) => x.id !== s.id))
                          }
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5"
                        >
                          <Icon d="M18 6L6 18M6 6l12 12" size={11} />
                        </button>
                      </div>
                      <textarea
                        value={s.text}
                        rows={2}
                        onChange={(e) => updSub(s.id, { text: e.target.value })}
                        className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 resize-none focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {["startTime", "endTime"].map((k) => (
                          <div key={k}>
                            <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">
                              {k === "startTime" ? "Start" : "End"}
                            </label>
                            <input
                              type="number"
                              value={s[k].toFixed(1)}
                              step={0.1}
                              min={0}
                              onChange={(e) =>
                                updSub(s.id, { [k]: Number(e.target.value) })
                              }
                              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AUDIO */}
              {activePanel === "music" && (
                <div className="space-y-2">
                  {[
                    {
                      id: "none",
                      label: "No Music",
                      icon: "M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
                    },
                    {
                      id: "bg",
                      label: "Chill Ambient",
                      icon: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setMusic((p) => ({ ...p, type: opt.id }))}
                      className={`w-full py-2.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-2 px-3
                        ${
                          music.type === opt.id
                            ? "bg-emerald-400/10 border-emerald-400/40 text-emerald-400"
                            : "border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                        }`}
                    >
                      <Icon d={opt.icon} size={13} />
                      {opt.label}
                      {music.type === opt.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                  <div
                    onClick={() => document.getElementById("music-inp").click()}
                    className="border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-zinc-600 transition-colors hover:bg-zinc-900/30"
                  >
                    <Icon
                      d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z"
                      size={18}
                      className="text-zinc-500"
                    />
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Upload Audio
                    </p>
                    {music.type === "custom" && (
                      <p className="text-[10px] text-emerald-400 truncate max-w-full px-2 text-center">
                        {music.file?.name}
                      </p>
                    )}
                    <input
                      id="music-inp"
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
                  <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/40 space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-500">
                        Music Volume
                      </label>
                      <span className="text-[10px] text-zinc-300 mono">
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
                        setMusic((p) => ({
                          ...p,
                          volume: Number(e.target.value),
                        }))
                      }
                      className="w-full rng rng-bar"
                      style={{ "--p": `${music.volume * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ PREVIEW — fills ALL remaining height and width ══ */}
        <div
          className="flex-1 flex items-center justify-center bg-[#050507] overflow-hidden"
          style={{ minWidth: 0 }}
          onMouseMove={onPreviewMove}
          onMouseUp={() => setDraggingOv(null)}
        >
          {clips.length === 0 ? (
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <Icon
                  d="M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                  size={32}
                />
              </div>
              <div className="text-center">
                <p className="text-zinc-300 font-semibold">Ready to edit</p>
                <p className="text-zinc-600 text-[12px] mt-1">
                  Upload your video clips to get started
                </p>
              </div>
              <button
                onClick={() => document.getElementById("clip-inp")?.click()}
                className="bg-emerald-400 text-black font-bold text-[13px] px-6 py-2.5 rounded-xl hover:bg-emerald-300 transition-all"
              >
                Upload Videos
              </button>
            </div>
          ) : (
            /*
              THE FIX:
              The preview container uses the FULL available height.
              We use a wrapper that is full size, and inside it the video box
              is sized with CSS to maintain aspect ratio without overflow.
              Controls are absolutely positioned INSIDE the video box — 
              they never push the video out of frame.
            */
            <div
              className="relative w-full h-full flex items-center justify-center"
              onMouseMove={showCtrl}
              onClick={showCtrl}
            >
              {/* Video box: constrained to fill available space keeping aspect ratio */}
              <div
                ref={previewRef}
                className="relative bg-black overflow-hidden shadow-2xl shadow-black/80 border border-zinc-800/30"
                style={
                  is916
                    ? {
                        // Portrait: height drives sizing
                        height: "100%",
                        aspectRatio: "9/16",
                        maxWidth: "100%",
                      }
                    : is11
                    ? {
                        // Square: smaller of width/height
                        height: "100%",
                        aspectRatio: "1/1",
                        maxWidth: "100%",
                      }
                    : {
                        // Landscape 16:9: fill width, cap by height
                        width: "100%",
                        aspectRatio: "16/9",
                        maxHeight: "100%",
                      }
                }
              >
                {/* ── VIDEO fills entire box ── */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  preload="metadata"
                />

                {/* Text overlays */}
                {visOv.map((ov) => (
                  <div
                    key={ov.id}
                    onMouseDown={(e) => startOvDrag(e, ov.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlay(ov.id);
                      setActivePanel("text");
                    }}
                    style={{
                      position: "absolute",
                      left: `${ov.x}%`,
                      top: `${ov.y}%`,
                      transform: "translate(-50%,-50%)",
                      fontFamily: ov.fontFamily,
                      fontSize: ov.fontSize,
                      fontWeight: ov.bold ? 700 : 400,
                      color: ov.color,
                      cursor: "grab",
                      zIndex: 10,
                      background: ov.bgBox ? "rgba(0,0,0,0.65)" : "transparent",
                      padding: ov.bgBox ? "6px 16px" : "2px",
                      borderRadius: ov.bgBox ? 8 : 0,
                      textShadow: "0 2px 12px rgba(0,0,0,1)",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      outline:
                        selectedOverlay === ov.id
                          ? "1.5px dashed rgba(52,211,153,0.9)"
                          : "none",
                      outlineOffset: 3,
                    }}
                  >
                    {ov.text}
                  </div>
                ))}

                {/* Subtitles */}
                {visSub.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      position: "absolute",
                      bottom: "6%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.72)",
                      padding: "6px 20px",
                      borderRadius: 8,
                      textAlign: "center",
                      maxWidth: "88%",
                      zIndex: 9,
                      textShadow: "0 2px 8px rgba(0,0,0,1)",
                    }}
                  >
                    {s.text}
                  </div>
                ))}

                {/* Badges */}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] text-zinc-400 mono border border-zinc-700/40 z-20">
                  {aspectRatio}
                </div>
                {playing && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-zinc-700/40 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-zinc-400 mono">LIVE</span>
                  </div>
                )}

                {/* ══ OVERLAY CONTROLS — inside video box, never pushes content ══ */}
                <div
                  className={`ctrl-fade absolute bottom-0 left-0 right-0 z-30 ${
                    showControls
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 55%, transparent 100%)",
                    paddingTop: 52,
                  }}
                >
                  {/* ── Progress bar ── */}
                  <div className="px-4 mb-2.5">
                    <div
                      className="relative w-full h-1 bg-white/15 rounded-full cursor-pointer group/bar"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        seekTo(
                          ((e.clientX - rect.left) / rect.width) * totalDuration
                        );
                      }}
                      onMouseMove={(e) => e.stopPropagation()}
                    >
                      {/* Filled */}
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                      {/* Thumb */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-lg
                                      opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${progressPct}% - 7px)` }}
                      />
                    </div>
                  </div>

                  {/* ── Controls row ── */}
                  <div className="flex items-center gap-1.5 px-3 pb-3">
                    {/* Transport */}
                    <button
                      onClick={() => seekTo(0)}
                      className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Icon d="M19 20L9 12l10-8v16zM5 19V5" size={14} />
                    </button>
                    <button
                      onClick={() => seekTo(Math.max(0, currentTime - 0.033))}
                      className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Icon d="M15 18l-6-6 6-6" size={14} />
                    </button>
                    {/* Play */}
                    <button
                      onClick={togglePlay}
                      className="w-9 h-9 rounded-full bg-emerald-400 text-black flex items-center justify-center hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-400/30 mx-0.5"
                    >
                      {playing ? (
                        <Icon
                          d="M6 4h4v16H6zM14 4h4v16h-4z"
                          size={13}
                          className="text-black"
                        />
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                          style={{ marginLeft: 1 }}
                        >
                          <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        seekTo(Math.min(totalDuration, currentTime + 0.033))
                      }
                      className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Icon d="M9 18l6-6-6-6" size={14} />
                    </button>
                    <button
                      onClick={() => seekTo(totalDuration)}
                      className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Icon d="M5 4l10 8-10 8V4zM19 5v14" size={14} />
                    </button>

                    {/* Timecode */}
                    <span className="text-[11px] text-white/80 mono tabular-nums ml-1 mr-1">
                      {fmtTime(currentTime)}
                      <span className="text-white/35"> / </span>
                      {fmtTime(totalDuration)}
                    </span>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Volume */}
                    <button
                      onClick={() => setMuted((m) => !m)}
                      className="p-1.5 text-white/60 hover:text-white transition-all"
                    >
                      <Icon
                        d={
                          muted || volume === 0
                            ? "M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                            : "M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z"
                        }
                        size={14}
                      />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setMuted(false);
                      }}
                      className="w-16 rng rng-bar"
                      style={{ "--p": `${(muted ? 0 : volume) * 100}%` }}
                    />

                    <div className="w-px h-4 bg-white/15 mx-1.5" />

                    {/* Split */}
                    <button
                      onClick={splitClip}
                      disabled={!clips.length}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 border border-white/20 px-3 py-1.5 rounded-lg hover:border-emerald-400/60 hover:text-emerald-400 transition-all disabled:opacity-30 bg-black/20"
                    >
                      <Icon
                        d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                        size={12}
                      />
                      Split
                    </button>

                    {/* Fullscreen */}
                    <button
                      className="p-1.5 text-white/40 hover:text-white/80 transition-all rounded-lg hover:bg-white/10"
                      onClick={() => previewRef.current?.requestFullscreen?.()}
                    >
                      <Icon
                        d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                        size={14}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ TIMELINE ══ */}
      <div
        className="border-t border-zinc-800/80 bg-[#080809] shrink-0"
        style={{ height: TIMELINE_H }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mono">
              Timeline
            </span>
            <button
              onClick={() => document.getElementById("clip-inp")?.click()}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 border border-zinc-800 px-2.5 py-0.5 rounded-lg hover:border-zinc-600 hover:text-zinc-300 transition-all"
            >
              <Icon d="M12 5v14M5 12h14" size={10} /> Add Clip
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 mono">Zoom</span>
            <button
              onClick={() =>
                setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))
              }
              className="w-5 h-5 text-zinc-600 hover:text-zinc-300 flex items-center justify-center rounded hover:bg-zinc-800"
            >
              −
            </button>
            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400/60 rounded-full transition-all"
                style={{ width: `${((zoom - 0.25) / 1.75) * 100}%` }}
              />
            </div>
            <button
              onClick={() =>
                setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))
              }
              className="w-5 h-5 text-zinc-600 hover:text-zinc-300 flex items-center justify-center rounded hover:bg-zinc-800"
            >
              +
            </button>
            <span className="text-[10px] text-zinc-600 w-9 text-right mono">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        <div
          ref={timelineRef}
          className="overflow-x-auto overflow-y-hidden px-4 py-2"
          style={{ height: 95 }}
        >
          {clips.length === 0 ? (
            <div className="h-full flex items-center">
              <p className="text-[11px] text-zinc-700 italic">
                Upload clips to see them here
              </p>
            </div>
          ) : (
            <div
              className="relative h-full"
              style={{
                minWidth: totalDuration * pxPerSec + 120,
                paddingTop: 18,
              }}
            >
              {/* Ruler */}
              <div className="absolute top-0 left-0 right-0 h-5 pointer-events-none">
                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center"
                      style={{ left: i * pxPerSec }}
                    >
                      <span className="text-[8px] text-zinc-700 mono mb-0.5">
                        {i}s
                      </span>
                      <div className="w-px h-2 bg-zinc-800" />
                    </div>
                  )
                )}
              </div>

              {/* Clips */}
              <div
                className="absolute flex gap-1"
                style={{ top: 18, height: 60 }}
              >
                {clips.map((clip, i) => {
                  const w = Math.max(
                    (clip.trimEnd - clip.trimStart) * pxPerSec,
                    20
                  );
                  const isSel = selectedClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => {
                        setSelectedClipId(clip.id);
                        seekTo(clipStartTime(i));
                      }}
                      className={`relative flex-shrink-0 h-full rounded-xl overflow-hidden cursor-pointer transition-all
                        ${
                          isSel
                            ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/15"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      style={{ width: w }}
                    >
                      {clip.strip?.length > 0 ? (
                        <div className="absolute inset-0 flex">
                          {clip.strip.map((frame, fi) => (
                            <div key={fi} className="flex-1 overflow-hidden">
                              {frame && (
                                <img
                                  src={frame}
                                  className="h-full w-full object-cover"
                                  style={{ minWidth: 0 }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-zinc-800" />
                      )}
                      <div
                        className={`absolute inset-0 ${
                          isSel ? "bg-emerald-400/10" : "bg-black/35"
                        }`}
                      />
                      <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
                        <p className="text-[9px] font-semibold text-white truncate drop-shadow-sm">
                          {clip.name.replace(/\.[^.]+$/, "")}
                        </p>
                        <span className="text-[8px] text-white/70 mono shrink-0 ml-1">
                          {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                        </span>
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setTrimDrag({
                            clipId: clip.id,
                            edge: "start",
                            startX: e.clientX,
                            orig: clip.trimStart,
                          });
                        }}
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center bg-gradient-to-r from-emerald-400/50 to-transparent hover:from-emerald-400/80 transition-all"
                      >
                        <div className="w-0.5 h-7 rounded-full bg-emerald-400" />
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setTrimDrag({
                            clipId: clip.id,
                            edge: "end",
                            startX: e.clientX,
                            orig: clip.trimEnd,
                          });
                        }}
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center bg-gradient-to-l from-emerald-400/50 to-transparent hover:from-emerald-400/80 transition-all"
                      >
                        <div className="w-0.5 h-7 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => document.getElementById("clip-inp")?.click()}
                  className="flex-shrink-0 w-10 h-full rounded-xl border-2 border-dashed border-zinc-800 ml-1 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors text-zinc-700 hover:text-zinc-500"
                >
                  <Icon d="M12 5v14M5 12h14" size={14} />
                </div>
              </div>

              {/* Overlay / subtitle track markers */}
              {overlays.map((ov) => (
                <div
                  key={ov.id}
                  onClick={() => {
                    setSelectedOverlay(ov.id);
                    setActivePanel("text");
                  }}
                  className="absolute h-1 rounded-full bg-purple-500/70 cursor-pointer hover:bg-purple-400 transition-colors"
                  style={{
                    left: ov.startTime * pxPerSec,
                    width: Math.max((ov.endTime - ov.startTime) * pxPerSec, 4),
                    top: 82,
                  }}
                  title={ov.text}
                />
              ))}
              {subtitles.map((s) => (
                <div
                  key={s.id}
                  className="absolute h-1 rounded-full bg-sky-500/70 cursor-pointer hover:bg-sky-400 transition-colors"
                  style={{
                    left: s.startTime * pxPerSec,
                    width: Math.max((s.endTime - s.startTime) * pxPerSec, 4),
                    top: 85,
                  }}
                />
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: currentTime * pxPerSec }}
              >
                <div className="w-px h-full bg-emerald-400/90 relative">
                  <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/60" />
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-emerald-400 opacity-70" />
                </div>
              </div>

              {/* Seek overlay */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo((e.clientX - rect.left) / pxPerSec);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Export toast */}
      {exportDone && (
        <div className="fixed bottom-6 right-6 bg-zinc-900/95 backdrop-blur-sm border border-emerald-400/20 rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 flex items-center gap-4 z-50 animate-fadeup">
          <div className="w-9 h-9 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
            <Icon d="M9 12l2 2 4-4" size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-zinc-100">
              Export complete!
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Your video is ready
            </p>
          </div>
          <a
            href={exportDone}
            download="edit.mp4"
            className="bg-emerald-400 text-black text-[12px] font-bold px-4 py-2 rounded-xl hover:bg-emerald-300 transition-all"
          >
            Download
          </a>
          <button
            onClick={() => setExportDone(null)}
            className="text-zinc-600 hover:text-zinc-400 p-1"
          >
            <Icon d="M18 6L6 18M6 6l12 12" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
