function GenerateVideo({
  clips = [],
  generateVideo,
  disabled = false,
  videoReady = false,
}) {
  if (clips.length === 0) return null;

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        className="btn-primary"
        onClick={generateVideo}
        disabled={disabled}
        style={{ width: "100%", justifyContent: "center", padding: "16px" }}
      >
        {disabled
          ? "Rendering video..."
          : videoReady
          ? "Re-render Video"
          : "Generate Video"}
      </button>
    </div>
  );
}

export default GenerateVideo;
