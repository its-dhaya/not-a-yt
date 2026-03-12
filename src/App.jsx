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
import VoiceSelector from "./components/VoiceSelector";
import { VOICES } from "./constants/voices";
import { supabase } from "./supabaseClient";
import {
  generateScriptAPI,
  getClipsAPI,
  generateVideoAPI,
} from "./services/api";

/* ── Toast ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-4 px-5 py-3.5
                     rounded-xl shadow-2xl text-[14px] max-w-sm animate-fadeup font-sans
                     ${
                       type === "error"
                         ? "bg-red-700 text-white"
                         : "bg-emerald-400 text-black font-semibold"
                     }`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}
function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback(
    (msg, type = "error") => setToast({ message: msg, type }),
    []
  );
  const clearToast = useCallback(() => setToast(null), []);
  return { toast, showToast, clearToast };
}

/* ── Step Sidebar ── */
const STEPS_META = [
  { key: "script", label: "Script", desc: "Generate & edit your script" },
  { key: "voice", label: "Voice", desc: "Pick a TTS voice" },
  { key: "keywords", label: "Keywords", desc: "Edit footage search terms" },
  { key: "clips", label: "Clips", desc: "Select clips & render" },
];

const TIPS = {
  script: [
    "Keep each line under 120 chars for best TTS.",
    "Click any line to edit inline.",
    "Regenerate if the script doesn't feel right.",
  ],
  voice: [
    "Hit Preview to hear each voice first.",
    "Jenny & Sonia work great for facts videos.",
  ],
  keywords: [
    "Be specific — 'great wall china' beats 'wall'.",
    "Avoid abstract words like 'history' or 'culture'.",
  ],
  clips: [
    "Hover a clip to preview it.",
    "↺ Different clips if nothing looks right.",
    "Select one clip per scene before rendering.",
  ],
};

