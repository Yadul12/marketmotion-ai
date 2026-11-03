import { Project, Scene } from '../types/studio';

export interface SampleEventTemplate {
  id: string;
  title: string;
  category: string;
  marketProbability: number;
  description: string;
  latestDevelopments: string;
  sourceLinks: string;
  rawArticleText: string;
  presetProject?: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
  presetScenes?: Omit<Scene, 'id' | 'projectId' | 'ownerId' | 'createdAt' | 'updatedAt'>[];
}

export const SAMPLE_EVENTS: SampleEventTemplate[] = [
  {
    id: 'fed-rate-cut-q4',
    title: 'Will the Federal Reserve cut benchmark interest rates by at least 50 bps before year-end?',
    category: 'Macroeconomics',
    marketProbability: 68,
    description:
      'This contract resolves to YES if the Federal Open Market Committee (FOMC) lowers the target federal funds rate range by a cumulative 50 basis points or more across its remaining scheduled meetings this calendar year.',
    latestDevelopments:
      'Core PCE inflation decelerated to 2.6% YoY in the latest Bureau of Economic Analysis release, while nonfarm payroll revisions showed 42,000 fewer jobs added over the prior two months. Gravia order book liquidity surged $4.2M in the last 24 hours as traders repriced Yes contracts from 54% to 68%.',
    sourceLinks:
      'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm\nhttps://www.bea.gov/data/personal-consumption-expenditures-price-index',
    rawArticleText:
      'WASHINGTON — Traders in prediction markets and interest-rate futures sharply increased bets on a cumulative 50-basis-point Federal Reserve rate reduction before year-end following softer-than-expected Core PCE inflation readings (2.6% YoY) and downward revisions to prior payroll figures. While Fed Chair Jerome Powell emphasized data dependence in his latest testimony, Gravia prediction market contracts now price a 68% probability of at least 50 bps in cuts before December 31.',
    presetProject: {
      title: 'Will the Federal Reserve cut benchmark interest rates by at least 50 bps before year-end?',
      category: 'Macroeconomics',
      marketProbability: 68,
      description:
        'This contract resolves to YES if the Federal Open Market Committee (FOMC) lowers the target federal funds rate range by a cumulative 50 basis points or more across its remaining scheduled meetings this calendar year.',
      latestDevelopments:
        'Core PCE inflation decelerated to 2.6% YoY in the latest Bureau of Economic Analysis release, while nonfarm payroll revisions showed 42,000 fewer jobs added over the prior two months. Gravia order book liquidity surged $4.2M in the last 24 hours as traders repriced Yes contracts from 54% to 68%.',
      sourceLinks:
        'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm\nhttps://www.bea.gov/data/personal-consumption-expenditures-price-index',
      rawArticleText:
        'WASHINGTON — Traders in prediction markets and interest-rate futures sharply increased bets on a cumulative 50-basis-point Federal Reserve rate reduction before year-end following softer-than-expected Core PCE inflation readings (2.6% YoY) and downward revisions to prior payroll figures.',
      status: 'ready',
      script30s: `[0:00-0:05] VISUAL: Dramatic low-angle push toward the Federal Reserve Eccles Building at dusk; kinetic chart spikes from 54% to 68%.\nVOICEOVER: Prediction markets just repriced the Fed's next move—pushing the odds of a 50-basis-point rate cut before year-end to 68%.\n\n[0:05-0:15] VISUAL: Split-screen terminal showing official BEA Core PCE at 2.6% YoY and -42K payroll revisions.\nVOICEOVER: Here are the verified facts: Core PCE inflation just cooled to 2.6% year-over-year, and two-month payroll revisions subtracted 42,000 jobs.\n\n[0:15-0:24] VISUAL: Gravia order book depth visualization with $4.2M volume bar.\nVOICEOVER: On Gravia, $4.2 million in new volume pushed Yes contracts up 14 points in 24 hours—though a sticky services print next month remains the key tail risk.\n\n[0:24-0:30] VISUAL: Clean probability gauge locking at 68% YES / 32% NO.\nVOICEOVER: Are traders front-running the FOMC, or is 68% justified? Track the live probability on Gravia.`,
      script60s: `[0:00-0:06] HOOK: Why did $4.2 million flood into Federal Reserve prediction markets in the last 24 hours?\n[0:06-0:18] VERIFIED FACTS: According to the Bureau of Economic Analysis, Core PCE inflation decelerated to 2.6% year-over-year. Simultaneously, Bureau of Labor Statistics revisions trimmed 42,000 jobs from the prior two monthly reports.\n[0:18-0:35] MARKET PROBABILITY: In response, Gravia prediction market traders repriced the probability of at least 50 basis points in Fed rate cuts before year-end from 54% to 68%.\n[0:35-0:50] SPECULATION & CATALYSTS: While market pricing favors two 25-bps cuts—or a single 50-bps move if unemployment ticks above 4.3%—the Federal Reserve has not pre-committed. An upside surprise in shelter inflation could quickly compress these odds back toward 45%.\n[0:50-1:00] CTA: Remember: 68% is market-implied probability, not a certainty. How are you positioning ahead of the next FOMC print?`,
      hooks: `1. [Data Shock Hook]: "$4.2M just flooded the Fed rate-cut market in 24 hours—pushing 50bps cut odds from 54% to 68%."\n2. [Contrarian Question Hook]: "Wall Street economists are split 50/50 on the Fed, but real-money prediction markets just broke to 68%. Here's what they're seeing."\n3. [Catalyst Alert Hook]: "Two official data releases just changed the entire year-end interest rate trajectory."`,
      narration: `Prediction markets just repriced the Federal Reserve's next move, pushing the implied probability of at least 50 basis points in rate cuts before year-end to 68 percent. Let's separate the verified facts from market pricing. First, the verified data: Core PCE inflation cooled to 2.6 percent year-over-year, while official payroll revisions subtracted 42,000 jobs from the prior two months. Second, the market probability: on Gravia, 4.2 million dollars in 24-hour volume drove Yes contracts up 14 percentage points. Finally, the speculative risk: traders are betting softening labor data forces the FOMC's hand, but a rebound in services inflation could reverse these odds overnight. Is 68 percent overpriced or right on target?`,
      verifiedFacts: `• Bureau of Economic Analysis reported Core PCE inflation at 2.6% YoY.\n• Prior two months of nonfarm payrolls were revised downward by a combined 42,000 jobs.\n• FOMC has neither announced nor guaranteed a 50-bps cumulative cut schedule.`,
      probabilityAnalysis: `• Current Gravia Market Probability: 68% YES / 32% NO (+14% in 24h on $4.2M volume).\n• Implies roughly 2-in-3 odds of either two 25-bps cuts or one 50-bps cut before Dec 31.`,
      speculationNotes: `• Bullish Cut Scenario: If next month's unemployment rate exceeds 4.3%, traders speculate an emergency 50-bps cut at a single meeting.\n• Hawkish Reversal Risk: Sticky shelter or energy spikes could compress probability below 45%.`,
      shortCaption: `Fed 50bps rate-cut odds surged from 54% to 68% after Core PCE cooled to 2.6% YoY. Here is the breakdown of verified data vs. market pricing.`,
      hashtags: `#PredictionMarkets #FederalReserve #Macroeconomics #InterestRates #Gravia #Fintech #MarketIntelligence`,
      callToAction: `Is the market overpricing a 68% probability of a 50bps cut, or is the Fed behind the curve? Drop your forecast below.`,
      pubInstagram: `Fed rate-cut odds just jumped from 54% → 68% in 24 hours. 📊\n\nHere is what is driving the repricing on Gravia:\n\n✅ VERIFIED FACTS:\n• Core PCE inflation cooled to 2.6% YoY (BEA)\n• Two-month payroll revisions subtracted 42,000 jobs\n\n📈 MARKET PROBABILITY:\n• 68% implied probability of ≥50 bps in cuts before year-end ($4.2M 24h volume)\n\n⚠️ SPECULATION & RISKS:\n• Traders are pricing a faster dovish pivot, but sticky shelter inflation next month remains the primary downside risk.\n\nDo you think 68% is too high or too low? 👇\n\n#PredictionMarkets #FederalReserve #Macroeconomics #InterestRates #Gravia #FinTech`,
      pubTiktok: `Why did $4.2M just move the Fed rate-cut market to 68%? 📊 Verified Core PCE hit 2.6% YoY, payrolls were revised down 42K, and traders are pricing a 68% chance of ≥50bps cuts before year-end. #PredictionMarkets #FedRateCut #Macro #FinanceTok #Gravia`,
      pubYoutubeTitle: `Fed Rate Cut Odds Jump to 68%: Verified Data vs. Market Pricing`,
      pubYoutubeDesc: `Prediction markets on Gravia repriced a ≥50bps Federal Reserve rate cut before year-end from 54% to 68% following the latest Core PCE (2.6% YoY) and payroll revision (-42K) releases.\n\n0:00 The 14-Point Market Shift\n0:05 Verified Facts (BEA & BLS Data)\n0:15 Gravia Order Book Probability (68%)\n0:24 Tail Risks & Speculative Catalysts\n\nSources:\n- Federal Reserve FOMC Calendar: https://www.federalreserve.gov\n- Bureau of Economic Analysis PCE Release: https://www.bea.gov`,
      pubXThread: `1/ Prediction markets just repriced the Fed's year-end path.\n\nThe implied probability of ≥50 bps in rate cuts before Dec 31 surged from 54% to 68% over the last 24 hours on $4.2M in volume.\n\nHere is the breakdown of Verified Facts vs. Market Odds 🧵👇\n---\n2/ VERIFIED FACTS:\n• Core PCE inflation decelerated to 2.6% YoY in the latest BEA print\n• Two-month nonfarm payroll revisions subtracted 42,000 jobs\n• The FOMC has made zero formal commitment to a 50-bps cut pace\n---\n3/ MARKET PROBABILITY (68%):\n• Order-flow on Gravia shows institutional buyers stepping in at 58¢–67¢\n• Pricing reflects roughly a 2-in-3 probability of either two 25-bps cuts or a single 50-bps move\n---\n4/ SPECULATION & TAIL RISK:\n• Traders are betting labor softening forces a faster normalization.\n• However, a single hot CPI shelter print next month could rapidly compress these odds back toward 45%.\n\nIs 68% mispriced?`,
      pubLinkedin: `Institutional Watch: Real-money prediction markets have repriced the probability of at least 50 basis points in Federal Reserve rate reductions before year-end from 54% to 68% over the past 24 hours.\n\nWhen evaluating prediction-market signals alongside traditional OIS curves, separating verified macro inputs from forward-looking order flow is essential:\n\n1. Verified Data Inputs:\n• Core PCE inflation decelerated to 2.6% YoY (Bureau of Economic Analysis).\n• Cumulative two-month payroll revisions reduced prior job gains by 42,000.\n\n2. Implied Probability Signal:\n• Active contract volume of $4.2M shifted consensus pricing by +14 percentage points, signaling that market participants assign a 68% likelihood to ≥50 bps of easing before year-end.\n\n3. Scenario & Risk Assessment:\n• While order flow anticipates a preemptive FOMC response to labor cooling, sticky services inflation remains the primary catalyst capable of invalidating the current consensus.\n\nHow is your desk weighting prediction-market probabilities against Fed funds futures this quarter?`,
      videoUrl: '',
      videoFileName: '',
      workflowStatus: JSON.stringify({
        runwayStatus: 'exported',
        higgsfieldStatus: 'exported',
        elevenlabsStatus: 'synthesized',
        capcutStatus: 'assembled',
        selectedVoiceProfile: 'Marcus — Institutional Baritone (24kHz)',
        aspectRatio: '9:16',
        notes: '30s vertical cut ready for cross-platform review.',
      }),
    },
    presetScenes: [
      {
        sceneNumber: 1,
        durationSeconds: 5,
        sceneDescription: 'Architectural twilight push-in on the Federal Reserve Eccles Building with a translucent 68% probability ticker rising in foreground.',
        visualPrompt: 'Runway Gen-3 Alpha: Slow cinematic low-angle dolly push toward neoclassical marble facade of the Federal Reserve building at blue hour, subtle volumetric mist, crisp financial data HUD reflection, 4k photorealistic.',
        higgsfieldPrompt: 'Higgsfield Cinema: 35mm anamorphic lens, f/2.8, cool slate blue shadows with warm tungsten window glow, authoritative institutional mood.',
        voiceoverText: "Prediction markets just repriced the Fed's next move—pushing the odds of a 50-basis-point rate cut before year-end to 68%.",
        onScreenText: 'FED ≥50BPS CUT ODDS: 54% → 68%',
        transitionRecommendation: 'Hard Cut on Sub-Bass Impact',
        epistemicTag: 'market_probability',
      },
      {
        sceneNumber: 2,
        durationSeconds: 10,
        sceneDescription: 'Clean split-screen institutional terminal displaying official BEA Core PCE 2.6% YoY chart and -42,000 BLS payroll revision ledger.',
        visualPrompt: 'Runway Gen-3 Alpha: Macro camera pan across a dark glass institutional Bloomberg-style terminal screen showing crisp emerald green inflation bar charts descending to 2.6%, shallow depth of field.',
        higgsfieldPrompt: 'Higgsfield Cinema: 50mm macro prime lens, crisp dark UI illumination on brushed aluminum desk, documentary precision.',
        voiceoverText: 'Here are the verified facts: Core PCE inflation just cooled to 2.6% year-over-year, and two-month payroll revisions subtracted 42,000 jobs.',
        onScreenText: 'VERIFIED: CORE PCE 2.6% YoY · PAYROLLS -42K',
        transitionRecommendation: 'Whip Pan Right',
        epistemicTag: 'verified_fact',
      },
      {
        sceneNumber: 3,
        durationSeconds: 9,
        sceneDescription: 'Order-book liquidity surge animation showing $4.2M volume inflow alongside speculative shelter inflation warning indicator.',
        visualPrompt: 'Runway Gen-3 Alpha: Isometric 3D glass order-book depth chart expanding upward with amber and cyan light trails representing $4.2M trading volume in a dark studio space.',
        higgsfieldPrompt: 'Higgsfield Cinema: Isometric architectural camera movement, high-contrast studio rim lighting, sleek dark slate environment.',
        voiceoverText: 'On Gravia, $4.2 million in new volume pushed Yes contracts up 14 points in 24 hours—though a sticky services print next month remains the key tail risk.',
        onScreenText: 'SPECULATION RISK: STICKY SHELTER CPI',
        transitionRecommendation: 'Match Dissolve to Gauge',
        epistemicTag: 'speculation',
      },
      {
        sceneNumber: 4,
        durationSeconds: 6,
        sceneDescription: 'Final high-contrast probability meter locking at 68% YES / 32% NO with Gravia verification watermark.',
        visualPrompt: 'Runway Gen-3 Alpha: Minimalist dark fintech studio backdrop with precision circular dial settling at 68%, subtle lens breathing.',
        higgsfieldPrompt: 'Higgsfield Cinema: Centered symmetrical framing, 85mm portrait lens, clean studio key light.',
        voiceoverText: 'Are traders front-running the FOMC, or is 68% justified? Track the live probability on Gravia.',
        onScreenText: '68% IMPLIED PROBABILITY · WHAT IS YOUR CALL?',
        transitionRecommendation: 'Clean Fade to End Card',
        epistemicTag: 'market_probability',
      },
    ],
  },
  {
    id: 'ai-chip-export-cap',
    title: 'Will the US Department of Commerce enact new HBM3e semiconductor export caps before Q3?',
    category: 'Technology',
    marketProbability: 41,
    description:
      'Resolves YES if the Bureau of Industry and Security (BIS) publishes an interim or final rule in the Federal Register restricting high-bandwidth memory (HBM3e) exports below current compute-density thresholds prior to July 1.',
    latestDevelopments:
      'Semiconductor equipment suppliers testified before the Senate Banking Committee this week. While bipartisan lawmakers urged tighter memory packaging rules, industry disclosures show BIS technical working groups requested a 90-day supply-chain impact review, pulling market odds down from 57% to 41%.',
    sourceLinks:
      'https://www.bis.doc.gov\nhttps://www.federalregister.gov',
    rawArticleText:
      'Following Senate hearings on advanced AI memory packaging, prediction markets on Gravia have trimmed the probability of an immediate Q2/Q3 Bureau of Industry and Security (BIS) rule targeting HBM3e stacks from 57% down to 41%, citing a newly requested 90-day technical consultation period.',
    presetProject: {
      title: 'Will the US Department of Commerce enact new HBM3e semiconductor export caps before Q3?',
      category: 'Technology',
      marketProbability: 41,
      description:
        'Resolves YES if the Bureau of Industry and Security (BIS) publishes an interim or final rule in the Federal Register restricting high-bandwidth memory (HBM3e) exports below current compute-density thresholds prior to July 1.',
      latestDevelopments:
        'Semiconductor equipment suppliers testified before the Senate Banking Committee this week. Industry disclosures show BIS technical working groups requested a 90-day supply-chain impact review, pulling market odds down from 57% to 41%.',
      sourceLinks: 'https://www.bis.doc.gov\nhttps://www.federalregister.gov',
      rawArticleText:
        'Prediction markets on Gravia trimmed the probability of an immediate Q2/Q3 Bureau of Industry and Security (BIS) rule targeting HBM3e stacks from 57% down to 41%.',
      status: 'storyboarded',
      script30s: `[0:00-0:06] VISUAL: Extreme close-up of silicon wafer stepper under amber cleanroom lighting.\nVOICEOVER: Prediction markets just slashed the odds of new US export caps on AI high-bandwidth memory before Q3—dropping from 57% down to 41%.\n\n[0:06-0:16] VISUAL: Federal Register docket graphic and Senate Banking Committee hearing transcript snippet.\nVOICEOVER: Verified fact: No final rule has been published in the Federal Register, and BIS technical groups just initiated a 90-day supply-chain review.\n\n[0:16-0:24] VISUAL: Gravia probability curve sliding from 57% to 41%.\nVOICEOVER: Traders are pricing a 59% likelihood that rulemaking slips into late Q3—though an executive memo could bypass the delay.\n\n[0:24-0:30] VISUAL: Summary card 41% YES / 59% NO.\nVOICEOVER: Will the HBM3e rule land before July 1, or is the delay priced in?`,
      script60s: `[0:00-0:10] HOOK: Why did AI semiconductor regulation odds drop 16 points in 48 hours?\n[0:10-0:25] VERIFIED FACTS: Senate testimony confirmed lawmakers want stricter HBM3e memory controls, but Bureau of Industry and Security working groups requested a 90-day supply-chain consultation.\n[0:25-0:45] MARKET PROBABILITY: Gravia traders repriced pre-July 1 enactment down to 41%, signaling that regulatory bureaucracy makes a Q2 Federal Register publication unlikely.\n[0:45-1:00] SPECULATION & CTA: An emergency interim final rule remains the main upside tail risk. How are you pricing AI supply-chain policy?`,
      hooks: `1. [Data Shock Hook]: "AI chip export restriction odds just dropped 16 points from 57% to 41%—here is why."\n2. [Contrarian Question Hook]: "Headlines say AI chip bans are imminent, so why are prediction markets pricing a 59% chance of delay?"\n3. [Catalyst Alert Hook]: "A 90-day BIS consultation just reshaped the semiconductor regulatory timeline."`,
      narration: `Prediction markets just slashed the odds of new US export caps on HBM3e AI memory before Q3, dropping from 57 percent to 41 percent. Let's look at the facts versus the odds. Verified fact: no rule has been filed in the Federal Register, and technical working groups just requested a 90-day supply-chain review. Market probability: at 41 percent, traders now favor a delay past July 1st, though an emergency interim rule remains the key speculative catalyst.`,
      verifiedFacts: `• No HBM3e interim final rule has been published in the Federal Register to date.\n• Senate Banking Committee held hearings on AI memory export controls this week.\n• BIS working groups requested a 90-day supply-chain impact review.`,
      probabilityAnalysis: `• Current Market Probability: 41% YES / 59% NO (-16% over 48 hours).\n• Market consensus expects procedural review to push publication past the July 1 cutoff.`,
      speculationNotes: `• Upside Risk: National security council directive could fast-track an Interim Final Rule (IFR).\n• Downside Risk: Allied trade negotiations with South Korea and Japan could extend timeline into Q4.`,
      shortCaption: `Headlines warn of immediate AI chip controls, but prediction markets just cut pre-Q3 enactment odds from 57% to 41%.`,
      hashtags: `#Semiconductors #AIChips #PredictionMarkets #TechPolicy #Gravia #HBM3e`,
      callToAction: `Does the rule land before July 1 (41%), or slip to Q3/Q4 (59%)? Share your view.`,
      pubInstagram: `Headlines say imminent AI chip rules—prediction markets say 59% chance of delay past July 1. 🔬\n\n✅ VERIFIED FACTS:\n• Senate hearings concluded this week\n• BIS working groups requested a 90-day supply-chain review\n\n📉 MARKET PROBABILITY:\n• 41% YES / 59% NO on Federal Register publication before Q3\n\n⚠️ SPECULATION:\n• Only an expedited Interim Final Rule would beat the July 1 deadline.\n\n#Semiconductors #AIChips #PredictionMarkets #TechPolicy #Gravia`,
      pubTiktok: `Why AI chip export ban odds dropped from 57% to 41% on Gravia 🔬 Verified 90-day supply chain review vs market odds. #Semiconductors #AITech #PredictionMarkets #Gravia`,
      pubYoutubeTitle: `Why AI Chip Export Rule Odds Dropped to 41%`,
      pubYoutubeDesc: `Gravia prediction markets repriced pre-Q3 HBM3e export restrictions from 57% to 41% after BIS working groups requested a 90-day supply-chain review.`,
      pubXThread: `1/ Headlines suggest imminent HBM3e AI memory export rules.\n\nBut real-money prediction markets just cut the probability of a Federal Register rule before July 1 from 57% → 41%.\n\nHere's why 🧵👇\n---\n2/ VERIFIED FACTS:\n• No rule has entered the Federal Register\n• BIS technical committees requested a 90-day industry impact review\n---\n3/ MARKET PROBABILITY (41%):\n• Traders price a 59% chance that procedural consultation pushes publication into Q3/Q4.`,
      pubLinkedin: `Policy vs. Timeline in Semiconductor Markets: While headlines focus on stricter HBM3e high-bandwidth memory controls, prediction markets on Gravia have repriced pre-July 1 enactment from 57% down to 41% following reports of a 90-day BIS technical consultation period.`,
      videoUrl: '',
      videoFileName: '',
      workflowStatus: JSON.stringify({
        runwayStatus: 'exported',
        higgsfieldStatus: 'pending',
        elevenlabsStatus: 'pending',
        capcutStatus: 'pending',
        selectedVoiceProfile: 'Elena — Crisp Broadcast Analyst (24kHz)',
        aspectRatio: '9:16',
        notes: 'Storyboard locked; ready for Runway scene generation.',
      }),
    },
    presetScenes: [
      {
        sceneNumber: 1,
        durationSeconds: 6,
        sceneDescription: 'Macro shot of silicon wafer lithography stepper under amber cleanroom lighting as probability counter drops to 41%.',
        visualPrompt: 'Runway Gen-3 Alpha: Macro tracking shot inside an ISO-1 semiconductor cleanroom, robotic wafer arm moving beneath amber monochromatic illumination, shallow depth of field.',
        higgsfieldPrompt: 'Higgsfield Cinema: 50mm anamorphic macro lens, warm amber cleanroom light contrasting with cool steel.',
        voiceoverText: 'Prediction markets just slashed the odds of new US export caps on AI high-bandwidth memory before Q3—dropping from 57% down to 41%.',
        onScreenText: 'HBM3E EXPORT RULE ODDS: 57% → 41%',
        transitionRecommendation: 'Hard Cut',
        epistemicTag: 'market_probability',
      },
      {
        sceneNumber: 2,
        durationSeconds: 10,
        sceneDescription: 'Federal Register regulatory timeline graphic showing the 90-day BIS technical consultation window extending past July 1.',
        visualPrompt: 'Runway Gen-3 Alpha: Clean dark architectural timeline animation showing calendar markers from April to July with a glowing 90-day review bracket.',
        higgsfieldPrompt: 'Higgsfield Cinema: Top-down editorial motion graphic lighting, crisp typography focus.',
        voiceoverText: 'Verified fact: No final rule has been published in the Federal Register, and BIS technical groups just initiated a 90-day supply-chain review.',
        onScreenText: 'VERIFIED: 90-DAY BIS TECHNICAL REVIEW',
        transitionRecommendation: 'Smooth Slide Left',
        epistemicTag: 'verified_fact',
      },
      {
        sceneNumber: 3,
        durationSeconds: 14,
        sceneDescription: 'Split comparison of standard rulemaking timeline (59% odds) vs emergency interim final rule tail risk (41% odds).',
        visualPrompt: 'Runway Gen-3 Alpha: Dual-column dark glass data display comparing Q3 procedural delay against expedited executive action.',
        higgsfieldPrompt: 'Higgsfield Cinema: 35mm lens, balanced neutral studio lighting, high-contrast UI legibility.',
        voiceoverText: 'Traders are pricing a 59% likelihood that rulemaking slips into late Q3—though an executive memo could bypass the delay. Will the HBM3e rule land before July 1?',
        onScreenText: '41% PRE-Q3 · 59% DELAYED TO Q3/Q4',
        transitionRecommendation: 'Fade to End Card',
        epistemicTag: 'speculation',
      },
    ],
  },
  {
    id: 'eu-carbon-border-tariff',
    title: 'Will the European Commission approve an exemption extension for green hydrogen imports under CBAM this quarter?',
    category: 'Energy',
    marketProbability: 29,
    description:
      'Resolves YES if the European Commission adopts a delegated act granting a transitional compliance extension for certified green hydrogen and ammonia imports under the Carbon Border Adjustment Mechanism (CBAM) before quarter-end.',
    latestDevelopments:
      'Directorate-General for Taxation and Customs Union (DG TAXUD) published draft implementation notes maintaining strict emissions verification deadlines, keeping market-implied probability of a near-term waiver subdued at 29%.',
    sourceLinks: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en',
    rawArticleText:
      'BRUSSELS — European industrial importers lobbying for a transitional grace period on green hydrogen certification under the EU Carbon Border Adjustment Mechanism (CBAM) face steep odds. Following DG TAXUD draft guidance maintaining strict default emission values, prediction markets price only a 29% probability of an official Commission waiver this quarter.',
  },
];
