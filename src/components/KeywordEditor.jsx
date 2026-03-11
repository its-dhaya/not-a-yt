function KeywordEditor({ keywords, updateKeyword, getClips }) {
  if (keywords.length === 0) return null;

  return (
    <div className="card">
      <p className="card-title">Edit Keywords</p>

      <div className="keyword-grid">
        {keywords.map((keyword, index) => (
          <input
            key={index}
            className="keyword-input"
            value={keyword}
            placeholder={`Scene ${index + 1}`}
            onChange={(e) => updateKeyword(index, e.target.value)}
          />
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button className="btn-primary" onClick={getClips}>
          Get Clips
        </button>
      </div>
    </div>
  );
}

export default KeywordEditor;
