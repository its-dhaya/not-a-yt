function KeywordEditor({ keywords, updateKeyword, getClips }) {
  if (keywords.length === 0) return null;

  return (
    <div className="card">
      <h3 className="section-title">Edit Keywords</h3>

      <div className="keyword-grid">
        {keywords.map((keyword, index) => (
          <input
            key={index}
            className="input"
            value={keyword}
            onChange={(e) => updateKeyword(index, e.target.value)}
          />
        ))}
      </div>
      <br></br>
      <button className="btn get-clips" onClick={getClips}>
        Get Clips
      </button>
    </div>
  );
}

export default KeywordEditor;
