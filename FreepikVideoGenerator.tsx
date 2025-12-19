import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Video, Loader2, Sparkles, Image, Clock, Wand2 } from "lucide-react";

interface FreepikVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
  trigger?: React.ReactNode;
}

const VIDEO_MODELS = [
  { 
    value: "kling-v2", 
    label: "Kling v2", 
    description: "Image-to-Video haute qualité",
    requiresImage: true,
    durations: ["5", "10"]
  },
  { 
    value: "minimax", 
    label: "MiniMax Hailuo", 
    description: "Text-to-Video ou Image-to-Video",
    requiresImage: false,
    durations: ["6", "10"]
  },
];

export function FreepikVideoGenerator({ onVideoGenerated, trigger }: FreepikVideoGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [model, setModel] = useState("minimax");
  const [duration, setDuration] = useState("6");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const selectedModel = VIDEO_MODELS.find(m => m.value === model);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (taskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/freepik/video-task/${taskId}?model=${model}`);
          const data = await response.json();
          
          const successStatuses = ["COMPLETED", "FINISHED", "READY"];
          const failedStatuses = ["FAILED", "ERROR"];
          
          if (successStatuses.includes(data.status) && data.videoUrl) {
            setGeneratedVideo(data.videoUrl);
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            toast({
              title: "Vidéo générée",
              description: "Votre vidéo est prête",
            });
          } else if (failedStatuses.includes(data.status)) {
            setIsGenerating(false);
            setTaskId(null);
            toast({
              title: "Erreur",
              description: "La génération a échoué",
              variant: "destructive",
            });
          } else {
            setProgress((prev) => Math.min(prev + 5, 90));
          }
        } catch (error) {
          console.error("Error checking video task:", error);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId, isGenerating, model, toast]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Veuillez décrire la vidéo que vous souhaitez générer",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedModel?.requiresImage && !imageUrl.trim()) {
      toast({
        title: "Image requise",
        description: `${selectedModel.label} nécessite une image de référence`,
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setProgress(10);
    setGeneratedVideo(null);
    
    try {
      const response = await fetch("/api/freepik/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: imageUrl || undefined,
          model,
          duration,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération");
      }
      
      if (data.task_id) {
        setTaskId(data.task_id);
        setProgress(20);
        toast({
          title: "Génération en cours",
          description: "Freepik travaille sur votre vidéo...",
        });
      }
      
    } catch (error: any) {
      setIsGenerating(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la vidéo",
        variant: "destructive",
      });
    }
  };

  const handleUseVideo = () => {
    if (generatedVideo && onVideoGenerated) {
      onVideoGenerated(generatedVideo);
      setOpen(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setGeneratedVideo(null);
      setPrompt("");
      setImageUrl("");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Video className="w-4 h-4" />
            Freepik Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-freepik-video">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Générateur Vidéo Freepik
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Select value={model} onValueChange={(v) => {
                setModel(v);
                const newModel = VIDEO_MODELS.find(m => m.value === v);
                if (newModel) {
                  setDuration(newModel.durations[0]);
                }
              }}>
                <SelectTrigger data-testid="select-video-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-gray-500">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Durée
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="select-video-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedModel?.durations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} secondes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              Image de référence {selectedModel?.requiresImage ? "(requis)" : "(optionnel)"}
            </Label>
            <Input
              placeholder="URL de l'image (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              data-testid="input-video-image-url"
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description du mouvement</Label>
            <Textarea
              placeholder="Décrivez le mouvement souhaité dans la vidéo... (ex: La personne sourit et tourne la tête lentement vers la droite)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              data-testid="textarea-video-prompt"
            />
          </div>

          {isGenerating && (
            <div className="space-y-2 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours... (peut prendre 1-3 minutes)
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">
                {progress < 30 ? "Initialisation..." : 
                 progress < 60 ? "Traitement de l'image..." : 
                 progress < 90 ? "Création de la vidéo..." : "Finalisation..."}
              </p>
            </div>
          )}

          {generatedVideo && (
            <div className="space-y-3">
              <Label>Vidéo générée</Label>
              <div className="rounded-lg overflow-hidden border bg-black">
                <video 
                  src={generatedVideo} 
                  controls 
                  className="w-full"
                  data-testid="video-generated-preview"
                />
              </div>
              <Button 
                onClick={handleUseVideo} 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                data-testid="button-use-video"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Utiliser cette vidéo
              </Button>
            </div>
          )}

          {!generatedVideo && (
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || (selectedModel?.requiresImage && !imageUrl.trim())}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              data-testid="button-generate-video"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération... {progress}%
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Générer la vidéo
                </>
              )}
            </Button>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Conseils :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kling v2 : Meilleur pour animer une image existante</li>
              <li>MiniMax : Peut créer une vidéo à partir du texte seul</li>
              <li>Utilisez des descriptions de mouvement précises</li>
              <li>La génération prend 1 à 3 minutes</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
