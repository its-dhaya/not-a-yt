function KeywordEditor({ keywords, updateKeyword, getClips, loadingClips }) {
  if (keywords.length === 0) return null;

  return (
    <div className="card">
      <p className="card-title">Edit Keywords</p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--muted-md)",
          marginBottom: "16px",
          fontFamily: "var(--font-body)",
        }}
      >
        These are used to search stock footage. Make them specific and visual.
      </p>

      <div className="keyword-grid">
        {keywords.map((keyword, index) => (
          <div key={index} style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                top: "-8px",
                left: "10px",
                fontSize: "10px",
                color: "var(--muted)",
                background: "var(--bg-card)",
                padding: "0 4px",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.05em",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <input
              className="keyword-input"
              value={keyword}
              placeholder={`Scene ${index + 1}`}
              onChange={(e) => updateKeyword(index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          className="btn-primary"
          onClick={getClips}
          disabled={loadingClips}
        >
          {loadingClips ? (
            <>
              <span className="btn-spinner" />
              Fetching Clips...
            </>
          ) : (
            "Get Clips"
          )}
        </button>
      </div>
    </div>
  );
}

export default KeywordEditor;
