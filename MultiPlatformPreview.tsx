import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Linkedin, Instagram, Facebook, Copy, Check, AlertTriangle } from "lucide-react";
import { PLATFORM_LIMITS, adaptContentForPlatform, getCharacterStatus, countHashtags } from "@/utils/platformLimits";

const SUPPORTED_PLATFORMS = ["instagram", "linkedin", "facebook"];

interface MultiPlatformPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  onDuplicate: (platforms: string[], adaptedContents: Record<string, string>) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "linkedin":
      return <Linkedin className="w-4 h-4" />;
    case "instagram":
      return <Instagram className="w-4 h-4" />;
    case "facebook":
      return <Facebook className="w-4 h-4" />;
    default:
      return null;
  }
};

export function MultiPlatformPreview({ 
  open, 
  onOpenChange, 
  originalContent,
  onDuplicate 
}: MultiPlatformPreviewProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin", "facebook"]);
  const [adaptedContents, setAdaptedContents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    SUPPORTED_PLATFORMS.forEach(p => {
      initial[p] = adaptContentForPlatform(originalContent, p);
    });
    return initial;
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const updateContent = (platform: string, content: string) => {
    setAdaptedContents(prev => ({ ...prev, [platform]: content }));
  };

  const handleDuplicate = () => {
    onDuplicate(selectedPlatforms, adaptedContents);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-indigo-600" />
            Dupliquer vers plusieurs plateformes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
            {SUPPORTED_PLATFORMS.map((platformId) => {
              const platform = PLATFORM_LIMITS[platformId];
              return (
                <label
                  key={platform.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <span style={{ color: platform.color }}>
                    <PlatformIcon platform={platform.id} />
                  </span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </label>
              );
            })}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {selectedPlatforms.map((platformId) => {
                const platform = PLATFORM_LIMITS[platformId];
                const content = adaptedContents[platformId] || "";
                const charStatus = getCharacterStatus(content.length, platform.maxChars);
                const hashtagCount = countHashtags(content);
                const hashtagWarning = hashtagCount > platform.maxHashtags;

                return (
                  <div
                    key={platformId}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`preview-${platformId}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ color: platform.color }}>
                          <PlatformIcon platform={platformId} />
                        </span>
                        <span className="font-medium text-sm">{platform.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={charStatus === "ok" ? "secondary" : charStatus === "warning" ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {content.length}/{platform.maxChars}
                        </Badge>
                        {hashtagWarning && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {hashtagCount}/{platform.maxHashtags} #
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e) => updateContent(platformId, e.target.value)}
                      className={`min-h-[120px] text-sm resize-none ${
                        charStatus === "danger" ? "border-red-300 focus:ring-red-500" : ""
                      }`}
                      data-testid={`textarea-${platformId}`}
                    />
                    <div className="text-xs text-muted-foreground">
                      Ratios image recommandés : {platform.imageRatios.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleDuplicate}
            disabled={selectedPlatforms.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="button-confirm-duplicate"
          >
            <Check className="w-4 h-4 mr-2" />
            Créer {selectedPlatforms.length} version{selectedPlatforms.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
