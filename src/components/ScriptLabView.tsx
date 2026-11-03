import React, { useState, useEffect } from 'react';
import { Project, StudioView } from '../types/studio';
import {
  Sparkles,
  Save,
  Download,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface ScriptLabViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onRegenerateScripts: () => Promise<void>;
  onGenerateStoryboard: (duration: 30 | 60) => Promise<void>;
  isGeneratingScripts: boolean;
  isGeneratingStoryboard: boolean;
  onNavigate: (view: StudioView) => void;
}

export const ScriptLabView: React.FC<ScriptLabViewProps> = ({
  project,
  onUpdateProject,
  onRegenerateScripts,
  onGenerateStoryboard,
  isGeneratingScripts,
  isGeneratingStoryboard,
  onNavigate,
}) => {
  const [activeCut, setActiveCut] = useState<'30s' | '60s'>('30s');
  const [script30s, setScript30s] = useState(project.script30s);
  const [script60s, setScript60s] = useState(project.script60s);
  const [hooks, setHooks] = useState(project.hooks);
  const [narration, setNarration] = useState(project.narration);
  const [verifiedFacts, setVerifiedFacts] = useState(project.verifiedFacts);
  const [probabilityAnalysis, setProbabilityAnalysis] = useState(project.probabilityAnalysis);
  const [speculationNotes, setSpeculationNotes] = useState(project.speculationNotes);
  const [shortCaption, setShortCaption] = useState(project.shortCaption);
  const [hashtags, setHashtags] = useState(project.hashtags);
  const [callToAction, setCallToAction] = useState(project.callToAction);

  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setScript30s(project.script30s);
    setScript60s(project.script60s);
    setHooks(project.hooks);
    setNarration(project.narration);
    setVerifiedFacts(project.verifiedFacts);
    setProbabilityAnalysis(project.probabilityAnalysis);
    setSpeculationNotes(project.speculationNotes);
    setShortCaption(project.shortCaption);
    setHashtags(project.hashtags);
    setCallToAction(project.callToAction);
  }, [
    project.id,
    project.script30s,
    project.script60s,
    project.hooks,
    project.narration,
    project.verifiedFacts,
    project.probabilityAnalysis,
    project.speculationNotes,
    project.shortCaption,
    project.hashtags,
    project.callToAction,
  ]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSavedNotice(false);
    try {
      await onUpdateProject({
        script30s,
        script60s,
        hooks,
        narration,
        verifiedFacts,
        probabilityAnalysis,
        speculationNotes,
        shortCaption,
        hashtags,
        callToAction,
        status: project.status === 'draft' && script30s ? 'scripted' : project.status,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExportMarkdown = () => {
    const md = `# MarketMotion AI — Script Package
## Event: ${project.title}
- Category: ${project.category}
- Implied Market Probability: ${project.marketProbability}% YES / ${100 - project.marketProbability}% NO

## 1. Epistemic Separation Matrix
### Verified Facts
${verifiedFacts}

### Market Probability Analysis (${project.marketProbability}%)
${probabilityAnalysis}

### Speculation & Catalysts
${speculationNotes}

## 2. Attention-Grabbing Hooks
${hooks}

## 3. 30-Second Video Script
${script30s}

## 4. 60-Second Video Script
${script60s}

## 5. Voiceover Narration (ElevenLabs Ready)
${narration}

## 6. Social Caption, Hashtags & CTA
- Caption: ${shortCaption}
- CTA: ${callToAction}
- Hashtags: ${hashtags}
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.slice(0, 32).replace(/[^a-zA-Z0-9]+/g, '_')}_script.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Step 02 · AI Script Lab & Epistemic Verification · Implied Odds:{' '}
            <span className="text-sky-400 font-mono tabular-nums font-semibold">
              {project.marketProbability}% YES
            </span>
          </p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 font-display line-clamp-1">
            {project.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportMarkdown}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Script (.md)</span>
          </button>

          <button
            onClick={onRegenerateScripts}
            disabled={isGeneratingScripts}
            className="px-3.5 py-2 text-xs font-medium text-sky-300 bg-sky-950/50 border border-sky-800/70 rounded-lg hover:bg-sky-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingScripts ? 'Generating Scripts...' : 'Regenerate with AI'}</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? 'Saved' : isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={() => onGenerateStoryboard(activeCut === '30s' ? 30 : 60)}
            disabled={isGeneratingStoryboard || (!script30s && !script60s)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span>
              {isGeneratingStoryboard
                ? 'Building Storyboard...'
                : `Generate ${activeCut} Storyboard`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Epistemic Separation Matrix (Verified Facts vs Market Probabilities vs Speculation) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Epistemic Separation Guardrails (Fact vs. Probability vs. Speculation)
          </h2>
          <span className="text-xs text-slate-400">
            Editorial Compliance Layer
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Verified Facts */}
          <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Facts (Confirmed Data)</span>
              </span>
              <button
                onClick={() => handleCopy('facts', verifiedFacts)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedField === 'facts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <textarea
              rows={5}
              value={verifiedFacts}
              onChange={(e) => setVerifiedFacts(e.target.value)}
              placeholder="Confirmed historical facts and official data releases..."
              className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500/60 leading-relaxed"
            />
          </div>

          {/* Market Probabilities */}
          <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-sky-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Market Probability ({project.marketProbability}% Implied)</span>
              </span>
              <button
                onClick={() => handleCopy('prob', probabilityAnalysis)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedField === 'prob' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <textarea
              rows={5}
              value={probabilityAnalysis}
              onChange={(e) => setProbabilityAnalysis(e.target.value)}
              placeholder="Current prediction-market pricing and liquidity consensus..."
              className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-sky-500/60 leading-relaxed"
            />
          </div>

          {/* Speculation & Catalysts */}
          <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-amber-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Speculation & Forward Catalysts</span>
              </span>
              <button
                onClick={() => handleCopy('spec', speculationNotes)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedField === 'spec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <textarea
              rows={5}
              value={speculationNotes}
              onChange={(e) => setSpeculationNotes(e.target.value)}
              placeholder="Unconfirmed catalysts, tail risks, and scenario projections..."
              className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500/60 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Main Script Editor Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: 30s & 60s Timecoded Video Scripts */}
        <div className="lg:col-span-7 p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <button
                onClick={() => setActiveCut('30s')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeCut === '30s' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30-Second Fast Cut
              </button>
              <button
                onClick={() => setActiveCut('60s')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeCut === '60s' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                60-Second Deep Dive
              </button>
            </div>

            <button
              onClick={() =>
                handleCopy('script', activeCut === '30s' ? script30s : script60s)
              }
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded flex items-center gap-1.5 cursor-pointer"
            >
              {copiedField === 'script' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {activeCut} Script</span>
                </>
              )}
            </button>
          </div>

          {activeCut === '30s' ? (
            <textarea
              rows={15}
              value={script30s}
              onChange={(e) => setScript30s(e.target.value)}
              placeholder="Click 'Regenerate with AI' above to generate a timecoded 30-second video script..."
              className="w-full p-4 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 leading-relaxed focus:outline-none focus:border-sky-500"
            />
          ) : (
            <textarea
              rows={15}
              value={script60s}
              onChange={(e) => setScript60s(e.target.value)}
              placeholder="Click 'Regenerate with AI' above to generate a timecoded 60-second video script..."
              className="w-full p-4 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 leading-relaxed focus:outline-none focus:border-sky-500"
            />
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Continuous Explanatory Narration (ElevenLabs Voice Synthesis Input)
              </label>
              <button
                onClick={() => handleCopy('narration', narration)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'narration' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy Voiceover</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Right 5 Columns: Hooks, Short Caption, Hashtags, and Call to Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                Attention-Grabbing Hooks (First 3 Seconds)
              </h3>
              <button
                onClick={() => handleCopy('hooks', hooks)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedField === 'hooks' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              rows={6}
              value={hooks}
              onChange={(e) => setHooks(e.target.value)}
              placeholder="3 high-retention opening hooks..."
              className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Short Caption, Hashtags & Call to Action
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Short Video Caption
              </label>
              <textarea
                rows={3}
                value={shortCaption}
                onChange={(e) => setShortCaption(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Call to Action (Viewer Engagement Prompt)
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Platform-Specific Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full p-2.5 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-sky-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => onNavigate('storyboard')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Storyboard Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('publishing')}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Open Publishing Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
