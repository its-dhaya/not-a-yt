import { useState } from "react";

export default function ClipSelector({
  clips,
  keywords,
  selectedClips,
  selectClip,
  onRetryScene,
  loadingClips,
}) {
  const [retrying, setRetrying] = useState(null);

  const handleRetry = async (i, kw) => {
    setRetrying(i);
    await onRetryScene(i, kw);
    setRetrying(null);
  };

  if (loadingClips)
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-5">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500 mb-6">
          Fetching Clips
        </p>
        <div className="flex flex-col gap-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="w-28 h-3.5 bg-zinc-700 rounded animate-shimmer mb-3" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="bg-zinc-700 rounded-lg animate-shimmer"
                    style={{
                      aspectRatio: "9/16",
                      animationDelay: `${j * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (!clips.length) return null;

  const selCount = Object.keys(selectedClips).length;
  const done = selCount === clips.length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-5 animate-fadeup">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-500">
          Select Clips
        </p>
        <span
          className={`text-[12px] px-3 py-1 rounded-full border transition-all duration-300
          ${
            done
              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
              : "text-zinc-400 bg-zinc-800 border-zinc-700"
          }`}
        >
          {selCount}/{clips.length} selected
        </span>
      </div>

      {clips.map((scene, i) => (
        <div
          key={i}
          className="pb-7 mb-7 border-b border-zinc-800 last:border-0 last:mb-0 last:pb-0"
        >
          <div className="flex items-baseline gap-3 mb-1.5">
            <span className="text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
              Scene {i + 1}
            </span>
            <span className="text-[13px] text-zinc-500">{keywords[i]}</span>
          </div>
          {scene.text && (
            <p className="text-[13px] text-zinc-500 italic mb-4 leading-snug">
              "{scene.text}"
            </p>
          )}

          {!scene.clips?.length ? (
            <div className="border border-dashed border-zinc-700 rounded-xl px-5 py-6 text-center">
              <p className="text-[14px] text-zinc-400 mb-1">
                No clips found for{" "}
                <span className="text-zinc-200 font-medium">
                  "{keywords[i]}"
                </span>
              </p>
              <p className="text-[12px] text-zinc-600 mb-4">
                Edit the keyword and retry
              </p>
              <button
                onClick={() => handleRetry(i, keywords[i])}
                disabled={retrying === i}
                className="border border-zinc-700 text-zinc-300 text-[12px] px-4 py-2 rounded-xl
                           hover:border-emerald-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
              >
                {retrying === i ? "Searching..." : "↺ Retry this scene"}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-2">
                {scene.clips.map((clip, j) => {
                  const isSel = selectedClips[i] === clip.preview;
                  return (
                    <div
                      key={j}
                      className={`clip-thumb ${isSel ? "sel" : ""}`}
                      onClick={() => selectClip(i, clip.preview)}
                    >
                      <video
                        src={clip.preview}
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => {
                          e.target.pause();
                          e.target.currentTime = 0;
                        }}
                      />
                      {isSel && (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => handleRetry(i, keywords[i])}
                disabled={retrying === i}
                className="mt-3 text-[12px] text-zinc-600 hover:text-emerald-400 transition-colors disabled:opacity-40"
              >
                {retrying === i ? "Searching..." : "↺ Different clips"}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
