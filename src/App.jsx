import { useState, useEffect, useCallback } from "react";

import TopicInput from "./components/TopicInput";
import ScriptView from "./components/ScriptView";
import KeywordEditor from "./components/KeywordEditor";
import ClipSelector from "./components/ClipSelector";
import GenerateVideo from "./components/GenerateVideo";
import ApiKeySetup from "./components/ApiKeySetup";
import Auth from "./components/Auth";
import Landing from "./components/Landing";
import Navbar from "./components/Navbar";

import { supabase } from "./supabaseClient";
import {
  generateScriptAPI,
  getClipsAPI,
  generateVideoAPI,
} from "./services/api";

/* -------------------------
   SIMPLE TOAST
------------------------- */

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "error" ? "#c0392b" : "#27ae60";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: bg,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        zIndex: 9999,
        maxWidth: "360px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        fontSize: "14px",
      }}
    >
      {message}
      <span
        onClick={onClose}
        style={{ marginLeft: "16px", cursor: "pointer", fontWeight: "bold" }}
      >
        ✕
      </span>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}

/* -------------------------
   APP
------------------------- */

function App() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [generatedKeywords, setGeneratedKeywords] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClips, setSelectedClips] = useState({});
  const [streamUrl, setStreamUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false); // true until session check done

  // Keys stored in memory (React state), never in localStorage
  const [apiKeys, setApiKeys] = useState(null);
  const [checkingKeys, setCheckingKeys] = useState(true);

  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const { toast, showToast, clearToast } = useToast();

  /* -------------------------
     RESTORE SESSION ON REFRESH
  ------------------------- */

  useEffect(() => {
    // onAuthStateChange is the single source of truth — fires on mount,
    // login, logout, and token refresh. No separate getSession needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
      } else {
        setUser(session.user);
      }
      // Only set authLoading false on initial load events
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT"
      ) {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* -------------------------
     FETCH KEYS FROM SUPABASE INTO STATE
  ------------------------- */

  const fetchKeys = useCallback(async () => {
    setCheckingKeys(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        // No valid user returned — stale session (e.g. user deleted in Supabase)
        // Force sign out and go back to landing
        await supabase.auth.signOut();
        setUser(null);
        setCheckingKeys(false);
        return;
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("groq_key, pexels_key, pixabay_key")
        .eq("user_id", currentUser.id)
        .single();

      if (error || !data) {
        // Keys not found — user exists but hasn't set up keys yet
        // Show ApiKeySetup, don't sign out
        console.error("Key fetch error:", error?.message);
        setCheckingKeys(false);
        return;
      }

      setApiKeys({
        groqKey: data.groq_key,
        pexelsKey: data.pexels_key,
        pixabayKey: data.pixabay_key,
      });
    } catch (err) {
      console.error("fetchKeys failed:", err);
    } finally {
      setCheckingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (user && !apiKeys) fetchKeys(); // only fetch if not already loaded
  }, [user, fetchKeys, apiKeys]);

  /* -------------------------
     REAL SSE PROGRESS
  ------------------------- */

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/progress`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data.percent);
        setProgressText(data.step);
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => eventSource.close();
  }, []);

  /* -------------------------
     AUTH GATE
  ------------------------- */

  if (authLoading)
    return (
      <div className="loading-screen">
        <div className="loading-dot" />
      </div>
    );
  if (!user) {
    if (showAuth)
      return <Auth onLogin={() => {}} onBack={() => setShowAuth(false)} />;
    return <Landing onGetStarted={() => setShowAuth(true)} />;
  }
  if (checkingKeys)
    return (
      <div className="loading-screen">
        <div className="loading-dot" />
      </div>
    );
  if (!apiKeys) return <ApiKeySetup onSave={fetchKeys} />;

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
    setStreamUrl(null);
    setDownloadUrl(null);

    try {
      const data = await generateScriptAPI(topic);
      setScript(data.script || []);
      setGeneratedKeywords(data.keywords || []);
    } catch (err) {
      console.error("generateScript:", err);
      showToast("Script generation failed. Check your Groq key or topic.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     KEYWORDS
  ------------------------- */

  const showKeywords = () => setKeywords(generatedKeywords);

  const updateKeyword = (index, value) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  /* -------------------------
     FETCH CLIPS
  ------------------------- */

  const getClips = async () => {
    try {
      const data = await getClipsAPI(script, keywords);
      setClips(data.scenes || []);
    } catch (err) {
      console.error("getClips:", err);
      showToast("Failed to fetch clips. Check your Pexels / Pixabay keys.");
    }
  };

  /* -------------------------
     CLIP SELECTION
  ------------------------- */

  const selectClip = (sceneIndex, clipUrl) => {
    setSelectedClips((prev) => ({ ...prev, [sceneIndex]: clipUrl }));
  };

  /* -------------------------
     GENERATE VIDEO
  ------------------------- */

  const generateVideo = async () => {
    const urls = Object.values(selectedClips);

    if (urls.length !== script.length) {
      showToast("Please select one clip for each scene.", "error");
      return;
    }

    try {
      setRendering(true);
      setProgress(0);
      setProgressText("Starting...");

      const result = await generateVideoAPI(urls, script);

      setProgress(100);
      setProgressText("Done!");
      setStreamUrl(result.streamUrl);
      setDownloadUrl(result.downloadUrl);
      showToast("Video ready!", "success");
    } catch (err) {
      console.error("generateVideo:", err);
      showToast("Video generation failed. Check the server logs.");
    } finally {
      setRendering(false);
    }
  };

  /* -------------------------
     RENDER
  ------------------------- */

  return (
    <div className="app">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}

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
          <div className="card">
            <div className="progress-wrap">
              <div className="progress-label">
                <span>{progressText}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <GenerateVideo
          clips={clips}
          generateVideo={generateVideo}
          disabled={rendering}
          videoReady={!!streamUrl}
        />

        {streamUrl && (
          <div className="video-result">
            <h2>Your Short is ready</h2>
            <video controls width="360">
              <source src={streamUrl} type="video/mp4" />
            </video>
            <div className="video-result-actions">
              <a href={downloadUrl} download>
                <button className="btn-primary">Download MP4</button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
