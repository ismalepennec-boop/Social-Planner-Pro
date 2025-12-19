import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Get a single post
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Create a new post
  app.post("/api/posts", async (req, res) => {
    const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ggpl39kbqjli1tfyldlyqxxd12ns1nxy";
    
    try {
      const result = insertPostSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }
      
      const post = await storage.createPost(result.data);
      
      // Send to Make.com webhook when post is scheduled OR sent (publish now)
      if (post.status === "scheduled" || post.status === "sent") {
        const action = post.status === "sent" ? "Publier maintenant" : "Programmé";
        console.log(`[Make.com] Sending post to webhook (${action}):`, post.id);
        
        const webhookPayload = {
          id: post.id,
          content: post.content,
          platforms: post.platforms,
          date: post.date,
          imageUrl: post.image || null,
          status: post.status,
          action: action,
        };
        
        try {
          const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          });
          
          if (webhookResponse.ok) {
            console.log("[Make.com] Post sent to webhook successfully:", post.id);
          } else {
            console.error("[Make.com] Webhook error:", webhookResponse.status);
          }
        } catch (webhookError) {
          console.error("[Make.com] Failed to send to webhook:", webhookError);
        }
      }
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Update a post
  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const updates = req.body;
      const post = await storage.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      await storage.deletePost(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Webhook endpoint - receives calls from Make.com to update post status
  app.post("/api/webhook/publish", async (req, res) => {
    try {
      console.log("[Webhook] Received publish request:", JSON.stringify(req.body));
      
      const { id, content, platforms, date } = req.body;
      
      if (id) {
        const postId = parseInt(id);
        if (isNaN(postId)) {
          console.log("[Webhook] Invalid post ID:", id);
          return res.status(400).json({ success: false, error: "ID de post invalide" });
        }
        
        const post = await storage.getPost(postId);
        if (!post) {
          console.log("[Webhook] Post not found:", postId);
          return res.status(404).json({ success: false, error: "Post non trouvé" });
        }
        
        await storage.updatePost(postId, { status: "sent" });
        console.log("[Webhook] Post status updated to 'sent':", postId);
        return res.json({ success: true, message: "Post marqué comme envoyé", postId });
      }
      
      if (content && platforms && date) {
        console.log("[Webhook] Creating new post from webhook data");
        const newPost = await storage.createPost({
          content,
          platforms: Array.isArray(platforms) ? platforms : [platforms],
          date: new Date(date),
          status: "sent",
        });
        console.log("[Webhook] New post created:", newPost.id);
        return res.json({ success: true, message: "Post créé et marqué comme envoyé", postId: newPost.id });
      }
      
      console.log("[Webhook] Invalid request - missing required fields");
      return res.status(400).json({ success: false, error: "Données manquantes: id ou (content, platforms, date) requis" });
    } catch (error) {
      console.error("[Webhook] Error processing publish request:", error);
      res.status(500).json({ success: false, error: "Erreur lors du traitement de la requête" });
    }
  });

  // Send post to Make.com webhook
  app.post("/api/posts/:id/send-to-make", async (req, res) => {
    const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ggpl39kbqjli1tfyldlyqxxd12ns1nxy";
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "ID de post invalide" });
      }
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ success: false, error: "Post non trouvé" });
      }
      
      console.log("[Make.com] Sending post to webhook:", id);
      
      const webhookPayload = {
        content: post.content,
        platforms: post.platforms,
        date: post.date,
        imageUrl: post.image || null,
      };
      
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });
      
      if (!response.ok) {
        console.error("[Make.com] Webhook error:", response.status, response.statusText);
        return res.status(502).json({ 
          success: false, 
          error: `Erreur de communication avec Make.com: ${response.status}` 
        });
      }
      
      await storage.updatePost(id, { status: "sent" });
      console.log("[Make.com] Post sent successfully and status updated:", id);
      
      res.json({ success: true, message: "Post envoyé à Make.com avec succès" });
    } catch (error) {
      console.error("[Make.com] Error sending to webhook:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erreur réseau: impossible de contacter Make.com" 
      });
    }
  });

  // AI Routes
  
  // Generate captions
  app.post("/api/ai/generate-caption", async (req, res) => {
    try {
      const { subject, tone, length, keywords } = req.body;
      
      if (!subject || !tone || !length) {
        return res.status(400).json({ error: "Paramètres manquants: subject, tone et length sont requis" });
      }
      
      const lengthInstructions = {
        short: "environ 50-80 caractères",
        medium: "environ 150-200 caractères",
        long: "environ 300-400 caractères"
      };
      
      const toneInstructions = {
        professional: "professionnel et sérieux",
        casual: "décontracté et amical",
        humorous: "humoristique et léger"
      };
      
      const keywordsText = keywords && keywords.length > 0 
        ? `Intègre naturellement ces mots-clés: ${keywords.join(", ")}.` 
        : "";
      
      const prompt = `Tu es un expert en marketing sur les réseaux sociaux. Génère 3 légendes/captions différentes pour un post sur les réseaux sociaux.

Sujet: ${subject}
Ton: ${toneInstructions[tone as keyof typeof toneInstructions]}
Longueur: ${lengthInstructions[length as keyof typeof lengthInstructions]}
${keywordsText}

Réponds UNIQUEMENT avec un JSON valide au format: {"captions": ["caption1", "caption2", "caption3"]}
Les captions doivent être en français et engageantes.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{"captions": []}');
      res.json(result);
    } catch (error) {
      console.error("[AI] Error generating caption:", error);
      res.status(500).json({ error: "Erreur lors de la génération des captions" });
    }
  });
  
  // Improve text
  app.post("/api/ai/improve-text", async (req, res) => {
    try {
      const { text, action } = req.body;
      
      if (!text || !action) {
        return res.status(400).json({ error: "Paramètres manquants: text et action sont requis" });
      }
      
      const actionInstructions = {
        shorten: "Raccourcis ce texte tout en gardant le message principal. Réduis d'au moins 30%.",
        lengthen: "Développe ce texte en ajoutant plus de détails et de contexte. Augmente d'au moins 50%.",
        professional: "Reformule ce texte avec un ton plus professionnel et formel.",
        casual: "Reformule ce texte avec un ton plus décontracté et amical.",
        fix_spelling: "Corrige toutes les fautes d'orthographe et de grammaire dans ce texte.",
        add_emojis: "Ajoute des emojis pertinents dans ce texte pour le rendre plus engageant.",
        more_engaging: "Reformule ce texte pour le rendre plus engageant et captivant. Ajoute un appel à l'action."
      };
      
      const prompt = `${actionInstructions[action as keyof typeof actionInstructions]}

Texte original:
"${text}"

Réponds UNIQUEMENT avec un JSON valide au format: {"improved": "texte amélioré ici"}
Le texte doit être en français.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{"improved": ""}');
      res.json(result);
    } catch (error) {
      console.error("[AI] Error improving text:", error);
      res.status(500).json({ error: "Erreur lors de l'amélioration du texte" });
    }
  });
  
  // Suggest hashtags
  app.post("/api/ai/suggest-hashtags", async (req, res) => {
    try {
      const { content, platform } = req.body;
      
      if (!content || !platform) {
        return res.status(400).json({ error: "Paramètres manquants: content et platform sont requis" });
      }
      
      const prompt = `Tu es un expert en marketing sur les réseaux sociaux. Analyse ce contenu et suggère 15 hashtags pertinents pour ${platform}.

Contenu: "${content}"

Pour chaque hashtag, estime sa portée potentielle (élevée, moyenne, faible ou niche).

Réponds UNIQUEMENT avec un JSON valide au format:
{"hashtags": [{"tag": "#exemple", "estimated_reach": "élevée"}, ...]}

Les hashtags doivent être pertinents pour un public francophone et optimisés pour ${platform}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{"hashtags": []}');
      res.json(result);
    } catch (error) {
      console.error("[AI] Error suggesting hashtags:", error);
      res.status(500).json({ error: "Erreur lors de la suggestion de hashtags" });
    }
  });
  
  // Best posting times
  app.post("/api/ai/best-time", async (req, res) => {
    try {
      const { platform } = req.body;
      
      if (!platform) {
        return res.status(400).json({ error: "Paramètre manquant: platform est requis" });
      }
      
      const bestTimes: Record<string, { day: string; hour: string; score: number }[]> = {
        linkedin: [
          { day: "Mardi", hour: "10:00", score: 95 },
          { day: "Mercredi", hour: "12:00", score: 90 },
          { day: "Jeudi", hour: "09:00", score: 85 }
        ],
        facebook: [
          { day: "Mercredi", hour: "11:00", score: 92 },
          { day: "Vendredi", hour: "14:00", score: 88 },
          { day: "Samedi", hour: "12:00", score: 82 }
        ],
        instagram: [
          { day: "Mardi", hour: "11:00", score: 94 },
          { day: "Mercredi", hour: "14:00", score: 89 },
          { day: "Vendredi", hour: "17:00", score: 86 }
        ]
      };
      
      const times = bestTimes[platform.toLowerCase()] || bestTimes.linkedin;
      res.json({ times });
    } catch (error) {
      console.error("[AI] Error getting best times:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des meilleurs horaires" });
    }
  });

  // Get important dates for a given month
  app.post("/api/ai/important-dates", async (req, res) => {
    try {
      const { month, year } = req.body;
      
      if (!month || !year) {
        return res.status(400).json({ error: "Paramètres manquants: month et year sont requis" });
      }
      
      if (month < 1 || month > 12) {
        return res.status(400).json({ error: "Le mois doit être entre 1 et 12" });
      }
      
      const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
      ];
      
      const prompt = `Tu es un expert en marketing digital et en community management. Génère une liste de dates importantes pour le mois de ${monthNames[month - 1]} ${year}.

Inclus les types d'événements suivants:
- Jours fériés et fêtes (holiday)
- Événements marketing majeurs comme Black Friday, Cyber Monday, Saint-Valentin, etc. (marketing)
- Journées mondiales et de sensibilisation (awareness)
- Événements saisonniers (seasonal)

Pour chaque date, fournis:
- La date au format ISO (YYYY-MM-DD)
- Le titre de l'événement
- Une courte description (1-2 phrases) orientée marketing/contenu
- Des hashtags pertinents (5-8 hashtags)
- La catégorie (holiday, marketing, awareness, seasonal)

Réponds UNIQUEMENT avec un JSON valide au format:
{
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "title": "Nom de l'événement",
      "description": "Description courte pour le marketing",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "category": "holiday" | "marketing" | "awareness" | "seasonal"
    }
  ]
}

Génère entre 8 et 15 dates pertinentes pour ce mois. Toutes les réponses doivent être en français.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{"dates": []}');
      res.json(result);
    } catch (error) {
      console.error("[AI] Error getting important dates:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des dates importantes" });
    }
  });

  // Generate post content for a specific date/event
  app.post("/api/ai/generate-post-for-date", async (req, res) => {
    try {
      const { date, event, description } = req.body;
      
      if (!date || !event || !description) {
        return res.status(400).json({ error: "Paramètres manquants: date, event et description sont requis" });
      }
      
      const prompt = `Tu es un expert en community management et en création de contenu pour les réseaux sociaux. Génère un post engageant pour l'événement suivant:

Date: ${date}
Événement: ${event}
Description: ${description}

Le post doit:
- Être engageant et captiver l'attention
- Inclure un appel à l'action
- Être adapté aux réseaux sociaux (LinkedIn, Instagram, Facebook)
- Faire environ 150-250 caractères
- Utiliser des emojis de manière appropriée

Réponds UNIQUEMENT avec un JSON valide au format:
{
  "content": "Le texte du post avec emojis",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}

La réponse doit être en français.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{"content": "", "hashtags": []}');
      res.json(result);
    } catch (error) {
      console.error("[AI] Error generating post for date:", error);
      res.status(500).json({ error: "Erreur lors de la génération du post" });
    }
  });

  // Freepik API - Generate image with Mystic
  app.post("/api/freepik/generate-image", async (req, res) => {
    try {
      const { prompt, aspect_ratio, resolution, style } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Paramètre manquant: prompt est requis" });
      }
      
      if (!process.env.FREEPIK_API_KEY) {
        return res.status(500).json({ error: "Clé API Freepik non configurée" });
      }
      
      console.log("[Freepik] Starting image generation:", prompt.substring(0, 50) + "...");
      
      const aspectRatios: Record<string, string> = {
        "1:1": "square_1_1",
        "4:3": "classic_4_3", 
        "3:4": "traditional_3_4",
        "16:9": "widescreen_16_9",
        "9:16": "social_story_9_16"
      };
      
      const freepikAspectRatio = aspectRatios[aspect_ratio] || "square_1_1";
      const freepikResolution = resolution || "2k";
      
      const styleEnhancement = style ? `, style ${style}` : "";
      const enhancedPrompt = `${prompt}${styleEnhancement}`;
      
      const response = await fetch("https://api.freepik.com/v1/ai/mystic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-freepik-api-key": process.env.FREEPIK_API_KEY,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          resolution: freepikResolution,
          aspect_ratio: freepikAspectRatio,
          model: "realism",
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Freepik] API error:", response.status, errorText);
        return res.status(response.status).json({ 
          error: `Erreur Freepik: ${response.status}`,
          details: errorText 
        });
      }
      
      const data = await response.json();
      console.log("[Freepik] Task created:", data.data?.task_id);
      
      res.json({
        task_id: data.data?.task_id,
        status: data.data?.status || "IN_PROGRESS",
        message: "Génération en cours..."
      });
      
    } catch (error: any) {
      console.error("[Freepik] Error:", error);
      res.status(500).json({ error: error.message || "Erreur Freepik" });
    }
  });

  // Freepik - Check task status
  app.get("/api/freepik/task/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      if (!process.env.FREEPIK_API_KEY) {
        return res.status(500).json({ error: "Clé API Freepik non configurée" });
      }
      
      const response = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
        method: "GET",
        headers: {
          "x-freepik-api-key": process.env.FREEPIK_API_KEY,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Freepik] Task check error:", response.status, errorText);
        return res.status(response.status).json({ error: "Erreur lors de la vérification" });
      }
      
      const data = await response.json();
      
      const imageUrl = data.data?.generated?.[0]?.url || null;
      const status = data.data?.status || "UNKNOWN";
      
      console.log("[Freepik] Task status:", status, imageUrl ? "- Image ready" : "");
      
      res.json({
        status,
        imageUrl,
        data: data.data
      });
      
    } catch (error: any) {
      console.error("[Freepik] Task check error:", error);
      res.status(500).json({ error: error.message || "Erreur" });
    }
  });

  // Generate image using AI (DALL-E or Gemini)
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, model, style } = req.body;
      
      if (!prompt || !model) {
        return res.status(400).json({ error: "Paramètres manquants: prompt et model sont requis" });
      }
      
      const styleTranslations: Record<string, string> = {
        realistic: "réaliste, photoréaliste",
        illustration: "illustration, dessin artistique",
        minimalist: "minimaliste, épuré",
        "3d": "rendu 3D, volumétrique",
        watercolor: "aquarelle, peinture artistique"
      };
      
      const styleText = style && styleTranslations[style] ? `, style ${styleTranslations[style]}` : "";
      const enhancedPrompt = `${prompt}${styleText}`;
      
      if (model === "dalle") {
        if (!process.env.OPENAI_API_KEY) {
          return res.status(500).json({ error: "Clé API OpenAI non configurée" });
        }
        
        console.log("[AI Image] Generating with DALL-E 3:", enhancedPrompt);
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
        });
        
        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
          return res.status(500).json({ error: "Erreur lors de la génération de l'image" });
        }
        
        console.log("[AI Image] DALL-E image generated successfully");
        res.json({ imageUrl, model: "dalle" });
        
      } else if (model === "gemini") {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
          return res.status(500).json({ error: "Clé API Google Gemini non configurée" });
        }
        
        console.log("[AI Image] Generating with Gemini:", enhancedPrompt);
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate an image: ${enhancedPrompt}`
              }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          }),
        });
        
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("[AI Image] Gemini API error:", errorText);
          
          // Check for quota exceeded error
          if (geminiResponse.status === 429 || errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
            return res.status(429).json({ 
              error: "Quota Gemini dépassé pour aujourd'hui. Utilisez DALL-E 3 en attendant ou réessayez demain." 
            });
          }
          return res.status(500).json({ error: "Erreur lors de la génération avec Gemini" });
        }
        
        const geminiData = await geminiResponse.json();
        
        const parts = geminiData.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith("image/"));
        
        if (!imagePart || !imagePart.inlineData?.data) {
          console.error("[AI Image] No image in Gemini response");
          return res.status(500).json({ error: "Aucune image générée par Gemini" });
        }
        
        const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        
        console.log("[AI Image] Gemini image generated successfully");
        res.json({ imageUrl: base64Image, model: "gemini" });
        
      } else {
        return res.status(400).json({ error: "Modèle non supporté. Utilisez 'dalle' ou 'gemini'" });
      }
      
    } catch (error: any) {
      console.error("[AI Image] Error generating image:", error);
      res.status(500).json({ 
        error: error.message || "Erreur lors de la génération de l'image" 
      });
    }
  });

  // Freepik Video Generation - Kling v2 or MiniMax Hailuo
  app.post("/api/freepik/generate-video", async (req, res) => {
    try {
      const { prompt, image, model, duration, aspect_ratio } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Paramètre manquant: prompt est requis" });
      }
      
      if (!process.env.FREEPIK_API_KEY) {
        return res.status(500).json({ error: "Clé API Freepik non configurée" });
      }
      
      console.log(`[Freepik Video] Starting video generation with ${model || 'kling-v2'}:`, prompt.substring(0, 50) + "...");
      
      let endpoint: string;
      let requestBody: any;
      
      const selectedModel = model || "kling-v2";
      
      if (selectedModel === "minimax") {
        endpoint = "https://api.freepik.com/v1/ai/image-to-video/minimax-hailuo-02-768p";
        
        if (image) {
          requestBody = {
            prompt,
            first_frame_image: image,
            prompt_optimizer: true,
            duration: parseInt(duration) || 6,
          };
        } else {
          requestBody = {
            prompt,
            prompt_optimizer: true,
            duration: parseInt(duration) || 6,
          };
        }
      } else {
        endpoint = "https://api.freepik.com/v1/ai/image-to-video/kling-v2";
        
        if (!image) {
          return res.status(400).json({ error: "Kling v2 nécessite une image de référence" });
        }
        
        requestBody = {
          image,
          prompt,
          duration: duration || "5",
          cfg_scale: 0.5,
        };
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-freepik-api-key": process.env.FREEPIK_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Freepik Video] API error:", response.status, errorText);
        return res.status(response.status).json({ 
          error: `Erreur Freepik: ${response.status}`,
          details: errorText 
        });
      }
      
      const data = await response.json();
      console.log("[Freepik Video] Task created:", data.data?.task_id);
      
      res.json({
        task_id: data.data?.task_id,
        status: data.data?.status || "CREATED",
        model: selectedModel,
        message: "Génération vidéo en cours..."
      });
      
    } catch (error: any) {
      console.error("[Freepik Video] Error:", error);
      res.status(500).json({ error: error.message || "Erreur Freepik Video" });
    }
  });

  // Freepik Video - Check task status
  app.get("/api/freepik/video-task/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { model } = req.query;
      
      if (!process.env.FREEPIK_API_KEY) {
        return res.status(500).json({ error: "Clé API Freepik non configurée" });
      }
      
      let endpoint: string;
      
      if (model === "minimax") {
        endpoint = `https://api.freepik.com/v1/ai/image-to-video/minimax-hailuo-02-768p/${taskId}`;
      } else {
        endpoint = `https://api.freepik.com/v1/ai/image-to-video/kling-v2/${taskId}`;
      }
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-freepik-api-key": process.env.FREEPIK_API_KEY,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Freepik Video] Task check error:", response.status, errorText);
        return res.status(response.status).json({ error: "Erreur lors de la vérification" });
      }
      
      const data = await response.json();
      
      const generated = data.data?.generated?.[0];
      const videoUrl = data.data?.video?.url || 
                       (typeof generated === 'string' ? generated : generated?.url) || 
                       null;
      const status = data.data?.status || "UNKNOWN";
      
      console.log("[Freepik Video] Task status:", status, videoUrl ? "- Video ready" : "");
      
      res.json({
        status,
        videoUrl,
        data: data.data
      });
      
    } catch (error: any) {
      console.error("[Freepik Video] Task check error:", error);
      res.status(500).json({ error: error.message || "Erreur" });
    }
  });

  // Parse video descriptions with AI
  app.post("/api/ai/parse-videos", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Texte requis" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "Clé API OpenAI non configurée" });
      }
      
      console.log("[AI Parse Videos] Parsing text for video projects...");
      
      const systemPrompt = `Tu es un assistant expert en création de contenu vidéo court (TikTok, Reels, Shorts).
      
Analyse chaque vidéo décrite et extrais/suggère:
- script: Le contenu/texte de la vidéo
- hook: L'accroche (choisis parmi: "saviez-vous", "astuces", "erreur", "secret", "arretez")
- template: Le template (choisis parmi: "viral-hook", "tutorial", "product-review")
- format: Le format (choisis parmi: "tiktok", "instagram-reel", "youtube-short")
- scheduledDate: Date/heure de publication si mentionnée (format ISO), sinon null
- musicStyle: Style de musique suggéré (upbeat, calm, dramatic, trendy, corporate)
- imageKeywords: 3-5 mots-clés en anglais pour chercher une image de fond adaptée au contenu
- videoKeywords: 3-5 mots-clés en anglais pour chercher une vidéo de fond adaptée
- suggestedTitle: Un titre court et accrocheur pour la vidéo (max 50 caractères)
- estimatedDuration: Durée estimée en secondes (15, 30, 60)

Sois créatif pour les suggestions de visuels - choisis des mots-clés qui donneront des résultats pertinents et esthétiques sur Pexels.

Réponds UNIQUEMENT en JSON valide:
{
  "videos": [
    {
      "script": "...",
      "hook": "saviez-vous",
      "template": "viral-hook",
      "format": "tiktok",
      "scheduledDate": null,
      "musicStyle": "upbeat",
      "imageKeywords": ["business", "success", "office"],
      "videoKeywords": ["office", "working", "professional"],
      "suggestedTitle": "Titre accrocheur",
      "estimatedDuration": 30
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "Pas de réponse de l'IA" });
      }
      
      const parsed = JSON.parse(content);
      console.log("[AI Parse Videos] Parsed", parsed.videos?.length || 0, "videos");
      
      res.json(parsed);
      
    } catch (error: any) {
      console.error("[AI Parse Videos] Error:", error);
      res.status(500).json({ error: error.message || "Erreur de parsing" });
    }
  });

  // Image search using Unsplash API (works without API key for basic usage)
  app.get("/api/pexels/search", async (req, res) => {
    try {
      const { query = "business", per_page = 4 } = req.query;
      const searchQuery = String(query).replace(/\s+/g, ",");
      const count = Math.min(Number(per_page), 8);
      
      // Generate unique Unsplash Source URLs based on keywords
      const photos = Array.from({ length: count }, (_, i) => {
        const seed = Date.now() + i * 1000 + Math.random() * 1000;
        return {
          id: seed,
          src: {
            medium: `https://source.unsplash.com/400x300/?${encodeURIComponent(searchQuery)}&sig=${seed}`,
            large: `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)}&sig=${seed}`,
          },
          photographer: "Unsplash",
          alt: query,
        };
      });
      
      res.json({ photos });
      
    } catch (error: any) {
      console.error("[Image Search] Error:", error);
      res.status(500).json({ error: error.message || "Erreur de recherche" });
    }
  });

  // Video search using Pexels API or fallback
  app.get("/api/pexels/videos", async (req, res) => {
    try {
      const { query = "business", per_page = 4 } = req.query;
      const searchQuery = String(query).replace(/\s+/g, ",");
      const count = Math.min(Number(per_page), 8);
      
      // Generate video thumbnails using Unsplash (as preview images)
      const videos = Array.from({ length: count }, (_, i) => {
        const seed = Date.now() + i * 2000 + Math.random() * 1000;
        return {
          id: seed,
          image: `https://source.unsplash.com/400x600/?${encodeURIComponent(searchQuery)}&sig=${seed}`,
          video_files: [
            { 
              link: "", // Actual video requires Pexels API key
              quality: "hd" 
            }
          ],
        };
      });
      
      res.json({ videos });
      
    } catch (error: any) {
      console.error("[Video Search] Error:", error);
      res.status(500).json({ error: error.message || "Erreur de recherche" });
    }
  });

  return httpServer;
}
