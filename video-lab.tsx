import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVideoLabStore, VideoStep } from "@/stores/videoLabStore";
import { FreepikImageGenerator } from "@/components/FreepikImageGenerator";
import { FreepikVideoGenerator } from "@/components/FreepikVideoGenerator";
import { VideoImporter } from "@/components/VideoImporter";
import { 
  Clapperboard, 
  Upload, 
  Sparkles, 
  Mic, 
  Play, 
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Bookmark,
  Clock,
  FileVideo,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Download,
  Zap,
  Type,
  Image,
  Film,
  Loader2,
  TrendingUp,
  Lightbulb,
  Target,
  Video
} from "lucide-react";

const STEPS: { id: VideoStep; label: string; icon: React.ElementType }[] = [
  { id: 'script', label: 'Script', icon: Type },
  { id: 'voice', label: 'Voix', icon: Mic },
  { id: 'visual', label: 'Visuel', icon: Image },
  { id: 'music', label: 'Musique', icon: Music2 },
  { id: 'export', label: 'Export', icon: Download },
];

const HOOKS = [
  { id: 'saviez-vous', text: 'Saviez-vous que...', icon: Lightbulb },
  { id: 'astuces', text: '3 astuces pour...', icon: Zap },
  { id: 'erreur', text: 'L\'erreur que tout le monde fait...', icon: Target },
  { id: 'secret', text: 'Le secret que personne ne vous dit...', icon: Sparkles },
  { id: 'arretez', text: 'Arrêtez de faire ça !', icon: TrendingUp },
];

const TEMPLATES = [
  { 
    id: 'viral-hook', 
    name: 'Viral Hook', 
    description: 'Accroche choc + révélation',
    structure: '[HOOK CHOC]\n\nVoici ce que vous devez savoir...\n\n[CONTENU PRINCIPAL]\n\n[APPEL À L\'ACTION]'
  },
  { 
    id: 'tutorial', 
    name: 'Tutorial', 
    description: 'Étape par étape explicatif',
    structure: 'Comment [OBJECTIF] en 3 étapes :\n\nÉtape 1 : [ACTION]\nÉtape 2 : [ACTION]\nÉtape 3 : [ACTION]\n\nRésultat : [BÉNÉFICE]'
  },
  { 
    id: 'product-review', 
    name: 'Product Review', 
    description: 'Test et avis produit',
    structure: 'J\'ai testé [PRODUIT] pendant [DURÉE]\n\nLes plus :\n• [AVANTAGE 1]\n• [AVANTAGE 2]\n\nLes moins :\n• [INCONVÉNIENT]\n\nMon verdict : [NOTE]/10'
  },
];

const SCRIPT_SUGGESTIONS = [
  "Découvrez comment doubler votre productivité en 5 minutes par jour. La technique que j'utilise m'a permis de gagner 2 heures chaque semaine !",
  "3 erreurs qui ruinent vos posts LinkedIn. La numéro 2 est celle que je vois le plus souvent, et pourtant la solution est simple...",
  "Le secret des entrepreneurs à succès ? Ils font tous cette chose chaque matin. Je vous révèle tout dans cette vidéo.",
];

const MUSIC_LIBRARY = [
  { id: 'upbeat-pop', name: 'Upbeat Pop', duration: '2:34', genre: 'Pop', trending: true },
  { id: 'chill-lofi', name: 'Chill Lo-Fi', duration: '3:12', genre: 'Lo-Fi', trending: false },
  { id: 'corporate', name: 'Corporate Inspire', duration: '2:45', genre: 'Corporate', trending: true },
  { id: 'energetic', name: 'Energetic EDM', duration: '2:18', genre: 'Electronic', trending: true },
  { id: 'acoustic', name: 'Acoustic Warm', duration: '2:55', genre: 'Acoustic', trending: false },
  { id: 'cinematic', name: 'Cinematic Epic', duration: '3:30', genre: 'Cinematic', trending: false },
];

const PEXELS_CATEGORIES = ['Motivation', 'Business', 'Nature', 'Technology', 'Lifestyle'];

