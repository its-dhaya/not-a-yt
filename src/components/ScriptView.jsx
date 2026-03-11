function ScriptView({ script, regenerate, showKeywords, hasKeywords }) {
  if (script.length === 0) return null;

  return (
    <div className="card">
      <p className="card-title">Generated Script</p>

      <div className="script-list">
        {script.map((line, index) => (
          <div key={index} className="script-item">
            <span className="script-num">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="script-text">{line}</span>
          </div>
        ))}
      </div>

      <div className="script-actions">
        <button className="btn-secondary" onClick={regenerate}>
          Regenerate
        </button>
        {hasKeywords && (
          <button className="btn-primary" onClick={showKeywords}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

export default ScriptView;
