import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;

// Initialize Gemini SDK on Server Side with mandatory telemetry User-Agent
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Media Storage Abstraction (Local Development Storage with Cloud Storage Interface)
export interface MediaStorageProvider {
  saveFile(file: Express.Multer.File): Promise<{ url: string; fileName: string; sizeBytes: number }>;
}

class LocalMediaStorageProvider implements MediaStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File) {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetPath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(targetPath, file.buffer);
    return {
      url: `/uploads/${safeName}`,
      fileName: file.originalname,
      sizeBytes: file.size,
    };
  }
}

const mediaStorage: MediaStorageProvider = new LocalMediaStorageProvider();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 }, // 80 MB video limit
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Serve local media uploads
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // 1. Parse Raw News Article / Event Summary into Prediction Market Event
  app.post('/api/ai/parse-article', async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
        return res.status(400).json({ error: 'Please provide at least 20 characters of article or summary text.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract a structured prediction-market event profile from the following news article or event brief:\n\n${rawText.slice(0, 7500)}`,
        config: {
          systemInstruction:
            'You are a senior quantitative analyst at a prediction-market platform like Gravia. Extract a clear, resolvable binary prediction market question, category, resolution description, estimated implied probability (0-100), latest verified developments, and any source URLs mentioned.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Clear binary prediction market title (max 180 chars).' },
              category: { type: Type.STRING, description: 'Market sector: Macroeconomics, Technology, Energy, Geopolitics, Regulation, or Finance.' },
              description: { type: Type.STRING, description: 'Resolution criteria and market context.' },
              marketProbability: { type: Type.INTEGER, description: 'Implied probability from 1 to 99.' },
              latestDevelopments: { type: Type.STRING, description: 'Verified recent developments and catalysts.' },
              sourceLinks: { type: Type.STRING, description: 'Newline-separated list of source links or institutions referenced.' },
            },
            required: ['title', 'category', 'description', 'marketProbability', 'latestDevelopments', 'sourceLinks'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error parsing article:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to parse article with Gemini API.',
      });
    }
  });

  // 2. AI Script Generator (30s script, 60s script, hooks, epistemic separation, captions, hashtags, CTA)
  app.post('/api/ai/generate-scripts', async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        marketProbability,
        latestDevelopments,
        sourceLinks,
        rawArticleText,
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Event title and description are required.' });
      }

      const ai = getAiClient();
      const prompt = `
Prediction Market Event: ${title}
Category: ${category || 'Macroeconomics'}
Current Market Implied Probability: ${marketProbability ?? 50}%
Description & Resolution Criteria: ${description}
Latest Developments: ${latestDevelopments || 'None provided'}
Verified Sources: ${sourceLinks || 'Standard institutional feeds'}
Additional Source Context: ${rawArticleText ? rawArticleText.slice(0, 3000) : 'None'}

Generate a complete short-form video script package for X, Instagram Reels, TikTok, YouTube Shorts, and LinkedIn.
CRITICAL REQUIREMENT: Strictly distinguish between:
1. Verified Facts (confirmed historical events, official filings, and reported numbers)
2. Market Probabilities (what the ${marketProbability ?? 50}% prediction market pricing reflects right now)
3. Speculation (unconfirmed catalysts, forward-looking scenarios, and tail risks)
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Executive Producer at MarketMotion AI (a prediction-market studio for Gravia). Write punchy, institutional-grade, high-retention video scripts that never conflate market odds with guaranteed outcomes. Format scripts with clear [0:00-0:05] timecode markers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              script30s: {
                type: Type.STRING,
                description: 'Complete 30-second video script with timecodes [0:00-0:05], visual cues, and spoken narration.',
              },
              script60s: {
                type: Type.STRING,
                description: 'Complete 60-second deep-dive video script with timecodes, visual cues, and spoken narration.',
              },
              hooks: {
                type: Type.STRING,
                description: '3 distinct attention-grabbing opening hooks (1. Data Shock Hook, 2. Contrarian Question Hook, 3. Catalyst Alert Hook).',
              },
              narration: {
                type: Type.STRING,
                description: 'Clean, continuous voiceover narration script ready for ElevenLabs synthesis.',
              },
              verifiedFacts: {
                type: Type.STRING,
                description: 'Bullet-pointed list of strictly verified facts grounded in the input sources.',
              },
              probabilityAnalysis: {
                type: Type.STRING,
                description: 'Analytical explanation of the current market probability percentage and order-flow pricing.',
              },
              speculationNotes: {
                type: Type.STRING,
                description: 'Explicitly labeled speculative catalysts and upside/downside scenarios.',
              },
              shortCaption: {
                type: Type.STRING,
                description: 'Punchy 1-2 sentence social video caption.',
              },
              hashtags: {
                type: Type.STRING,
                description: 'Space-separated relevant hashtags for fintech and prediction markets.',
              },
              callToAction: {
                type: Type.STRING,
                description: 'Engaging call-to-action asking viewers whether the market probability is mispriced.',
              },
            },
            required: [
              'script30s',
              'script60s',
              'hooks',
              'narration',
              'verifiedFacts',
              'probabilityAnalysis',
              'speculationNotes',
              'shortCaption',
              'hashtags',
              'callToAction',
            ],
          },
        },
      });

      const data = JSON.parse((response.text ?? '{}').trim());
      return res.json(data);
    } catch (error: any) {
      console.error('Error generating scripts:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate scripts via Gemini API.',
      });
    }
  });

  // 3. AI Storyboard Generator (Divides script into scenes with Runway, Higgsfield, ElevenLabs, CapCut prompts)
  app.post('/api/ai/generate-storyboard', async (req, res) => {
    try {
      const { title, marketProbability, scriptText, targetDuration = 30 } = req.body;
      if (!title || !scriptText) {
        return res.status(400).json({ error: 'Event title and script text are required to generate a storyboard.' });
      }

      const ai = getAiClient();
      const prompt = `
