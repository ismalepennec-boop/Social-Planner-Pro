import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Copy, Check, Zap } from "lucide-react";
import { generateCaption, type GenerateCaptionParams } from "@/lib/api";

interface CaptionGeneratorProps {
  onUseCaption: (caption: string) => void;
}

export function CaptionGenerator({ onUseCaption }: CaptionGeneratorProps) {
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "humorous">("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [keywords, setKeywords] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!subject.trim()) {
      setError("Veuillez entrer un sujet");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const params: GenerateCaptionParams = {
        subject: subject.trim(),
        tone,
        length,
        keywords: keywords.trim() ? keywords.split(",").map(k => k.trim()).filter(Boolean) : undefined,
      };

      const result = await generateCaption(params);
      setCaptions(result.captions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCaption = (caption: string, index: number) => {
    onUseCaption(caption);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-5" data-testid="caption-generator">
      <div className="space-y-4">
        <div>
          <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Sujet du post *
          </Label>
          <Input
            id="subject"
            placeholder="Ex: Lancement de notre nouveau produit..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-gray-50/50 border-gray-200 rounded-xl focus:ring-violet-500 focus:border-violet-400"
            data-testid="input-caption-subject"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Ton</Label>
          <RadioGroup
            value={tone}
            onValueChange={(v) => setTone(v as typeof tone)}
            className="flex flex-wrap gap-2"
            data-testid="radio-tone"
          >
            {[
              { value: "professional", label: "Professionnel" },
              { value: "casual", label: "Décontracté" },
              { value: "humorous", label: "Humoristique" },
            ].map((opt) => (
              <div key={opt.value} className="flex-1">
                <RadioGroupItem value={opt.value} id={`tone-${opt.value}`} className="sr-only" data-testid={`radio-tone-${opt.value}`} />
                <Label
                  htmlFor={`tone-${opt.value}`}
                  className={`flex items-center justify-center px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer transition-all border ${
                    tone === opt.value
                      ? "bg-violet-100 border-violet-300 text-violet-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Longueur</Label>
          <RadioGroup
            value={length}
            onValueChange={(v) => setLength(v as typeof length)}
            className="flex gap-2"
            data-testid="radio-length"
          >
            {[
              { value: "short", label: "Court" },
              { value: "medium", label: "Moyen" },
              { value: "long", label: "Long" },
            ].map((opt) => (
              <div key={opt.value} className="flex-1">
                <RadioGroupItem value={opt.value} id={`len-${opt.value}`} className="sr-only" data-testid={`radio-length-${opt.value}`} />
                <Label
                  htmlFor={`len-${opt.value}`}
                  className={`flex items-center justify-center px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer transition-all border ${
                    length === opt.value
                      ? "bg-violet-100 border-violet-300 text-violet-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="keywords" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Mots-clés (optionnel)
          </Label>
          <Input
            id="keywords"
            placeholder="innovation, qualité, service..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-gray-50/50 border-gray-200 rounded-xl focus:ring-violet-500 focus:border-violet-400"
            data-testid="input-caption-keywords"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !subject.trim()}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl h-12 shadow-lg shadow-violet-200 font-semibold"
          data-testid="button-generate-caption"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des captions
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600" data-testid="text-caption-error">{error}</p>
          </div>
        )}
      </div>

      {captions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-100" data-testid="caption-results">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <Label className="text-sm font-semibold text-gray-900">Suggestions générées</Label>
          </div>
          <div className="space-y-3">
            {captions.map((caption, index) => (
              <div 
                key={index} 
                className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all"
                data-testid={`card-caption-${index}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed" data-testid={`text-caption-${index}`}>
                    {caption}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={copiedIndex === index ? "default" : "outline"}
                  onClick={() => handleUseCaption(caption, index)}
                  className={`w-full rounded-xl transition-all ${
                    copiedIndex === index 
                      ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500" 
                      : "border-gray-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                  }`}
                  data-testid={`button-use-caption-${index}`}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-2" />
                      Appliqué !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Utiliser cette caption
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
