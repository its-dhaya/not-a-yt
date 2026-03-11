import { useState } from "react";

const MAX_CHARS = 120; // TTS works best under 120 chars per line

function ScriptView({
  script,
  onScriptChange,
  regenerate,
  showKeywords,
  hasKeywords,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [confirmRegen, setConfirmRegen] = useState(false);

  if (script.length === 0) return null;

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(script[index]);
  };

  const saveEdit = (index) => {
    if (editValue.trim()) {
      const updated = [...script];
      updated[index] = editValue.trim();
      onScriptChange(updated);
    }
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKey = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit(index);
    if (e.key === "Escape") cancelEdit();
  };

  const handleRegenerate = () => {
    if (confirmRegen) {
      setConfirmRegen(false);
      regenerate();
    } else {
      setConfirmRegen(true);
      // auto-cancel confirm after 3s
      setTimeout(() => setConfirmRegen(false), 3000);
    }
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
          Generated Script
        </p>
        <span
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Click any line to edit
        </span>
      </div>

      <div className="script-list">
        {script.map((line, index) => {
          const charCount = line.length;
          const isOver = charCount > MAX_CHARS;
          const isEditing = editingIndex === index;

          return (
            <div key={index} className="script-item">
              <span className="script-num">
                {String(index + 1).padStart(2, "0")}
              </span>

              {isEditing ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <textarea
                    autoFocus
                    className="script-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKey(e, index)}
                    rows={2}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color:
                          editValue.length > MAX_CHARS
                            ? "#ff5f5f"
                            : "var(--muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {editValue.length}/{MAX_CHARS} chars
                      {editValue.length > MAX_CHARS && " — too long for TTS"}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: "12px", padding: "6px 14px" }}
                        onClick={() => saveEdit(index)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 14px" }}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="script-text-row"
                  onClick={() => startEdit(index)}
                  title="Click to edit"
                >
                  <div style={{ flex: 1 }}>
                    <span className="script-text">{line}</span>
                    {isOver && (
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: "8px",
                          fontSize: "10px",
                          color: "#ff5f5f",
                          background: "#ff5f5f18",
                          border: "1px solid #ff5f5f44",
                          borderRadius: "4px",
                          padding: "1px 6px",
                          fontFamily: "var(--font-body)",
                          verticalAlign: "middle",
                        }}
                      >
                        {charCount} chars — shorten this
                      </span>
                    )}
                  </div>
                  <span className="script-edit-icon">✎</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="script-actions">
        <button
          className={confirmRegen ? "btn-primary" : "btn-secondary"}
          style={
            confirmRegen ? { background: "#c0392b", fontSize: "13px" } : {}
          }
          onClick={handleRegenerate}
        >
          {confirmRegen ? "Sure? Click again to confirm" : "Regenerate"}
        </button>
        {hasKeywords && (
          <button className="btn-primary" onClick={showKeywords}>
            Next — Pick Voice →
          </button>
        )}
      </div>
    </div>
  );
}

export default ScriptView;
