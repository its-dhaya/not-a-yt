const BASE_URL = "http://localhost:3000";

/* -------------------------
   GENERATE SCRIPT
------------------------- */

export const generateScriptAPI = async (topic, apiKeys) => {
  const res = await fetch(`${BASE_URL}/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      groqKey: apiKeys.groqKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate script");
  }

  return res.json();
};

/* -------------------------
   GET CLIPS
------------------------- */

export const getClipsAPI = async (script, keywords, apiKeys) => {
  const res = await fetch(`${BASE_URL}/get-clips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script,
      keywords,
      pexelsKey: apiKeys.pexelsKey,
      pixabayKey: apiKeys.pixabayKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch clips");
  }

  return res.json();
};

/* -------------------------
   GENERATE VIDEO
   Calls /generate-video which handles TTS + render internally
------------------------- */

export const generateVideoAPI = async (videoUrls, script) => {
  const res = await fetch(`${BASE_URL}/generate-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrls, script }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate video");
  }

  const data = await res.json();

  // Return scoped stream + download URLs using jobId from server
  return {
    ...data,
    streamUrl: `${BASE_URL}/stream/${data.jobId}`,
    downloadUrl: `${BASE_URL}/download/${data.jobId}`,
  };
};
