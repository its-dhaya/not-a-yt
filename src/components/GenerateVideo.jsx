export default function GenerateVideo({
  clips = [],
  generateVideo,
  disabled = false,
  videoReady = false,
}) {
  if (!clips.length) return null;
  return (
    <button
      onClick={generateVideo}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 bg-emerald-400 text-black font-semibold
                 text-[15px] py-4 rounded-xl hover:opacity-85 transition-opacity mb-5
                 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {disabled ? (
        <>
          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          Rendering video...
        </>
      ) : videoReady ? (
        "Re-render Video"
      ) : (
        "Generate Video"
      )}
    </button>
  );
}
