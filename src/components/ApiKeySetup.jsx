import { useState } from "react";
import { supabase } from "../supabaseClient";

function ApiKeySetup({ onSave }) {
  const [pexelsKey, setPexelsKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [pixabayKey, setPixabayKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!pexelsKey || !groqKey || !pixabayKey) {
      alert("Please enter all API keys");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not authenticated");
        return;
      }

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        groq_key: groqKey,
        pexels_key: pexelsKey,
        pixabay_key: pixabayKey,
      });

      if (error) {
        alert(error.message);
        return;
      }

      localStorage.setItem("pexelsKey", pexelsKey);
      localStorage.setItem("groqKey", groqKey);
      localStorage.setItem("pixabayKey", pixabayKey);

      alert("API keys saved successfully");

      onSave();
    } catch (err) {
      console.error(err);
      alert("Failed to save keys");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title">Setup API Keys</h1>

        <input
          className="setup-input"
          placeholder="Enter Pexels API Key"
          value={pexelsKey}
          onChange={(e) => setPexelsKey(e.target.value)}
        />

        <input
          className="setup-input"
          placeholder="Enter Pixabay API Key"
          value={pixabayKey}
          onChange={(e) => setPixabayKey(e.target.value)}
        />

        <input
          className="setup-input"
          placeholder="Enter Groq API Key"
          value={groqKey}
          onChange={(e) => setGroqKey(e.target.value)}
        />

        <button className="setup-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Keys"}
        </button>
      </div>
    </div>
  );
}

export default ApiKeySetup;
