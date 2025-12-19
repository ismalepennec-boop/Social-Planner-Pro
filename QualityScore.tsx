import { useMemo } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface QualityScoreProps {
  content: string;
  hasImage: boolean;
  platforms: string[];
}

interface Criterion {
  id: string;
  label: string;
  passed: boolean;
  suggestion?: string;
}

export function QualityScore({ content, hasImage, platforms }: QualityScoreProps) {
  const analysis = useMemo(() => {
    const criteria: Criterion[] = [];
    let score = 0;
    const maxScore = 100;
    const pointsPerCriterion = 20;

    const contentLength = content.length;
    const hasAppropriateLength = contentLength >= 50 && contentLength <= 2000;
    criteria.push({
      id: "length",
      label: "Longueur appropriée",
      passed: hasAppropriateLength,
      suggestion: contentLength < 50 
        ? "Ajoutez plus de contenu (min. 50 caractères)" 
        : contentLength > 2000 
          ? "Raccourcissez votre texte (max. 2000 caractères)"
          : undefined,
    });
    if (hasAppropriateLength) score += pointsPerCriterion;

    const ctaPatterns = [
      /cliquez/i, /découvrez/i, /inscrivez/i, /téléchargez/i, /contactez/i,
      /rejoignez/i, /essayez/i, /commencez/i, /abonnez/i, /partagez/i,
      /commentez/i, /likez/i, /suivez/i, /achetez/i, /réservez/i,
      /click/i, /discover/i, /join/i, /try/i, /start/i, /subscribe/i,
      /\?$/, /!$/
    ];
    const hasCTA = ctaPatterns.some(pattern => pattern.test(content));
    criteria.push({
      id: "cta",
      label: "Appel à l'action",
      passed: hasCTA,
      suggestion: !hasCTA ? "Ajoutez un appel à l'action (ex: Découvrez, Rejoignez-nous...)" : undefined,
    });
    if (hasCTA) score += pointsPerCriterion;

    const hashtagCount = (content.match(/#\w+/g) || []).length;
    const hasHashtags = hashtagCount >= 1 && hashtagCount <= 15;
    criteria.push({
      id: "hashtags",
      label: "Hashtags présents",
      passed: hasHashtags,
      suggestion: hashtagCount === 0 
        ? "Ajoutez des hashtags pertinents" 
        : hashtagCount > 15 
          ? "Réduisez le nombre de hashtags (max. 15)"
          : undefined,
    });
    if (hasHashtags) score += pointsPerCriterion;

    const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🔥', '⭐', '🌟', '✨', '⚡', '☀️', '🌈', '🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🍀', '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '🚀', '💡', '📌', '📍', '🔗', '📩', '📬', '📱', '💻', '📷', '🎥', '🎬', '🎵', '🎶', '❤️‍🔥'];
    const hasEmojis = commonEmojis.some(emoji => content.includes(emoji));
    criteria.push({
      id: "emojis",
      label: "Emojis utilisés",
      passed: hasEmojis,
      suggestion: !hasEmojis ? "Ajoutez des emojis pour plus d'engagement" : undefined,
    });
    if (hasEmojis) score += pointsPerCriterion;

    criteria.push({
      id: "visual",
      label: "Visuel inclus",
      passed: hasImage,
      suggestion: !hasImage ? "Ajoutez une image pour augmenter l'engagement" : undefined,
    });
    if (hasImage) score += pointsPerCriterion;

    return { score, criteria };
  }, [content, hasImage]);

  const getScoreColor = (score: number) => {
    if (score < 40) return { ring: "stroke-red-500", bg: "text-red-500", label: "À améliorer" };
    if (score < 70) return { ring: "stroke-yellow-500", bg: "text-yellow-500", label: "Correct" };
    return { ring: "stroke-green-500", bg: "text-green-500", label: "Excellent" };
  };

  const scoreColors = getScoreColor(analysis.score);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

  const suggestions = analysis.criteria.filter(c => !c.passed && c.suggestion);

  return (
    <div className="bg-muted/30 rounded-lg p-4 border" data-testid="quality-score">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0" data-testid="score-circle">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={scoreColors.ring}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${scoreColors.bg}`} data-testid="text-score-value">
              {analysis.score}
            </span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Score de qualité</h4>
            <span className={`text-xs font-medium ${scoreColors.bg}`} data-testid="text-score-label">
              {scoreColors.label}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {analysis.criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-center gap-1.5">
                {criterion.passed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${criterion.passed ? "text-foreground" : "text-muted-foreground"}`} data-testid={`criterion-${criterion.id}`}>
                  {criterion.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t" data-testid="suggestions-list">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Suggestions d'amélioration
          </p>
          <ul className="space-y-1">
            {suggestions.map((s) => (
              <li key={s.id} className="text-xs text-muted-foreground flex items-start gap-1.5" data-testid={`suggestion-${s.id}`}>
                <span className="text-yellow-500">•</span>
                {s.suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
