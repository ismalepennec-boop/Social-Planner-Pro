import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Sparkles, 
  Loader2, 
  Download, 
  Check,
  ImageIcon,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FreepikImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  trigger?: React.ReactNode;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "Carré (1:1)", description: "Instagram, Facebook" },
  { value: "16:9", label: "Paysage (16:9)", description: "YouTube, LinkedIn" },
  { value: "9:16", label: "Portrait (9:16)", description: "Stories, Reels" },
  { value: "4:3", label: "Classique (4:3)", description: "Standard" },
  { value: "3:4", label: "Portrait (3:4)", description: "Pinterest" },
];

const RESOLUTIONS = [
  { value: "1k", label: "1K", description: "Rapide" },
  { value: "2k", label: "2K", description: "Recommandé" },
  { value: "4k", label: "4K", description: "Haute qualité" },
];

const STYLE_PRESETS = [
  { value: "", label: "Auto", icon: "Auto" },
  { value: "realistic", label: "Réaliste" },
  { value: "illustration", label: "Illustration" },
  { value: "3d", label: "3D" },
  { value: "minimalist", label: "Minimaliste" },
  { value: "cinematic", label: "Cinématique" },
];

export function FreepikImageGenerator({ onImageGenerated, trigger }: FreepikImageGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2k");
  const [style, setStyle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (taskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/freepik/task/${taskId}`);
          const data = await response.json();
          
          const successStatuses = ["COMPLETED", "FINISHED", "READY"];
          const failedStatuses = ["FAILED", "ERROR"];
          
          if (successStatuses.includes(data.status) && data.imageUrl) {
            setGeneratedImage(data.imageUrl);
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            toast({
              title: "Image générée",
              description: "Votre image est prête",
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
            setProgress((prev) => Math.min(prev + 10, 90));
          }
        } catch (error) {
          console.error("Error checking task:", error);
        }
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [taskId, isGenerating, toast]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Veuillez décrire l'image que vous souhaitez générer",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setProgress(10);
    setGeneratedImage(null);
    
    try {
      const response = await fetch("/api/freepik/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          style,
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
          description: "Freepik travaille sur votre image...",
        });
      }
    } catch (error: any) {
      setIsGenerating(false);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      setOpen(false);
      setGeneratedImage(null);
      setPrompt("");
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setIsGenerating(false);
          setTaskId(null);
          setProgress(0);
        }
        setOpen(newOpen);
      }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Wand2 className="w-4 h-4" />
            Freepik AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Générateur d'images Freepik
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description de l'image</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez l'image que vous souhaitez créer... Ex: Un paysage de montagne au coucher du soleil avec un lac cristallin"
                className="min-h-[120px] resize-none"
                data-testid="freepik-prompt"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger data-testid="freepik-aspect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        <div>
                          <div className="font-medium">{ratio.label}</div>
                          <div className="text-xs text-gray-500">{ratio.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Résolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger data-testid="freepik-resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        <div>
                          <div className="font-medium">{res.label}</div>
                          <div className="text-xs text-gray-500">{res.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setStyle(preset.value)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      style === preset.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    data-testid={`freepik-style-${preset.value || 'auto'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              data-testid="freepik-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération... {progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer avec Freepik
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <Label>Aperçu</Label>
            <div 
              className={`relative rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 ${
                aspectRatio === "9:16" ? "aspect-[9/16]" : 
                aspectRatio === "16:9" ? "aspect-video" :
                aspectRatio === "4:3" ? "aspect-[4/3]" :
                aspectRatio === "3:4" ? "aspect-[3/4]" :
                "aspect-square"
              }`}
            >
              {generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-cover"
                  data-testid="freepik-result"
                />
              ) : isGenerating ? (
                <div className="text-center p-6">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">Génération en cours...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-4 mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm text-gray-400">L'image apparaîtra ici</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUseImage}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="freepik-use"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Utiliser cette image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(generatedImage, '_blank')}
                  data-testid="freepik-download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="secondary">Freepik Mystic</Badge>
            <span>Génération ultra-réaliste</span>
          </div>
          <p className="text-xs text-gray-400">
            Propulsé par l'IA Freepik
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
