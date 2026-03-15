import { useState, useCallback, useRef } from "react";
import { uid, getVideoDuration, captureFrame, buildStrip, clamp } from "./utils";

/* ══════════════════════════════════════════════════════════════
   Central store — all editor state + pure data-manipulation actions.
   Playback, keyboard, audio-element management live in index.jsx.
══════════════════════════════════════════════════════════════ */
export function useEditorStore() {

  /* ── Media library (uploaded files, not yet on timeline) ── */
  const [mediaLibrary, setMediaLibrary] = useState([]);

  /* ── Timeline tracks ── */
  const [clips,       setClips]       = useState([]);
  const [overlays,    setOverlays]    = useState([]);
  const [subtitles,   setSubtitles]   = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);

  /* ── Playback ── */
  const [currentTime,  setCurrentTime]  = useState(0);
  const [playing,      setPlaying]      = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [muted,        setMuted]        = useState(false);
  const [showControls, setShowControls] = useState(true);

  /* ── Selection ── */
  const [selectedClipId,    setSelectedClipId]    = useState(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);
  const [selectedAudioId,   setSelectedAudioId]   = useState(null);

  /* ── UI ── */
  const [aspectRatio,   setAspectRatio]   = useState("16:9");
  const [activeLeftTab, setActiveLeftTab] = useState("clips");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [zoom,          setZoom]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [snapEnabled,   setSnapEnabled]   = useState(true);

  /* ── Timeline interactions ── */
  const [trimDrag, setTrimDrag] = useState(null);
  const [clipDrag, setClipDrag] = useState(null);
  const [ovDrag,   setOvDrag]   = useState(null);
  const [ctxMenu,  setCtxMenu]  = useState(null); // {x, y, clipId}

  /* ── Export ── */
  const [exporting,      setExporting]      = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone,     setExportDone]     = useState(null);

  /* ── Undo / Redo ── */
  const history    = useRef([]);
  const historyIdx = useRef(-1);

  const pushHistory = useCallback((newClips) => {
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push(JSON.parse(JSON.stringify(newClips)));
    historyIdx.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    setClips(JSON.parse(JSON.stringify(history.current[historyIdx.current])));
  }, []);

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current += 1;
    setClips(JSON.parse(JSON.stringify(history.current[historyIdx.current])));
  }, []);

  /* ─────────────────── Derived ─────────────────── */
  const totalDuration = clips.reduce((s, c) => s + (c.trimEnd - c.trimStart), 0);
  const selectedClip  = clips.find((c) => c.id === selectedClipId) || null;
  const selOv         = overlays.find((o) => o.id === selectedOverlayId) || null;

  /* ─────────────────── Time helpers ─────────────────── */
  const resolveTime = useCallback((t) => {
    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const d = clips[i].trimEnd - clips[i].trimStart;
      if (t <= acc + d || i === clips.length - 1) return { idx: i, local: t - acc };
      acc += d;
    }
    return { idx: 0, local: 0 };
  }, [clips]);

  const clipStartTime = useCallback(
    (idx) => clips.slice(0, idx).reduce((s, c) => s + (c.trimEnd - c.trimStart), 0),
    [clips]
  );

  /* ─────────────────── Media Library ─────────────────── */

  /**
   * Upload files → process thumbnails/filmstrips → add to library panel.
   * Files do NOT automatically go to the timeline; drag them there.
   */
  const addToLibrary = useCallback(async (files) => {
    const vids = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (!vids.length) return;
    setLoading(true);
    const items = await Promise.all(
      vids.map(async (file) => {
        const url      = URL.createObjectURL(file);
        const duration = await getVideoDuration(url);
        const thumb    = await captureFrame(url, duration * 0.1);
        const strip    = await buildStrip(url, 10);
        return {
          id: uid(), file, url, name: file.name,
          duration, thumb, strip,
        };
      })
    );
    setMediaLibrary((prev) => [...prev, ...items]);
    setLoading(false);
  }, []);

  /** Remove a clip from the media library (does NOT affect timeline clips). */
  const removeFromLibrary = useCallback((id) => {
    setMediaLibrary((prev) => prev.filter((m) => m.id !== id));
  }, []);

  /**
   * Create a new timeline clip from a library item and insert it at insertIdx.
   * insertIdx = -1 (or >= clips.length) means append to the end.
   */
  const addLibraryItemToTimeline = useCallback(
    (libraryId, insertIdx = -1) => {
      const item = mediaLibrary.find((m) => m.id === libraryId);
      if (!item) return null;
      const newClip = {
        id: uid(),
        file: item.file,
        url: item.url,
        name: item.name,
        duration: item.duration,
        trimStart: 0,
        trimEnd: item.duration,
        speed: 1,
        volume: 1,
        filter: "",
        transition: "None",
        thumb: item.thumb,
        strip: item.strip,
      };
      setClips((prev) => {
        const next = [...prev];
        const idx =
          insertIdx >= 0 && insertIdx <= next.length ? insertIdx : next.length;
        next.splice(idx, 0, newClip);
        pushHistory(next);
        return next;
      });
      setSelectedClipId(newClip.id);
      return newClip.id;
    },
    [mediaLibrary, pushHistory]
  );

  /* ─────────────────── Clip CRUD ─────────────────── */
  const updateClip = useCallback((id, patch) => {
    setClips((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const deleteClip = useCallback((id) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      pushHistory(next);
      return next;
    });
    if (selectedClipId === id) setSelectedClipId(null);
  }, [selectedClipId, pushHistory]);

  const duplicateClip = useCallback((id) => {
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      if (i < 0) return prev;
      const next = [...prev];
      next.splice(i + 1, 0, { ...prev[i], id: uid() });
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const splitClip = useCallback((globalTime) => {
    let acc = 0, idx = -1, local = 0;
    for (let i = 0; i < clips.length; i++) {
      const d = clips[i].trimEnd - clips[i].trimStart;
      if (globalTime <= acc + d) { idx = i; local = globalTime - acc; break; }
      acc += d;
    }
    if (idx < 0) return;
    const clip       = clips[idx];
    const splitPoint = clip.trimStart + local;
    if (local < 0.1 || clip.trimEnd - splitPoint < 0.1) return;
    const left  = { ...clip, id: uid(), trimEnd:   splitPoint };
    const right = { ...clip, id: uid(), trimStart: splitPoint };
    setClips((prev) => {
      const next = [...prev];
      next.splice(idx, 1, left, right);
      pushHistory(next);
      return next;
    });
    setSelectedClipId(right.id);
  }, [clips, pushHistory]);

  const reorderClips = useCallback((fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setClips((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const applyTrimDelta = useCallback((clipId, edge, dx) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        if (edge === "start")
          return { ...c, trimStart: clamp(c.trimStart + dx, 0, c.trimEnd - 0.1) };
        return { ...c, trimEnd: clamp(c.trimEnd + dx, c.trimStart + 0.1, c.duration) };
      })
    );
  }, []);

  const commitTrim = useCallback(() => {
    pushHistory(clips);
  }, [clips, pushHistory]);

  /* ─────────────────── Overlay CRUD ─────────────────── */
  const addOverlay = useCallback((startTime, endTimeCap) => {
    const ov = {
      id: uid(), text: "Your text",
      x: 50, y: 50,
      fontSize: 40, fontFamily: "Arial",
      color: "#ffffff", bgColor: "rgba(0,0,0,0.5)",
      bold: false, italic: false, shadow: true, bgBox: false,
      align: "center",
      startTime,
      endTime: Math.min(startTime + 3, endTimeCap || startTime + 3),
    };
    setOverlays((p) => [...p, ov]);
    setSelectedOverlayId(ov.id);
    setActiveLeftTab("text");
    return ov.id;
  }, []);

  const updateOverlay = useCallback(
    (id, patch) => setOverlays((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o))),
    []
  );

  const deleteOverlay = useCallback((id) => {
    setOverlays((p) => p.filter((o) => o.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  }, [selectedOverlayId]);

  /* ─────────────────── Subtitle CRUD ─────────────────── */
  const addSubtitle = useCallback((startTime, endTimeCap) => {
    setSubtitles((p) => [
      ...p,
      {
        id: uid(), text: "Subtitle text",
        startTime,
        endTime: Math.min(startTime + 2.5, endTimeCap || startTime + 2.5),
        fontSize: 22, color: "#ffffff", bgBox: true,
      },
    ]);
  }, []);

  const updateSubtitle = useCallback(
    (id, patch) => setSubtitles((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    []
  );

  const deleteSubtitle = useCallback(
    (id) => setSubtitles((p) => p.filter((s) => s.id !== id)),
    []
  );

  /* ─────────────────── Audio CRUD ─────────────────── */
  const addAudioFile = useCallback((file) => {
    const url   = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener(
      "loadedmetadata",
      () => {
        setAudioTracks((p) => [
          ...p,
          {
            id: uid(), name: file.name, url, file,
            volume: 0.8, startTime: 0, duration: audio.duration,
            muted: false,
          },
        ]);
      },
      { once: true }
    );
  }, []);

  const updateAudio = useCallback(
    (id, patch) =>
      setAudioTracks((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    []
  );

  const deleteAudio = useCallback((id) => {
    setAudioTracks((p) => p.filter((a) => a.id !== id));
    if (selectedAudioId === id) setSelectedAudioId(null);
  }, [selectedAudioId]);

  return {
    /* state */
    mediaLibrary, setMediaLibrary,
    clips, setClips,
    overlays, setOverlays,
    subtitles, setSubtitles,
    audioTracks, setAudioTracks,
    currentTime, setCurrentTime,
    playing, setPlaying,
    volume, setVolume,
    muted, setMuted,
    showControls, setShowControls,
    selectedClipId, setSelectedClipId,
    selectedOverlayId, setSelectedOverlayId,
    selectedAudioId, setSelectedAudioId,
    aspectRatio, setAspectRatio,
    activeLeftTab, setActiveLeftTab,
    leftCollapsed, setLeftCollapsed,
    zoom, setZoom,
    loading, dragOver, setDragOver,
    snapEnabled, setSnapEnabled,
    trimDrag, setTrimDrag,
    clipDrag, setClipDrag,
    ovDrag, setOvDrag,
    ctxMenu, setCtxMenu,
    exporting, setExporting,
    exportProgress, setExportProgress,
    exportDone, setExportDone,
    /* derived */
    totalDuration, selectedClip, selOv,
    /* methods */
    resolveTime, clipStartTime,
    addToLibrary, removeFromLibrary, addLibraryItemToTimeline,
    updateClip, deleteClip, duplicateClip,
    splitClip, reorderClips, applyTrimDelta, commitTrim,
    addOverlay, updateOverlay, deleteOverlay,
    addSubtitle, updateSubtitle, deleteSubtitle,
    addAudioFile, updateAudio, deleteAudio,
    undo, redo,
  };
}
