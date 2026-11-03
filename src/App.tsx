import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { Project, Scene, StudioView } from './types/studio';
import {
  subscribeUserProjects,
  subscribeProjectScenes,
  createProject,
  updateProject,
  deleteProjectWithScenes,
  saveScene,
  replaceAllProjectScenes,
  deleteScene,
  seedSamplePortfolio,
} from './services/projectService';
import { DashboardView } from './components/DashboardView';
import { EventInputView } from './components/EventInputView';
import { ScriptLabView } from './components/ScriptLabView';
import { StoryboardView } from './components/StoryboardView';
import { CreativeWorkflowView } from './components/CreativeWorkflowView';
import { PublishingPrepView } from './components/PublishingPrepView';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Film,
  Layers,
  Share2,
  LogOut,
  TrendingUp,
  AlertCircle,
  LogIn,
} from 'lucide-react';

const VIEW_LABELS: Record<StudioView, string> = {
  dashboard: 'Production Overview',
  event_input: 'Event Input & Parser',
  script_lab: 'AI Script Lab',
  storyboard: 'Storyboard Studio',
  workflow: 'Creative Workflow & Video',
  publishing: 'Publishing Packages',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentView, setCurrentView] = useState<StudioView>('dashboard');

  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [isGeneratingPublishing, setIsGeneratingPublishing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [globalBannerError, setGlobalBannerError] = useState<string | null>(null);

  const autoSeededRef = useRef(false);

  // 1. Track Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to User's Prediction Market Projects in Firestore
  useEffect(() => {
    if (!authReady || !user) {
      setProjects([]);
      setProjectsLoaded(false);
      return;
    }

    const unsub = subscribeUserProjects(
      user.uid,
      async (items) => {
        setProjects(items);
        setProjectsLoaded(true);

        if (items.length > 0 && !activeProjectId) {
          setActiveProjectId(items[0].id);
        }

        // Auto-seed sample prediction markets once if the user's studio is completely empty
        if (items.length === 0 && !autoSeededRef.current) {
          autoSeededRef.current = true;
          setIsSeeding(true);
          try {
            const firstId = await seedSamplePortfolio(user.uid);
            if (firstId) setActiveProjectId(firstId);
          } catch (err: any) {
            console.error('Initial sample seed error:', err);
          } finally {
            setIsSeeding(false);
          }
        }
      },
      (err) => {
        setGlobalBannerError(err.message);
      }
    );

    return () => unsub();
  }, [authReady, user?.uid]);

  // 3. Subscribe to Active Project's Scenes Subcollection
  useEffect(() => {
    if (!authReady || !user || !activeProjectId) {
      setScenes([]);
      return;
    }
    const unsub = subscribeProjectScenes(activeProjectId, user.uid, (sceneItems) => {
      setScenes(sceneItems);
    });
    return () => unsub();
  }, [authReady, user?.uid, activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setAuthError(err?.message || 'Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveProjectId(null);
    setCurrentView('dashboard');
  };

  const handleSeedSamples = async () => {
    if (!user) return;
    setIsSeeding(true);
    setGlobalBannerError(null);
    try {
      const firstId = await seedSamplePortfolio(user.uid);
      if (firstId) setActiveProjectId(firstId);
    } catch (err: any) {
      setGlobalBannerError(err?.message || 'Failed to seed sample markets.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateNewClick = () => {
    setActiveProjectId(null);
    setCurrentView('event_input');
  };

  const handleSelectProject = (id: string, targetView: StudioView = 'script_lab') => {
    setActiveProjectId(id);
    setCurrentView(targetView);
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    await deleteProjectWithScenes(id, user.uid);
    if (activeProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setActiveProjectId(remaining[0]?.id || null);
    }
  };

  // Generate AI Scripts helper
  const runScriptGenerationForProject = async (
    projectId: string,
    eventPayload: {
      title: string;
      category: string;
      description: string;
      marketProbability: number;
      latestDevelopments: string;
      sourceLinks: string;
      rawArticleText: string;
    }
  ) => {
    setIsGeneratingScripts(true);
    setGlobalBannerError(null);
    try {
      const res = await fetch('/api/ai/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Script generation failed.');
      }

      await updateProject(projectId, {
        script30s: data.script30s || '',
        script60s: data.script60s || '',
        hooks: data.hooks || '',
        narration: data.narration || '',
        verifiedFacts: data.verifiedFacts || '',
        probabilityAnalysis: data.probabilityAnalysis || '',
        speculationNotes: data.speculationNotes || '',
        shortCaption: data.shortCaption || '',
        hashtags: data.hashtags || '',
        callToAction: data.callToAction || '',
        status: 'scripted',
      });
    } catch (err: any) {
      setGlobalBannerError(err.message || 'AI Script generation encountered an error.');
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  const handleSaveEvent = async (
    eventData: {
      title: string;
      category: string;
      description: string;
      marketProbability: number;
      latestDevelopments: string;
      sourceLinks: string;
      rawArticleText: string;
    },
    andGenerateScripts: boolean
  ) => {
    if (!user) return;
    setIsSavingEvent(true);
    setGlobalBannerError(null);
    try {
      let targetId = activeProjectId;
      if (targetId && activeProject) {
        await updateProject(targetId, eventData);
      } else {
        targetId = await createProject(user.uid, {
          ...eventData,
          status: 'draft',
        });
        setActiveProjectId(targetId);
      }

      if (andGenerateScripts && targetId) {
        setIsSavingEvent(false);
        await runScriptGenerationForProject(targetId, eventData);
        setCurrentView('script_lab');
      }
    } catch (err: any) {
      setGlobalBannerError(err.message || 'Failed to save prediction market event.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleGenerateStoryboard = async (targetDuration: 30 | 60) => {
    if (!user || !activeProject) return;
    setIsGeneratingStoryboard(true);
    setGlobalBannerError(null);
    try {
      const scriptText =
        targetDuration === 30
          ? activeProject.script30s || activeProject.script60s || activeProject.description
          : activeProject.script60s || activeProject.script30s || activeProject.description;

      const res = await fetch('/api/ai/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProject.title,
          marketProbability: activeProject.marketProbability,
          scriptText,
          targetDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Storyboard generation failed.');
      }

      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        await replaceAllProjectScenes(activeProject.id, user.uid, data.scenes);
        await updateProject(activeProject.id, { status: 'storyboarded' });
        setCurrentView('storyboard');
      }
    } catch (err: any) {
      setGlobalBannerError(err.message || 'Failed to generate storyboard scenes.');
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleGeneratePublishing = async () => {
    if (!activeProject) return;
    setIsGeneratingPublishing(true);
    setGlobalBannerError(null);
    try {
      const res = await fetch('/api/ai/generate-publishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProject.title,
          category: activeProject.category,
          marketProbability: activeProject.marketProbability,
          description: activeProject.description,
          verifiedFacts: activeProject.verifiedFacts,
          probabilityAnalysis: activeProject.probabilityAnalysis,
          speculationNotes: activeProject.speculationNotes,
          script30s: activeProject.script30s,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate social publishing packages.');
      }

      await updateProject(activeProject.id, {
        pubInstagram: data.pubInstagram || '',
        pubTiktok: data.pubTiktok || '',
        pubYoutubeTitle: data.pubYoutubeTitle || '',
        pubYoutubeDesc: data.pubYoutubeDesc || '',
        pubXThread: data.pubXThread || '',
        pubLinkedin: data.pubLinkedin || '',
      });
    } catch (err: any) {
      setGlobalBannerError(err.message || 'Failed to generate publishing copy.');
    } finally {
      setIsGeneratingPublishing(false);
    }
  };

  // Loading state while Firebase Auth initializes
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold font-display tracking-tight text-slate-200">
            MarketMotion AI
          </div>
          <div className="text-xs text-slate-500">Initializing Prediction Market Studio...</div>
        </div>
      </div>
    );
  }

  // Signed-Out Institutional Authentication Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
        {/* Top Bar Contract */}
        <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
          >
            MarketMotion AI
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#workflow" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Script Lab
            </a>
            <a href="#workflow" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Storyboard Engine
            </a>
            <a href="#workflow" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Creative Integrations
            </a>
            <a href="#workflow" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Epistemic Standards
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        </header>

        {/* Main Hero Split */}
        <main className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs text-sky-400 font-medium">
              Prediction Market Intelligence · Short-Form Video Content Studio
            </p>
            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-100 font-display leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Transform complex market probabilities into institutional-grade video briefings.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
              Built for prediction-market desks like Gravia. Ingest live contract probabilities and verified news catalysts to generate 30s/60s scripts, scene-by-scene Runway and Higgsfield storyboards, ElevenLabs voiceover scripts, and compliant multi-platform social packages.
            </p>

            {authError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/70 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleSignIn}
                className="px-6 py-3 text-sm font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Launch Content Studio</span>
              </button>
              <span className="text-xs text-slate-400">
                Includes pre-loaded FOMC & Semiconductor prediction market sample projects
              </span>
            </div>
          </div>

          <div
            id="workflow"
            className="lg:col-span-5 p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-medium text-slate-300">
                Live Contract Preview · Macroeconomics
              </span>
              <span className="text-xs font-mono tabular-nums text-sky-400 font-semibold">
                68% IMPLIED YES
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Will the Federal Reserve cut benchmark interest rates by ≥50 bps before year-end?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Core PCE inflation decelerated to 2.6% YoY while two-month payroll revisions subtracted 42,000 jobs.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400">Verified Facts</span>
                <span className="text-slate-300 font-mono">BEA Core PCE 2.6% YoY · BLS -42K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sky-400">Market Probability</span>
                <span className="text-slate-300 font-mono">68% YES (+14 pts / $4.2M Vol)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400">Speculative Risk</span>
                <span className="text-slate-300 font-mono">Next Month Shelter CPI Print</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
          <span>MarketMotion AI — Prediction Market Content Studio</span>
          <span>X · Instagram Reels · TikTok · YouTube Shorts · LinkedIn</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex">
      {/* Left Sidebar Navigation (260px) */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div className="p-5 space-y-6">
          {/* Brand Title */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-base font-bold tracking-tight text-slate-100 font-display flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>MarketMotion AI</span>
            </button>
          </div>

          {/* Active Project Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Market Contract</span>
              <button
                onClick={handleCreateNewClick}
                className="text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                + New
              </button>
            </div>
            <select
              value={activeProjectId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setActiveProjectId(val);
              }}
              className="w-full px-2.5 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {projects.length === 0 ? (
                <option value="">No active projects</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.marketProbability}%] {p.title.slice(0, 38)}...
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Studio Pipeline Navigation */}
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Overview Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('event_input')}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'event_input'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FilePlus2 className="w-4 h-4 text-sky-400" />
              <span>01. Event Input & Parser</span>
            </button>

            <button
              onClick={() => setCurrentView('script_lab')}
              disabled={!activeProject}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
                currentView === 'script_lab'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>02. AI Script Lab</span>
            </button>

            <button
              onClick={() => setCurrentView('storyboard')}
              disabled={!activeProject}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
                currentView === 'storyboard'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Film className="w-4 h-4 text-sky-400" />
              <span>03. Storyboard Studio</span>
            </button>

            <button
              onClick={() => setCurrentView('workflow')}
              disabled={!activeProject}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
                currentView === 'workflow'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>04. Creative Workflow</span>
            </button>

            <button
              onClick={() => setCurrentView('publishing')}
              disabled={!activeProject}
              className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
                currentView === 'publishing'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>05. Publishing Prep</span>
            </button>
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {user.displayName || 'Studio Producer'}
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* SaaS Top Header with Contextual Breadcrumbs */}
        <header className="h-14 px-8 border-b border-slate-800/80 bg-[#0B0F17] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <span
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-slate-200 cursor-pointer whitespace-nowrap"
            >
              Workspace
            </span>
            <span>/</span>
            <span className="text-slate-200 font-medium whitespace-nowrap">
              {VIEW_LABELS[currentView]}
            </span>
            {activeProject && currentView !== 'dashboard' && (
              <>
                <span>/</span>
                <span className="text-slate-400 truncate max-w-xs">
                  {activeProject.title}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateNewClick}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-md hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              + New Market Event
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {globalBannerError && (
            <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/70 rounded-lg flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{globalBannerError}</span>
              </div>
              <button
                onClick={() => setGlobalBannerError(null)}
                className="text-rose-300 hover:text-white underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {!projectsLoaded ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-slate-900 rounded animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 bg-slate-900 rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="h-64 bg-slate-900 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  projects={projects}
                  activeProjectId={activeProjectId}
                  onSelectProject={handleSelectProject}
                  onCreateNew={handleCreateNewClick}
                  onDeleteProject={handleDeleteProject}
                  onSeedSamplePortfolio={handleSeedSamples}
                  isSeeding={isSeeding}
                />
              )}

              {currentView === 'event_input' && (
                <EventInputView
                  activeProject={activeProject}
                  onSaveEvent={handleSaveEvent}
                  isSaving={isSavingEvent}
                  isGeneratingScripts={isGeneratingScripts}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'script_lab' && activeProject && (
                <ScriptLabView
                  project={activeProject}
                  onUpdateProject={(updates) => updateProject(activeProject.id, updates)}
                  onRegenerateScripts={() =>
                    runScriptGenerationForProject(activeProject.id, {
                      title: activeProject.title,
                      category: activeProject.category,
                      description: activeProject.description,
                      marketProbability: activeProject.marketProbability,
                      latestDevelopments: activeProject.latestDevelopments,
                      sourceLinks: activeProject.sourceLinks,
                      rawArticleText: activeProject.rawArticleText,
                    })
                  }
                  onGenerateStoryboard={handleGenerateStoryboard}
                  isGeneratingScripts={isGeneratingScripts}
                  isGeneratingStoryboard={isGeneratingStoryboard}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'storyboard' && activeProject && (
                <StoryboardView
                  project={activeProject}
                  scenes={scenes}
                  onGenerateStoryboard={handleGenerateStoryboard}
                  onSaveScene={async (sceneInput, existingId) => {
                    await saveScene(activeProject.id, user.uid, sceneInput, existingId);
                  }}
                  onDeleteScene={async (sceneId) => {
                    await deleteScene(activeProject.id, sceneId);
                  }}
                  isGeneratingStoryboard={isGeneratingStoryboard}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'workflow' && activeProject && (
                <CreativeWorkflowView
                  project={activeProject}
                  scenes={scenes}
                  onUpdateProject={(updates) => updateProject(activeProject.id, updates)}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'publishing' && activeProject && (
                <PublishingPrepView
                  project={activeProject}
                  onUpdateProject={(updates) => updateProject(activeProject.id, updates)}
                  onGeneratePublishing={handleGeneratePublishing}
                  isGeneratingPublishing={isGeneratingPublishing}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
