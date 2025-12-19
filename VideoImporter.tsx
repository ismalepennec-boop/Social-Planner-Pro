import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Loader2, 
  Sparkles, 
  Check, 
  Calendar,
  Video,
  Zap,
  FileText,
  Image,
  Music,
  Clock,
  Edit2,
  Play,
  CalendarPlus,
  ChevronRight,
  RefreshCw
} from "lucide-react";

interface ParsedVideo {
  script: string;
  hook: string;
  template: string;
  format: string;
  scheduledDate: string | null;
  musicStyle: string;
  imageKeywords?: string[];
  videoKeywords?: string[];
  suggestedTitle?: string;
  estimatedDuration?: number;
  selectedImage?: { url: string; photographer: string } | null;
  selectedVideo?: { url: string; image: string } | null;
  generatedVideoUrl?: string;
  videoTaskId?: string;
  videoGenerating?: boolean;
  sourceImageUrl?: string;
  videoModel?: 'kling' | 'minimax';
}

interface PexelsImage {
  id: number;
  src: { medium: string; large: string };
  photographer: string;
}

interface PexelsVideo {
  id: number;
  image: string;
  video_files: { link: string; quality: string }[];
}

interface VideoImporterProps {
  onImport: (videos: ParsedVideo[]) => void;
  onScheduleAll?: (videos: ParsedVideo[]) => void;
  trigger?: React.ReactNode;
}

const HOOK_LABELS: Record<string, string> = {
  "saviez-vous": "Saviez-vous que...",
  "astuces": "3 astuces pour...",
  "erreur": "L'erreur que tout le monde fait",
  "secret": "Le secret que personne ne vous dit",
  "arretez": "Arrêtez de faire ça !",
};

const TEMPLATE_LABELS: Record<string, string> = {
  "viral-hook": "Viral Hook",
  "tutorial": "Tutorial",
  "product-review": "Product Review",
};

const FORMAT_LABELS: Record<string, string> = {
  "tiktok": "TikTok",
  "instagram-reel": "Reel Instagram",
  "youtube-short": "YouTube Short",
};

const MUSIC_LABELS: Record<string, string> = {
  "upbeat": "Dynamique",
  "calm": "Calme",
  "dramatic": "Dramatique",
  "trendy": "Tendance",
  "corporate": "Corporate",
};

