import { Icon, Tip } from "./Icon";
import { FONTS, FILTER_OPTIONS, TRANSITION_OPTIONS, fmtTime } from "./utils";

const TABS = [
  { id: "clips",     icon: "M15 10l4.553-2.07A1 1 0 0121 8.94V15.06a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z", label: "Clips" },
  { id: "text",      icon: "M4 6h16M4 12h10M4 18h6",                                                                                                           label: "Text"  },
  { id: "audio",     icon: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z",                                                                                   label: "Audio" },
  { id: "subtitles", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",                                                                        label: "Subs"  },
  { id: "effects",   icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",                                   label: "FX"    },
];

/* ─── shared form atoms ─── */
const Label = ({ children }) => (
  <label className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">{children}</label>
);
const Input = ({ className = "", ...p }) => (
  <input {...p} className={`w-full bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2 py-1.5 text-[11px]
                             text-zinc-200 focus:outline-none focus:border-emerald-400/60 transition-colors ${className}`} />
);
const Select = ({ children, ...p }) => (
  <select {...p} className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2 py-1.5 text-[11px]
                            text-zinc-200 focus:outline-none focus:border-emerald-400/60 transition-colors">
    {children}
  </select>
);
const Toggle = ({ on, onClick, label }) => (
  <button onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all
      ${on ? "bg-emerald-400 border-emerald-400 text-black" : "border-zinc-700/60 text-zinc-400 hover:border-zinc-500"}`}>
    {label}
  </button>
);

/* ═══════════════ CLIPS PANEL ═══════════════ */
function ClipsPanel({ store }) {
  const { clips, selectedClipId, setSelectedClipId, seekTo, clipStartTime,
          deleteClip, loading, dragOver, setDragOver, addClips } = store;
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addClips(e.dataTransfer.files); }}
        onClick={() => document.getElementById("clip-inp")?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all
          ${dragOver ? "border-emerald-400 bg-emerald-400/5" : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30"}`}
      >
        {loading
          ? <svg className="animate-spin w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          : <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" size={22} className="text-zinc-500" />
        }
        <p className="text-[11px] font-semibold text-zinc-300">Drop videos here</p>
        <p className="text-[10px] text-zinc-600">or click to browse</p>
        <input id="clip-inp" type="file" multiple accept="video/*" className="hidden"
          onChange={(e) => addClips(e.target.files)} />
      </div>

      {clips.map((c, i) => (
        <div key={c.id}
          onClick={() => { setSelectedClipId(c.id); seekTo(clipStartTime(i)); }}
          className={`group flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all
            ${selectedClipId === c.id
              ? "border-emerald-400/40 bg-emerald-400/5 shadow-sm"
              : "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"}`}
        >
          {c.thumb
            ? <img src={c.thumb} className="w-14 h-8 rounded-lg object-cover shrink-0 ring-1 ring-zinc-700/50" alt="" />
            : <div className="w-14 h-8 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600">
                <Icon d="M15 10l4.553-2.07" size={12} />
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-zinc-200 truncate">{c.name.replace(/\.[^.]+$/, "")}</p>
            <p className="text-[10px] text-zinc-600 mono mt-0.5">
              {fmtTime(c.trimEnd - c.trimStart)}
              {c.speed !== 1 && <span className="ml-1.5 text-amber-400">{c.speed}×</span>}
            </p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); deleteClip(c.id); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-1 transition-all shrink-0">
            <Icon d="M18 6L6 18M6 6l12 12" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ TEXT PANEL ═══════════════ */
function TextPanel({ store }) {
  const { currentTime, totalDuration, addOverlay,
          overlays, selectedOverlayId, setSelectedOverlayId,
          updateOverlay, deleteOverlay, selOv } = store;
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <button onClick={() => addOverlay(currentTime, totalDuration)}
        className="w-full py-3 rounded-xl border border-dashed border-zinc-800 text-[12px] font-medium text-zinc-400
                   hover:border-emerald-400/40 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all
                   flex items-center justify-center gap-2">
        <Icon d="M12 5v14M5 12h14" size={14} /> Add Text Layer
      </button>

      {overlays.map((ov) => (
        <div key={ov.id} onClick={() => setSelectedOverlayId(ov.id)}
          className={`group p-2.5 rounded-xl border cursor-pointer transition-all
            ${selectedOverlayId === ov.id ? "border-emerald-400/40 bg-emerald-400/5" : "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-200 truncate max-w-[130px]">{ov.text}</p>
            <button onClick={(e) => { e.stopPropagation(); deleteOverlay(ov.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-0.5 transition-all">
              <Icon d="M18 6L6 18M6 6l12 12" size={11} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mono mt-0.5">{fmtTime(ov.startTime)} → {fmtTime(ov.endTime)}</p>
        </div>
      ))}

      {selOv && (
        <div className="border border-zinc-800/60 rounded-xl p-3 bg-zinc-900/50 space-y-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Text Properties</p>

          <textarea value={selOv.text} rows={2}
            onChange={(e) => updateOverlay(selOv.id, { text: e.target.value })}
            className="bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-2 text-[12px] text-zinc-200
                       resize-none focus:outline-none w-full focus:border-emerald-400/60" />

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Font</Label>
              <Select value={selOv.fontFamily} onChange={(e) => updateOverlay(selOv.id, { fontFamily: e.target.value })}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </div>
            <div><Label>Size</Label>
              <Input type="number" value={selOv.fontSize} min={8} max={200}
                onChange={(e) => updateOverlay(selOv.id, { fontSize: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Color</Label>
              <input type="color" value={selOv.color} onChange={(e) => updateOverlay(selOv.id, { color: e.target.value })}
                className="w-full h-9 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700/60 p-0.5
                           [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch-wrapper]:p-0" />
            </div>
            <div><Label>BG Color</Label>
              <input type="color" value={selOv.bgColor?.replace(/rgba?\(.*?\)/,"") || "#000000"}
                onChange={(e) => updateOverlay(selOv.id, { bgColor: e.target.value + "bb" })}
                className="w-full h-9 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700/60 p-0.5
                           [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch-wrapper]:p-0" />
            </div>
          </div>

          <div className="flex gap-2">
            <Toggle on={selOv.bold}   onClick={() => updateOverlay(selOv.id, { bold:   !selOv.bold   })} label="B" />
            <Toggle on={selOv.italic} onClick={() => updateOverlay(selOv.id, { italic: !selOv.italic })} label="I" />
            <Toggle on={selOv.bgBox}  onClick={() => updateOverlay(selOv.id, { bgBox:  !selOv.bgBox  })} label="BG" />
            <Toggle on={selOv.shadow} onClick={() => updateOverlay(selOv.id, { shadow: !selOv.shadow })} label="Shadow" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Show At (s)</Label>
              <Input type="number" value={selOv.startTime.toFixed(1)} step={0.1} min={0}
                onChange={(e) => updateOverlay(selOv.id, { startTime: Number(e.target.value) })} className="mono" />
            </div>
            <div><Label>Hide At (s)</Label>
              <Input type="number" value={selOv.endTime.toFixed(1)} step={0.1} min={0}
                onChange={(e) => updateOverlay(selOv.id, { endTime: Number(e.target.value) })} className="mono" />
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 text-center">↕ Drag text on preview to reposition</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ AUDIO PANEL ═══════════════ */
function AudioPanel({ store }) {
  const { audioTracks, updateAudio, deleteAudio, addAudioFile, selectedAudioId, setSelectedAudioId } = store;
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <div onClick={() => document.getElementById("audio-inp")?.click()}
        className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2
                   cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/30 transition-all text-center">
        <Icon d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z" size={20} className="text-zinc-500" />
        <div>
          <p className="text-[11px] font-semibold text-zinc-300">Upload Audio</p>
          <p className="text-[10px] text-zinc-600">MP3, WAV, AAC, OGG</p>
        </div>
        <input id="audio-inp" type="file" accept="audio/*" multiple className="hidden"
          onChange={(e) => Array.from(e.target.files).forEach(addAudioFile)} />
      </div>

      {audioTracks.map((a) => (
        <div key={a.id}
          onClick={() => setSelectedAudioId(a.id)}
          className={`group border rounded-xl p-3 space-y-2 cursor-pointer transition-all
            ${selectedAudioId === a.id ? "border-sky-400/40 bg-sky-400/5" : "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
                <Icon d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z" size={12} />
              </div>
              <p className="text-[11px] font-semibold text-zinc-200 truncate max-w-[110px]">{a.name.replace(/\.[^.]+$/, "")}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); updateAudio(a.id, { muted: !a.muted }); }}
                className={`p-1 rounded transition-colors ${a.muted ? "text-red-400" : "text-zinc-600 hover:text-zinc-300"}`}>
                <Icon d={a.muted ? "M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m2 2l-2-2" : "M9 18V5l12-2v13"} size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteAudio(a.id); }}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-1 transition-all">
                <Icon d="M18 6L6 18M6 6l12 12" size={11} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Icon d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0z" size={11} className="text-zinc-600 shrink-0" />
            <input type="range" min={0} max={1} step={0.05} value={a.volume}
              onChange={(e) => updateAudio(a.id, { volume: Number(e.target.value) })}
              className="flex-1 accent-emerald-400 h-1.5" />
            <span className="text-[10px] mono text-zinc-500 w-7 text-right">{Math.round(a.volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Start</span>
            <input type="number" value={(a.startTime || 0).toFixed(1)} step={0.5} min={0}
              onChange={(e) => updateAudio(a.id, { startTime: Number(e.target.value) })}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-zinc-800/80 border border-zinc-700/60 rounded px-1.5 py-1 text-[10px] mono text-zinc-300 focus:outline-none" />
            <span className="text-[9px] text-zinc-600">s</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ SUBTITLES PANEL ═══════════════ */
function SubsPanel({ store }) {
  const { currentTime, totalDuration, addSubtitle, subtitles, updateSubtitle, deleteSubtitle } = store;
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <button onClick={() => addSubtitle(currentTime, totalDuration)}
        className="w-full py-3 rounded-xl border border-dashed border-zinc-800 text-[12px] font-medium text-zinc-400
                   hover:border-emerald-400/40 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all
                   flex items-center justify-center gap-2">
        <Icon d="M12 5v14M5 12h14" size={14} /> Add Subtitle
      </button>

      {subtitles.map((s, i) => (
        <div key={s.id} className="group border border-zinc-800/60 bg-zinc-900/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 mono font-semibold">#{String(i + 1).padStart(2, "0")}</span>
            <button onClick={() => deleteSubtitle(s.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-0.5 transition-all">
              <Icon d="M18 6L6 18M6 6l12 12" size={11} />
            </button>
          </div>
          <textarea value={s.text} rows={2} onChange={(e) => updateSubtitle(s.id, { text: e.target.value })}
            className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 resize-none focus:outline-none" />
          <div className="grid grid-cols-2 gap-2">
            {["startTime", "endTime"].map((k) => (
              <div key={k}>
                <Label>{k === "startTime" ? "Start" : "End"}</Label>
                <Input type="number" value={s[k].toFixed(1)} step={0.1} min={0} className="mono"
                  onChange={(e) => updateSubtitle(s.id, { [k]: Number(e.target.value) })} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ EFFECTS PANEL ═══════════════ */
function EffectsPanel({ store }) {
  const { selectedClip, updateClip } = store;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Transitions */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">Transitions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {TRANSITION_OPTIONS.map((t) => (
            <button key={t}
              disabled={!selectedClip}
              onClick={() => selectedClip && updateClip(selectedClip.id, { transition: t })}
              className={`py-2 px-3 rounded-xl text-[11px] font-semibold border transition-all
                ${selectedClip?.transition === t
                  ? "bg-emerald-400/10 border-emerald-400/40 text-emerald-400"
                  : "border-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">Filters</p>
        <div className="grid grid-cols-2 gap-1.5">
          {FILTER_OPTIONS.map(({ label, css }) => (
            <button key={label}
              disabled={!selectedClip}
              onClick={() => selectedClip && updateClip(selectedClip.id, { filter: css })}
              className={`py-2 px-3 rounded-xl text-[11px] font-semibold border transition-all
                ${selectedClip?.filter === css
                  ? "bg-emerald-400/10 border-emerald-400/40 text-emerald-400"
                  : "border-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!selectedClip && (
        <p className="text-[11px] text-zinc-700 text-center italic pt-2">Select a clip to apply effects</p>
      )}
    </div>
  );
}

/* ═══════════════ SIDEBAR ROOT ═══════════════ */
export function LeftSidebar({ store }) {
  const { activeLeftTab, setActiveLeftTab, leftCollapsed, setLeftCollapsed } = store;

  const panels = {
    clips: <ClipsPanel store={store} />,
    text: <TextPanel store={store} />,
    audio: <AudioPanel store={store} />,
    subtitles: <SubsPanel store={store} />,
    effects: <EffectsPanel store={store} />,
  };

  return (
    <div className={`shrink-0 border-r border-zinc-800/80 flex bg-[#080809] transition-all duration-200
                     ${leftCollapsed ? "w-14" : "w-64"}`}>

      {/* Icon rail */}
      <div className="w-14 shrink-0 flex flex-col items-center py-2 gap-0.5 border-r border-zinc-800/50">
        {TABS.map((t) => (
          <Tip key={t.id} label={t.label} side="right">
            <button
              onClick={() => { if (leftCollapsed) setLeftCollapsed(false); setActiveLeftTab(t.id); }}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
                ${activeLeftTab === t.id && !leftCollapsed
                  ? "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/30"
                  : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
            >
              <Icon d={t.icon} size={15} />
              <span className="text-[7px] font-semibold uppercase tracking-wider leading-none">{t.label}</span>
            </button>
          </Tip>
        ))}
        <div className="flex-1" />
        {/* Collapse toggle */}
        <button onClick={() => setLeftCollapsed((v) => !v)}
          className="w-10 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
          <Icon d={leftCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} size={14} />
        </button>
      </div>

      {/* Panel content */}
      {!leftCollapsed && (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
            <p className="text-[11px] font-semibold text-zinc-300 capitalize">{activeLeftTab}</p>
          </div>
          {panels[activeLeftTab] ?? null}
        </div>
      )}
    </div>
  );
}
