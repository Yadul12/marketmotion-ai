export type ProjectStatus =
  | 'draft'
  | 'scripted'
  | 'storyboarded'
  | 'production'
  | 'ready'
  | 'published'
  | 'archived';

export type EpistemicTag = 'verified_fact' | 'market_probability' | 'speculation';

export interface WorkflowState {
  runwayStatus: 'pending' | 'exported' | 'rendered';
  higgsfieldStatus: 'pending' | 'exported' | 'rendered';
  elevenlabsStatus: 'pending' | 'exported' | 'synthesized';
  capcutStatus: 'pending' | 'exported' | 'assembled';
  selectedVoiceProfile?: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  notes?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string;
  marketProbability: number;
  latestDevelopments: string;
  sourceLinks: string;
  rawArticleText: string;
  status: ProjectStatus;
  script30s: string;
  script60s: string;
  hooks: string;
  narration: string;
  verifiedFacts: string;
  probabilityAnalysis: string;
  speculationNotes: string;
  shortCaption: string;
  hashtags: string;
  callToAction: string;
  pubInstagram: string;
  pubTiktok: string;
  pubYoutubeTitle: string;
  pubYoutubeDesc: string;
  pubXThread: string;
  pubLinkedin: string;
  videoUrl: string;
  videoFileName: string;
  workflowStatus: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Scene {
  id: string;
  projectId: string;
  ownerId: string;
  sceneNumber: number;
  durationSeconds: number;
  sceneDescription: string;
  visualPrompt: string;
  higgsfieldPrompt: string;
  voiceoverText: string;
  onScreenText: string;
  transitionRecommendation: string;
  epistemicTag: EpistemicTag;
  createdAt?: any;
  updatedAt?: any;
}

export type StudioView =
  | 'dashboard'
  | 'event_input'
  | 'script_lab'
  | 'storyboard'
  | 'workflow'
  | 'publishing';
