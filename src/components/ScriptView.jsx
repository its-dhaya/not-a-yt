import { useState } from "react";
const MAX = 120;

export default function ScriptView({
  script,
  onScriptChange,
  regenerate,
  showKeywords,
  hasKeywords,
}) {
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [confirmRegen, setConfirmRegen] = useState(false);

  if (!script.length) return null;

  const startEdit = (i) => {
    setEditIdx(i);
    setEditVal(script[i]);
  };
  const saveEdit = (i) => {
    if (editVal.trim()) {
      const u = [...script];
      u[i] = editVal.trim();
      onScriptChange(u);
    }
    setEditIdx(null);
  };
  const cancelEdit = () => setEditIdx(null);
  const onKey = (e, i) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit(i);
    if (e.key === "Escape") cancelEdit();
  };

  const handleRegen = () => {
    if (confirmRegen) {
      setConfirmRegen(false);
      regenerate();
    } else {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 3000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-5 animate-fadeup">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500">
          Generated Script
        </p>
        <span className="text-[12px] text-zinc-600">
          Click any line to edit
        </span>
      </div>

      <div className="divide-y divide-zinc-800">
        {script.map((line, i) => (
          <div
            key={i}
            className="grid py-3.5 gap-4"
            style={{ gridTemplateColumns: "32px 1fr" }}
          >
            <span className="font-display text-[12px] text-zinc-600 pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            {editIdx === i ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  rows={2}
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="w-full bg-zinc-800 border border-emerald-400 rounded-xl px-4 py-2.5
                             text-zinc-100 text-[14px] leading-snug outline-none resize-none"
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] ${
                      editVal.length > MAX ? "text-red-400" : "text-zinc-600"
                    }`}
                  >
                    {editVal.length}/{MAX}
                    {editVal.length > MAX && " — too long for TTS"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(i)}
                      className="bg-emerald-400 text-black text-[12px] font-semibold px-4 py-1.5 rounded-lg hover:opacity-85 transition-opacity"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="border border-zinc-700 text-zinc-300 text-[12px] px-4 py-1.5 rounded-lg hover:border-emerald-400 hover:text-emerald-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startEdit(i)}
                className="group flex items-start justify-between gap-3 cursor-pointer -mx-2 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="flex-1">
                  <span className="text-zinc-200 text-[14px] leading-snug">
                    {line}
                  </span>
                  {line.length > MAX && (
                    <span className="ml-2 inline-block text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5 align-middle">
                      {line.length} chars — shorten
                    </span>
                  )}
                </div>
                <span className="text-zinc-600 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                  ✎
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleRegen}
          className={`text-[13px] font-medium px-5 py-2.5 rounded-xl border transition-colors
            ${
              confirmRegen
                ? "bg-red-600 border-red-600 text-white"
                : "border-zinc-700 text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            }`}
        >
          {confirmRegen ? "Sure? Click again to confirm" : "Regenerate"}
        </button>
        {hasKeywords && (
          <button
            onClick={showKeywords}
            className="bg-emerald-400 text-black font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:opacity-85 hover:-translate-y-px transition-all"
          >
            Next — Pick Voice →
          </button>
        )}
      </div>
    </div>
  );
}
