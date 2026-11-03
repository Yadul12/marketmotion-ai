import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, Scene, EpistemicTag, ProjectStatus } from '../types/studio';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

// Defensive validation & truncation helpers strictly matching firebase-blueprint.json & firestore.rules
function clampStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string' ? val : fallback;
  return s.slice(0, maxLen);
}

function clampNonEmptyStr(val: string | undefined | null, maxLen: number, fallback: string): string {
  const s = typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;
  return s.slice(0, maxLen);
}

function sanitizeStatus(status: string | undefined): ProjectStatus {
  const allowed: ProjectStatus[] = [
    'draft',
    'scripted',
    'storyboarded',
    'production',
    'ready',
    'published',
    'archived',
  ];
  return allowed.includes(status as ProjectStatus) ? (status as ProjectStatus) : 'draft';
}

function sanitizeEpistemicTag(tag: string | undefined): EpistemicTag {
  const allowed: EpistemicTag[] = ['verified_fact', 'market_probability', 'speculation'];
  return allowed.includes(tag as EpistemicTag) ? (tag as EpistemicTag) : 'market_probability';
}

export function makeSafeId(prefix = 'proj'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function subscribeUserProjects(
  ownerId: string,
  onData: (projects: Project[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'projects';
  const q = query(collection(db, path), where('ownerId', '==', ownerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Project, 'id'>),
      }));
      items.sort((a, b) => {
        const tA = a.updatedAt?.toMillis?.() ?? 0;
        const tB = b.updatedAt?.toMillis?.() ?? 0;
        return tB - tA;
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeProjectScenes(
  projectId: string,
  ownerId: string,
  onData: (scenes: Scene[]) => void
) {
  const path = `projects/${projectId}/scenes`;
  const q = query(collection(db, path), where('ownerId', '==', ownerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Scene[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Scene, 'id'>),
      }));
      items.sort((a, b) => a.sceneNumber - b.sceneNumber);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createProject(
  ownerId: string,
  input: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>,
  customId?: string
): Promise<string> {
  const projectId = customId || makeSafeId('proj');
  const path = `projects/${projectId}`;

  const prob = Number.isFinite(Number(input.marketProbability))
    ? Math.max(0, Math.min(100, Math.round(Number(input.marketProbability))))
    : 50;

  const payload = {
    ownerId,
    title: clampNonEmptyStr(input.title, 200, 'Untitled Prediction Market Event'),
    category: clampNonEmptyStr(input.category, 60, 'Macroeconomics'),
    description: clampNonEmptyStr(
      input.description,
      4000,
      'Binary prediction market contract resolution details.'
    ),
    marketProbability: prob,
    latestDevelopments: clampStr(input.latestDevelopments, 4000),
    sourceLinks: clampStr(input.sourceLinks, 2000),
    rawArticleText: clampStr(input.rawArticleText, 8000),
    status: sanitizeStatus(input.status),
    script30s: clampStr(input.script30s, 5000),
    script60s: clampStr(input.script60s, 8000),
    hooks: clampStr(input.hooks, 3000),
    narration: clampStr(input.narration, 6000),
    verifiedFacts: clampStr(input.verifiedFacts, 4000),
    probabilityAnalysis: clampStr(input.probabilityAnalysis, 4000),
    speculationNotes: clampStr(input.speculationNotes, 4000),
    shortCaption: clampStr(input.shortCaption, 2000),
    hashtags: clampStr(input.hashtags, 1000),
    callToAction: clampStr(input.callToAction, 1000),
    pubInstagram: clampStr(input.pubInstagram, 3000),
    pubTiktok: clampStr(input.pubTiktok, 3000),
    pubYoutubeTitle: clampStr(input.pubYoutubeTitle, 300),
    pubYoutubeDesc: clampStr(input.pubYoutubeDesc, 4000),
    pubXThread: clampStr(input.pubXThread, 4000),
    pubLinkedin: clampStr(input.pubLinkedin, 4000),
    videoUrl: clampStr(input.videoUrl, 1000),
    videoFileName: clampStr(input.videoFileName, 255),
    workflowStatus: clampStr(
      input.workflowStatus,
      2000,
      JSON.stringify({
        runwayStatus: 'pending',
        higgsfieldStatus: 'pending',
        elevenlabsStatus: 'pending',
        capcutStatus: 'pending',
        selectedVoiceProfile: 'Marcus — Institutional Baritone (24kHz)',
        aspectRatio: '9:16',
        notes: '',
      })
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'projects', projectId), payload);
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const path = `projects/${projectId}`;
  const cleanUpdates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) cleanUpdates.title = clampNonEmptyStr(updates.title, 200, 'Untitled Market');
  if (updates.category !== undefined) cleanUpdates.category = clampNonEmptyStr(updates.category, 60, 'Macroeconomics');
  if (updates.description !== undefined)
    cleanUpdates.description = clampNonEmptyStr(updates.description, 4000, 'Market description');
  if (updates.marketProbability !== undefined) {
    cleanUpdates.marketProbability = Math.max(0, Math.min(100, Math.round(Number(updates.marketProbability) || 0)));
  }
  if (updates.latestDevelopments !== undefined)
    cleanUpdates.latestDevelopments = clampStr(updates.latestDevelopments, 4000);
  if (updates.sourceLinks !== undefined) cleanUpdates.sourceLinks = clampStr(updates.sourceLinks, 2000);
  if (updates.rawArticleText !== undefined) cleanUpdates.rawArticleText = clampStr(updates.rawArticleText, 8000);
  if (updates.status !== undefined) cleanUpdates.status = sanitizeStatus(updates.status);
  if (updates.script30s !== undefined) cleanUpdates.script30s = clampStr(updates.script30s, 5000);
  if (updates.script60s !== undefined) cleanUpdates.script60s = clampStr(updates.script60s, 8000);
  if (updates.hooks !== undefined) cleanUpdates.hooks = clampStr(updates.hooks, 3000);
  if (updates.narration !== undefined) cleanUpdates.narration = clampStr(updates.narration, 6000);
  if (updates.verifiedFacts !== undefined) cleanUpdates.verifiedFacts = clampStr(updates.verifiedFacts, 4000);
  if (updates.probabilityAnalysis !== undefined)
    cleanUpdates.probabilityAnalysis = clampStr(updates.probabilityAnalysis, 4000);
  if (updates.speculationNotes !== undefined)
    cleanUpdates.speculationNotes = clampStr(updates.speculationNotes, 4000);
  if (updates.shortCaption !== undefined) cleanUpdates.shortCaption = clampStr(updates.shortCaption, 2000);
  if (updates.hashtags !== undefined) cleanUpdates.hashtags = clampStr(updates.hashtags, 1000);
  if (updates.callToAction !== undefined) cleanUpdates.callToAction = clampStr(updates.callToAction, 1000);
  if (updates.pubInstagram !== undefined) cleanUpdates.pubInstagram = clampStr(updates.pubInstagram, 3000);
  if (updates.pubTiktok !== undefined) cleanUpdates.pubTiktok = clampStr(updates.pubTiktok, 3000);
  if (updates.pubYoutubeTitle !== undefined) cleanUpdates.pubYoutubeTitle = clampStr(updates.pubYoutubeTitle, 300);
  if (updates.pubYoutubeDesc !== undefined) cleanUpdates.pubYoutubeDesc = clampStr(updates.pubYoutubeDesc, 4000);
  if (updates.pubXThread !== undefined) cleanUpdates.pubXThread = clampStr(updates.pubXThread, 4000);
  if (updates.pubLinkedin !== undefined) cleanUpdates.pubLinkedin = clampStr(updates.pubLinkedin, 4000);
  if (updates.videoUrl !== undefined) cleanUpdates.videoUrl = clampStr(updates.videoUrl, 1000);
  if (updates.videoFileName !== undefined) cleanUpdates.videoFileName = clampStr(updates.videoFileName, 255);
  if (updates.workflowStatus !== undefined) cleanUpdates.workflowStatus = clampStr(updates.workflowStatus, 2000);

  try {
    await updateDoc(doc(db, 'projects', projectId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProjectWithScenes(projectId: string, ownerId: string): Promise<void> {
  const scenesPath = `projects/${projectId}/scenes`;
  try {
    const q = query(collection(db, scenesPath), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    for (const sceneDoc of snap.docs) {
      await deleteDoc(doc(db, scenesPath, sceneDoc.id));
    }
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function saveScene(
  projectId: string,
  ownerId: string,
  sceneInput: Omit<Scene, 'id' | 'projectId' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingSceneId?: string
): Promise<string> {
  const sceneId = existingSceneId || makeSafeId('scene');
  const path = `projects/${projectId}/scenes/${sceneId}`;

  const sceneNumber = Math.max(1, Math.min(50, Math.round(Number(sceneInput.sceneNumber) || 1)));
  const durationSeconds = Math.max(1, Math.min(120, Math.round(Number(sceneInput.durationSeconds) || 5)));

  if (existingSceneId) {
    const updatePayload = {
      sceneNumber,
      durationSeconds,
      sceneDescription: clampNonEmptyStr(sceneInput.sceneDescription, 2000, 'Scene description'),
      visualPrompt: clampNonEmptyStr(sceneInput.visualPrompt, 2000, 'Runway camera prompt'),
      higgsfieldPrompt: clampStr(sceneInput.higgsfieldPrompt, 2000),
      voiceoverText: clampNonEmptyStr(sceneInput.voiceoverText, 2000, 'Voiceover narration'),
      onScreenText: clampStr(sceneInput.onScreenText, 500),
      transitionRecommendation: clampNonEmptyStr(sceneInput.transitionRecommendation, 300, 'Hard Cut'),
      epistemicTag: sanitizeEpistemicTag(sceneInput.epistemicTag),
      updatedAt: serverTimestamp(),
    };
    try {
      await updateDoc(doc(db, `projects/${projectId}/scenes`, sceneId), updatePayload);
      return sceneId;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const createPayload = {
      projectId,
      ownerId,
      sceneNumber,
      durationSeconds,
      sceneDescription: clampNonEmptyStr(sceneInput.sceneDescription, 2000, 'Scene description'),
      visualPrompt: clampNonEmptyStr(sceneInput.visualPrompt, 2000, 'Runway camera prompt'),
      higgsfieldPrompt: clampStr(sceneInput.higgsfieldPrompt, 2000),
      voiceoverText: clampNonEmptyStr(sceneInput.voiceoverText, 2000, 'Voiceover narration'),
      onScreenText: clampStr(sceneInput.onScreenText, 500),
      transitionRecommendation: clampNonEmptyStr(sceneInput.transitionRecommendation, 300, 'Hard Cut'),
      epistemicTag: sanitizeEpistemicTag(sceneInput.epistemicTag),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, `projects/${projectId}/scenes`, sceneId), createPayload);
      return sceneId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function replaceAllProjectScenes(
  projectId: string,
  ownerId: string,
  newScenes: Omit<Scene, 'id' | 'projectId' | 'ownerId' | 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  const scenesPath = `projects/${projectId}/scenes`;
  try {
    const q = query(collection(db, scenesPath), where('ownerId', '==', ownerId));
    const existingSnap = await getDocs(q);
    for (const d of existingSnap.docs) {
      await deleteDoc(doc(db, scenesPath, d.id));
    }
    for (let i = 0; i < newScenes.length; i++) {
      const s = newScenes[i];
      await saveScene(projectId, ownerId, {
        ...s,
        sceneNumber: i + 1,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, scenesPath);
  }
}

export async function deleteScene(projectId: string, sceneId: string): Promise<void> {
  const path = `projects/${projectId}/scenes/${sceneId}`;
  try {
    await deleteDoc(doc(db, `projects/${projectId}/scenes`, sceneId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedSamplePortfolio(ownerId: string): Promise<string | null> {
  let firstCreatedId: string | null = null;
  for (const sample of SAMPLE_EVENTS) {
    if (sample.presetProject) {
      const projId = await createProject(ownerId, sample.presetProject);
      if (!firstCreatedId) firstCreatedId = projId;
      if (sample.presetScenes && sample.presetScenes.length > 0) {
        await replaceAllProjectScenes(projId, ownerId, sample.presetScenes);
      }
    }
  }
  return firstCreatedId;
}
