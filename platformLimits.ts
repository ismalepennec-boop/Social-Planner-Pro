export interface PlatformLimits {
  id: string;
  name: string;
  maxChars: number;
  maxHashtags: number;
  imageRatios: string[];
  color: string;
  icon: string;
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    maxChars: 2200,
    maxHashtags: 30,
    imageRatios: ["1:1", "4:5"],
    color: "#E1306C",
    icon: "instagram",
  },
  twitter: {
    id: "twitter",
    name: "Twitter/X",
    maxChars: 280,
    maxHashtags: 2,
    imageRatios: ["16:9", "1:1"],
    color: "#1DA1F2",
    icon: "twitter",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    maxChars: 3000,
    maxHashtags: 5,
    imageRatios: ["1.91:1"],
    color: "#0A66C2",
    icon: "linkedin",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    maxChars: 63206,
    maxHashtags: 10,
    imageRatios: ["1.91:1"],
    color: "#1877F2",
    icon: "facebook",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    maxChars: 2200,
    maxHashtags: 5,
    imageRatios: ["9:16"],
    color: "#000000",
    icon: "video",
  },
};

export function adaptContentForPlatform(content: string, platformId: string): string {
  const platform = PLATFORM_LIMITS[platformId];
  if (!platform) return content;

  let adapted = content;

  // Truncate if too long
  if (adapted.length > platform.maxChars) {
    adapted = adapted.substring(0, platform.maxChars - 3) + "...";
  }

  // Extract hashtags
  const hashtags = adapted.match(/#\w+/g) || [];
  
  // Limit hashtags if necessary
  if (hashtags.length > platform.maxHashtags) {
    const excessHashtags = hashtags.slice(platform.maxHashtags);
    excessHashtags.forEach(tag => {
      adapted = adapted.replace(tag, "").trim();
    });
    // Clean up double spaces
    adapted = adapted.replace(/\s+/g, " ").trim();
  }

  return adapted;
}

export function getCharacterStatus(length: number, maxChars: number): "ok" | "warning" | "danger" {
  const ratio = length / maxChars;
  if (ratio >= 1) return "danger";
  if (ratio >= 0.9) return "warning";
  return "ok";
}

export function countHashtags(content: string): number {
  const hashtags = content.match(/#\w+/g) || [];
  return hashtags.length;
}