export function VideoImporter({ onImport, onScheduleAll, trigger }: VideoImporterProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedVideos, setParsedVideos] = useState<ParsedVideo[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "enrich">("input");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [bulkScheduleDate, setBulkScheduleDate] = useState("");
  const [bulkScheduleInterval, setBulkScheduleInterval] = useState("24");
  const [generatingVideos, setGeneratingVideos] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generateVideoForProject = async (index: number, imageUrl?: string) => {
    const video = parsedVideos[index];
    if (!video) return;

    // Use Kling for image-to-video if image provided, otherwise MiniMax for text-to-video
    const hasImage = imageUrl || video.sourceImageUrl;
    const modelToUse = hasImage ? "kling" : "minimax";

    setGeneratingVideos(prev => new Set(prev).add(index));
    updateVideo(index, { 
      videoGenerating: true, 
      sourceImageUrl: imageUrl || video.sourceImageUrl,
      videoModel: modelToUse,
    });

    try {
      const response = await fetch("/api/freepik/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: video.script.slice(0, 200), // Limit prompt length
          model: modelToUse,
          duration: 6,
          image: hasImage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur de génération");
      }

      const data = await response.json();
      const taskId = data.task_id;

      if (taskId) {
        updateVideo(index, { videoTaskId: taskId });
        // Start polling for video completion with the correct model
        pollVideoStatus(index, taskId, modelToUse);
      }
    } catch (error) {
      console.error("Video generation error:", error);
      updateVideo(index, { videoGenerating: false });
      setGeneratingVideos(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      toast({
        title: "Erreur",
        description: "Impossible de générer la vidéo",
        variant: "destructive",
      });
    }
  };

  const pollVideoStatus = async (index: number, taskId: string, model: 'kling' | 'minimax' = 'minimax') => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateVideo(index, { videoGenerating: false });
        setGeneratingVideos(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        return;
      }

      try {
        const response = await fetch(`/api/freepik/video-task/${taskId}?model=${model}`);
        const data = await response.json();

        if (data.status === "COMPLETED" || data.status === "FINISHED" || data.status === "READY") {
          updateVideo(index, { 
            generatedVideoUrl: data.videoUrl,
            videoGenerating: false,
          });
          setGeneratingVideos(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
          toast({
            title: "Vidéo générée",
            description: `Vidéo ${index + 1} prête`,
          });
        } else if (data.status === "FAILED" || data.status === "ERROR") {
          updateVideo(index, { videoGenerating: false });
          setGeneratingVideos(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
        } else {
          // Still processing, poll again
          attempts++;
          setTimeout(poll, 5000);
        }
      } catch {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const handleParse = async () => {
    if (!text.trim()) {
      toast({
        title: "Texte requis",
        description: "Veuillez entrer une description de vos vidéos",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    
    try {
      const response = await fetch("/api/ai/parse-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du parsing");
      }
      
      if (data.videos && data.videos.length > 0) {
        setParsedVideos(data.videos);
        setStep("preview");
        toast({
          title: "Analyse terminée",
          description: `${data.videos.length} vidéo(s) détectée(s)`,
        });
      } else {
        toast({
          title: "Aucune vidéo détectée",
          description: "Essayez de décrire plus clairement vos vidéos",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'analyser le texte",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const searchPexelsImages = async (keywords: string[]): Promise<PexelsImage[]> => {
    try {
      const query = keywords.join(" ");
      const response = await fetch(`/api/pexels/search?query=${encodeURIComponent(query)}&per_page=4`);
      const data = await response.json();
      return data.photos || [];
    } catch {
      return [];
    }
  };

  const searchPexelsVideos = async (keywords: string[]): Promise<PexelsVideo[]> => {
    try {
      const query = keywords.join(" ");
      const response = await fetch(`/api/pexels/videos?query=${encodeURIComponent(query)}&per_page=4`);
      const data = await response.json();
      return data.videos || [];
    } catch {
      return [];
    }
  };

  const enrichWithMedia = async () => {
    setIsLoadingMedia(true);
    
    try {
      const enrichedVideos = await Promise.all(
        parsedVideos.map(async (video) => {
          const [images, videos] = await Promise.all([
            video.imageKeywords ? searchPexelsImages(video.imageKeywords) : Promise.resolve([]),
            video.videoKeywords ? searchPexelsVideos(video.videoKeywords) : Promise.resolve([]),
          ]);
          
          return {
            ...video,
            suggestedImages: images,
            suggestedVideos: videos,
            selectedImage: images[0] ? { url: images[0].src.large, photographer: images[0].photographer } : null,
            selectedVideo: videos[0] ? { 
              url: videos[0].video_files.find(f => f.quality === "hd")?.link || videos[0].video_files[0]?.link || "",
              image: videos[0].image 
            } : null,
          };
        })
      );
      
      setParsedVideos(enrichedVideos);
      setStep("enrich");
      toast({
        title: "Médias trouvés",
        description: "Images et vidéos suggérées pour chaque projet",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les médias",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const updateVideo = (index: number, updates: Partial<ParsedVideo>) => {
    setParsedVideos(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const applyBulkSchedule = () => {
    if (!bulkScheduleDate) {
      toast({
        title: "Date requise",
        description: "Veuillez sélectionner une date de début",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(bulkScheduleDate);
    const intervalHours = parseInt(bulkScheduleInterval);

    const scheduledVideos = parsedVideos.map((video, index) => {
      const scheduleDate = new Date(startDate);
      scheduleDate.setHours(scheduleDate.getHours() + (index * intervalHours));
      return {
        ...video,
        scheduledDate: scheduleDate.toISOString(),
      };
    });

    setParsedVideos(scheduledVideos);
    toast({
      title: "Planification appliquée",
      description: `${parsedVideos.length} vidéos planifiées`,
    });
  };

  const handleImport = () => {
    onImport(parsedVideos);
    toast({
      title: "Import réussi",
      description: `${parsedVideos.length} vidéo(s) ajoutée(s) à votre planning`,
    });
    handleClose();
  };

  const handleScheduleAll = () => {
    if (onScheduleAll) {
      onScheduleAll(parsedVideos);
      toast({
        title: "Planification créée",
        description: `${parsedVideos.length} post(s) ajoutés au calendrier`,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setText("");
    setParsedVideos([]);
    setStep("input");
    setEditingIndex(null);
    setOpen(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Non planifiée";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Non planifiée";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import rapide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-video-importer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Import rapide de vidéos
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'input' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
            Description
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'preview' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
            Aperçu
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'enrich' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">3</span>
            Médias & Planification
          </div>
        </div>

        {step === "input" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-sm text-gray-700">
                Décrivez vos vidéos en texte libre. L'IA analysera et suggérera automatiquement :
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500" /> Script et accroche
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500" /> Images de fond
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500" /> Vidéos de fond
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500" /> Style musical
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Décrivez vos vidéos</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Exemple:

Vidéo 1 - pour demain 14h sur TikTok:
"Saviez-vous que 80% des gens font cette erreur ? Voici comment l'éviter..."

Vidéo 2 - vendredi sur Instagram:
Tutorial sur comment utiliser notre produit. Montrer les fonctionnalités.

Vidéo 3:
Réponse à un commentaire viral - format YouTube Short, style humoristique`}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-video-import"
              />
            </div>

            <Button
              onClick={handleParse}
              disabled={!text.trim() || isParsing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              data-testid="button-parse-videos"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {parsedVideos.length} vidéo(s) détectée(s)
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("input")}>
                Modifier le texte
              </Button>
            </div>

            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {parsedVideos.map((video, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl border bg-white shadow-sm"
                    data-testid={`video-preview-${index}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {FORMAT_LABELS[video.format] || video.format}
                        </Badge>
                        {video.estimatedDuration && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {video.estimatedDuration}s
                          </Badge>
                        )}
                      </div>
                    </div>

                    {video.suggestedTitle && (
                      <p className="text-sm font-medium text-gray-900 mb-1">{video.suggestedTitle}</p>
                    )}
                    
                    {editingIndex === index ? (
                      <div className="mb-3">
                        <Textarea
                          value={video.script}
                          onChange={(e) => updateVideo(index, { script: e.target.value })}
                          rows={4}
                          className="text-sm"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-2 text-xs"
                          onClick={() => setEditingIndex(null)}
                        >
                          <Check className="w-3 h-3 mr-1" /> Valider
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="text-sm text-gray-600 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors"
                        onClick={() => setEditingIndex(index)}
                        title="Cliquer pour modifier"
                      >
                        {video.script}
                        <Edit2 className="w-3 h-3 inline ml-2 text-gray-400" />
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {HOOK_LABELS[video.hook] || video.hook}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        {TEMPLATE_LABELS[video.template] || video.template}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                        <Music className="w-3 h-3 mr-1" />
                        {MUSIC_LABELS[video.musicStyle] || video.musicStyle}
                      </Badge>
                    </div>

                    <div className="flex gap-2 text-xs text-gray-500">
                      {video.imageKeywords && (
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {video.imageKeywords.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep("enrich")}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                data-testid="button-enrich-media"
              >
                <Video className="w-4 h-4 mr-2" />
                Générer les vidéos
              </Button>
            </div>
          </div>
        )}

        {step === "enrich" && (
          <div className="space-y-4">
            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="videos">Vidéos ({parsedVideos.length})</TabsTrigger>
                <TabsTrigger value="schedule">Planification</TabsTrigger>
              </TabsList>

              <TabsContent value="videos" className="mt-4">
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-4">
                    {parsedVideos.map((video, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border bg-white shadow-sm"
                        data-testid={`video-enriched-${index}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-32">
                            {video.generatedVideoUrl ? (
                              <video 
                                src={video.generatedVideoUrl}
                                className="w-32 h-44 rounded-lg object-cover bg-black"
                                controls
                                muted
                                loop
                              />
                            ) : video.videoGenerating ? (
                              <div className="w-32 h-44 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col items-center justify-center">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin mb-2" />
                                <p className="text-[10px] text-purple-600 text-center px-2">Génération en cours...</p>
                              </div>
                            ) : video.sourceImageUrl ? (
                              <div className="relative w-32 h-44">
                                <img 
                                  src={video.sourceImageUrl}
                                  alt="Source"
                                  className="w-32 h-44 rounded-lg object-cover"
                                />
                                <button
                                  onClick={() => generateVideoForProject(index)}
                                  className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-black/60 transition-colors"
                                >
                                  <Play className="w-6 h-6 text-white" />
                                  <span className="text-[10px] text-white font-medium">Animer</span>
                                </button>
                              </div>
                            ) : (
                              <div className="w-32 h-44 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50 flex flex-col items-center justify-center gap-1 p-2">
                                <button
                                  onClick={() => generateVideoForProject(index)}
                                  className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                                >
                                  <Sparkles className="w-5 h-5 text-purple-400" />
                                  <span className="text-[9px] text-purple-600 font-medium">IA Texte</span>
                                </button>
                                <div className="w-8 border-t border-purple-200 my-1" />
                                <button
                                  onClick={() => {
                                    const url = window.prompt("Entrez l'URL de l'image:");
                                    if (url && url.startsWith("http")) {
                                      updateVideo(index, { sourceImageUrl: url });
                                    }
                                  }}
                                  className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                                >
                                  <Image className="w-5 h-5 text-purple-400" />
                                  <span className="text-[9px] text-purple-600 font-medium text-center">URL Image</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {FORMAT_LABELS[video.format] || video.format}
                                </Badge>
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <Music className="w-3 h-3 mr-1" />
                                  {MUSIC_LABELS[video.musicStyle] || video.musicStyle}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>

                            {video.suggestedTitle && (
                              <p className="text-sm font-medium text-gray-900 mb-1">{video.suggestedTitle}</p>
                            )}
                            <p className="text-xs text-gray-600 line-clamp-2">{video.script}</p>

                            {video.scheduledDate && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                                <Calendar className="w-3 h-3" />
                                {formatDate(video.scheduledDate)}
                              </div>
                            )}

                            {editingIndex === index && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Format</Label>
                                    <Select
                                      value={video.format}
                                      onValueChange={(v) => updateVideo(index, { format: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Musique</Label>
                                    <Select
                                      value={video.musicStyle}
                                      onValueChange={(v) => updateVideo(index, { musicStyle: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(MUSIC_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Date de publication</Label>
                                  <Input
                                    type="datetime-local"
                                    value={video.scheduledDate?.slice(0, 16) || ""}
                                    onChange={(e) => updateVideo(index, { 
                                      scheduledDate: e.target.value ? new Date(e.target.value).toISOString() : null 
                                    })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="schedule" className="mt-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4">
                  <p className="text-sm font-medium text-gray-700">Planification en masse</p>
                  <p className="text-xs text-gray-500">Planifiez toutes les vidéos automatiquement à partir d'une date</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Date de début</Label>
                      <Input
                        type="datetime-local"
                        value={bulkScheduleDate}
                        onChange={(e) => setBulkScheduleDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Intervalle entre vidéos</Label>
                      <Select value={bulkScheduleInterval} onValueChange={setBulkScheduleInterval}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 heures</SelectItem>
                          <SelectItem value="12">12 heures</SelectItem>
                          <SelectItem value="24">1 jour</SelectItem>
                          <SelectItem value="48">2 jours</SelectItem>
                          <SelectItem value="72">3 jours</SelectItem>
                          <SelectItem value="168">1 semaine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={applyBulkSchedule} className="w-full" variant="secondary">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Appliquer la planification
                  </Button>

                  {parsedVideos.some(v => v.scheduledDate) && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Aperçu du planning :</p>
                      {parsedVideos.map((video, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg">
                          <span className="text-gray-700 truncate max-w-[200px]">
                            {video.suggestedTitle || video.script.slice(0, 30) + "..."}
                          </span>
                          <span className="text-purple-600 font-medium">
                            {formatDate(video.scheduledDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("preview")}
              >
                Retour
              </Button>
              <Button
                variant="outline"
                onClick={() => enrichWithMedia()}
                disabled={isLoadingMedia}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingMedia ? 'animate-spin' : ''}`} />
                Actualiser médias
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1"
                variant="secondary"
                data-testid="button-import-to-lab"
              >
                <Video className="w-4 h-4 mr-2" />
                Importer au Lab
              </Button>
              {onScheduleAll && (
                <Button
                  onClick={handleScheduleAll}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  data-testid="button-schedule-all"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Planifier tout
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
