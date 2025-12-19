import { useState, useEffect } from "react";
import { X, Loader2, Download, RefreshCw, Check, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateImage, type GenerateImageParams } from "@/lib/api";

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const MODELS = [
  { id: "freepik", label: "Freepik Mystic (Ultra-réaliste)", premium: true },
  { id: "dalle", label: "DALL-E 3 (OpenAI)", premium: false },
  { id: "gemini", label: "Gemini (Google)", premium: false },
] as const;

const STYLES = [
  { id: "realistic", label: "Réaliste" },
  { id: "illustration", label: "Illustration" },
  { id: "minimalist", label: "Minimaliste" },
  { id: "3d", label: "3D" },
  { id: "watercolor", label: "Aquarelle" },
] as const;

export function ImageGenerator({ isOpen, onClose, onSelectImage }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"freepik" | "dalle" | "gemini">("freepik");
  const [style, setStyle] = useState<"realistic" | "illustration" | "minimalist" | "3d" | "watercolor">("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [freepikTaskId, setFreepikTaskId] = useState<string | null>(null);
  const [freepikProgress, setFreepikProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (freepikTaskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/freepik/task/${freepikTaskId}`);
          const data = await response.json();
          
          const successStatuses = ["COMPLETED", "FINISHED", "READY"];
          const failedStatuses = ["FAILED", "ERROR"];
          
          if (successStatuses.includes(data.status) && data.imageUrl) {
            setGeneratedImages([data.imageUrl]);
            setIsGenerating(false);
            setFreepikTaskId(null);
            setFreepikProgress(100);
          } else if (failedStatuses.includes(data.status)) {
            setError("La génération Freepik a échoué");
            setIsGenerating(false);
            setFreepikTaskId(null);
          } else {
            setFreepikProgress((prev) => Math.min(prev + 10, 90));
          }
        } catch (err) {
          console.error("Error checking Freepik task:", err);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [freepikTaskId, isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setFreepikProgress(10);

    try {
      if (model === "freepik") {
        const response = await fetch("/api/freepik/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            aspect_ratio: "1:1",
            resolution: "2k",
            style,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Erreur Freepik");
        }
        
        if (data.task_id) {
          setFreepikTaskId(data.task_id);
          setFreepikProgress(20);
        }
      } else {
        const results: string[] = [];
        for (let i = 0; i < 4; i++) {
          const result = await generateImage({ prompt, model, style });
          results.push(result.imageUrl);
          setGeneratedImages([...results]);
        }
        setIsGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (model === "freepik") {
      handleGenerate();
      return;
    }
    
    setRegeneratingIndex(index);
    setError(null);

    try {
      const result = await generateImage({ prompt, model: model as "dalle" | "gemini", style });
      const newImages = [...generatedImages];
      newImages[index] = result.imageUrl;
      setGeneratedImages(newImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la régénération");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onClose();
  };

  const handleClose = () => {
    setPrompt("");
    setGeneratedImages([]);
    setError(null);
    setIsGenerating(false);
    setFreepikTaskId(null);
    setFreepikProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-image-generator">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl" data-testid="title-image-generator">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            Générateur d'images IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Description de l'image
            </Label>
            <Textarea
              id="prompt"
              placeholder="Décrivez l'image que vous souhaitez générer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="textarea-prompt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Modèle IA</Label>
              <Select value={model} onValueChange={(value: "freepik" | "dalle" | "gemini") => setModel(value)}>
                <SelectTrigger data-testid="select-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} data-testid={`option-model-${m.id}`}>
                      <div className="flex items-center gap-2">
                        {m.id === "freepik" && <Sparkles className="w-4 h-4 text-cyan-500" />}
                        {m.label}
                        {m.premium && <Badge className="ml-1 bg-cyan-500 text-white text-[10px] px-1.5 py-0">PRO</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Style</Label>
              <Select value={style} onValueChange={(value: typeof style) => setStyle(value)}>
                <SelectTrigger data-testid="select-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.id} value={s.id} data-testid={`option-style-${s.id}`}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6"
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {model === "freepik" 
                  ? `Génération Freepik... ${freepikProgress}%`
                  : `Génération en cours... (${generatedImages.length}/4)`
                }
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="text-error">
              {error}
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg" data-testid="title-results">
                Images générées ({generatedImages.length})
              </h3>
              <div className="grid grid-cols-2 gap-4" data-testid="grid-images">
                {generatedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border bg-muted/30"
                    data-testid={`image-container-${index}`}
                  >
                    <div className="aspect-square relative">
                      {regeneratingIndex === index ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`Image générée ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`image-${index}`}
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUseImage(imageUrl)}
                        className="bg-white hover:bg-gray-100 text-gray-900"
                        data-testid={`button-use-${index}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Utiliser
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(imageUrl, index)}
                        className="bg-white hover:bg-gray-100 text-gray-900"
                        data-testid={`button-download-${index}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRegenerate(index)}
                        disabled={regeneratingIndex !== null}
                        className="bg-white hover:bg-gray-100 text-gray-900"
                        data-testid={`button-regenerate-${index}`}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Régénérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
