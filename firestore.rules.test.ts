import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, updateDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const baseValidProject = (ownerId = 'user_A') => ({
  ownerId,
  title: 'Will the Federal Reserve cut rates by 50bps in Q4?',
  category: 'Macroeconomics',
  description: 'Resolves YES if the FOMC announces a >= 50bps cut.',
  marketProbability: 64,
  latestDevelopments: 'CPI cooled 0.2% below consensus.',
  sourceLinks: 'https://www.federalreserve.gov',
  rawArticleText: 'Full FOMC statement analysis.',
  status: 'draft',
  script30s: '30s script text',
  script60s: '60s script text',
  hooks: 'Hook 1',
  narration: 'Narration text',
  verifiedFacts: 'Fact 1',
  probabilityAnalysis: 'Odds at 64%',
  speculationNotes: 'Market speculating on labor report',
  shortCaption: 'Fed rate cut odds shift',
  hashtags: '#Macro #PredictionMarkets',
  callToAction: 'Follow for daily market briefs',
  pubInstagram: 'IG caption',
  pubTiktok: 'TikTok caption',
  pubYoutubeTitle: 'Fed Rate Cut Odds Explained',
  pubYoutubeDesc: 'YouTube Shorts description',
  pubXThread: '1/ Fed odds just moved to 64%...',
  pubLinkedin: 'Institutional analysis of FOMC pricing...',
  videoUrl: '',
  videoFileName: '',
  workflowStatus: '{}',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

describe('MarketMotion AI Firestore Security Rules — Dirty Dozen TDD', () => {
  beforeAll(async () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-marketmotion-security',
      firestore: { rules },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    if (testEnv) await testEnv.clearFirestore();
  });

  it('1. Rejects Identity Spoofing on Project Create', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(userA, 'projects/proj_1'), baseValidProject('user_B')));
  });

  it('2. Rejects Unverified Email Write', async () => {
    const unverified = testEnv.authenticatedContext('user_A', { email_verified: false }).firestore();
    await assertFails(setDoc(doc(unverified, 'projects/proj_1'), baseValidProject('user_A')));
  });

  it('3. Rejects Shadow Field Injection on Create', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertFails(
      setDoc(doc(userA, 'projects/proj_1'), {
        ...baseValidProject('user_A'),
        isAdmin: true,
      })
    );
  });

  it('4. Rejects Shadow Field Injection on Update', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(userA, 'projects/proj_1'), baseValidProject('user_A')));
    await assertFails(
      updateDoc(doc(userA, 'projects/proj_1'), {
        title: 'Updated Title',
        hackedField: 'injected',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('5. Rejects Owner Hijack on Update', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(userA, 'projects/proj_1'), baseValidProject('user_A')));
    await assertFails(
      updateDoc(doc(userA, 'projects/proj_1'), {
        ownerId: 'user_B',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('6. Rejects Immortal Field (createdAt) Mutation on Update', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(userA, 'projects/proj_1'), baseValidProject('user_A')));
    await assertFails(
      updateDoc(doc(userA, 'projects/proj_1'), {
        createdAt: new Date(0),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('7. Rejects Forged Client Timestamp', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertFails(
      setDoc(doc(userA, 'projects/proj_1'), {
        ...baseValidProject('user_A'),
        createdAt: new Date('2020-01-01T00:00:00Z'),
      })
    );
  });

  it('8. Rejects Denial-of-Wallet String Overflow', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertFails(
      setDoc(doc(userA, 'projects/proj_1'), {
        ...baseValidProject('user_A'),
        title: 'A'.repeat(250),
      })
    );
  });

  it('9. Rejects Terminal State Bypass on Archived Project', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertSucceeds(
      setDoc(doc(userA, 'projects/proj_1'), {
        ...baseValidProject('user_A'),
        status: 'archived',
      })
    );
    await assertFails(
      updateDoc(doc(userA, 'projects/proj_1'), {
        title: 'Try to edit archived project',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('10. Rejects Orphaned Subcollection Scene Create', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    await assertFails(
      setDoc(doc(userA, 'projects/missing_proj/scenes/scene_1'), {
        projectId: 'missing_proj',
        ownerId: 'user_A',
        sceneNumber: 1,
        durationSeconds: 6,
        sceneDescription: 'Opening visual',
        visualPrompt: 'Runway prompt',
        higgsfieldPrompt: 'Higgsfield prompt',
        voiceoverText: 'Voiceover text',
        onScreenText: '64% PROBABILITY',
        transitionRecommendation: 'Whip pan',
        epistemicTag: 'market_probability',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('11. Rejects Cross-Tenant Subcollection Scene Write', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    const userB = testEnv.authenticatedContext('user_B', { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(userA, 'projects/proj_A'), baseValidProject('user_A')));
    await assertFails(
      setDoc(doc(userB, 'projects/proj_A/scenes/scene_1'), {
        projectId: 'proj_A',
        ownerId: 'user_B',
        sceneNumber: 1,
        durationSeconds: 6,
        sceneDescription: 'Opening visual',
        visualPrompt: 'Runway prompt',
        higgsfieldPrompt: 'Higgsfield prompt',
        voiceoverText: 'Voiceover text',
        onScreenText: '64% PROBABILITY',
        transitionRecommendation: 'Whip pan',
        epistemicTag: 'market_probability',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('12. Rejects Unauthorized Unfiltered List Query Scraping', async () => {
    const userA = testEnv.authenticatedContext('user_A', { email_verified: true }).firestore();
    const userB = testEnv.authenticatedContext('user_B', { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(userA, 'projects/proj_A'), baseValidProject('user_A')));
    await assertFails(getDocs(collection(userB, 'projects')));
  });
});
