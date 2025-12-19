import type { Post, InsertPost } from "@shared/schema";

const API_BASE = "/api";

export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${API_BASE}/posts`);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
}

export async function getPost(id: number): Promise<Post> {
  const response = await fetch(`${API_BASE}/posts/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch post");
  }
  return response.json();
}

export async function createPost(post: InsertPost): Promise<Post> {
  const response = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    throw new Error("Failed to create post");
  }
  return response.json();
}

export async function updatePost(id: number, updates: Partial<InsertPost>): Promise<Post> {
  const response = await fetch(`${API_BASE}/posts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update post");
  }
  return response.json();
}

export async function deletePost(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/posts/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete post");
  }
}

export async function sendToMake(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/posts/${id}/send-to-make`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de l'envoi à Make.com");
  }
  return data;
}

// AI API Functions

export interface GenerateCaptionParams {
  subject: string;
  tone: "professional" | "casual" | "humorous";
  length: "short" | "medium" | "long";
  keywords?: string[];
}

export interface GenerateCaptionResponse {
  captions: string[];
}

export async function generateCaption(params: GenerateCaptionParams): Promise<GenerateCaptionResponse> {
  const response = await fetch(`${API_BASE}/ai/generate-caption`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la génération de caption");
  }
  return data;
}

export interface ImproveTextParams {
  text: string;
  action: "shorten" | "lengthen" | "professional" | "casual" | "fix_spelling" | "add_emojis" | "more_engaging";
}

export interface ImproveTextResponse {
  improved: string;
}

export async function improveText(params: ImproveTextParams): Promise<ImproveTextResponse> {
  const response = await fetch(`${API_BASE}/ai/improve-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de l'amélioration du texte");
  }
  return data;
}

export interface SuggestHashtagsParams {
  content: string;
  platform: string;
}

export interface HashtagSuggestion {
  tag: string;
  estimated_reach: string;
}

export interface SuggestHashtagsResponse {
  hashtags: HashtagSuggestion[];
}

export async function suggestHashtags(params: SuggestHashtagsParams): Promise<SuggestHashtagsResponse> {
  const response = await fetch(`${API_BASE}/ai/suggest-hashtags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la suggestion de hashtags");
  }
  return data;
}

export interface BestTimeParams {
  platform: string;
}

export interface BestTimeSlot {
  day: string;
  hour: string;
  score: number;
}

export interface BestTimeResponse {
  times: BestTimeSlot[];
}

export async function getBestTime(params: BestTimeParams): Promise<BestTimeResponse> {
  const response = await fetch(`${API_BASE}/ai/best-time`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la récupération des meilleurs horaires");
  }
  return data;
}

// Important Dates API Functions

export interface ImportantDate {
  date: string;
  title: string;
  description: string;
  hashtags: string[];
  category: "holiday" | "marketing" | "awareness" | "seasonal";
}

export interface ImportantDatesResponse {
  dates: ImportantDate[];
}

export async function getImportantDates(month: number, year: number): Promise<ImportantDatesResponse> {
  const response = await fetch(`${API_BASE}/ai/important-dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ month, year }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la récupération des dates importantes");
  }
  return data;
}

export interface GeneratePostForDateParams {
  date: string;
  event: string;
  description: string;
}

export interface GeneratePostForDateResponse {
  content: string;
  hashtags: string[];
}

export async function generatePostForDate(params: GeneratePostForDateParams): Promise<GeneratePostForDateResponse> {
  const response = await fetch(`${API_BASE}/ai/generate-post-for-date`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la génération du post");
  }
  return data;
}

// AI Image Generation

export interface GenerateImageParams {
  prompt: string;
  model: "dalle" | "gemini";
  style?: "realistic" | "illustration" | "minimalist" | "3d" | "watercolor";
}

export interface GenerateImageResponse {
  imageUrl: string;
  model: string;
}

export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
  const response = await fetch(`${API_BASE}/ai/generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Échec de la génération de l'image");
  }
  return data;
}
