import React, { useState, useRef } from 'react';
import { Project, Scene, WorkflowState, StudioView } from '../types/studio';
import {
  Download,
  Upload,
  Play,
  Copy,
  Check,
  Film,
  Mic,
  Scissors,
  Camera,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CreativeWorkflowViewProps {
  project: Project;
  scenes: Scene[];
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onNavigate: (view: StudioView) => void;
}

const DEFAULT_WORKFLOW: WorkflowState = {
  runwayStatus: 'pending',
  higgsfieldStatus: 'pending',
  elevenlabsStatus: 'pending',
  capcutStatus: 'pending',
  selectedVoiceProfile: 'Marcus — Institutional Baritone (24kHz)',
  aspectRatio: '9:16',
  notes: '',
};

function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )},000`;
}

export const CreativeWorkflowView: React.FC<CreativeWorkflowViewProps> = ({
  project,
  scenes,
  onUpdateProject,
  onNavigate,
}) => {
  const parsedWorkflow: WorkflowState = (() => {
    try {
      return { ...DEFAULT_WORKFLOW, ...JSON.parse(project.workflowStatus || '{}') };
    } catch {
      return DEFAULT_WORKFLOW;
    }
  })();

  const [workflow, setWorkflow] = useState<WorkflowState>(parsedWorkflow);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRenderingAnimatic, setIsRenderingAnimatic] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const saveWorkflowState = async (next: WorkflowState) => {
    setWorkflow(next);
    const allComplete =
      next.runwayStatus === 'rendered' &&
      next.elevenlabsStatus === 'synthesized' &&
      next.capcutStatus === 'assembled';
    await onUpdateProject({
      workflowStatus: JSON.stringify(next),
      status: allComplete ? 'ready' : 'production',
    });
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Export Runway Gen-3 Batch Manifest
  const handleExportRunwayPackage = async () => {
    const manifest = {
      tool: 'Runway Gen-3 Alpha Turbo',
      integrationMode: 'Manual Export / Import Manifest',
      project: project.title,
      aspectRatio: workflow.aspectRatio || '9:16',
      shots: scenes.map((s) => ({
        sceneNumber: s.sceneNumber,
        durationSeconds: s.durationSeconds,
        prompt: s.visualPrompt,
        transition: s.transitionRecommendation,
      })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway_gen3_manifest_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await saveWorkflowState({ ...workflow, runwayStatus: 'exported' });
  };

  // Export Higgsfield Camera & Lighting Spec
  const handleExportHiggsfieldPackage = async () => {
    const manifest = {
      tool: 'Higgsfield Cinematic Visuals',
      integrationMode: 'Manual Export / Import Spec',
      project: project.title,
      shots: scenes.map((s) => ({
        sceneNumber: s.sceneNumber,
        durationSeconds: s.durationSeconds,
        cinematicPrompt: s.higgsfieldPrompt || s.visualPrompt,
        epistemicOverlayTag: s.epistemicTag,
      })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `higgsfield_cinema_shots_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await saveWorkflowState({ ...workflow, higgsfieldStatus: 'exported' });
  };

  // Export ElevenLabs Voiceover Script
  const handleExportElevenLabsScript = async () => {
    const scriptContent = `# ElevenLabs Voice Synthesis Package
Voice Profile: ${workflow.selectedVoiceProfile}
Stability: 0.65 | Clarity + Similarity: 0.82 | Style Exaggeration: 0.15

## Full Continuous Narration
${project.narration || scenes.map((s) => s.voiceoverText).join(' ')}

## Scene-by-Scene Timed Lines
${scenes
  .map(
    (s) =>
      `[Scene ${s.sceneNumber} — ${s.durationSeconds}s | ${s.epistemicTag.toUpperCase()}]\n${s.voiceoverText}`
  )
  .join('\n\n')}
`;
    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs_voiceover_${project.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    await saveWorkflowState({ ...workflow, elevenlabsStatus: 'exported' });
  };

  // Export CapCut .SRT Subtitles & Assembly Sheet
  const handleExportCapCutSrt = async () => {
    let elapsed = 0;
    const srtBlocks = scenes.map((s, idx) => {
      const start = formatSrtTime(elapsed);
      elapsed += s.durationSeconds || 5;
      const end = formatSrtTime(elapsed);
      return `${idx + 1}\n${start} --> ${end}\n${s.onScreenText ? `[${s.onScreenText}]\n` : ''}${s.voiceoverText}`;
    });
    const srtText = srtBlocks.join('\n\n');
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capcut_captions_${project.id}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    await saveWorkflowState({ ...workflow, capcutStatus: 'exported' });
  };

  // Upload Rendered Video File (.mp4 / .webm / .mov)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video upload failed.');
      }
      await onUpdateProject({
        videoUrl: data.url,
        videoFileName: data.fileName,
        status: 'ready',
      });
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Built-in Canvas-to-WebM Storyboard Animatic Video Renderer
  const handleRenderPlayableAnimatic = async () => {
    setUploadError(null);
    setIsRenderingAnimatic(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not initialized.');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D context unavailable.');

      const renderScenes =
        scenes.length > 0
          ? scenes
          : [
              {
                id: 's1',
                projectId: project.id,
                ownerId: project.ownerId,
                sceneNumber: 1,
                durationSeconds: 3,
                sceneDescription: project.description,
                visualPrompt: '',
                higgsfieldPrompt: '',
                voiceoverText: project.shortCaption || project.title,
                onScreenText: `${project.marketProbability}% IMPLIED PROBABILITY`,
                transitionRecommendation: 'Cut',
                epistemicTag: 'market_probability' as const,
              },
            ];

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start();

      // Render each scene for 1.4 seconds in the animatic preview so generation completes in ~5 seconds
      for (let i = 0; i < renderScenes.length; i++) {
        const sc = renderScenes[i];
        const frames = 42; // 1.4s at 30fps
        for (let f = 0; f < frames; f++) {
          const progress = f / frames;
          // Background
          ctx.fillStyle = '#0B0F17';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Subtle grid lines
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1;
          for (let y = 80; y < canvas.height; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Top Brand Header
          ctx.fillStyle = '#94A3B8';
          ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('MARKETMOTION AI · GRAVIA STUDIO', 40, 60);

          // Epistemic Banner
          const tagColor =
            sc.epistemicTag === 'verified_fact'
              ? '#10B981'
              : sc.epistemicTag === 'speculation'
              ? '#F59E0B'
              : '#38BDF8';
          ctx.fillStyle = tagColor;
          ctx.font = '600 16px "JetBrains Mono", monospace';
          ctx.fillText(
            `SCENE 0${sc.sceneNumber} // ${sc.epistemicTag.replace('_', ' ').toUpperCase()}`,
            40,
            115
          );

          // Market Title (Wrapped)
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
          const words = project.title.split(' ');
          let line = '';
          let yPos = 180;
          for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > canvas.width - 80) {
              ctx.fillText(line, 40, yPos);
              line = w + ' ';
              yPos += 38;
            } else {
              line = test;
            }
          }
          ctx.fillText(line, 40, yPos);

          // Probability Gauge Box
          ctx.fillStyle = '#111827';
          ctx.fillRect(40, 320, canvas.width - 80, 140);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(40, 320, canvas.width - 80, 140);

          ctx.fillStyle = '#94A3B8';
          ctx.font = '500 16px "Public Sans", sans-serif';
          ctx.fillText('IMPLIED MARKET PROBABILITY', 64, 360);

          ctx.fillStyle = '#38BDF8';
          ctx.font = '700 54px "JetBrains Mono", monospace';
          ctx.fillText(`${project.marketProbability}% YES`, 64, 425);

          // Animated Probability Bar
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(64, 440, canvas.width - 128, 8);
          ctx.fillStyle = tagColor;
          ctx.fillRect(
            64,
            440,
            ((canvas.width - 128) * (project.marketProbability / 100)) *
              Math.min(1, 0.4 + progress * 0.6),
            8
          );

          // On-screen kinetic text
          ctx.fillStyle = '#F1F5F9';
          ctx.font = '600 22px "JetBrains Mono", monospace';
          ctx.fillText((sc.onScreenText || 'MARKET BRIEF').slice(0, 34), 40, 540);

          // Voiceover Caption Subtitle Box
          ctx.fillStyle = '#111827';
          ctx.fillRect(40, 580, canvas.width - 80, 240);
          ctx.fillStyle = '#E2E8F0';
          ctx.font = '400 20px "Public Sans", sans-serif';
          const voWords = sc.voiceoverText.split(' ');
          let voLine = '';
          let voY = 625;
          for (const w of voWords) {
            const test = voLine + w + ' ';
            if (ctx.measureText(test).width > canvas.width - 120) {
              ctx.fillText(voLine, 60, voY);
              voLine = w + ' ';
              voY += 32;
            } else {
              voLine = test;
            }
          }
          ctx.fillText(voLine, 60, voY);

          // Scene Progress Footer
          ctx.fillStyle = '#64748B';
          ctx.font = '500 15px "JetBrains Mono", monospace';
          ctx.fillText(
            `TRANSITION: ${sc.transitionRecommendation.toUpperCase()}`,
            40,
            900
          );

          await new Promise((r) => setTimeout(r, 30));
        }
      }

      recorder.stop();
      const webmBlob = await recordingDone;
      const file = new File([webmBlob], `marketmotion_preview_${project.id}.webm`, {
        type: 'video/webm',
      });

      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload generated animatic.');

      await onUpdateProject({
        videoUrl: data.url,
        videoFileName: data.fileName,
        status: 'ready',
      });
    } catch (err: any) {
      setUploadError(err.message || 'Could not render preview animatic.');
    } finally {
      setIsRenderingAnimatic(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden 9:16 Vertical Canvas for WebM Animatic Generation */}
      <canvas ref={canvasRef} width={540} height={960} className="hidden" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Step 04 · AI Creative Production Pipeline & Video Preview
          </p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 font-display line-clamp-1">
            Creative Workflow — {project.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('publishing')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Publishing Prep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transparency Notice on External Creative Tool Integrations */}
      <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-200">
            Production Pipeline Export & Import Protocol
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Export structured scene manifests for Runway Gen-3, Higgsfield, ElevenLabs, and CapCut (.srt subtitles) below, then upload your rendered cut or generate an instant playable 9:16 animatic video directly in the studio.
          </p>
        </div>
        <div className="text-xs font-mono text-sky-400 shrink-0">
          {scenes.length} Scenes Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: 4-Stage Creative Tool Integrations */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Runway Gen-3 Alpha */}
          <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-sky-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    01. Runway — AI Video Motion Generation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exports per-scene camera movement & B-roll prompts ({scenes.length} shots)
                  </p>
                </div>
              </div>
              <select
                value={workflow.runwayStatus}
                onChange={(e) =>
                  saveWorkflowState({
                    ...workflow,
                    runwayStatus: e.target.value as WorkflowState['runwayStatus'],
                  })
                }
                className="px-2.5 py-1 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
              >
                <option value="pending">Status: Pending</option>
                <option value="exported">Status: Manifest Exported</option>
                <option value="rendered">Status: Clips Rendered</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleExportRunwayPackage}
                className="px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download Runway Manifest (.json)</span>
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    'runway-all',
                    scenes
                      .map((s) => `Scene ${s.sceneNumber} (${s.durationSeconds}s): ${s.visualPrompt}`)
                      .join('\n\n')
                  )
                }
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'runway-all' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy All Motion Prompts</span>
              </button>
            </div>
          </div>

          {/* 2. Higgsfield Cinematic Visuals */}
          <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    02. Higgsfield — Cinematic Visuals & Lens Direction
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exports anamorphic lens, character framing, and studio lighting specs
                  </p>
                </div>
              </div>
              <select
                value={workflow.higgsfieldStatus}
                onChange={(e) =>
                  saveWorkflowState({
                    ...workflow,
                    higgsfieldStatus: e.target.value as WorkflowState['higgsfieldStatus'],
                  })
                }
                className="px-2.5 py-1 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
              >
                <option value="pending">Status: Pending</option>
                <option value="exported">Status: Spec Exported</option>
                <option value="rendered">Status: Visuals Rendered</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleExportHiggsfieldPackage}
                className="px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Higgsfield Spec (.json)</span>
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    'higgsfield-all',
                    scenes
                      .map(
                        (s) =>
                          `Scene ${s.sceneNumber}: ${s.higgsfieldPrompt || s.visualPrompt}`
                      )
                      .join('\n\n')
                  )
                }
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'higgsfield-all' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Cinematic Prompts</span>
              </button>
            </div>
          </div>

          {/* 3. ElevenLabs Voiceover Synthesis */}
          <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    03. ElevenLabs — AI Voiceover Narration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exports broadcast narration script with pacing and phonetic emphasis cues
                  </p>
                </div>
              </div>
              <select
                value={workflow.elevenlabsStatus}
                onChange={(e) =>
                  saveWorkflowState({
                    ...workflow,
                    elevenlabsStatus: e.target.value as WorkflowState['elevenlabsStatus'],
                  })
                }
                className="px-2.5 py-1 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
              >
                <option value="pending">Status: Pending</option>
                <option value="exported">Status: Script Exported</option>
                <option value="synthesized">Status: Audio Synthesized</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={workflow.selectedVoiceProfile}
                onChange={(e) =>
                  saveWorkflowState({ ...workflow, selectedVoiceProfile: e.target.value })
                }
                className="px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="Marcus — Institutional Baritone (24kHz)">
                  Voice: Marcus — Institutional Baritone (24kHz)
                </option>
                <option value="Elena — Crisp Broadcast Analyst (24kHz)">
                  Voice: Elena — Crisp Broadcast Analyst (24kHz)
                </option>
                <option value="Devon — Fast-Paced Macro Desk (24kHz)">
                  Voice: Devon — Fast-Paced Macro Desk (24kHz)
                </option>
              </select>

              <button
                onClick={handleExportElevenLabsScript}
                className="px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Voiceover Package (.txt)</span>
              </button>
            </div>
          </div>

          {/* 4. CapCut Final Editing & SRT Subtitles */}
          <div className="p-5 bg-[#111827] border border-slate-800/80 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scissors className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    04. CapCut — Final Timeline Assembly & Subtitles
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generates timecoded .SRT captions and lower-third overlay cues
                  </p>
                </div>
              </div>
              <select
                value={workflow.capcutStatus}
                onChange={(e) =>
                  saveWorkflowState({
                    ...workflow,
                    capcutStatus: e.target.value as WorkflowState['capcutStatus'],
                  })
                }
                className="px-2.5 py-1 text-xs bg-[#0B0F17] border border-slate-800 rounded text-slate-200"
              >
                <option value="pending">Status: Pending</option>
                <option value="exported">Status: SRT Exported</option>
                <option value="assembled">Status: Final Cut Assembled</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleExportCapCutSrt}
                className="px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Timecoded Subtitles (.srt)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Video Upload & HTML5 Video Preview Studio */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-slate-800/80 rounded-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              Video Upload & HTML5 Preview Player
            </h2>
            <span className="text-xs font-mono text-slate-400">9:16 Vertical / 16:9</span>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/70 rounded text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {project.videoUrl ? (
            <div className="space-y-3">
              <div className="bg-black border border-slate-800 rounded-lg overflow-hidden aspect-[9/16] max-h-[420px] mx-auto flex items-center justify-center">
                <video
                  key={project.videoUrl}
                  src={project.videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">
                    {project.videoFileName || 'preview_cut.webm'}
                  </span>
                </span>
                <a
                  href={project.videoUrl}
                  download={project.videoFileName || 'marketmotion_video.webm'}
                  className="text-sky-400 hover:text-sky-300 underline"
                >
                  Download Video
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#0B0F17] border border-dashed border-slate-800 rounded-lg text-center space-y-3">
              <Play className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-200">
                  No Video File Attached Yet
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a final video cut (.mp4, .webm, .mov) from CapCut/Runway, or click below to synthesize an instant playable 9:16 storyboard animatic video right in your browser.
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRenderingAnimatic}
              className="py-2.5 px-3 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{isUploading ? 'Uploading Video...' : 'Upload Rendered Video'}</span>
            </button>

            <button
              type="button"
              onClick={handleRenderPlayableAnimatic}
              disabled={isUploading || isRenderingAnimatic}
              className="py-2.5 px-3 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isRenderingAnimatic
                  ? 'Rendering 9:16 Video...'
                  : 'Render Playable Animatic'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