Prediction Market Event: ${title}
Implied Probability: ${marketProbability ?? 50}%
Target Video Duration: ${targetDuration} seconds
Source Script:
${scriptText}

Divide this script into 5 to 7 sequential storyboard scenes whose durations sum to approximately ${targetDuration} seconds.
For each scene, provide:
- sceneNumber (1-based integer)
- durationSeconds (integer in seconds)
- sceneDescription (narrative & visual direction)
- visualPrompt (Runway Gen-3 Alpha motion prompt: camera movement, lighting, environment, motion dynamics)
- higgsfieldPrompt (Higgsfield cinematic visual prompt: lens focal length, character/subject framing, color grade)
- voiceoverText (exact ElevenLabs spoken lines for this scene)
- onScreenText (concise lower-third or kinetic typography overlay for CapCut, max 60 chars)
- transitionRecommendation (e.g. Hard Cut on Beat, Whip Pan Right, Match Dissolve, Glitch Data Wipe)
- epistemicTag (MUST be one of: "verified_fact", "market_probability", "speculation")
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Senior Motion Director for a fintech media studio. Create production-ready storyboard scenes tailored for Runway Gen-3, Higgsfield, ElevenLabs, and CapCut.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                durationSeconds: { type: Type.INTEGER },
                sceneDescription: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                higgsfieldPrompt: { type: Type.STRING },
                voiceoverText: { type: Type.STRING },
                onScreenText: { type: Type.STRING },
                transitionRecommendation: { type: Type.STRING },
                epistemicTag: {
                  type: Type.STRING,
                  description: 'Must be verified_fact, market_probability, or speculation',
                },
              },
              required: [
                'sceneNumber',
                'durationSeconds',
                'sceneDescription',
                'visualPrompt',
                'higgsfieldPrompt',
                'voiceoverText',
                'onScreenText',
                'transitionRecommendation',
                'epistemicTag',
              ],
            },
          },
        },
      });

      const scenes = JSON.parse((response.text ?? '[]').trim());
      return res.json({ scenes });
    } catch (error: any) {
      console.error('Error generating storyboard:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate storyboard via Gemini API.',
      });
    }
  });

  // 4. AI Publishing Package Generator (X, Instagram Reels, TikTok, YouTube Shorts, LinkedIn)
  app.post('/api/ai/generate-publishing', async (req, res) => {
    try {
      const {
        title,
        category,
        marketProbability,
        description,
        verifiedFacts,
        probabilityAnalysis,
        speculationNotes,
        script30s,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Event title is required.' });
      }

      const ai = getAiClient();
      const prompt = `
Prediction Market Event: ${title}
Category: ${category}
Implied Probability: ${marketProbability}%
Description: ${description}
Verified Facts: ${verifiedFacts}
Probability Analysis: ${probabilityAnalysis}
Speculation Notes: ${speculationNotes}
Script Summary: ${script30s}

Create platform-native publishing packages for all 5 target social channels. Ensure every post distinguishes verified facts from the ${marketProbability}% market-implied probability.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Head of Social Distribution for a prediction-market intelligence firm. Craft high-engagement, compliant social copy for Instagram Reels, TikTok, YouTube Shorts, X (Twitter), and LinkedIn.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pubInstagram: {
                type: Type.STRING,
                description: 'Instagram Reel caption with structured spacing, fact vs. odds breakdown, and hashtag block.',
              },
              pubTiktok: {
                type: Type.STRING,
                description: 'TikTok punchy caption optimized for search keywords and comment engagement.',
              },
              pubYoutubeTitle: {
                type: Type.STRING,
                description: 'High-CTR YouTube Shorts title under 70 characters.',
              },
              pubYoutubeDesc: {
                type: Type.STRING,
                description: 'YouTube Shorts description with key takeaways, source notes, and tags.',
              },
              pubXThread: {
                type: Type.STRING,
                description: '4-post X (Twitter) thread separated by --- (1/ Hook & Odds, 2/ Verified Facts, 3/ What the Market is Pricing, 4/ Question & Link).',
              },
              pubLinkedin: {
                type: Type.STRING,
                description: 'Executive LinkedIn analytical post examining institutional implications of the prediction market pricing.',
              },
            },
            required: [
              'pubInstagram',
              'pubTiktok',
              'pubYoutubeTitle',
              'pubYoutubeDesc',
              'pubXThread',
              'pubLinkedin',
            ],
          },
        },
      });

      const pkg = JSON.parse((response.text ?? '{}').trim());
      return res.json(pkg);
    } catch (error: any) {
      console.error('Error generating publishing package:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate publishing package via Gemini API.',
      });
    }
  });

  // 5. Video Upload Endpoint using MediaStorageProvider Abstraction
  app.post('/api/media/upload', upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded.' });
      }
      const saved = await mediaStorage.saveFile(req.file);
      return res.json(saved);
    } catch (error: any) {
      console.error('Video upload error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to store uploaded video.' });
    }
  });

  // Mount Vite dev middleware or static dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MarketMotion AI Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