export default function VideoLab() {
  const { 
    currentStep, 
    project, 
    setStep, 
    nextStep, 
    prevStep, 
    updateProject,
    calculateViralityScore,
    addProjects,
    savedProjects,
    loadProject,
    deleteProject
  } = useVideoLabStore();
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [pexelsSearch, setPexelsSearch] = useState('');
  const [pexelsCategory, setPexelsCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const charCount = project.script.length;
  const estimatedDuration = charCount * 0.05;
  const viralityScore = calculateViralityScore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateProject({ lastSaved: Date.now() });
    }, 30000);
    return () => clearInterval(interval);
  }, [updateProject]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "video/mp4" || file.type === "video/quicktime")) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      updateProject({ videoFile: url, videoFileName: file.name });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const insertHook = (hookText: string) => {
    const newScript = hookText + (project.script ? '\n\n' + project.script : '');
    updateProject({ 
      script: newScript,
      selectedHooks: [...project.selectedHooks, hookText]
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      updateProject({ 
        script: template.structure,
        selectedTemplate: templateId
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent potentiel viral';
    if (score >= 50) return 'Bon potentiel';
    return 'À améliorer';
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200">
                <Clapperboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Laboratoire Vidéo</h1>
                <p className="text-sm text-gray-500">Créez des vidéos virales en quelques clics</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <VideoImporter 
                onImport={(videos) => {
                  const projectsToAdd = videos.map(v => ({
                    script: v.script,
                    selectedTemplate: v.template,
                    selectedHooks: v.hook ? [v.hook] : [],
                    format: v.format as 'tiktok' | 'instagram-reel' | 'youtube-short',
                  }));
                  addProjects(projectsToAdd);
                }}
                onScheduleAll={async (videos) => {
                  let successCount = 0;
                  for (const video of videos) {
                    // Map video formats to supported platforms (linkedin, facebook, instagram)
                    const platform = video.format === 'instagram-reel' ? 'instagram' 
                      : video.format === 'youtube-short' ? 'facebook' 
                      : 'instagram'; // TikTok -> Instagram as closest match
                    
                    try {
                      const response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          content: video.script,
                          platforms: [platform],
                          date: video.scheduledDate || new Date().toISOString(),
                          status: video.scheduledDate ? 'scheduled' : 'draft',
                          image: video.sourceImageUrl || null,
                          video: video.generatedVideoUrl || null,
                          type: 'video',
                        }),
                      });
                      if (response.ok) successCount++;
                    } catch (err) {
                      console.error('Failed to schedule video:', err);
                    }
                  }
                  if (successCount < videos.length) {
                    console.warn(`Only ${successCount}/${videos.length} videos scheduled`);
                  }
                }}
                trigger={
                  <Button variant="outline" className="gap-2 border-violet-200 hover:bg-violet-50">
                    <Upload className="w-4 h-4" />
                    Import rapide
                  </Button>
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">Score de viralité</p>
                <p className={`text-2xl font-bold ${getScoreColor(viralityScore)}`}>{viralityScore}/100</p>
              </div>
              <div className="w-20 h-20">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke={viralityScore >= 80 ? '#22c55e' : viralityScore >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${viralityScore * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setStep(step.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-violet-100 text-violet-700' 
                        : isCompleted 
                          ? 'bg-green-50 text-green-600' 
                          : 'text-gray-400 hover:text-gray-600'
                    }`}
                    data-testid={`step-${step.id}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive 
                        ? 'bg-violet-500 text-white' 
                        : isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-sm">{step.label}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100 bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {currentStep === 'script' && (
                  <>
                    {savedProjects.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold text-gray-700">Projets importés ({savedProjects.length})</Label>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {savedProjects.slice(0, 5).map((p, idx) => (
                            <div
                              key={p.id}
                              className="flex-shrink-0 p-3 rounded-lg bg-white border shadow-sm cursor-pointer hover:border-violet-300 transition-all w-48"
                              onClick={() => loadProject(p.id)}
                              data-testid={`saved-project-${idx}`}
                            >
                              <p className="text-xs font-medium text-gray-800 line-clamp-2">{p.script.substring(0, 60) || "Nouveau projet"}...</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {p.format === 'tiktok' ? 'TT' : p.format === 'instagram-reel' ? 'IG' : 'YT'}
                                </Badge>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                                  className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Templates de script</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => applyTemplate(template.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              project.selectedTemplate === template.id
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            data-testid={`template-${template.id}`}
                          >
                            <p className="font-semibold text-sm">{template.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Hooks d'accroche</Label>
                      <div className="flex flex-wrap gap-2">
                        {HOOKS.map((hook) => {
                          const Icon = hook.icon;
                          return (
                            <Button
                              key={hook.id}
                              variant="outline"
                              size="sm"
                              onClick={() => insertHook(hook.text)}
                              className="gap-2 rounded-full"
                              data-testid={`hook-${hook.id}`}
                            >
                              <Icon className="w-3 h-3" />
                              {hook.text}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Votre script</Label>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {charCount} caractères
                          </span>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              ~{formatDuration(estimatedDuration)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Textarea
                        value={project.script}
                        onChange={(e) => updateProject({ script: e.target.value })}
                        placeholder="Écrivez votre script ici..."
                        className="min-h-[200px] resize-none bg-gray-50/50 border-gray-200 rounded-xl"
                        data-testid="textarea-video-script"
                      />
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            estimatedDuration >= 7 && estimatedDuration <= 30 
                              ? 'bg-green-500' 
                              : estimatedDuration > 60 
                                ? 'bg-red-500' 
                                : 'bg-violet-500'
                          }`}
                          style={{ width: `${Math.min((estimatedDuration / 60) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Durée optimale: 7-30 secondes pour maximiser l'engagement
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Suggestions IA</Label>
                      <div className="space-y-2">
                        {SCRIPT_SUGGESTIONS.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => updateProject({ script: suggestion })}
                            className="w-full p-4 rounded-xl border border-gray-200 text-left hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                            data-testid={`suggestion-${i}`}
                          >
                            <div className="flex items-start gap-3">
                              <Sparkles className="w-5 h-5 text-violet-500 mt-0.5" />
                              <p className="text-sm text-gray-700 line-clamp-2">{suggestion}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 'voice' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Mic className="w-5 h-5 text-violet-500" />
                          <div>
                            <p className="font-medium">Voix-off IA</p>
                            <p className="text-sm text-gray-500">Générer une voix synthétique</p>
                          </div>
                        </div>
                        <Switch
                          checked={project.voiceSettings.enabled}
                          onCheckedChange={(enabled) => updateProject({ 
                            voiceSettings: { ...project.voiceSettings, enabled } 
                          })}
                          data-testid="switch-voice"
                        />
                      </div>

                      {project.voiceSettings.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 p-4 rounded-xl bg-violet-50 border border-violet-200"
                        >
                          <Button className="w-full gap-2" data-testid="button-generate-voice">
                            <Mic className="w-4 h-4" />
                            Générer la voix-off
                          </Button>
                          <p className="text-xs text-center text-violet-600">
                            Fonctionnalité bientôt disponible
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-gray-700">Sous-titres</Label>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Type className="w-5 h-5 text-violet-500" />
                          <div>
                            <p className="font-medium">Activer les sous-titres</p>
                            <p className="text-sm text-gray-500">+25 pts de viralité</p>
                          </div>
                        </div>
                        <Switch
                          checked={project.subtitles.enabled}
                          onCheckedChange={(enabled) => updateProject({ 
                            subtitles: { ...project.subtitles, enabled } 
                          })}
                          data-testid="switch-subtitles"
                        />
                      </div>

                      {project.subtitles.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-yellow-500" />
                              <div>
                                <p className="font-medium">Mots-clés en surbrillance</p>
                                <p className="text-sm text-gray-500">Style flashy jaune</p>
                              </div>
                            </div>
                            <Switch
                              checked={project.subtitles.highlightKeywords}
                              onCheckedChange={(highlightKeywords) => updateProject({ 
                                subtitles: { ...project.subtitles, highlightKeywords } 
                              })}
                              data-testid="switch-highlight"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {(['minimal', 'bold', 'neon'] as const).map((style) => (
                              <button
                                key={style}
                                onClick={() => updateProject({ 
                                  subtitles: { ...project.subtitles, style } 
                                })}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  project.subtitles.style === style
                                    ? 'border-violet-500 bg-violet-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                data-testid={`style-${style}`}
                              >
                                <p className={`text-center font-semibold ${
                                  style === 'minimal' ? 'text-gray-600' :
                                  style === 'bold' ? 'text-black font-black' :
                                  'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500'
                                }`}>
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </p>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 'visual' && (
                  <>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="freepik">Freepik AI</TabsTrigger>
                        <TabsTrigger value="pexels">Vidéos Stock</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 border-gray-200 hover:border-violet-300 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {project.videoFileName ? (
                              <>
                                <FileVideo className="w-12 h-12 mb-3 text-violet-500" />
                                <p className="text-sm font-medium text-gray-700">{project.videoFileName}</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 mb-3 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold text-violet-600">Cliquez pour uploader</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">MP4 ou MOV</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime"
                            onChange={handleVideoUpload}
                            className="hidden"
                            data-testid="input-video-upload"
                          />
                        </label>
                      </TabsContent>
                      
                      <TabsContent value="freepik" className="space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                              <Video className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Freepik Video AI</h3>
                              <p className="text-sm text-gray-500">Kling v2 & MiniMax Hailuo</p>
                            </div>
                          </div>
                          <FreepikVideoGenerator 
                            onVideoGenerated={(url) => {
                              updateProject({ selectedPexelsVideo: url });
                            }}
                            trigger={
                              <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                                <Film className="w-4 h-4" />
                                Générer une vidéo AI
                              </Button>
                            }
                          />
                        </div>
                        
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Freepik Mystic</h3>
                              <p className="text-sm text-gray-500">Génération d'images ultra-réalistes</p>
                            </div>
                          </div>
                          <FreepikImageGenerator 
                            onImageGenerated={(url) => {
                              updateProject({ selectedPexelsVideo: url });
                            }}
                            trigger={
                              <Button className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                                <Sparkles className="w-4 h-4" />
                                Générer une image AI
                              </Button>
                            }
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pexels" className="space-y-4">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={pexelsSearch}
                              onChange={(e) => setPexelsSearch(e.target.value)}
                              placeholder="Rechercher des vidéos..."
                              className="pl-10 rounded-xl"
                              data-testid="input-pexels-search"
                            />
                          </div>
                          <Button 
                            onClick={() => setIsSearching(true)}
                            className="rounded-xl"
                            data-testid="button-pexels-search"
                          >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {PEXELS_CATEGORIES.map((cat) => (
                            <Button
                              key={cat}
                              variant={pexelsCategory === cat ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPexelsCategory(pexelsCategory === cat ? null : cat)}
                              className="rounded-full"
                              data-testid={`pexels-cat-${cat.toLowerCase()}`}
                            >
                              {cat}
                            </Button>
                          ))}
                        </div>

                        <div className="p-8 rounded-xl border-2 border-dashed border-gray-200 text-center">
                          <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            Entrez une clé API Pexels pour activer cette fonctionnalité
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="grid grid-cols-3 gap-3">
                      {(['tiktok', 'instagram-reel', 'youtube-short'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => updateProject({ format: fmt })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            project.format === fmt
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          data-testid={`format-${fmt}`}
                        >
                          <div className="text-lg font-bold mb-1">
                            {fmt === 'tiktok' ? 'TT' : fmt === 'instagram-reel' ? 'IG' : 'YT'}
                          </div>
                          <div className="text-xs font-medium">
                            {fmt === 'tiktok' ? 'TikTok' : fmt === 'instagram-reel' ? 'Reel' : 'Short'}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            9:16 • {fmt === 'instagram-reel' ? '90s max' : '60s max'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {currentStep === 'music' && (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2 pr-4">
                      {MUSIC_LIBRARY.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => updateProject({ selectedMusic: track.id })}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            project.selectedMusic === track.id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                          data-testid={`music-${track.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              project.selectedMusic === track.id ? 'bg-violet-500' : 'bg-gray-100'
                            }`}>
                              <Music2 className={`w-6 h-6 ${
                                project.selectedMusic === track.id ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{track.name}</p>
                                {track.trending && (
                                  <Badge className="bg-rose-500 text-white text-[10px]">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Tendance
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{track.genre} • {track.duration}</p>
                            </div>
                            {project.selectedMusic === track.id && (
                              <Check className="w-5 h-5 text-violet-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {currentStep === 'export' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <h3 className="text-xl font-bold mb-2">Prêt à exporter</h3>
                      <p className="text-white/80 mb-4">
                        Votre vidéo sera optimisée pour {
                          project.format === 'tiktok' ? 'TikTok (9:16, 60s max)' :
                          project.format === 'instagram-reel' ? 'Instagram Reels (9:16, 90s max)' :
                          'YouTube Shorts (9:16, 60s max)'
                        }
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white rounded-full h-2" 
                            style={{ width: `${viralityScore}%` }}
                          />
                        </div>
                        <span className="font-bold">{viralityScore}/100</span>
                      </div>
                      <p className="text-sm text-white/70 mt-2">{getScoreLabel(viralityScore)}</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Résumé</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500">Durée estimée</p>
                          <p className="font-bold">{formatDuration(estimatedDuration)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500">Format</p>
                          <p className="font-bold capitalize">{project.format.replace('-', ' ')}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500">Sous-titres</p>
                          <p className="font-bold">{project.subtitles.enabled ? 'Activés' : 'Désactivés'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500">Musique</p>
                          <p className="font-bold">
                            {project.selectedMusic 
                              ? MUSIC_LIBRARY.find(m => m.id === project.selectedMusic)?.name 
                              : 'Aucune'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-14 text-lg font-semibold shadow-lg shadow-rose-200"
                      data-testid="button-export-all"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Exporter pour tous les réseaux
                    </Button>

                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="rounded-xl" data-testid="button-export-tiktok">
                        TikTok
                      </Button>
                      <Button variant="outline" className="rounded-xl" data-testid="button-export-reel">
                        Reel
                      </Button>
                      <Button variant="outline" className="rounded-xl" data-testid="button-export-short">
                        Short
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="gap-2 rounded-xl"
                data-testid="button-prev-step"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStepIndex === STEPS.length - 1}
                className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700"
                data-testid="button-next-step"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="w-1/2 p-8 overflow-y-auto bg-gray-50 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant={showOverlay ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOverlay(!showOverlay)}
                className="rounded-xl"
                data-testid="button-toggle-overlay"
              >
                {showOverlay ? "Masquer overlay" : "Afficher overlay"}
              </Button>
            </div>

            <div 
              className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
              style={{ 
                width: '280px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20" />
              
              <div 
                className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden"
                style={{ aspectRatio: '9/16' }}
              >
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      muted={isMuted}
                      onClick={togglePlay}
                      data-testid="video-preview"
                    />
                    {!isPlaying && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                        onClick={togglePlay}
                      >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6 bg-gradient-to-br from-gray-800 to-gray-900">
                    <FileVideo className="w-16 h-16 mb-4 text-gray-600" />
                    <p className="text-sm text-center text-gray-400">
                      Aperçu vidéo
                    </p>
                  </div>
                )}

                {project.subtitles.enabled && project.script && (
                  <div className="absolute bottom-20 left-4 right-4 z-10">
                    <p className={`text-center text-sm leading-tight ${
                      project.subtitles.style === 'minimal' 
                        ? 'text-white font-medium' 
                        : project.subtitles.style === 'bold'
                          ? 'text-white font-black text-base uppercase tracking-wide'
                          : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 font-black'
                    }`} style={project.subtitles.style === 'neon' ? {
                      textShadow: '0 0 10px #ec4899, 0 0 20px #ec4899, 0 0 30px #ec4899'
                    } : project.subtitles.style === 'bold' ? {
                      textShadow: '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000'
                    } : undefined}>
                      {project.subtitles.highlightKeywords ? (
                        project.script.substring(0, 50).split(' ').map((word, i) => (
                          <span key={i} className={i % 3 === 0 ? 'text-yellow-400' : ''}>
                            {word}{' '}
                          </span>
                        ))
                      ) : (
                        project.script.substring(0, 50)
                      )}
                      {project.script.length > 50 && '...'}
                    </p>
                  </div>
                )}

                {showOverlay && (
                  <>
                    <div className="absolute top-4 left-4 right-16 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                        <div>
                          <p className="text-white text-xs font-semibold">@votre_compte</p>
                          <p className="text-white/70 text-[10px]">Suivre</p>
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-xs mt-1">12.5K</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-xs mt-1">432</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Bookmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-xs mt-1">89</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-xs mt-1">Share</span>
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-16 z-10">
                      <div className="flex items-center gap-2">
                        <Music2 className="w-3 h-3 text-white" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-white/80 text-[10px] whitespace-nowrap">
                            {project.selectedMusic 
                              ? MUSIC_LIBRARY.find(m => m.id === project.selectedMusic)?.name 
                              : "Son original"} 
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Format {project.format === 'tiktok' ? 'TikTok' : project.format === 'instagram-reel' ? 'Instagram Reel' : 'YouTube Short'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Ratio 9:16 • 1080x1920px</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
