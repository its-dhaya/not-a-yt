const BASE_URL = "http://localhost:3000";

export const generateScriptAPI = async (topic) => {
  const res = await fetch(`${BASE_URL}/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      pexelsKey: localStorage.getItem("pexelsKey"),
      groqKey: localStorage.getItem("groqKey"),
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate script");
  }

  return res.json();
};

export const getClipsAPI = async (script, keywords) => {
  const payload = {
    script,
    keywords,
    pexelsKey: localStorage.getItem("pexelsKey"),
    groqKey: localStorage.getItem("groqKey"),
    pixabayKey: localStorage.getItem("pixabayKey"),
  };

  console.log("GET CLIPS PAYLOAD:", payload);

  const res = await fetch(`${BASE_URL}/get-clips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const generateVideoAPI = async (videoUrls, script) => {
  // Step 1: Generate TTS
  await fetch(`${BASE_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: script.join(" "),
    }),
  });

  // Step 2: Generate Video
  const res = await fetch(`${BASE_URL}/video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrls,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate video");
  }

  return res.json();
};
