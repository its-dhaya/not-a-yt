import { useState } from "react";

function ScriptView({
  script,
  onScriptChange,
  regenerate,
  showKeywords,
  hasKeywords,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

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
        {script.map((line, index) => (
          <div key={index} className="script-item">
            <span className="script-num">
              {String(index + 1).padStart(2, "0")}
            </span>

            {editingIndex === index ? (
              /* edit mode */
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
            ) : (
              /* view mode — click to edit */
              <div
                className="script-text-row"
                onClick={() => startEdit(index)}
                title="Click to edit"
              >
                <span className="script-text">{line}</span>
                <span className="script-edit-icon">✎</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="script-actions">
        <button className="btn-secondary" onClick={regenerate}>
          Regenerate
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
