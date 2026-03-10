import { useState } from "react";
import { supabase } from "../supabaseClient";

function ApiKeySetup({ onSave }) {
  const [pexelsKey, setPexelsKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [pixabayKey, setPixabayKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");

    if (!pexelsKey || !groqKey || !pixabayKey) {
      setError("Please enter all three API keys.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated.");
        return;
      }

      // Upsert so re-saving works without duplicate errors
      const { error: dbError } = await supabase.from("api_keys").upsert(
        {
          user_id: user.id,
          groq_key: groqKey,
          pexels_key: pexelsKey,
          pixabay_key: pixabayKey,
        },
        { onConflict: "user_id" }
      );

      if (dbError) {
        console.error("DB error:", dbError);
        setError(dbError.message);
        return;
      }

      // No localStorage — App will fetch keys from Supabase into state
      onSave();
    } catch (err) {
      console.error("handleSave failed:", err);
      setError("Failed to save keys. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title">Setup API Keys</h1>

        {error && (
          <p
            style={{ color: "#c0392b", marginBottom: "12px", fontSize: "14px" }}
          >
            {error}
          </p>
        )}

        <input
          className="setup-input"
          placeholder="Enter Groq API Key"
          value={groqKey}
          onChange={(e) => setGroqKey(e.target.value)}
        />

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

        <button className="setup-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Keys"}
        </button>
      </div>
    </div>
  );
}

export default ApiKeySetup;
