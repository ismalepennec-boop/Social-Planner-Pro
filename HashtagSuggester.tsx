import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hash, Plus, Sparkles } from "lucide-react";
import { suggestHashtags, type HashtagSuggestion } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HashtagSuggesterProps {
  content: string;
  platform: string;
  onAddHashtags: (hashtags: string[]) => void;
}

export function HashtagSuggester({ content, platform, onAddHashtags }: HashtagSuggesterProps) {
  const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError("Veuillez d'abord rédiger du contenu");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHashtags([]);
    setSelectedTags(new Set());

    try {
      const result = await suggestHashtags({
        content: content.trim(),
        platform: platform || "linkedin",
      });
      setHashtags(result.hashtags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHashtag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const selectAll = () => {
    setSelectedTags(new Set(hashtags.map(h => h.tag)));
  };

  const deselectAll = () => {
    setSelectedTags(new Set());
  };

  const handleAddSelected = () => {
    onAddHashtags(Array.from(selectedTags));
  };

  const getReachBadgeColor = (reach: string) => {
    const r = reach.toLowerCase();
    if (r.includes("élevé") || r.includes("high")) return "bg-green-100 text-green-700 border-green-200";
    if (r.includes("moyen") || r.includes("medium")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (r.includes("niche")) return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4" data-testid="hashtag-suggester">
      <Button
        onClick={handleAnalyze}
        disabled={isLoading || !content.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        data-testid="button-analyze-hashtags"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Analyser le contenu
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-500" data-testid="text-hashtag-error">{error}</p>
      )}

      {hashtags.length > 0 && (
        <div className="space-y-3" data-testid="hashtag-results">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {hashtags.length} hashtags suggérés
            </Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7" data-testid="button-select-all">
                Tout
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7" data-testid="button-deselect-all">
                Aucun
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {hashtags.map((hashtag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`hashtag-item-${index}`}
                >
                  <Checkbox
                    checked={selectedTags.has(hashtag.tag)}
                    onCheckedChange={() => toggleHashtag(hashtag.tag)}
                    data-testid={`checkbox-hashtag-${index}`}
                  />
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium" data-testid={`text-hashtag-${index}`}>
                    {hashtag.tag}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getReachBadgeColor(hashtag.estimated_reach)}`}
                    data-testid={`badge-reach-${index}`}
                  >
                    {hashtag.estimated_reach}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Button
            onClick={handleAddSelected}
            disabled={selectedTags.size === 0}
            className="w-full"
            data-testid="button-add-hashtags"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter {selectedTags.size} hashtag{selectedTags.size > 1 ? "s" : ""} sélectionné{selectedTags.size > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {!content.trim() && (
        <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-content">
          Rédigez d'abord du contenu pour analyser les hashtags
        </p>
      )}
    </div>
  );
}
