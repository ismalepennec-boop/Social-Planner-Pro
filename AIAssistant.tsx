import { useState } from "react";
import { X, Sparkles, PenLine, Hash, Clock, Wand2, Loader2, Scissors, FileText, Briefcase, Smile, Check, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CaptionGenerator } from "./CaptionGenerator";
import { HashtagSuggester } from "./HashtagSuggester";
import { improveText, getBestTime, type BestTimeSlot } from "@/lib/api";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  platforms: string[];
  onUpdateContent: (content: string) => void;
}

const IMPROVE_ACTIONS = [
  { id: "shorten", label: "Raccourcir", Icon: Scissors },
  { id: "lengthen", label: "Allonger", Icon: FileText },
  { id: "professional", label: "Plus pro", Icon: Briefcase },
  { id: "casual", label: "Plus cool", Icon: Smile },
  { id: "fix_spelling", label: "Corriger", Icon: Check },
  { id: "add_emojis", label: "Ajouter emojis", Icon: Star },
  { id: "more_engaging", label: "Plus engageant", Icon: Rocket },
] as const;

export function AIAssistant({ isOpen, onClose, content, platforms, onUpdateContent }: AIAssistantProps) {
  const [improvingAction, setImprovingAction] = useState<string | null>(null);
  const [bestTimes, setBestTimes] = useState<BestTimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesError, setTimesError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseCaption = (caption: string) => {
    onUpdateContent(caption);
  };

  const handleAddHashtags = (hashtags: string[]) => {
    const currentContent = content.trim();
    const newHashtags = hashtags.join(" ");
    const newContent = currentContent ? `${currentContent}\n\n${newHashtags}` : newHashtags;
    onUpdateContent(newContent);
  };

  const handleImproveText = async (action: string) => {
    if (!content.trim()) return;

    setImprovingAction(action);
    try {
      const result = await improveText({
        text: content,
        action: action as any,
      });
      onUpdateContent(result.improved);
    } catch (error) {
      console.error("Error improving text:", error);
    } finally {
      setImprovingAction(null);
    }
  };

  const handleGetBestTimes = async () => {
    const platform = platforms[0] || "linkedin";
    setLoadingTimes(true);
    setTimesError(null);

    try {
      const result = await getBestTime({ platform });
      setBestTimes(result.times);
    } catch (error) {
      setTimesError(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoadingTimes(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div
        className="fixed right-4 top-4 bottom-4 w-[420px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100"
        data-testid="ai-assistant-sidebar"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(139, 92, 246, 0.1)' }}
      >
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Assistant IA</h2>
                <p className="text-xs text-white/70">Propulsé par GPT-4</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl"
              data-testid="button-close-ai-assistant"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="generate" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-4 gap-2 bg-gray-100/80 p-1.5 rounded-2xl h-auto">
              <TabsTrigger 
                value="generate" 
                className="flex flex-col gap-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-600 transition-all" 
                data-testid="tab-generate"
              >
                <PenLine className="w-4 h-4" />
                <span className="text-[10px] font-medium">Générer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="improve" 
                className="flex flex-col gap-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-600 transition-all" 
                data-testid="tab-improve"
              >
                <Wand2 className="w-4 h-4" />
                <span className="text-[10px] font-medium">Améliorer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hashtags" 
                className="flex flex-col gap-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-600 transition-all" 
                data-testid="tab-hashtags"
              >
                <Hash className="w-4 h-4" />
                <span className="text-[10px] font-medium">Hashtags</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timing" 
                className="flex flex-col gap-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-600 transition-all" 
                data-testid="tab-timing"
              >
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-medium">Horaires</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <TabsContent value="generate" className="mt-0 h-full" data-testid="tab-content-generate">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-1">Générateur de captions</h3>
                <p className="text-xs text-gray-500">
                  Créez des captions engageantes pour vos posts
                </p>
              </div>
              <CaptionGenerator onUseCaption={handleUseCaption} />
            </TabsContent>

            <TabsContent value="improve" className="mt-0" data-testid="tab-content-improve">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-1">Améliorer le texte</h3>
                <p className="text-xs text-gray-500">
                  Transformez votre contenu existant
                </p>
              </div>

              {!content.trim() ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <PenLine className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Rédigez d'abord du contenu pour l'améliorer
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3" data-testid="improve-actions">
                  {IMPROVE_ACTIONS.map((action) => {
                    const ActionIcon = action.Icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 bg-gray-50/50 border-gray-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all rounded-xl"
                        onClick={() => handleImproveText(action.id)}
                        disabled={improvingAction !== null}
                        data-testid={`button-improve-${action.id}`}
                      >
                        {improvingAction === action.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                        ) : (
                          <ActionIcon className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="text-xs font-medium">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hashtags" className="mt-0" data-testid="tab-content-hashtags">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-1">Suggestions de hashtags</h3>
                <p className="text-xs text-gray-500">
                  Obtenez des hashtags optimisés pour votre contenu
                </p>
              </div>
              <HashtagSuggester
                content={content}
                platform={platforms[0] || "linkedin"}
                onAddHashtags={handleAddHashtags}
              />
            </TabsContent>

            <TabsContent value="timing" className="mt-0" data-testid="tab-content-timing">
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-1">Meilleurs horaires</h3>
                <p className="text-xs text-gray-500">
                  Découvrez les meilleurs moments pour publier
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Label className="text-sm text-gray-600">Plateforme :</Label>
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200" data-testid="badge-current-platform">
                    {platforms[0] || "linkedin"}
                  </Badge>
                </div>

                <Button
                  onClick={handleGetBestTimes}
                  disabled={loadingTimes}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl h-12 shadow-lg shadow-violet-200"
                  data-testid="button-get-best-times"
                >
                  {loadingTimes ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Obtenir les meilleurs horaires
                    </>
                  )}
                </Button>

                {timesError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm text-red-600" data-testid="text-times-error">{timesError}</p>
                  </div>
                )}

                {bestTimes.length > 0 && (
                  <div className="space-y-2" data-testid="best-times-results">
                    {bestTimes.map((time, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-violet-200 transition-all"
                        data-testid={`time-slot-${index}`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900" data-testid={`text-day-${index}`}>{time.day}</p>
                          <p className="text-sm text-gray-500" data-testid={`text-hour-${index}`}>{time.hour}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                              style={{ width: `${time.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-violet-600 min-w-[40px]" data-testid={`text-score-${index}`}>
                            {time.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
