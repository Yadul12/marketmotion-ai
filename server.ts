import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;

const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey === 'MY_GEMINI_API_KEY' ||
    apiKey === 'your_gemini_api_key_here'
  ) {
    return null;
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

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>
) {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const candidateModels = preferred
    ? [preferred, 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.0-flash']
    : ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.0-flash'];
  const uniqueModels = Array.from(new Set(candidateModels));

  let lastError: any;
  for (const model of uniqueModels) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      if (
        msg.includes('404') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('not supported')
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Media Storage Abstraction (Local Development + Serverless /tmp Storage)
export interface MediaStorageProvider {
  saveFile(
    file: Express.Multer.File
  ): Promise<{ url: string; fileName: string; sizeBytes: number }>;
  getUploadDir(): string;
}

class LocalMediaStorageProvider implements MediaStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.VERCEL
      ? path.join(os.tmpdir(), 'marketmotion-uploads')
      : path.resolve(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } catch {
      this.uploadDir = path.join(os.tmpdir(), 'marketmotion-uploads');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
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

export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));

// Health check endpoint
app.get(['/healthz', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'marketmotion-ai',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

// Serve media uploads from local or /tmp directory
app.use('/uploads', express.static(mediaStorage.getUploadDir()));

// 1. Parse Raw News Article / Event Summary into Prediction Market Event
app.post('/api/ai/parse-article', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
      return res.status(400).json({
        error: 'Please provide at least 20 characters of article or summary text.',
      });
    }

    const buildFallbackParse = () => {
      const firstLine = rawText
        .trim()
        .split(/\r?\n/)[0]
        .replace(/^[#*\-\s]+/, '')
        .slice(0, 120);
      const lower = rawText.toLowerCase();
      const category = lower.includes('chip') || lower.includes('ai') || lower.includes('nvidia')
        ? 'Technology'
        : lower.includes('oil') || lower.includes('grid') || lower.includes('hydrogen')
        ? 'Energy'
        : lower.includes('sec') || lower.includes('ban') || lower.includes('policy')
        ? 'Regulation'
        : 'Macroeconomics';
      const pctMatch = rawText.match(/(\d{1,2})\s*%/);
      const marketProbability = pctMatch
        ? Math.max(5, Math.min(95, Number(pctMatch[1])))
        : 64;

      return {
        title: firstLine.endsWith('?')
          ? firstLine
          : `Will ${firstLine.slice(0, 140)} resolve YES before year-end?`,
        category,
        description: `Binary contract resolving YES if official institutional filings confirm the primary milestone described in the brief: ${rawText.trim().slice(0, 320)}`,
        marketProbability,
        latestDevelopments: rawText.trim().slice(0, 400),
        sourceLinks: 'https://www.federalreserve.gov\nhttps://www.bls.gov',
      };
    };

    const ai = getAiClient();
    if (!ai) {
      return res.json(buildFallbackParse());
    }

    try {
      const response = await generateWithModelFallback(ai, {
        contents: `Extract a structured prediction-market event profile from the following news article or event brief:\n\n${rawText.slice(0, 7500)}`,
        config: {
          systemInstruction:
            'You are a senior quantitative analyst at a prediction-market platform like Gravia. Extract a clear, resolvable binary prediction market question, category, resolution description, estimated implied probability (0-100), latest verified developments, and any source URLs mentioned.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Clear binary prediction market title (max 180 chars).',
              },
              category: {
                type: Type.STRING,
                description:
                  'Market sector: Macroeconomics, Technology, Energy, Geopolitics, Regulation, or Finance.',
              },
              description: {
                type: Type.STRING,
                description: 'Resolution criteria and market context.',
              },
              marketProbability: {
                type: Type.INTEGER,
                description: 'Implied probability from 1 to 99.',
              },
              latestDevelopments: {
                type: Type.STRING,
                description: 'Verified recent developments and catalysts.',
              },
              sourceLinks: {
                type: Type.STRING,
                description:
                  'Newline-separated list of source links or institutions referenced.',
              },
            },
            required: [
              'title',
              'category',
              'description',
              'marketProbability',
              'latestDevelopments',
              'sourceLinks',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      console.warn('Gemini parse-article fallback activated:', err);
      return res.json(buildFallbackParse());
    }
  } catch (error: any) {
    console.error('Error parsing article:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to parse article.',
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
      return res
        .status(400)
        .json({ error: 'Event title and description are required.' });
    }

    const prob = Number(marketProbability ?? 50);
    const buildFallbackScripts = () => ({
      script30s: `[0:00-0:05] VISUAL: Kinetic order-book ticker flashing ${prob}% IMPLIED YES.\nNARRATION: The market is pricing a ${prob}% probability on "${title}" — but look at the underlying data.\n[0:05-0:15] VISUAL: Split-screen verified filing vs. implied probability curve.\nNARRATION: Verified baseline: ${
        latestDevelopments || description
      }\n[0:15-0:24] VISUAL: Order-flow depth chart highlighting institutional hedging.\nNARRATION: While ${prob}% reflects current contract consensus, forward catalysts remain actively contested.\n[0:24-0:30] VISUAL: Gravia contract card with resolution criteria.\nNARRATION: Is ${prob}% too high or mispriced? Track the live contract on Gravia.`,
      script60s: `[0:00-0:06] VISUAL: High-contrast macro terminal opening on ${prob}% YES odds.\nNARRATION: Prediction markets just moved to ${prob}% on a critical ${
        category || 'Macroeconomics'
      } question: "${title}"\n[0:06-0:20] VISUAL: Primary source document callouts (${
        sourceLinks || 'Institutional Filings'
      }).\nNARRATION: First, separate the verified facts: ${description}\n[0:20-0:38] VISUAL: Implied probability candlestick chart with volume bars.\nNARRATION: Second, what the ${prob}% market probability represents: traders are weighing ${
        latestDevelopments || 'recent institutional catalysts'
      } against historical resolution baselines.\n[0:38-0:52] VISUAL: Scenario matrix comparing upside and downside tail risks.\nNARRATION: Third, the speculative catalysts: upcoming data releases could swing this contract by 15 to 20 points before resolution.\n[0:52-1:00] VISUAL: Gravia live probability gauge.\nNARRATION: Where do you stand on the ${prob}% consensus? Drop your thesis below.`,
      hooks: `1. [Data Shock Hook]: "${prob}% of the prediction market is pricing YES on ${title.slice(0, 70)} — here's the verified data driving the move."\n2. [Contrarian Question Hook]: "Is the order book mispricing ${title.slice(0, 65)} at ${prob}%?"\n3. [Catalyst Alert Hook]: "Three verified catalysts just shifted the implied odds on ${title.slice(0, 65)}."`,
      narration: `Prediction markets are currently pricing a ${prob} percent implied probability on ${title}. To understand why, we have to separate verified facts from forward speculation. On the factual side, ${description}. Meanwhile, order-flow pricing at ${prob} percent reflects how institutional participants are hedging ${
        latestDevelopments || 'upcoming catalysts'
      }. The key question now is whether the next catalyst validates this ${prob} percent consensus or triggers a sharp repricing.`,
      verifiedFacts: `• Contract Resolution Scope: ${description}\n• Verified Developments: ${
        latestDevelopments || 'Confirmed against baseline institutional filings.'
      }\n• Recorded Reference Sources: ${sourceLinks || 'Official public filings & market feeds'}`,
      probabilityAnalysis: `Current ${prob}% implied probability reflects active two-way order book liquidity in ${
        category || 'Macroeconomics'
      }, pricing a ${prob >= 50 ? 'base-case YES tilt' : 'cautious NO lean'} while leaving ${100 - prob}% implied weight on counter-scenarios.`,
      speculationNotes: `• Forward Catalyst Risk: Unconfirmed policy or macro surprises prior to contract expiration.\n• Liquidity Sensitivity: High-conviction block orders around scheduled announcements can shift implied odds ±12%.`,
      shortCaption: `Markets are pricing ${prob}% YES on "${title}" — here is the verified data vs. what the order book is anticipating.`,
      hashtags: `#PredictionMarkets #Gravia #${(category || 'Macro').replace(/[^a-zA-Z0-9]/g, '')} #MarketProbabilities #Fintech #QuantitativeAnalysis`,
      callToAction: `Do you think ${prob}% implied probability is overvalued or undervalued? Share your probability estimate in the comments.`,
    });

    const ai = getAiClient();
    if (!ai) {
      return res.json(buildFallbackScripts());
    }

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

    try {
      const response = await generateWithModelFallback(ai, {
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
                description:
                  'Complete 30-second video script with timecodes [0:00-0:05], visual cues, and spoken narration.',
              },
              script60s: {
                type: Type.STRING,
                description:
                  'Complete 60-second deep-dive video script with timecodes, visual cues, and spoken narration.',
              },
              hooks: {
                type: Type.STRING,
                description:
                  '3 distinct attention-grabbing opening hooks (1. Data Shock Hook, 2. Contrarian Question Hook, 3. Catalyst Alert Hook).',
              },
              narration: {
                type: Type.STRING,
                description:
                  'Clean, continuous voiceover narration script ready for ElevenLabs synthesis.',
              },
              verifiedFacts: {
                type: Type.STRING,
                description:
                  'Bullet-pointed list of strictly verified facts grounded in the input sources.',
              },
              probabilityAnalysis: {
                type: Type.STRING,
                description:
                  'Analytical explanation of the current market probability percentage and order-flow pricing.',
              },
              speculationNotes: {
                type: Type.STRING,
                description:
                  'Explicitly labeled speculative catalysts and upside/downside scenarios.',
              },
              shortCaption: {
                type: Type.STRING,
                description: 'Punchy 1-2 sentence social video caption.',
              },
              hashtags: {
                type: Type.STRING,
                description:
                  'Space-separated relevant hashtags for fintech and prediction markets.',
              },
              callToAction: {
                type: Type.STRING,
                description:
                  'Engaging call-to-action asking viewers whether the market probability is mispriced.',
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
    } catch (err) {
      console.warn('Gemini generate-scripts fallback activated:', err);
      return res.json(buildFallbackScripts());
    }
  } catch (error: any) {
    console.error('Error generating scripts:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate scripts.',
    });
  }
});

// 3. AI Storyboard Generator (Divides script into scenes with Runway, Higgsfield, ElevenLabs, CapCut prompts)
app.post('/api/ai/generate-storyboard', async (req, res) => {
  try {
    const { title, marketProbability, scriptText, targetDuration = 30 } = req.body;
    if (!title || !scriptText) {
      return res.status(400).json({
        error: 'Event title and script text are required to generate a storyboard.',
      });
    }

    const prob = Number(marketProbability ?? 50);
    const durUnit = targetDuration === 60 ? 10 : 5;
    const buildFallbackScenes = () => [
      {
        sceneNumber: 1,
        durationSeconds: durUnit,
        sceneDescription: `Opening hook displaying live ${prob}% implied probability gauge for "${title}".`,
        visualPrompt: `Slow push-in on dark glass institutional trading desk terminal displaying "${prob}% IMPLIED YES" in glowing cyan telemetry, shallow depth of field, 4K motion.`,
        higgsfieldPrompt: `35mm anamorphic lens, f/1.8 aperture, moody slate-blue rim lighting on macro analyst workstation, crisp HUD reflection.`,
        voiceoverText: `The prediction market is pricing a ${prob} percent probability on ${title}.`,
        onScreenText: `${prob}% IMPLIED PROBABILITY`,
        transitionRecommendation: 'Hard Cut on Beat',
        epistemicTag: 'market_probability',
      },
      {
        sceneNumber: 2,
        durationSeconds: durUnit,
        sceneDescription: `Verified baseline facts and primary institutional filings.`,
        visualPrompt: `Macro camera pan across official regulatory filing document with emerald verification highlights and timestamp callouts.`,
        higgsfieldPrompt: `50mm prime lens, overhead documentary tabletop lighting, high-contrast crisp paper and digital overlay texture.`,
        voiceoverText: `Here is what is strictly verified in the baseline data right now, separate from market speculation.`,
        onScreenText: `VERIFIED BASELINE FACTS`,
        transitionRecommendation: 'Whip Pan Right',
        epistemicTag: 'verified_fact',
      },
      {
        sceneNumber: 3,
        durationSeconds: durUnit,
        sceneDescription: `Order-book depth and liquidity flow breakdown.`,
        visualPrompt: `Dynamic 3D order-book depth chart animating buy and sell walls converging at ${prob}% implied odds.`,
        higgsfieldPrompt: `24mm wide cinema lens, volumetric dark studio environment, cyan and emerald data illumination.`,
        voiceoverText: `Order-flow consensus sits at ${prob} percent as institutional desks hedge incoming catalysts.`,
        onScreenText: `ORDER BOOK CONSENSUS: ${prob}%`,
        transitionRecommendation: 'Glitch Data Wipe',
        epistemicTag: 'market_probability',
      },
      {
        sceneNumber: 4,
        durationSeconds: durUnit,
        sceneDescription: `Forward speculative scenarios and upside/downside tail risks.`,
        visualPrompt: `Split-screen scenario simulation showing divergent probability paths in amber and cyan light trails.`,
        higgsfieldPrompt: `85mm portrait lens, dramatic amber key light contrasting with deep navy shadows, cinematic color grade.`,
        voiceoverText: `However, unconfirmed forward catalysts could still trigger a sharp repricing before contract resolution.`,
        onScreenText: `SPECULATIVE TAIL RISKS`,
        transitionRecommendation: 'Match Dissolve',
        epistemicTag: 'speculation',
      },
      {
        sceneNumber: 5,
        durationSeconds: durUnit,
        sceneDescription: `Closing call-to-action with Gravia contract summary card.`,
        visualPrompt: `Clean pull-back revealing the full Gravia prediction market contract card and resolution timer.`,
        higgsfieldPrompt: `35mm anamorphic lens, balanced studio key lighting, ultra-sharp UI typography.`,
        voiceoverText: `Is ${prob} percent accurately priced, or is the market missing the next catalyst?`,
        onScreenText: `OVERPRICED OR UNDERPRICED AT ${prob}%?`,
        transitionRecommendation: 'Hard Cut on Beat',
        epistemicTag: 'market_probability',
      },
    ];

    const ai = getAiClient();
    if (!ai) {
      return res.json({ scenes: buildFallbackScenes() });
    }

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

    try {
      const response = await generateWithModelFallback(ai, {
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
                  description:
                    'Must be verified_fact, market_probability, or speculation',
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
    } catch (err) {
      console.warn('Gemini generate-storyboard fallback activated:', err);
      return res.json({ scenes: buildFallbackScenes() });
    }
  } catch (error: any) {
    console.error('Error generating storyboard:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate storyboard.',
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

    const prob = Number(marketProbability ?? 50);
    const buildFallbackPublishing = () => ({
      pubInstagram: `📊 ${prob}% IMPLIED PROBABILITY: ${title}\n\n✅ Verified Baseline:\n${
        verifiedFacts || description || 'Confirmed institutional resolution parameters.'
      }\n\n📈 What the Market is Pricing (${prob}%):\n${
        probabilityAnalysis || 'Active order-book consensus across liquidity desks.'
      }\n\n⚠️ Forward Catalysts to Watch:\n${
        speculationNotes || 'Upcoming scheduled releases could shift contract pricing.'
      }\n\nIs ${prob}% mispriced? Drop your call below 👇\n\n#PredictionMarkets #Gravia #Macroeconomics #Fintech #MarketOdds`,
      pubTiktok: `The prediction market is pricing ${prob}% YES on "${title}" 📊 Here is the verified data vs. what traders are betting happens next. Is ${prob}% too high or too low? #predictionmarkets #gravia #fintech #macro #marketodds`,
      pubYoutubeTitle: `${prob}% Odds: ${title.slice(0, 52)} | Market Briefing`,
      pubYoutubeDesc: `Prediction Market Briefing: ${title} (${prob}% Implied Probability)\n\n01. Verified Baseline Facts:\n${
        verifiedFacts || description
      }\n\n02. Order-Book Probability Analysis:\n${
        probabilityAnalysis || `${prob}% consensus pricing in ${category || 'Macroeconomics'}.`
      }\n\n03. Speculative Scenarios:\n${
        speculationNotes || 'Key upcoming catalysts.'
      }\n\n#PredictionMarkets #Gravia #Shorts`,
      pubXThread: `1/ 📊 MARKET BRIEFING: Prediction markets are currently pricing a ${prob}% implied probability on:\n\n"${title}"\n\nHere is the epistemic breakdown separating verified facts from order-book expectations 🧵👇\n---\n2/ ✅ VERIFIED BASELINE FACTS:\n\n${
        verifiedFacts || description
      }\n---\n3/ 📈 WHAT THE ${prob}% PROBABILITY REFLECTS:\n\n${
        probabilityAnalysis || 'Order-flow consensus weighing confirmed filings against upcoming catalysts.'
      }\n---\n4/ ⚠️ CATALYSTS & TAIL RISKS:\n\n${
        speculationNotes || 'Forward-looking scenarios that could reprice the contract.'
      }\n\nWhere would you price this contract right now — above or below ${prob}%?`,
      pubLinkedin: `Institutional Prediction Market Briefing — ${category || 'Macroeconomics'}\n\nContract: "${title}"\nCurrent Implied Probability: ${prob}% YES\n\nWhen evaluating prediction-market signals for decision support, separating verified baseline data from implied order-book expectations is essential:\n\n1. Verified Factual Baseline:\n${
        verifiedFacts || description
      }\n\n2. Market-Implied Probability (${prob}%):\n${
        probabilityAnalysis || 'Reflects current risk-weighted capital allocation across contract participants.'
      }\n\n3. Forward Catalysts & Tail Risks:\n${
        speculationNotes || 'Upcoming institutional releases remain the primary variance driver.'
      }\n\nHow is your desk weighting this probability curve? #PredictionMarkets #InstitutionalResearch #RiskManagement #Gravia`,
    });

    const ai = getAiClient();
    if (!ai) {
      return res.json(buildFallbackPublishing());
    }

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

    try {
      const response = await generateWithModelFallback(ai, {
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
                description:
                  'Instagram Reel caption with structured spacing, fact vs. odds breakdown, and hashtag block.',
              },
              pubTiktok: {
                type: Type.STRING,
                description:
                  'TikTok punchy caption optimized for search keywords and comment engagement.',
              },
              pubYoutubeTitle: {
                type: Type.STRING,
                description: 'High-CTR YouTube Shorts title under 70 characters.',
              },
              pubYoutubeDesc: {
                type: Type.STRING,
                description:
                  'YouTube Shorts description with key takeaways, source notes, and tags.',
              },
              pubXThread: {
                type: Type.STRING,
                description:
                  '4-post X (Twitter) thread separated by --- (1/ Hook & Odds, 2/ Verified Facts, 3/ What the Market is Pricing, 4/ Question & Link).',
              },
              pubLinkedin: {
                type: Type.STRING,
                description:
                  'Executive LinkedIn analytical post examining institutional implications of the prediction market pricing.',
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
    } catch (err) {
      console.warn('Gemini generate-publishing fallback activated:', err);
      return res.json(buildFallbackPublishing());
    }
  } catch (error: any) {
    console.error('Error generating publishing package:', error);
    return res.status(500).json({
      error:
        error?.message || 'Failed to generate publishing package.',
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
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to store uploaded video.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    console.log(
      `MarketMotion AI Studio server running on http://localhost:${PORT}`
    );
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
