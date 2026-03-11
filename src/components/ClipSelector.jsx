import { useState } from "react";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function ClipSelector({
  clips,
  keywords,
  selectedClips,
  selectClip,
  onRetryScene,
  loadingClips,
}) {
  const [retrying, setRetrying] = useState(null); // scene index being retried

  if (loadingClips) {
    return (
      <div className="card">
        <p className="card-title">Fetching Clips</p>
        <div className="clip-skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="clip-skeleton-row">
              <div className="clip-skeleton-label" />
              <div className="clip-skeleton-grid">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="clip-skeleton-thumb" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clips.length === 0) return null;

  const selectedCount = Object.keys(selectedClips).length;
  const totalScenes = clips.length;

  const handleRetry = async (index, keyword) => {
    setRetrying(index);
    await onRetryScene(index, keyword);
    setRetrying(null);
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <p className="card-title" style={{ marginBottom: 0 }}>
          Select Clips
        </p>
        <span
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            color:
              selectedCount === totalScenes
                ? "var(--accent)"
                : "var(--muted-md)",
            background:
              selectedCount === totalScenes
                ? "var(--accent-dim)"
                : "var(--bg-input)",
            border: `1px solid ${
              selectedCount === totalScenes
                ? "var(--accent)"
                : "var(--border-md)"
            }`,
            borderRadius: "100px",
            padding: "3px 12px",
            transition: "all 0.3s",
          }}
        >
          {selectedCount}/{totalScenes} selected
        </span>
      </div>

      {clips.map((scene, index) => (
        <div key={index} className="scene-block">
          <div className="scene-header">
            <span className="scene-label">Scene {index + 1}</span>
            <span className="scene-keyword">{keywords[index]}</span>
          </div>

          {scene.text && <p className="scene-script-text">"{scene.text}"</p>}

          {/* empty state */}
          {!scene.clips || scene.clips.length === 0 ? (
            <div className="clip-empty">
              <p>
                No clips found for <strong>"{keywords[index]}"</strong>
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "4px",
                }}
              >
                Edit the keyword above and retry
              </p>
              <button
                className="btn-secondary"
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  padding: "7px 16px",
                }}
                onClick={() => handleRetry(index, keywords[index])}
                disabled={retrying === index}
              >
                {retrying === index ? "Searching..." : "↺ Retry this scene"}
              </button>
            </div>
          ) : (
            <>
              <div className="clip-grid">
                {scene.clips.map((clip, i) => {
                  const isSelected = selectedClips[index] === clip.preview;
                  return (
                    <div
                      key={i}
                      className={`clip-thumb ${isSelected ? "selected" : ""}`}
                      onClick={() => selectClip(index, clip.preview)}
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
                      {isSelected && (
                        <span className="clip-selected-badge">✓</span>
                      )}
                      {/* <span className="clip-source-badge">{clip.source}</span> */}
                    </div>
                  );
                })}
              </div>

              {/* retry button per scene */}
              <button
                className="clip-retry-btn"
                onClick={() => handleRetry(index, keywords[index])}
                disabled={retrying === index}
                title="Search different clips for this scene"
              >
                {retrying === index ? "Searching..." : "↺ Different clips"}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ClipSelector;
