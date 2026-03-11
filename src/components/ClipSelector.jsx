function ClipSelector({ clips, keywords, selectedClips, selectClip }) {
  if (clips.length === 0) return null;

  return (
    <div className="card">
      <p className="card-title">Select Clips</p>

      {clips.map((scene, index) => (
        <div key={index} className="scene-block">
          <div className="scene-header">
            <span className="scene-label">Scene {index + 1}</span>
            <span className="scene-keyword">{keywords[index]}</span>
          </div>

          {scene.text && <p className="scene-script-text">"{scene.text}"</p>}

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
                  {isSelected && <span className="clip-selected-badge">✓</span>}
                  {/* <span className="clip-source-badge">{clip.source}</span> */}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ClipSelector;
