export default function KeywordEditor({
  keywords,
  updateKeyword,
  getClips,
  loadingClips,
}) {
  if (!keywords.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-7 mb-5 animate-fadeup">
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500 mb-1.5">
        Edit Keywords
      </p>
      <p className="text-[13px] text-zinc-500 mb-5">
        Used to search stock footage — make them specific and visual.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {keywords.map((kw, i) => (
          <div key={i} className="relative">
            <span className="absolute -top-2 left-2.5 text-[10px] text-zinc-600 bg-zinc-900 px-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              value={kw}
              placeholder={`Scene ${i + 1}`}
              onChange={(e) => updateKeyword(i, e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                         rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        ))}
      </div>
      <button
        onClick={getClips}
        disabled={loadingClips}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-400 text-black
                   font-semibold text-[13px] px-6 py-3 rounded-xl hover:opacity-85 transition-opacity
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loadingClips ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Fetching Clips...
          </>
        ) : (
          "Get Clips"
        )}
      </button>
    </div>
  );
}
