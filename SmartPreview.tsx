import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Smartphone, MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface SmartPreviewProps {
  content: string;
  image?: string | null;
  date?: string;
  platforms: string[];
}

export function SmartPreview({ content, image, date, platforms }: SmartPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<string>(
    platforms.length > 0 ? platforms[0] : "instagram"
  );

  // Auto-switch preview when platforms change if current is not selected
  if (platforms.length > 0 && !platforms.includes(activePlatform)) {
    setActivePlatform(platforms[0]);
  }

  const displayDate = date ? new Date(date) : new Date();

  return (
    <div className="flex flex-col items-center h-full">
      <div className="mb-6 flex gap-2">
        {platforms.length > 0 ? (
          platforms.map(p => (
            <Badge
              key={p}
              variant={activePlatform === p ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setActivePlatform(p)}
            >
              {p}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Sélectionnez une plateforme pour prévisualiser</span>
        )}
      </div>

      {/* Smartphone Frame */}
      <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-800 rounded-b-xl z-20"></div>
        
        {/* Screen Content */}
        <div className="w-full h-full bg-white text-black overflow-y-auto pt-8 pb-4 scrollbar-hide">
          {/* Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold leading-none">john_doe_social</p>
                {activePlatform === "linkedin" && <p className="text-[10px] text-gray-500 leading-none mt-0.5">Social Media Expert</p>}
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>

          {/* Content */}
          <div className="flex flex-col">
            {image ? (
              <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                <img src={image} alt="Post content" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-gray-300">
                <span className="text-xs">Aucune image</span>
              </div>
            )}

            {/* Actions Bar (Instagram Style) */}
            {activePlatform === "instagram" && (
              <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-3">
                  <Heart className="w-5 h-5" />
                  <MessageCircle className="w-5 h-5" />
                  <Send className="w-5 h-5" />
                </div>
                <Bookmark className="w-5 h-5" />
              </div>
            )}

            {/* Likes (Instagram Style) */}
            {activePlatform === "instagram" && (
              <div className="px-3 pb-1">
                <p className="text-xs font-bold">1,234 J'aime</p>
              </div>
            )}

            {/* Caption */}
            <div className="px-3 pb-4">
              <p className="text-xs leading-relaxed">
                <span className="font-bold mr-1">john_doe_social</span>
                {content || <span className="text-gray-400 italic">Votre légende apparaîtra ici...</span>}
              </p>
              <p className="text-[10px] text-gray-400 mt-2 uppercase">
                {format(displayDate, "d MMMM", { locale: fr })}
              </p>
            </div>
          </div>
          
          {/* Platform Specific Footer or styling */}
          {activePlatform === "linkedin" && (
             <div className="px-4 py-3 bg-gray-50 border-t mt-4 mx-4 rounded text-xs text-gray-500 text-center">
               LinkedIn Post Preview
             </div>
          )}
          {activePlatform === "facebook" && (
             <div className="px-4 py-3 bg-blue-50 border-t mt-4 mx-4 rounded text-xs text-blue-500 text-center">
               Facebook Post Preview
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
