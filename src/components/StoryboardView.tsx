import React, { useState } from 'react';
import { Project, Scene, EpistemicTag, StudioView } from '../types/studio';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Film,
} from 'lucide-react';

interface StoryboardViewProps {
  project: Project;
  scenes: Scene[];
  onGenerateStoryboard: (duration: 30 | 60) => Promise<void>;
  onSaveScene: (
    sceneInput: Omit<Scene, 'id' | 'projectId' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingSceneId?: string
  ) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  isGeneratingStoryboard: boolean;
  onNavigate: (view: StudioView) => void;
}

const EPISTEMIC_LABELS: Record<EpistemicTag, { label: string; color: string }> = {
  verified_fact: { label: 'Verified Fact', color: 'text-emerald-400' },
  market_probability: { label: 'Market Probability', color: 'text-sky-400' },
  speculation: { label: 'Speculative Scenario', color: 'text-amber-400' },
};

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  scenes,
  onGenerateStoryboard,
  onSaveScene,
  onDeleteScene,
  isGeneratingStoryboard,
  onNavigate,
}) => {
  const [targetDuration, setTargetDuration] = useState<30 | 60>(30);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [draftScene, setDraftScene] = useState<
    Omit<Scene, 'id' | 'projectId' | 'ownerId' | 'createdAt' | 'updatedAt'> | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSavingScene, setIsSavingScene] = useState(false);

  const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

  const handleStartEdit = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setDraftScene({
      sceneNumber: scene.sceneNumber,
      durationSeconds: scene.durationSeconds,
      sceneDescription: scene.sceneDescription,
      visualPrompt: scene.visualPrompt,
      higgsfieldPrompt: scene.higgsfieldPrompt,
      voiceoverText: scene.voiceoverText,
      onScreenText: scene.onScreenText,
      transitionRecommendation: scene.transitionRecommendation,
      epistemicTag: scene.epistemicTag,
    });
  };

  const handleAddScene = async () => {
    const nextNum = scenes.length + 1;
    await onSaveScene({
      sceneNumber: nextNum,
      durationSeconds: 6,
      sceneDescription: 'Analytical breakdown of key prediction-market catalyst.',
      visualPrompt:
        'Runway Gen-3 Alpha: Smooth dolly push across dark glass financial data display showing implied odds chart, 4k photorealistic.',
      higgsfieldPrompt:
        'Higgsfield Cinema: 35mm anamorphic lens, subtle cool rim lighting, studio documentary mood.',
      voiceoverText: `Meanwhile, traders on Gravia are pricing a ${project.marketProbability}% implied probability.`,
      onScreenText: `${project.marketProbability}% IMPLIED PROBABILITY`,
      transitionRecommendation: 'Hard Cut on Beat',
      epistemicTag: 'market_probability',
    });
  };

  const handleCommitEdit = async () => {
    if (!editingSceneId || !draftScene) return;
    setIsSavingScene(true);
    try {
      await onSaveScene(draftScene, editingSceneId);
      setEditingSceneId(null);
      setDraftScene(null);
    } finally {
      setIsSavingScene(false);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportStoryboardJson = () => {
    const payload = {
      projectTitle: project.title,
      category: project.category,
      marketProbability: project.marketProbability,
      totalDurationSeconds: totalDuration,
      sceneCount: scenes.length,
      scenes: scenes.map((s) => ({
        sceneNumber: s.sceneNumber,
        durationSeconds: s.durationSeconds,
        epistemicClassification: s.epistemicTag,
        sceneDescription: s.sceneDescription,
        runwayVisualPrompt: s.visualPrompt,
        higgsfieldCinemaPrompt: s.higgsfieldPrompt,
        elevenlabsVoiceover: s.voiceoverText,
        capcutOnScreenText: s.onScreenText,
        transitionRecommendation: s.transitionRecommendation,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.slice(0, 28).replace(/[^a-zA-Z0-9]+/g, '_')}_storyboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  let cumulativeTime = 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Step 03 · Scene-by-Scene Visual & Audio Storyboard · Runtime:{' '}
            <span className="text-sky-400 font-mono tabular-nums font-semibold">
              {totalDuration}s across {scenes.length} scenes
            </span>
          </p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 font-display line-clamp-1">
            Storyboard Studio — {project.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
            <button
              onClick={() => setTargetDuration(30)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                targetDuration === 30 ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              30s Target
            </button>
            <button
              onClick={() => setTargetDuration(60)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                targetDuration === 60 ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              60s Target
            </button>
          </div>

          <button
            onClick={() => onGenerateStoryboard(targetDuration)}
            disabled={isGeneratingStoryboard}
            className="px-3.5 py-2 text-xs font-medium text-sky-300 bg-sky-950/50 border border-sky-800/70 rounded-lg hover:bg-sky-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isGeneratingStoryboard
                ? 'Dividing Script into Scenes...'
                : `Auto-Generate ${targetDuration}s Storyboard`}
            </span>
          </button>

          <button
            onClick={handleAddScene}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scene</span>
          </button>

          <button
            onClick={handleExportStoryboardJson}
            disabled={scenes.length === 0}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => onNavigate('workflow')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Creative Workflow & Video</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {scenes.length === 0 ? (
        <div className="p-12 bg-[#111827] border border-slate-800/80 rounded-lg text-center space-y-4">
          <Film className="w-8 h-8 text-sky-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-100">
              No Storyboard Scenes Generated Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Automatically segment your script into timed visual scenes complete with Runway Gen-3 motion prompts, Higgsfield camera direction, ElevenLabs voiceover lines, and CapCut overlays.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onGenerateStoryboard(targetDuration)}
              disabled={isGeneratingStoryboard}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingStoryboard
                  ? 'Generating Scenes...'
                  : `Generate ${targetDuration}s Storyboard Now`}
              </span>
            </button>
            <button
              onClick={handleAddScene}
              className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Add Manual Scene
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {scenes.map((scene) => {
            const startSec = cumulativeTime;
            const endSec = cumulativeTime + (scene.durationSeconds || 0);
            cumulativeTime = endSec;
            const isEditing = editingSceneId === scene.id && draftScene !== null;
            const epistemicInfo =
              EPISTEMIC_LABELS[scene.epistemicTag] || EPISTEMIC_LABELS.market_probability;

            return (
              <div
                key={scene.id}
                className="p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4"
              >
                {/* Scene Top Metadata Bar (Unboxed Zero-Pill Typography) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono tabular-nums font-semibold text-slate-100">
                      Scene {String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-sky-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      0:{String(startSec).padStart(2, '0')}–0:{String(endSec).padStart(2, '0')} ({scene.durationSeconds}s)
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className={`font-medium ${epistemicInfo.color}`}>
                      {epistemicInfo.label}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">
                      Transition: <strong className="text-slate-200 font-normal">{scene.transitionRecommendation}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCommitEdit}
                          disabled={isSavingScene}
                          className="px-3 py-1 text-xs font-semibold text-slate-950 bg-sky-400 rounded hover:bg-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingScene ? 'Saving...' : 'Save Scene'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingSceneId(null);
                            setDraftScene(null);
                          }}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(scene)}
                          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Edit Scene
                        </button>
                        <button
                          onClick={() => onDeleteScene(scene.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Scene"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && draftScene ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Scene Description</label>
                      <textarea
                        rows={3}
                        value={draftScene.sceneDescription}
                        onChange={(e) =>
                          setDraftScene({ ...draftScene, sceneDescription: e.target.value })
                        }
                        className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        ElevenLabs Voiceover Script
                      </label>
                      <textarea
                        rows={3}
                        value={draftScene.voiceoverText}
                        onChange={(e) =>
                          setDraftScene({ ...draftScene, voiceoverText: e.target.value })
                        }
                        className="w-full p-2.5 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Runway Gen-3 Visual Motion Prompt
                      </label>
                      <textarea
                        rows={3}
                        value={draftScene.visualPrompt}
                        onChange={(e) =>
                          setDraftScene({ ...draftScene, visualPrompt: e.target.value })
                        }
                        className="w-full p-2.5 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Higgsfield Cinematic Prompt
                      </label>
                      <textarea
                        rows={3}
                        value={draftScene.higgsfieldPrompt}
                        onChange={(e) =>
                          setDraftScene({ ...draftScene, higgsfieldPrompt: e.target.value })
                        }
                        className="w-full p-2.5 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          CapCut On-Screen Text
                        </label>
                        <input
                          type="text"
                          value={draftScene.onScreenText}
                          onChange={(e) =>
                            setDraftScene({ ...draftScene, onScreenText: e.target.value })
                          }
                          className="w-full p-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Transition Recommendation
                        </label>
                        <input
                          type="text"
                          value={draftScene.transitionRecommendation}
                          onChange={(e) =>
                            setDraftScene({
                              ...draftScene,
                              transitionRecommendation: e.target.value,
                            })
                          }
                          className="w-full p-2 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Duration (Seconds)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={draftScene.durationSeconds}
                          onChange={(e) =>
                            setDraftScene({
                              ...draftScene,
                              durationSeconds: Number(e.target.value) || 5,
                            })
                          }
                          className="w-full p-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Epistemic Classification
                        </label>
                        <select
                          value={draftScene.epistemicTag}
                          onChange={(e) =>
                            setDraftScene({
                              ...draftScene,
                              epistemicTag: e.target.value as EpistemicTag,
                            })
                          }
                          className="w-full p-2 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-100"
                        >
                          <option value="verified_fact">Verified Fact</option>
                          <option value="market_probability">Market Probability</option>
                          <option value="speculation">Speculative Scenario</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Narrative & Voiceover Column */}
                    <div className="lg:col-span-5 space-y-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Scene Action & Direction</div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {scene.sceneDescription}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>ElevenLabs Voiceover Script</span>
                          <button
                            onClick={() =>
                              handleCopyPrompt(`vo-${scene.id}`, scene.voiceoverText)
                            }
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `vo-${scene.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-100 italic leading-relaxed">
                          "{scene.voiceoverText}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60">
                        <div className="text-xs text-slate-400 mb-1">
                          CapCut On-Screen Text Overlay
                        </div>
                        <div className="text-xs font-mono font-semibold text-sky-300">
                          {scene.onScreenText || '—'}
                        </div>
                      </div>
                    </div>

                    {/* AI Visual Generation Prompts Column */}
                    <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-[#0B0F17] border border-slate-800/80 rounded-lg flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium text-slate-300">
                            Runway Gen-3 Motion Prompt
                          </span>
                          <button
                            onClick={() =>
                              handleCopyPrompt(`rw-${scene.id}`, scene.visualPrompt)
                            }
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `rw-${scene.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                          {scene.visualPrompt}
                        </p>
                      </div>

                      <div className="p-3.5 bg-[#0B0F17] border border-slate-800/80 rounded-lg flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium text-slate-300">
                            Higgsfield Cinematic Prompt
                          </span>
                          <button
                            onClick={() =>
                              handleCopyPrompt(
                                `hf-${scene.id}`,
                                scene.higgsfieldPrompt || scene.visualPrompt
                              )
                            }
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `hf-${scene.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                          {scene.higgsfieldPrompt || scene.visualPrompt}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