function StepSidebar({ step, topic, selectedVoice }) {
  const curIdx = STEPS_META.findIndex((s) => s.key === step);
  const voice = VOICES.find((v) => v.id === selectedVoice)?.label || "Jenny";

  return (
    <div className="flex flex-col h-full font-sans">
      {/* steps */}
      <div className="mb-8">
        {STEPS_META.map((s, i) => {
          const done = i < curIdx;
          const active = i === curIdx;
          return (
            <div key={s.key} className="flex gap-3.5 mb-4 last:mb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 transition-all
                  ${
                    done
                      ? "bg-emerald-400 border-emerald-400 text-black"
                      : active
                      ? "border-emerald-400 text-emerald-400"
                      : "border-zinc-700 text-zinc-600"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                {i < STEPS_META.length - 1 && (
                  <div
                    className={`w-px mt-1 ${
                      done ? "bg-emerald-400/30" : "bg-zinc-800"
                    }`}
                    style={{ minHeight: "20px" }}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={`text-[13px] font-medium leading-none mb-1 transition-colors
                  ${
                    active
                      ? "text-zinc-100"
                      : done
                      ? "text-zinc-400"
                      : "text-zinc-600"
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[12px] text-zinc-600">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* context chips */}
      {topic && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3.5 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
            Topic
          </p>
          <p className="text-[13px] text-zinc-200 font-medium truncate">
            {topic}
          </p>
        </div>
      )}
      {curIdx >= 1 && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3.5 mb-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
            Voice
          </p>
          <p className="text-[13px] text-zinc-200 font-medium">{voice}</p>
        </div>
      )}

      {/* tips */}
      <div className="mt-auto">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
          Tips
        </p>
        <ul className="flex flex-col gap-2.5">
          {(TIPS[step] || []).map((tip, i) => (
            <li
              key={i}
              className="flex gap-2 text-[12px] text-zinc-500 leading-snug"
            >
              <span className="text-emerald-400 mt-0.5 shrink-0">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Right Panel ── */
function RightPanel({ script, selectedVoice, keywords, clips, selectedClips }) {
  const voice = VOICES.find((v) => v.id === selectedVoice)?.label || "—";
  const overLimit = script.some((l) => l.length > 120);
  const stats = [
    { label: "Script lines", value: script.length || "—" },
    { label: "Voice", value: voice },
    { label: "Keywords", value: keywords.length ? `${keywords.length}` : "—" },
    {
      label: "Clips picked",
      value: clips.length
        ? `${Object.keys(selectedClips).length}/${clips.length}`
        : "—",
    },
  ];
  return (
    <div className="font-sans">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-5">
        At a glance
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
          >
            <p className="text-[11px] text-zinc-500 mb-0.5">{s.label}</p>
            <p className="text-[15px] font-semibold text-zinc-100">{s.value}</p>
          </div>
        ))}
      </div>
      {overLimit && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-[12px] text-red-400 font-medium mb-1">
            ⚠ Long lines detected
          </p>
          <p className="text-[11px] text-red-400/70 leading-snug">
            Some lines exceed 120 chars. Edit them for better TTS.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [generatedKeywords, setGeneratedKeywords] = useState([]);
  const [step, setStep] = useState("script");
  const [clips, setClips] = useState([]);
  const [selectedClips, setSelectedClips] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingClips, setLoadingClips] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("en-US-JennyNeural");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [streamUrl, setStreamUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [apiKeys, setApiKeys] = useState(null);
  const [checkingKeys, setCheckingKeys] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) setUser(null);
      else setUser(session.user);
      if (["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT"].includes(event))
        setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchKeys = useCallback(async () => {
    setCheckingKeys(true);
    try {
      const {
        data: { user: cu },
      } = await supabase.auth.getUser();
      if (!cu) {
        await supabase.auth.signOut();
        setUser(null);
        setCheckingKeys(false);
        return;
      }
      const { data, error } = await supabase
        .from("api_keys")
        .select("groq_key,pexels_key,pixabay_key")
        .eq("user_id", cu.id)
        .single();
      if (error || !data) {
        setCheckingKeys(false);
        return;
      }
      setApiKeys({
        groqKey: data.groq_key,
        pexelsKey: data.pexels_key,
        pixabayKey: data.pixabay_key,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (user && !apiKeys) fetchKeys();
  }, [user, fetchKeys, apiKeys]);

  useEffect(() => {
    const es = new EventSource(
      `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/progress`
    );
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setProgress(d.percent);
        setProgressText(d.step);
      } catch {
        e;
      }
    };
    return () => es.close();
  }, []);

  const Spinner = () => (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
    </div>
  );

  if (authLoading) return <Spinner />;
  if (!user)
    return showAuth ? (
      <Auth onLogin={() => {}} onBack={() => setShowAuth(false)} />
    ) : (
      <Landing onGetStarted={() => setShowAuth(true)} />
    );
  if (checkingKeys) return <Spinner />;
  if (!apiKeys) return <ApiKeySetup onSave={fetchKeys} />;

  const generateScript = async () => {
    if (!topic) return;
    setLoading(true);
    setScript([]);
    setKeywords([]);
    setGeneratedKeywords([]);
    setClips([]);
    setSelectedClips({});
    setStreamUrl(null);
    setDownloadUrl(null);
    setStep("script");
    try {
      const data = await generateScriptAPI(topic);
      setScript(data.script || []);
      setGeneratedKeywords(data.keywords || []);
    } catch {
      showToast("Script generation failed. Check your Groq key or topic.");
    } finally {
      setLoading(false);
    }
  };

  const showVoice = () => setStep("voice");
  const showKeywords = () => {
    setKeywords(generatedKeywords);
    setStep("keywords");
  };
  const updateKeyword = (i, v) => {
    const u = [...keywords];
    u[i] = v;
    setKeywords(u);
  };

  const getClips = async () => {
    setLoadingClips(true);
    try {
      const data = await getClipsAPI(script, keywords);
      setClips(data.scenes || []);
    } catch {
      showToast("Failed to fetch clips. Check your Pexels / Pixabay keys.");
    } finally {
      setLoadingClips(false);
    }
  };

  const retryScene = async (idx, kw) => {
    try {
      const data = await getClipsAPI([script[idx]], [kw]);
      const ns = data.scenes?.[0];
      if (ns) {
        const u = [...clips];
        u[idx] = ns;
        setClips(u);
        setSelectedClips((p) => {
          const n = { ...p };
          delete n[idx];
          return n;
        });
      }
    } catch {
      showToast("Retry failed. Try a different keyword.");
    }
  };

  const selectClip = (i, url) => setSelectedClips((p) => ({ ...p, [i]: url }));

  const generateVideo = async () => {
    const urls = Object.values(selectedClips);
    if (urls.length !== script.length) {
      showToast("Please select one clip for each scene.");
      return;
    }
    try {
      setRendering(true);
      setProgress(0);
      setProgressText("Starting...");
      const result = await generateVideoAPI(urls, script, selectedVoice);
      setProgress(100);
      setProgressText("Done!");
      setStreamUrl(result.streamUrl);
      setDownloadUrl(result.downloadUrl);
      showToast("Video ready!", "success");
    } catch {
      showToast("Video generation failed. Check the server logs.");
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
      <Navbar user={user} />

      <div className="flex">
        {/* LEFT SIDEBAR */}
        <aside
          className="w-60 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto
                          border-r border-zinc-800 px-6 py-8"
        >
          <StepSidebar
            step={step}
            topic={topic}
            selectedVoice={selectedVoice}
          />
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 px-10 py-10">
          <h1 className="font-display text-[38px] tracking-tight text-zinc-100 mb-8">
            AI Video Generator
          </h1>

          <TopicInput
            topic={topic}
            setTopic={setTopic}
            generateScript={generateScript}
            loading={loading}
          />

          <ScriptView
            script={script}
            onScriptChange={setScript}
            regenerate={generateScript}
            showKeywords={showVoice}
            hasKeywords={generatedKeywords.length > 0}
          />

          {["voice", "keywords", "clips"].includes(step) && (
            <>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelect={setSelectedVoice}
              />
              {step === "voice" && (
                <button
                  onClick={showKeywords}
                  className="mb-5 bg-emerald-400 text-black font-semibold text-[13px] px-6 py-3
                             rounded-xl hover:opacity-85 hover:-translate-y-px transition-all"
                >
                  Next — Edit Keywords →
                </button>
              )}
            </>
          )}

          {["keywords", "clips"].includes(step) && (
            <KeywordEditor
              keywords={keywords}
              updateKeyword={updateKeyword}
              loadingClips={loadingClips}
              getClips={() => {
                getClips();
                setStep("clips");
              }}
            />
          )}

          {step === "clips" && (
            <>
              <ClipSelector
                clips={clips}
                keywords={keywords}
                selectedClips={selectedClips}
                selectClip={selectClip}
                loadingClips={loadingClips}
                onRetryScene={retryScene}
              />

              {rendering && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
                  <div className="flex justify-between text-[13px] text-zinc-400 mb-3">
                    <span>{progressText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-5 text-center animate-fadeup">
                  <h2 className="font-display text-[26px] text-zinc-100 mb-6">
                    Your Short is ready 🎬
                  </h2>
                  <video
                    controls
                    className="mx-auto rounded-2xl border border-zinc-700"
                    style={{ maxWidth: "320px" }}
                  >
                    <source src={streamUrl} type="video/mp4" />
                  </video>
                  <div className="mt-5">
                    <a href={downloadUrl} download>
                      <button className="bg-emerald-400 text-black font-semibold text-[14px] px-8 py-3 rounded-xl hover:opacity-85 transition-opacity">
                        Download MP4
                      </button>
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT PANEL — xl screens only */}
        <aside
          className="w-52 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto
                          border-l border-zinc-800 px-6 py-8 hidden xl:block"
        >
          <RightPanel
            script={script}
            selectedVoice={selectedVoice}
            keywords={keywords}
            clips={clips}
            selectedClips={selectedClips}
          />
        </aside>
      </div>
    </div>
  );
}
