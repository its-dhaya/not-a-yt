import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "./useEditorStore";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { Preview } from "./Preview";
import { Timeline } from "./Timeline";
import { ContextMenu } from "./ContextMenu";

import { BASE_URL } from "./utils";

const TOPBAR_H = 48;
const TIMELINE_H = 160;

export default function ManualEditor() {
  const store = useEditorStore();

  const {
    clips,
    setClips,
    audioTracks,
    currentTime,
    setCurrentTime,
    playing,
    setPlaying,
    volume,
    muted,
    setShowControls,
    totalDuration,
    resolveTime,
    setExporting,
    setExportProgress,
    setExportDone,
    setOvDrag,
    setOverlays,
    overlays,
    subtitles,
    aspectRatio,
    selectedClipId,
    deleteClip,
    duplicateClip,
    splitClip,
    undo,
    redo,
    ctxMenu,
  } = store;

  const videoRef = useRef(null);
  const audioRefs = useRef({});
  const rafRef = useRef(null);
  const playStart = useRef({ wall: 0, media: 0 });
  const hideTimer = useRef(null);

  /* ═══════════════════════════════════════════════
     PLAYBACK ENGINE
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (!playing || !clips.length) return;

    const tick = () => {
      const elapsed = (performance.now() - playStart.current.wall) / 1000;
      const t = Math.min(playStart.current.media + elapsed, totalDuration);
      setCurrentTime(t);

      if (t >= totalDuration) {
        setPlaying(false);
        videoRef.current?.pause();
        Object.values(audioRefs.current).forEach((a) => a.pause());
        return;
      }

      const { idx, local } = resolveTime(t);
      const clip = clips[idx];

      if (videoRef.current) {
        const vid = videoRef.current;

        if (vid.dataset.clipId !== clip.id) {
          vid.pause();
          vid.src = clip.url;
          vid.dataset.clipId = clip.id;
          vid.playbackRate = clip.speed || 1;
          vid.volume = muted ? 0 : (clip.volume ?? 1) * volume;
          vid.currentTime = clip.trimStart + local;
          vid.play().catch(() => {});
          playStart.current = { wall: performance.now(), media: t };
        } else {
          const rate = clip.speed || 1;
          if (vid.playbackRate !== rate) vid.playbackRate = rate;

          const want = clip.trimStart + local;
          if (Math.abs(vid.currentTime - want) > 0.4) vid.currentTime = want;

          if (vid.paused) {
            vid.play().catch(() => {});
            playStart.current = { wall: performance.now(), media: t };
          }
        }
      }

      audioTracks.forEach((track) => {
        let el = audioRefs.current[track.id];
        if (!el) {
          el = new Audio(track.url);
          audioRefs.current[track.id] = el;
        }
        const trackLocal = t - (track.startTime || 0);
        if (trackLocal >= 0 && trackLocal <= (track.duration || Infinity)) {
          el.volume = track.muted ? 0 : (track.volume ?? 0.8) * volume;
          if (Math.abs(el.currentTime - trackLocal) > 0.5)
            el.currentTime = trackLocal;
          if (el.paused) el.play().catch(() => {});
        } else {
          if (!el.paused) el.pause();
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    playStart.current = { wall: performance.now(), media: currentTime };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
      Object.values(audioRefs.current).forEach((a) => a.pause());
    };
  }, [playing]);

  /* ═══════════════════════════════════════════════
     SEEK
  ═══════════════════════════════════════════════ */
  const seekTo = useCallback(
    (t) => {
      const ct = Math.max(0, Math.min(t, Math.max(totalDuration, 0.001)));
      cancelAnimationFrame(rafRef.current);
      setCurrentTime(ct);
      setPlaying(false);

      if (!clips.length) return;

      const { idx, local } = resolveTime(ct);
      const clip = clips[idx];

      if (clip && videoRef.current) {
        const vid = videoRef.current;
        const load = () => {
          vid.playbackRate = clip.speed || 1;
          vid.volume = muted ? 0 : (clip.volume ?? 1) * volume;
          vid.currentTime = clip.trimStart + local;
        };
        if (vid.dataset.clipId !== clip.id) {
          vid.src = clip.url;
          vid.dataset.clipId = clip.id;
          vid.addEventListener("loadeddata", load, { once: true });
        } else {
          load();
        }
      }

      audioTracks.forEach((track) => {
        const el = audioRefs.current[track.id];
        if (!el) return;
        const trackLocal = ct - (track.startTime || 0);
        if (trackLocal >= 0)
          el.currentTime = Math.min(trackLocal, track.duration || 0);
      });
    },
    [clips, totalDuration, resolveTime, volume, muted, audioTracks]
  );

  /* ═══════════════════════════════════════════════
     INIT FIRST CLIP
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (
      clips.length > 0 &&
      videoRef.current &&
      !videoRef.current.dataset.clipId
    ) {
      const c = clips[0];
      videoRef.current.src = c.url;
      videoRef.current.dataset.clipId = c.id;
      videoRef.current.volume = muted ? 0 : (c.volume ?? 1) * volume;
      videoRef.current.currentTime = c.trimStart;
    }
  }, [clips.length]);

  useEffect(() => {
    if (clips.length === 0 && videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.dataset.clipId = "";
    }
  }, [clips.length]);

  /* ═══════════════════════════════════════════════
     VOLUME SYNC
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (videoRef.current) {
      const clip = clips.find((c) => c.id === videoRef.current.dataset.clipId);
      videoRef.current.volume = muted ? 0 : (clip?.volume ?? 1) * volume;
    }
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      const track = audioTracks.find((a) => a.id === id);
      if (track)
        el.volume = track.muted || muted ? 0 : (track.volume ?? 0.8) * volume;
    });
  }, [volume, muted]);

  /* ═══════════════════════════════════════════════
     TOGGLE PLAY
  ═══════════════════════════════════════════════ */
  const togglePlay = useCallback(() => {
    if (!clips.length) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (currentTime >= totalDuration - 0.05) {
      seekTo(0);
      setTimeout(() => setPlaying(true), 80);
      return;
    }
    setPlaying(true);
  }, [playing, clips.length, currentTime, totalDuration, seekTo]);

  /* ═══════════════════════════════════════════════
     AUTO-HIDE CONTROLS
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    clearTimeout(hideTimer.current);
    if (!playing) {
      setShowControls(true);
      return;
    }
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 2800);
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  /* ═══════════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        splitClip(currentTime);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedClipId) duplicateClip(selectedClipId);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedClipId) {
        deleteClip(selectedClipId);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekTo(currentTime - (e.shiftKey ? 1 : 0.033));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        seekTo(currentTime + (e.shiftKey ? 1 : 0.033));
      }

      if (e.key === "j") seekTo(Math.max(0, currentTime - 5));
      if (e.key === "l") seekTo(Math.min(totalDuration, currentTime + 5));
      if (e.key === "k") setPlaying(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, currentTime, selectedClipId, totalDuration]);

  /* ═══════════════════════════════════════════════
     EXPORT
  ═══════════════════════════════════════════════ */
  const handleExport = async () => {
    if (!clips.length) return;
    setExporting(true);
    setExportProgress(5);
    setExportDone(null);
    try {
      const form = new FormData();
      clips.forEach((c, i) => form.append(`clip_${i}`, c.file, c.name));
      audioTracks.forEach((a, i) => form.append(`audio_${i}`, a.file, a.name));
      form.append(
        "meta",
        JSON.stringify({
          aspectRatio,
          clips: clips.map((c, i) => ({
            index: i,
            name: c.name,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
            speed: c.speed,
            volume: c.volume,
            filter: c.filter,
            transition: c.transition,
          })),
          overlays: overlays.map(({ file, strip, thumb, ...o }) => o),
          subtitles,
          audio: audioTracks.map((a) => ({
            name: a.name,
            volume: a.volume,
            startTime: a.startTime,
            duration: a.duration,
            muted: a.muted,
          })),
        })
      );
      setExportProgress(20);
      const res = await fetch(`${BASE_URL}/export-video`, {
        method: "POST",
        body: form,
      });
      setExportProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      setExportDone(URL.createObjectURL(await res.blob()));
      setExportProgress(100);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  /* ── Cleanup audio on unmount ── */
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((a) => {
        a.pause();
        a.src = "";
      });
    };
  }, []);

  /* ── Remove stale audio refs ── */
  useEffect(() => {
    const ids = new Set(audioTracks.map((a) => a.id));
    Object.keys(audioRefs.current).forEach((id) => {
      if (!ids.has(id)) {
        audioRefs.current[id].pause();
        delete audioRefs.current[id];
      }
    });
  }, [audioTracks]);

  /* ── Enrich store with computed fns for children ── */
  const enriched = { ...store, seekTo, togglePlay, handleExport };

  return (
    <div
      className="flex flex-col bg-[#0c0c0e] overflow-hidden select-none text-zinc-200"
      style={{ height: "100vh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, * { font-family: 'DM Sans', sans-serif; }
        .mono, code, input[type=number] { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type=range] { cursor: pointer; }
        input[type=color]  { cursor: pointer; }

        /* ── Auto-hide outer nav ──────────────────────────────────────────
           Slides any parent <nav> or <header> out of view so the editor
           occupies the full page. Hovering the top 4px brings it back.  */
        body > nav,
        body > header,
        [data-autohide-nav] {
          position: fixed !important;
          top: 0; left: 0; right: 0;
          z-index: 9000;
          transform: translateY(-100%);
          transition: transform 0.2s ease;
        }
        body > nav:hover,
        body > header:hover,
        [data-autohide-nav]:hover {
          transform: translateY(0);
        }
        /* 4px invisible hot-strip at the very top — hover it to reveal the nav */
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 4px;
          z-index: 9001;
        }
      `}</style>

      <TopBar store={enriched} />

      <div
        className="flex min-h-0"
        style={{ height: `calc(100vh - ${TOPBAR_H}px - ${TIMELINE_H}px)` }}
      >
        <LeftSidebar store={enriched} />
        <Preview store={enriched} videoRef={videoRef} />
      </div>

      <Timeline store={enriched} />

      {/* ── Context menu portal — shown on right-click of a timeline clip ── */}
      {ctxMenu && <ContextMenu ctxMenu={ctxMenu} store={enriched} />}
    </div>
  );
}
