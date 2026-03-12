import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

/* ── Auth header ── */
const getAuthHeader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    // Throw a special error type so callers can detect session expiry
    const err = new Error("Session expired. Please log in again.");
    err.code = "SESSION_EXPIRED";
    throw err;
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};

/* ── Handle response — detect 401 specifically ── */
const handleResponse = async (res) => {
  if (res.status === 401) {
    // Token expired mid-flow — force sign out so app redirects to login
    await supabase.auth.signOut();
    const err = new Error("Your session expired. Please log in again.");
    err.code = "SESSION_EXPIRED";
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
};

/* ── Generate Script ── */
export const generateScriptAPI = async (topic) => {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/generate-script`, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic }),
  });
  return handleResponse(res);
};

/* ── Get Clips ── */
export const getClipsAPI = async (script, keywords) => {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/get-clips`, {
    method: "POST",
    headers,
    body: JSON.stringify({ script, keywords }),
  });
  return handleResponse(res);
};

/* ── Generate Video ── */
export const generateVideoAPI = async (
  videoUrls,
  script,
  voice,
  themeId = "classic",
  themeSettings = null
) => {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/generate-video`, {
    method: "POST",
    headers,
    body: JSON.stringify({ videoUrls, script, voice, themeId, themeSettings }),
  });
  const data = await handleResponse(res);
  return {
    ...data,
    streamUrl: `${BASE_URL}/stream/${data.jobId}`,
    downloadUrl: `${BASE_URL}/download/${data.jobId}`,
  };
};
