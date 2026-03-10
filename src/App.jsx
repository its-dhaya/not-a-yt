import { useState, useEffect } from "react";

import TopicInput from "./components/TopicInput";
import ScriptView from "./components/ScriptView";
import KeywordEditor from "./components/KeywordEditor";
import ClipSelector from "./components/ClipSelector";
import GenerateVideo from "./components/GenerateVideo";
import ApiKeySetup from "./components/ApiKeySetup";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";

import { supabase } from "./supabaseClient";

import {
  generateScriptAPI,
  getClipsAPI,
  generateVideoAPI,
} from "./services/api";

function App() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [generatedKeywords, setGeneratedKeywords] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClips, setSelectedClips] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);

  const [user, setUser] = useState(null);
  const [keysReady, setApiKeysSet] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  /* -------------------------
     CHECK KEYS AFTER LOGIN
  ------------------------- */

  const checkKeys = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      localStorage.setItem("groqKey", data.groq_key);
      localStorage.setItem("pexelsKey", data.pexels_key);

      setApiKeysSet(true);
    }

    setCheckingKeys(false);
  };

  useEffect(() => {
    const loadKeys = async () => {
      if (user) {
        await checkKeys();
      }
    };

    loadKeys();
  }, [user]);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/progress");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setProgress(data.percent);
      setProgressText(data.step);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  /* -------------------------
     LOGIN SCREEN
  ------------------------- */

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (checkingKeys) {
    return <h2 style={{ textAlign: "center" }}>Checking API keys...</h2>;
  }

  if (!keysReady) {
    return <ApiKeySetup onSave={() => setApiKeysSet(true)} />;
  }

  /* -------------------------
     GENERATE SCRIPT
  ------------------------- */

  const generateScript = async () => {
    if (!topic) return;

    setLoading(true);
    setScript([]);
    setKeywords([]);
    setGeneratedKeywords([]);
    setClips([]);
    setVideoUrl(null);

    try {
      const data = await generateScriptAPI(topic);

      const scriptData =
        data.script || data.data?.script || data[0]?.script || [];

      const keywordData =
        data.keywords || data.data?.keywords || data[0]?.keywords || [];

      setScript(scriptData);
      setGeneratedKeywords(keywordData);
    } catch (err) {
      console.error(err);
      alert("Script generation failed");
    }

    setLoading(false);
  };

  /* -------------------------
     KEYWORD HANDLING
  ------------------------- */

  const showKeywords = () => {
    setKeywords(generatedKeywords);
  };

  const updateKeyword = (index, value) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  /* -------------------------
     CLIP SELECTION
  ------------------------- */

  const selectClip = (sceneIndex, clipUrl) => {
    setSelectedClips((prev) => ({
      ...prev,
      [sceneIndex]: clipUrl,
    }));
  };

  /* -------------------------
     FETCH CLIPS
  ------------------------- */

  const getClips = async () => {
    try {
      const data = await getClipsAPI(script, keywords);

      const sceneClips =
        data.scenes || data.data?.scenes || data[0]?.scenes || [];

      setClips(sceneClips);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch clips");
    }
  };

  /* -------------------------
     GENERATE VIDEO
  ------------------------- */

  const generateVideo = async () => {
    const urls = Object.values(selectedClips);

    if (urls.length !== script.length) {
      alert("Please select one clip for each scene");
      return;
    }

    try {
      setRendering(true);
      setProgress(10);

      // simulate progress
      const progressTimer = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          return p + 7.5;
        });
      }, 2000);

      await generateVideoAPI(urls, script);

      clearInterval(progressTimer);

      setProgress(100);

      // video ready → enable download
      setVideoUrl("http://localhost:3000/download");
    } catch (err) {
      console.error(err);
      alert("Video generation failed");
    } finally {
      setRendering(false);
    }
  };

  /* -------------------------
     MAIN UI
  ------------------------- */

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <h1 className="title">AI Video Generator</h1>

        <TopicInput
          topic={topic}
          setTopic={setTopic}
          generateScript={generateScript}
          loading={loading}
        />

        <ScriptView
          script={script}
          regenerate={generateScript}
          showKeywords={showKeywords}
          hasKeywords={generatedKeywords.length > 0}
        />

        <KeywordEditor
          keywords={keywords}
          updateKeyword={updateKeyword}
          getClips={getClips}
        />

        <ClipSelector
          clips={clips}
          keywords={keywords}
          selectedClips={selectedClips}
          selectClip={selectClip}
        />

        {rendering && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <p>
              {progressText} ({progress}%)
            </p>

            <div
              style={{
                width: "100%",
                background: "#ddd",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "12px",
                  background: "#4caf50",
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        )}

        <GenerateVideo
          clips={clips}
          generateVideo={generateVideo}
          disabled={rendering}
          videoReady={!!videoUrl}
        />

        {/* Final Video */}
        {videoUrl && (
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h2>Final Generated Video</h2>

            <video controls width="600" style={{ borderRadius: "10px" }}>
              <source src={videoUrl} type="video/mp4" />
            </video>

            <div style={{ marginTop: "15px" }}>
              <a href={videoUrl} download>
                <button className="generate-btn">Download Video</button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
