import React, { useState, useMemo } from 'react';
import { Project, StudioView } from '../types/studio';
import {
  Plus,
  Search,
  FileText,
  Film,
  CheckCircle2,
  FolderKanban,
  Trash2,
  ArrowUpRight,
  Download,
  Database,
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string, targetView?: StudioView) => void;
  onCreateNew: () => void;
  onDeleteProject: (id: string) => Promise<void>;
  onSeedSamplePortfolio: () => Promise<void>;
  isSeeding: boolean;
}

const STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Draft',
  scripted: 'Scripted',
  storyboarded: 'Storyboarded',
  production: 'In Production',
  ready: 'Ready for Review',
  published: 'Published',
  archived: 'Archived',
};

const STATUS_TEXT_COLOR: Record<Project['status'], string> = {
  draft: 'text-slate-400',
  scripted: 'text-sky-400',
  storyboarded: 'text-indigo-400',
  production: 'text-amber-400',
  ready: 'text-emerald-400',
  published: 'text-emerald-300',
  archived: 'text-slate-500',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNew,
  onDeleteProject,
  onSeedSamplePortfolio,
  isSeeding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const scriptsGenerated = projects.filter(
      (p) => p.script30s.trim().length > 0 || p.script60s.trim().length > 0
    ).length;
    const videosCreated = projects.filter(
      (p) => p.videoUrl.trim().length > 0 || p.status === 'ready' || p.status === 'published'
    ).length;
    const draftsAwaitingApproval = projects.filter(
      (p) => p.status !== 'published' && p.status !== 'archived'
    ).length;

    return {
      totalProjects,
      scriptsGenerated,
      videosCreated,
      draftsAwaitingApproval,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteProject(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Prediction Market Intelligence · Short-Form Content Pipeline
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100 font-display">
            Production Overview
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSeedSamplePortfolio}
            disabled={isSeeding}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>{isSeeding ? 'Loading Sample Markets...' : 'Load Sample Markets'}</span>
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Market Event</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Market Projects</span>
            <FolderKanban className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-100 font-mono tabular-nums">
              {metrics.totalProjects}
            </span>
            <span className="text-xs text-slate-400">Active contracts</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Scripts Generated</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-100 font-mono tabular-nums">
              {metrics.scriptsGenerated}
            </span>
            <span className="text-xs text-slate-400">30s & 60s dual-cuts</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Videos Created & Ready</span>
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-100 font-mono tabular-nums">
              {metrics.videosCreated}
            </span>
            <span className="text-xs text-slate-400">Render & preview complete</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Drafts Awaiting Approval</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-100 font-mono tabular-nums">
              {metrics.draftsAwaitingApproval}
            </span>
            <span className="text-xs text-slate-400">Pending compliance sign-off</span>
          </div>
        </div>
      </div>

      {/* Pipeline Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800/80 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'draft', label: 'Drafts' },
            { id: 'scripted', label: 'Scripted' },
            { id: 'storyboarded', label: 'Storyboarded' },
            { id: 'ready', label: 'Ready' },
            { id: 'published', label: 'Published' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by market question or sector..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#111827] border border-slate-800/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Content Production Pipeline Table */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 bg-[#111827] border border-slate-800/80 rounded-lg text-center space-y-4">
          <p className="text-base font-medium text-slate-200">
            {projects.length === 0
              ? 'No prediction-market content projects in your studio yet'
              : 'No projects match your current filter'}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {projects.length === 0
              ? 'Load our institutional sample prediction markets (FOMC Rate Cut & AI Semiconductor Export Controls) or create a custom market event to generate scripts, storyboards, and social packages.'
              : 'Try clearing the search query or switching the status filter above.'}
          </p>
          {projects.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onSeedSamplePortfolio}
                disabled={isSeeding}
                className="px-4 py-2 text-xs font-medium text-slate-100 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isSeeding ? 'Seeding Portfolio...' : 'Load Sample Portfolio'}
              </button>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors cursor-pointer"
              >
                Create Custom Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-slate-800/80 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-slate-900/50">
                  <th className="py-3 px-4 font-medium">Prediction Market Event</th>
                  <th className="py-3 px-4 font-medium">Sector</th>
                  <th className="py-3 px-4 font-medium text-right">Implied Odds</th>
                  <th className="py-3 px-4 font-medium">Production Stage</th>
                  <th className="py-3 px-4 font-medium">Deliverables</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredProjects.map((project) => {
                  const isSelected = project.id === activeProjectId;
                  const hasScripts = Boolean(project.script30s || project.script60s);
                  const hasPublishing = Boolean(project.pubXThread || project.pubInstagram);
                  const hasVideo = Boolean(project.videoUrl);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelectProject(project.id, 'script_lab')}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-950/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-medium text-slate-100 line-clamp-1">
                          {project.title}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {project.latestDevelopments || project.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                        {project.category}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-400"
                              style={{ width: `${project.marketProbability}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-xs font-semibold text-slate-100">
                            {project.marketProbability}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className={`font-medium ${STATUS_TEXT_COLOR[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                        <span>{hasScripts ? 'Scripts ✓' : 'No Script'}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>{hasPublishing ? 'Social Pack ✓' : 'No Social'}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>{hasVideo ? 'Video ✓' : 'No Video'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectProject(project.id, 'event_input')}
                            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            Edit Event
                          </button>
                          <button
                            onClick={() => onSelectProject(project.id, 'script_lab')}
                            className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Studio</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
                            disabled={deletingId === project.id}
                            title="Delete Project"
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Production Architecture & Epistemic Standard Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2">
          <div className="text-xs font-medium text-emerald-400">
            01. Verified Factual Baseline
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every script isolates historical data releases, official filings, and central bank or regulatory records from market sentiment.
          </p>
        </div>
        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2">
          <div className="text-xs font-medium text-sky-400">
            02. Implied Probability Attribution
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Order-book odds (e.g. 68% YES) are explicitly framed as real-time market pricing and liquidity consensus rather than guaranteed outcomes.
          </p>
        </div>
        <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-2">
          <div className="text-xs font-medium text-amber-400">
            03. Speculative Catalyst Isolation
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Forward-looking scenarios and upside/downside invalidation triggers are tagged separately in both scripts and storyboard scenes.
          </p>
        </div>
      </div>
    </div>
  );
};
