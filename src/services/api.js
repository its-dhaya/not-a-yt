import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

/* -------------------------
   SECURITY: get JWT token from Supabase session
   This is sent as Bearer token — server verifies it
   and fetches API keys itself. Keys never leave the server.
------------------------- */

const getAuthHeader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};

/* -------------------------
   GENERATE SCRIPT
------------------------- */

export const generateScriptAPI = async (topic) => {
  const headers = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/generate-script`, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic }), // no API keys sent from frontend
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

export const getClipsAPI = async (script, keywords) => {
  const headers = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/get-clips`, {
    method: "POST",
    headers,
    body: JSON.stringify({ script, keywords }), // no API keys sent from frontend
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch clips");
  }

  return res.json();
};

/* -------------------------
   GENERATE VIDEO
------------------------- */

export const generateVideoAPI = async (videoUrls, script) => {
  const headers = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/generate-video`, {
    method: "POST",
    headers,
    body: JSON.stringify({ videoUrls, script }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate video");
  }

  const data = await res.json();

  return {
    ...data,
    streamUrl: `${BASE_URL}/stream/${data.jobId}`,
    downloadUrl: `${BASE_URL}/download/${data.jobId}`,
  };
};
