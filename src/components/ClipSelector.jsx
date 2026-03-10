function ClipSelector({ clips, keywords, selectedClips, selectClip }) {
  if (clips.length === 0) return null;

  return (
    <div className="card">
      <h3 className="section-title">Select Clips</h3>

      {clips.map((scene, index) => (
        <div key={index} className="scene">
          <h4>Scene {index + 1}</h4>

          <p className="scene-keyword">
            Keyword: <span>{keywords[index]}</span>
          </p>

          <p>{scene.text}</p>

          <div className="clip-grid">
            {scene.clips.map((clip, i) => (
              <video
                key={i}
                src={clip.preview}
                controls
                onClick={() => selectClip(index, clip.preview)}
                className={
                  selectedClips[index] === clip.preview
                    ? "clip selected"
                    : "clip"
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ClipSelector;
