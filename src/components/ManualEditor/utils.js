export const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return "0:00.0";
  const m   = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
};

export const fmtTC = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m   = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
};

/* ── video helpers ── */
export const getVideoDuration = (url) =>
  new Promise((res) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => res(v.duration);
    v.onerror = () => res(10);
  });

export const captureFrame = (url, t = 0.5, w = 160, h = 90) =>
  new Promise((res) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.preload = "metadata";
    v.src = url;
    const seek = () => { v.currentTime = Math.min(t, v.duration * 0.9); };
    v.onloadeddata  = seek;
    v.onloadedmetadata = seek;
    v.onseeked = () => {
      try {
        const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
        c.getContext("2d").drawImage(v, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", 0.55));
      } catch { res(null); }
    };
    v.onerror = () => res(null);
    setTimeout(() => res(null), 8000);
  });

export const buildStrip = async (url, count = 10) => {
  const dur = await getVideoDuration(url);
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      captureFrame(url, (dur / count) * i + dur / count / 2)
    )
  );
};

/* ── constants ── */
export const BASE_PX_PER_SEC = 90;
export const BASE_URL        = typeof import.meta !== "undefined"
  ? (import.meta.env?.VITE_SERVER_URL || "http://localhost:3000")
  : "http://localhost:3000";

export const FONTS = [
  "Arial","Helvetica","Georgia","Times New Roman",
  "Verdana","Trebuchet MS","Impact","Courier New",
  "Tahoma","Palatino","Garamond","Comic Sans MS",
];

export const ASPECT_RATIOS = [
  { id: "16:9", label: "Landscape",  ar: 16 / 9  },
  { id: "9:16", label: "Portrait",   ar: 9  / 16 },
  { id: "1:1",  label: "Square",     ar: 1        },
  { id: "4:5",  label: "Instagram",  ar: 4  / 5  },
];

export const SPEED_OPTIONS = [
  { label: "0.25×", v: 0.25 },
  { label: "0.5×",  v: 0.5  },
  { label: "0.75×", v: 0.75 },
  { label: "1×",    v: 1    },
  { label: "1.25×", v: 1.25 },
  { label: "1.5×",  v: 1.5  },
  { label: "2×",    v: 2    },
];

export const TRANSITION_OPTIONS = [
  "None","Fade","Slide Left","Slide Right","Zoom In","Zoom Out","Wipe","Dissolve",
];

export const FILTER_OPTIONS = [
  { label: "None",       css: ""                                   },
  { label: "Cinematic",  css: "contrast(1.1) saturate(0.85) sepia(0.15)" },
  { label: "Vintage",    css: "sepia(0.4) contrast(1.1) brightness(0.95)" },
  { label: "B&W",        css: "grayscale(1)"                       },
  { label: "Warm",       css: "sepia(0.2) saturate(1.3) brightness(1.05)" },
  { label: "Cool",       css: "saturate(0.9) hue-rotate(15deg)"    },
  { label: "Vivid",      css: "saturate(1.6) contrast(1.05)"       },
  { label: "Fade",       css: "brightness(1.1) contrast(0.85) saturate(0.9)" },
];
