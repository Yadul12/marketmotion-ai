# MarketMotion AI — Prediction Market Content Studio

**MarketMotion AI** is an AI-powered short-form video and social content studio built for prediction-market intelligence platforms such as **Gravia**. It transforms complex prediction-market events and implied probabilities into structured short-form video scripts, scene-by-scene storyboards, creative production manifests, and platform-native social publishing packages.

---

## Key Capabilities

1. **Event Input & AI News Article Extractor (`EventInputView`)**
   - Enter prediction-market contracts manually (Title, Sector, Implied Market Probability `0–100%`, Resolution Criteria, Latest Verified Developments, and Verified Source Links).
   - Paste raw news articles or research notes and extract structured prediction-market fields automatically via Gemini (`POST /api/ai/parse-article`).
   - Load curated institutional sample events (Federal Reserve Rate Cut Decision, US HBM3e Semiconductor Export Controls, EU CBAM Green Hydrogen Waiver).

2. **AI Script Lab & Epistemic Guardrails (`ScriptLabView`)**
   - Generates 30-second fast cuts, 60-second deep-dive scripts, 3 attention-grabbing opening hooks, continuous ElevenLabs voiceover narration, short captions, hashtags, and calls to action (`POST /api/ai/generate-scripts`).
   - Enforces **Epistemic Separation** across every output by explicitly isolating:
     - **Verified Facts**: Confirmed historical releases and official filings.
     - **Market Probabilities**: Real-time contract pricing and order-flow consensus.
     - **Speculation & Catalysts**: Forward-looking scenarios and upside/downside tail risks.

3. **Storyboard Studio (`StoryboardView`)**
   - Automatically segments scripts into sequential timed scenes (`POST /api/ai/generate-storyboard`) persisted in `/projects/{projectId}/scenes/{sceneId}`.
   - Generates per-scene **Runway Gen-3 Alpha** motion prompts, **Higgsfield** cinematic camera & lighting specs, **ElevenLabs** voiceover lines, **CapCut** lower-third overlays, and transition recommendations.

4. **AI Creative Workflow & Video Preview (`CreativeWorkflowView`)**
   - Provides structured export/import manifests for **Runway**, **Higgsfield**, **ElevenLabs**, and timecoded `.srt` subtitle files for **CapCut**.
   - Includes a server-side `MediaStorageProvider` abstraction (`POST /api/media/upload`) for uploading rendered `.mp4`/`.webm`/`.mov` files, an HTML5 `<video>` preview player, and an in-browser **9:16 WebM Storyboard Animatic Renderer**.

5. **Publishing Preparation & Human Compliance Gate (`PublishingPrepView`)**
   - Generates tailored publishing packages (`POST /api/ai/generate-publishing`) for **X (Twitter) Threads**, **Instagram Reels**, **TikTok**, **YouTube Shorts**, and **LinkedIn**.
   - Enforces a mandatory human compliance sign-off gate before marking any project as `Published`.

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- `GEMINI_API_KEY` configured in `.env`
- Firebase configuration in `firebase-applet-config.json`

### Running Locally
```bash
npm install
npm run dev
```
The full-stack Express + Vite server listens on `http://localhost:3000`.
