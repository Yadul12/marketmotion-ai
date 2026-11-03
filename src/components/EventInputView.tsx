import React, { useState, useEffect } from 'react';
import { Project, StudioView } from '../types/studio';
import { SAMPLE_EVENTS, SampleEventTemplate } from '../data/sampleEvents';
import {
  FileText,
  Sparkles,
  Save,
  ArrowRight,
  Link as LinkIcon,
  TrendingUp,
  Newspaper,
  Check,
  AlertCircle,
} from 'lucide-react';

interface EventInputViewProps {
  activeProject: Project | null;
  onSaveEvent: (
    data: {
      title: string;
      category: string;
      description: string;
      marketProbability: number;
      latestDevelopments: string;
      sourceLinks: string;
      rawArticleText: string;
    },
    andGenerateScripts: boolean
  ) => Promise<void>;
  isSaving: boolean;
  isGeneratingScripts: boolean;
  onNavigate: (view: StudioView) => void;
}

const CATEGORIES = [
  'Macroeconomics',
  'Technology',
  'Energy',
  'Geopolitics',
  'Regulation',
  'Finance & Crypto',
];

export const EventInputView: React.FC<EventInputViewProps> = ({
  activeProject,
  onSaveEvent,
  isSaving,
  isGeneratingScripts,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Macroeconomics');
  const [marketProbability, setMarketProbability] = useState(50);
  const [description, setDescription] = useState('');
  const [latestDevelopments, setLatestDevelopments] = useState('');
  const [sourceLinks, setSourceLinks] = useState('');
  const [rawArticleText, setRawArticleText] = useState('');

  const [isParsingArticle, setIsParsingArticle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject) {
      setTitle(activeProject.title);
      setCategory(activeProject.category || 'Macroeconomics');
      setMarketProbability(activeProject.marketProbability ?? 50);
      setDescription(activeProject.description);
      setLatestDevelopments(activeProject.latestDevelopments);
      setSourceLinks(activeProject.sourceLinks);
      setRawArticleText(activeProject.rawArticleText);
    } else {
      setTitle('');
      setCategory('Macroeconomics');
      setMarketProbability(55);
      setDescription('');
      setLatestDevelopments('');
      setSourceLinks('');
      setRawArticleText('');
    }
  }, [activeProject?.id]);

  const handleLoadTemplate = (tpl: SampleEventTemplate) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setMarketProbability(tpl.marketProbability);
    setDescription(tpl.description);
    setLatestDevelopments(tpl.latestDevelopments);
    setSourceLinks(tpl.sourceLinks);
    setRawArticleText(tpl.rawArticleText);
    setErrorMsg(null);
    setStatusNotice(`Loaded sample market: "${tpl.title.slice(0, 50)}..."`);
  };

  const handleParseArticle = async () => {
    if (!rawArticleText || rawArticleText.trim().length < 20) {
      setErrorMsg('Paste at least a sentence or paragraph of news article text to extract event fields.');
      return;
    }
    setErrorMsg(null);
    setIsParsingArticle(true);
    try {
      const response = await fetch('/api/ai/parse-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawArticleText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse article.');
      }
      if (data.title) setTitle(data.title.slice(0, 200));
      if (data.category) setCategory(data.category.slice(0, 60));
      if (typeof data.marketProbability === 'number') {
        setMarketProbability(Math.max(1, Math.min(99, Math.round(data.marketProbability))));
      }
      if (data.description) setDescription(data.description.slice(0, 4000));
      if (data.latestDevelopments) setLatestDevelopments(data.latestDevelopments.slice(0, 4000));
      if (data.sourceLinks) setSourceLinks(data.sourceLinks.slice(0, 2000));
      setStatusNotice('Extracted structured prediction-market fields from pasted article.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not extract event fields from text.');
    } finally {
      setIsParsingArticle(false);
    }
  };

  const handleSubmit = async (andGenerate: boolean) => {
    setErrorMsg(null);
    setStatusNotice(null);
    if (!title.trim()) {
      setErrorMsg('Please enter a prediction-market event title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide the resolution criteria and event description.');
      return;
    }

    await onSaveEvent(
      {
        title: title.trim(),
        category,
        description: description.trim(),
        marketProbability,
        latestDevelopments: latestDevelopments.trim(),
        sourceLinks: sourceLinks.trim(),
        rawArticleText: rawArticleText.trim(),
      },
      andGenerate
    );
    if (!andGenerate) {
      setStatusNotice('Event saved to database.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Step 01 · Market Contract Ingestion & Source Verification
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100 font-display">
            {activeProject ? 'Edit Prediction Market Event' : 'New Prediction Market Event'}
          </h1>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 mr-1 whitespace-nowrap">Sample Presets:</span>
          {SAMPLE_EVENTS.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-800 hover:border-sky-500/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {tpl.category}: {tpl.marketProbability}%
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/70 rounded-lg flex items-center gap-3 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusNotice && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center gap-3 text-xs text-emerald-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Structured Prediction Market Contract Form */}
        <div className="lg:col-span-7 p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-slate-100">
              Market Contract Specification
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {title.length}/200 chars
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prediction Market Question / Event Title *
              </label>
              <input
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Will the Federal Reserve cut benchmark interest rates by at least 50 bps before year-end?"
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Market Sector
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    <span>Implied Market Probability</span>
                  </label>
                  <span className="text-sm font-semibold text-sky-400 font-mono tabular-nums">
                    {marketProbability}% YES · {100 - marketProbability}% NO
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={marketProbability}
                    onChange={(e) => setMarketProbability(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marketProbability}
                    onChange={(e) =>
                      setMarketProbability(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className="w-16 px-2 py-1 text-xs font-mono tabular-nums text-right bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Resolution Criteria & Market Description *
              </label>
              <textarea
                rows={4}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify the exact conditions and official data source required for this prediction market contract to resolve to YES..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Latest Verified Developments & Order-Flow Catalysts
              </label>
              <textarea
                rows={4}
                maxLength={4000}
                value={latestDevelopments}
                onChange={(e) => setLatestDevelopments(e.target.value)}
                placeholder="Enter recent economic releases, regulatory filings, volume surges, or probability shifts..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Source Links (one URL per line)</span>
              </label>
              <textarea
                rows={3}
                maxLength={2000}
                value={sourceLinks}
                onChange={(e) => setSourceLinks(e.target.value)}
                placeholder="https://www.federalreserve.gov/...&#10;https://www.bea.gov/..."
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSaving || isGeneratingScripts}
              className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Event Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSaving || isGeneratingScripts}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingScripts
                  ? 'Generating 30s/60s Scripts...'
                  : 'Save & Generate AI Scripts'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: News Article / Event Summary AI Extractor */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-semibold text-slate-100">
                Paste News Article or Research Brief
              </h2>
            </div>
            <span className="text-xs text-slate-400">Auto-Extractor</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Paste a breaking news article, central bank release, or research desk summary below. Our AI parser will extract a structured prediction-market question, implied probability estimate, and verified developments.
          </p>

          <textarea
            rows={12}
            maxLength={8000}
            value={rawArticleText}
            onChange={(e) => setRawArticleText(e.target.value)}
            placeholder="Paste news article or research note here..."
            className="w-full px-3.5 py-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed"
          />

          <button
            type="button"
            onClick={handleParseArticle}
            disabled={isParsingArticle}
            className="w-full py-2.5 px-4 text-xs font-medium text-sky-300 bg-sky-950/50 border border-sky-800/70 rounded-lg hover:bg-sky-900/60 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {isParsingArticle
                ? 'Analyzing Article & Extracting Market Fields...'
                : 'Extract Market Fields from Pasted Text'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
