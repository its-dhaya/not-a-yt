import { useState } from "react";

function GenerateVideo({
  clips = [],
  generateVideo,
  disabled = false,
  videoReady = false,
}) {
  const [downloading, setDownloading] = useState(false);

  const downloadVideo = async () => {
    try {
      setDownloading(true);

      const res = await fetch("http://localhost:3000/download");

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-video.mp4";

      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }

    setDownloading(false);
  };

  if (clips.length === 0) return null;

  return (
    <div className="generate-section">
      <button
        className="generate-btn"
        onClick={generateVideo}
        disabled={disabled}
      >
        {disabled ? "Rendering..." : "Generate Video"}
      </button>

      {videoReady && (
        <button
          className="download-btn"
          onClick={downloadVideo}
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download Video"}
        </button>
      )}
    </div>
  );
}

export default GenerateVideo;
