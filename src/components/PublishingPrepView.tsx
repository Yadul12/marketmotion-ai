import React, { useState, useEffect } from 'react';
import { Project } from '../types/studio';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Save,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PublishingPrepViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onGeneratePublishing: () => Promise<void>;
  isGeneratingPublishing: boolean;
}

export const PublishingPrepView: React.FC<PublishingPrepViewProps> = ({
  project,
  onUpdateProject,
  onGeneratePublishing,
  isGeneratingPublishing,
}) => {
  const [pubXThread, setPubXThread] = useState(project.pubXThread);
  const [pubInstagram, setPubInstagram] = useState(project.pubInstagram);
  const [pubTiktok, setPubTiktok] = useState(project.pubTiktok);
  const [pubYoutubeTitle, setPubYoutubeTitle] = useState(project.pubYoutubeTitle);
  const [pubYoutubeDesc, setPubYoutubeDesc] = useState(project.pubYoutubeDesc);
  const [pubLinkedin, setPubLinkedin] = useState(project.pubLinkedin);

  const [complianceChecked, setComplianceChecked] = useState(project.status === 'published');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setPubXThread(project.pubXThread);
    setPubInstagram(project.pubInstagram);
    setPubTiktok(project.pubTiktok);
    setPubYoutubeTitle(project.pubYoutubeTitle);
    setPubYoutubeDesc(project.pubYoutubeDesc);
    setPubLinkedin(project.pubLinkedin);
    setComplianceChecked(project.status === 'published');
  }, [
    project.id,
    project.pubXThread,
    project.pubInstagram,
    project.pubTiktok,
    project.pubYoutubeTitle,
    project.pubYoutubeDesc,
    project.pubLinkedin,
    project.status,
  ]);

  const handleCopy = (platform: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 1800);
  };

  const handleSavePackages = async (markPublished = false) => {
    setIsSaving(true);
    setSavedNotice(false);
    try {
      await onUpdateProject({
        pubXThread,
        pubInstagram,
        pubTiktok,
        pubYoutubeTitle,
        pubYoutubeDesc,
        pubLinkedin,
        status: markPublished ? 'published' : project.status,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAllPackages = () => {
    const bundle = {
      eventTitle: project.title,
      category: project.category,
      marketProbability: `${project.marketProbability}%`,
      approvalStatus: project.status === 'published' ? 'Approved for Release' : 'Draft Pending Approval',
      platforms: {
        xTwitterThread: pubXThread,
        instagramReelsCaption: pubInstagram,
        tiktokCaption: pubTiktok,
        youtubeShorts: {
          title: pubYoutubeTitle,
          description: pubYoutubeDesc,
        },
        linkedinPost: pubLinkedin,
      },
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.slice(0, 28).replace(/[^a-zA-Z0-9]+/g, '_')}_publishing_bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Step 05 · Multi-Platform Distribution & Editorial Approval Gate
          </p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 font-display line-clamp-1">
            Publishing Packages — {project.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportAllPackages}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bundle (.json)</span>
          </button>

          <button
            onClick={onGeneratePublishing}
            disabled={isGeneratingPublishing}
            className="px-3.5 py-2 text-xs font-medium text-sky-300 bg-sky-950/50 border border-sky-800/70 rounded-lg hover:bg-sky-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isGeneratingPublishing
                ? 'Generating 5-Platform Copy...'
                : 'Generate Platform Packages with AI'}
            </span>
          </button>

          <button
            onClick={() => handleSavePackages(false)}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-slate-100 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? 'Saved' : isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. X (Twitter) Post / Thread */}
        <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                X (Twitter) Analytical Thread
              </h3>
              <p className="text-xs text-slate-400">
                Multi-post thread separating verified facts from {project.marketProbability}% market odds
              </p>
            </div>
            <button
              onClick={() => handleCopy('x', pubXThread)}
              className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 cursor-pointer"
            >
              {copiedPlatform === 'x' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlatform === 'x' ? 'Copied' : 'Copy Thread'}</span>
            </button>
          </div>
          <textarea
            rows={9}
            value={pubXThread}
            onChange={(e) => setPubXThread(e.target.value)}
            placeholder="Generate or write X thread..."
            className="w-full p-3 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* 2. LinkedIn Institutional Post */}
        <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                LinkedIn Executive Commentary
              </h3>
              <p className="text-xs text-slate-400">
                Institutional breakdown for macro, policy, and research audiences
              </p>
            </div>
            <button
              onClick={() => handleCopy('linkedin', pubLinkedin)}
              className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 cursor-pointer"
            >
              {copiedPlatform === 'linkedin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlatform === 'linkedin' ? 'Copied' : 'Copy Post'}</span>
            </button>
          </div>
          <textarea
            rows={9}
            value={pubLinkedin}
            onChange={(e) => setPubLinkedin(e.target.value)}
            placeholder="Generate or write LinkedIn post..."
            className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* 3. Instagram Reels Caption */}
        <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Instagram Reels Caption
              </h3>
              <p className="text-xs text-slate-400">
                Structured bullet summary with hashtags ({pubInstagram.length}/2200 chars)
              </p>
            </div>
            <button
              onClick={() => handleCopy('ig', pubInstagram)}
              className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 cursor-pointer"
            >
              {copiedPlatform === 'ig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlatform === 'ig' ? 'Copied' : 'Copy Caption'}</span>
            </button>
          </div>
          <textarea
            rows={8}
            value={pubInstagram}
            onChange={(e) => setPubInstagram(e.target.value)}
            placeholder="Generate or write Instagram Reels caption..."
            className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* 4. TikTok & YouTube Shorts */}
        <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                TikTok Caption & Search Tags
              </h3>
              <button
                onClick={() => handleCopy('tiktok', pubTiktok)}
                className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 cursor-pointer"
              >
                {copiedPlatform === 'tiktok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy TikTok</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={pubTiktok}
              onChange={(e) => setPubTiktok(e.target.value)}
              placeholder="TikTok caption..."
              className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                YouTube Shorts Title & Description
              </h3>
              <button
                onClick={() =>
                  handleCopy('yt', `${pubYoutubeTitle}\n\n${pubYoutubeDesc}`)
                }
                className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 cursor-pointer"
              >
                {copiedPlatform === 'yt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy YouTube</span>
              </button>
            </div>
            <input
              type="text"
              value={pubYoutubeTitle}
              onChange={(e) => setPubYoutubeTitle(e.target.value)}
              placeholder="YouTube Shorts Title (max 100 chars)"
              className="w-full p-2.5 text-xs font-medium bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <textarea
              rows={3}
              value={pubYoutubeDesc}
              onChange={(e) => setPubYoutubeDesc(e.target.value)}
              placeholder="YouTube Shorts Description, timestamps, and source links..."
              className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Human Authorization & Compliance Sign-Off Gate */}
      <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Human Editorial & Compliance Approval Gate</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            MarketMotion AI never publishes automatically without authorized platform credentials and explicit human sign-off. Verify that all claims distinguish confirmed data from the {project.marketProbability}% market-implied probability before approving release.
          </p>
          <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={complianceChecked}
              onChange={(e) => setComplianceChecked(e.target.checked)}
              className="rounded border-slate-700 accent-emerald-400"
            />
            <span>
              I confirm that verified facts, market probabilities, and speculative scenarios are accurately separated.
            </span>
          </label>
        </div>

        <div className="shrink-0">
          {project.status === 'published' ? (
            <div className="px-4 py-2.5 bg-emerald-950/40 border border-emerald-800/70 rounded-lg text-xs font-medium text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Approved & Marked Published</span>
            </div>
          ) : (
            <button
              onClick={() => handleSavePackages(true)}
              disabled={!complianceChecked || isSaving}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Approve Package & Mark Published</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
