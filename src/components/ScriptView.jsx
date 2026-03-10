function ScriptView({ script, regenerate, showKeywords, hasKeywords }) {
  if (script.length === 0) return null;

  return (
    <div className="card">
      <h3 className="section-title">Generated Script</h3>

      {script.map((line, index) => (
        <p key={index}>
          <b>{index + 1}.</b> {line}
        </p>
      ))}

      <div className="btn-row">
        <button className="btn" onClick={regenerate}>
          Regenerate
        </button>

        {hasKeywords && (
          <button className="btn" onClick={showKeywords}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default ScriptView;
