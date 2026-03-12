# not-a-yt — Frontend

AI-powered YouTube Shorts generator. This is the frontend React app. It talks to the `not-a-yt-server` backend.

---

## Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS v3**
- **Supabase** — auth + API key storage
- **DM Sans** + **DM Serif Display** — Google Fonts

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18 or higher
- **npm** v9 or higher

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/its-dhaya/not-a-yt.git
cd not-a-yt
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Tailwind CSS v3

> Important: Must be v3. Do not install v4.

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

This generates two files:

- `tailwind.config.js` — replace with the one from this repo
- `postcss.config.js` — keep as generated

### 4. Set up environment variables

Create a `.env` file in the root of the project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:3000
```

Get your Supabase URL and anon key from:
**Supabase Dashboard → Project Settings → API**

### 5. Set up Supabase

In your Supabase project, run this SQL to create the API keys table:

```sql
CREATE TABLE api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  groq_key text,
  pexels_key text,
  pixabay_key text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE api_keys ADD CONSTRAINT api_keys_user_id_unique UNIQUE (user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own keys"
ON api_keys FOR ALL
USING (auth.uid() = user_id);
```

Also go to **Authentication → Providers → Email** and turn off **Confirm email** if you want users to log in immediately after signup.

### 6. Run the dev server

```bash
npm run dev
```

App will be at `http://localhost:5173`

---

## Project Structure

```
src/
├── assets/              # Logo and static images
├── components/
│   ├── ApiKeySetup.jsx  # API key entry page
│   ├── Auth.jsx         # Login / signup page
│   ├── ClipSelector.jsx # Clip picker per scene
│   ├── GenerateVideo.jsx# Render trigger button
│   ├── KeywordEditor.jsx# Edit search keywords
│   ├── Landing.jsx      # Public landing page
│   ├── Navbar.jsx       # Top nav with logout
│   ├── ScriptView.jsx   # Script display + edit
│   ├── TopicInput.jsx   # Topic entry
│   └── VoiceSelector.jsx# TTS voice picker
├── constants/
│   └── voices.js        # Edge TTS voice list
├── services/
│   └── api.js           # All backend API calls
├── styles/
│   └── App.css          # Legacy (can be deleted)
├── App.jsx              # Main app + routing logic
├── index.css            # Tailwind directives + base styles
├── main.jsx             # React entry point
└── supabaseClient.js    # Supabase client init
```

---

## vite.config.js

Make sure your `vite.config.js` looks like this (no Tailwind plugin — v3 uses PostCSS):

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

---

## App Flow

```
Landing page
    ↓ Get Started
Login / Signup (Supabase Auth)
    ↓
API Key Setup (Groq + Pexels + Pixabay)
    ↓
Step 1 — Enter topic → Generate Script
Step 2 — Pick a TTS voice
Step 3 — Edit keywords
Step 4 — Select clips → Generate Video → Download MP4
```

---

## Common Issues

**Tailwind not applying styles**

- Make sure you installed `tailwindcss@3` not v4
- Make sure `postcss.config.js` exists
- Make sure `main.jsx` only imports `./index.css` (not `App.css`)
- Restart dev server after installing Tailwind

**`@tailwindcss/vite` error on startup**

- Run `npm uninstall @tailwindcss/vite`
- Remove any reference to it in `vite.config.js`

**`Cannot find module ../constants/voices`**

- Create `src/constants/voices.js` with the VOICES array

**Blank screen after login**

- Check browser console for errors
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`

**`Email not confirmed` error on login**

- Go to Supabase → Authentication → Providers → Email → turn off Confirm email

---

## Environment Variables Reference

| Variable                 | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                             |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key                         |
| `VITE_SERVER_URL`        | Backend server URL (default: `http://localhost:3000`) |

---

## Backend

The backend lives in a separate repo: `not-a-yt-server`.
It handles script generation, clip fetching, TTS, and video rendering.
Make sure it's running on port `3000` before using the app.
