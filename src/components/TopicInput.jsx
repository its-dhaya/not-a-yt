export default function TopicInput({
  topic,
  setTopic,
  generateScript,
  loading,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-5">
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500 mb-4">
        Enter Topic
      </p>
      <div className="flex gap-3">
        <input
          value={topic}
          placeholder="e.g. Ancient Rome, Black Holes, Tesla..."
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && generateScript()}
          disabled={loading}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600
                     rounded-xl px-5 py-3 text-[15px] outline-none focus:border-emerald-400
                     transition-colors disabled:opacity-50"
        />
        <button
          onClick={generateScript}
          disabled={loading || !topic}
          className="bg-emerald-400 text-black font-semibold text-[13px] px-6 py-3 rounded-xl
                     hover:opacity-85 hover:-translate-y-px transition-all whitespace-nowrap
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? "Generating..." : "Generate Script"}
        </button>
      </div>
    </div>
  );
}
