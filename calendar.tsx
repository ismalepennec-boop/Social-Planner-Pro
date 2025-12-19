import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Post } from "@shared/schema";
import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { ImportantDate } from "@/lib/api";
import { Linkedin, Instagram, Facebook, CalendarDays, Sparkles, Loader2, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "linkedin":
      return <Linkedin className="w-3 h-3 text-[#0A66C2]" />;
    case "instagram":
      return <Instagram className="w-3 h-3 text-pink-500" />;
    case "facebook":
      return <Facebook className="w-3 h-3 text-[#1877F2]" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'sent':
    case 'published':
      return <span className="w-2 h-2 rounded-full bg-emerald-500" title="Publié" />;
    case 'draft':
      return <span className="w-2 h-2 rounded-full bg-gray-400" title="Brouillon" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-amber-500" title="Programmé" />;
  }
};

const getCategoryColor = (category: ImportantDate["category"]) => {
  switch (category) {
    case "holiday":
      return "#ef4444";
    case "marketing":
      return "#a855f7";
    case "awareness":
      return "#3b82f6";
    case "seasonal":
      return "#22c55e";
    default:
      return "#6366f1";
  }
};

const getCategoryLabel = (category: ImportantDate["category"]) => {
  switch (category) {
    case "holiday":
      return "Jour férié";
    case "marketing":
      return "Marketing";
    case "awareness":
      return "Sensibilisation";
    case "seasonal":
      return "Saisonnier";
    default:
      return category;
  }
};

const getCategoryIcon = (category: ImportantDate["category"]) => {
  return null;
};

function CustomEvent({ event }: { event: any }) {
  const resource = event.resource;
  
  if (resource?.type === 'important-date') {
    const importantDate = resource.data as ImportantDate;
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  const post = resource as Post;
  if (!post || !post.platforms) return <span>{event.title}</span>;

  const isVideo = post.type === 'video';

  return (
    <div className="flex items-center gap-1.5 w-full overflow-hidden">
      {isVideo ? (
        <Video className="w-3 h-3 flex-shrink-0" />
      ) : (
        <FileText className="w-3 h-3 flex-shrink-0" />
      )}
      {getStatusBadge(post.status)}
      <div className="flex gap-0.5">
        {post.platforms.slice(0, 3).map(p => (
          <PlatformIcon key={p} platform={p} />
        ))}
      </div>
      <span className="text-xs truncate flex-1 opacity-90">
        {post.content.substring(0, 30)}
      </span>
    </div>
  );
}

function AgendaEvent({ event }: { event: any }) {
  const resource = event.resource;
  
  if (resource?.type === 'important-date') {
    const importantDate = resource.data as ImportantDate;
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="font-medium">{event.title}</span>
        <Badge 
          variant="outline" 
          className="text-xs"
          style={{ borderColor: getCategoryColor(importantDate.category), color: getCategoryColor(importantDate.category) }}
        >
          {getCategoryLabel(importantDate.category)}
        </Badge>
      </div>
    );
  }

  const post = resource as Post;
  if (!post || !post.platforms) return <span>{event.title}</span>;

  return (
    <div className="flex items-center gap-3 py-2">
      {post.image && (
        <img 
          src={post.image} 
          alt="" 
          className="w-12 h-12 rounded object-cover border"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {post.platforms.map(p => (
            <PlatformIcon key={p} platform={p} />
          ))}
          {getStatusBadge(post.status)}
        </div>
        <p className="text-sm truncate">{post.content}</p>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedImportantDate, setSelectedImportantDate] = useState<ImportantDate | null>(null);
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const fetchImportantDates = async () => {
    setIsLoadingDates(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await api.getImportantDates(month, year);
      setImportantDates(response.dates);
      toast({
        title: "Dates importantes chargées",
        description: `${response.dates.length} dates trouvées pour ${format(currentDate, "MMMM yyyy", { locale: fr })}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les dates importantes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDates(false);
    }
  };

  const generatePostForDate = async (date: ImportantDate) => {
    setIsGeneratingPost(true);
    try {
      const response = await api.generatePostForDate({
        date: date.date,
        event: date.title,
        description: date.description,
      });
      setGeneratedContent(response.content);
      setGeneratedHashtags(response.hashtags);
      setIsCreatePostOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le post",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      setIsCreatePostOpen(false);
      setSelectedImportantDate(null);
      setGeneratedContent("");
      setGeneratedHashtags([]);
      toast({
        title: "Post créé !",
        description: "Le post a été ajouté au calendrier",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de créer le post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!selectedImportantDate || !generatedContent) return;
    
    const fullContent = generatedContent + "\n\n" + generatedHashtags.join(" ");
    const postDate = new Date(selectedImportantDate.date);
    postDate.setHours(10, 0, 0, 0);
    
    createPostMutation.mutate({
      content: fullContent,
      date: postDate,
      platforms: ["linkedin", "instagram", "facebook"],
      status: "scheduled",
    });
  };

  const scheduledEvents = posts.map(post => ({
    id: post.id,
    title: post.content.substring(0, 50),
    start: new Date(post.date),
    end: new Date(new Date(post.date).getTime() + 60 * 60 * 1000),
    resource: post,
  }));

  const importantDateEvents = importantDates.map((date, index) => ({
    id: `important-${index}`,
    title: date.title,
    start: new Date(date.date),
    end: new Date(date.date),
    allDay: true,
    resource: { type: 'important-date', data: date },
  }));
  
  const events = [...scheduledEvents, ...importantDateEvents];

  const eventStyleGetter = (event: any) => {
    if (event.resource?.type === 'important-date') {
      const importantDate = event.resource.data as ImportantDate;
      return {
        style: {
          backgroundColor: getCategoryColor(importantDate.category),
          borderRadius: '4px',
          opacity: 0.85,
          color: 'white',
          border: '0px',
          display: 'block',
          fontSize: '0.75rem'
        }
      };
    }

    const post = event.resource as Post;
    if (!post || !post.platforms) {
      return { style: { backgroundColor: '#6366f1' } };
    }
    
    const isVideo = post.type === 'video';
    let backgroundColor = '#8b5cf6';

    if (isVideo) {
      // Vidéos: couleur orange/ambre pour les distinguer
      backgroundColor = '#f59e0b';
    } else if (post.platforms.includes('linkedin')) {
      backgroundColor = '#0077b5';
    } else if (post.platforms.includes('instagram')) {
      backgroundColor = '#e1306c';
    } else if (post.platforms.includes('facebook')) {
      backgroundColor = '#1877f2';
    }
    
    if (!isVideo && post.platforms.length > 1) backgroundColor = '#6366f1';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: any) => {
    const resource = event.resource as any;
    if (resource?.type === 'important-date') {
      setSelectedImportantDate(resource.data as ImportantDate);
    } else if (resource?.platforms) {
      setSelectedPost(resource as Post);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-6 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Calendrier</h1>
                <p className="text-sm text-gray-500">Vue d'ensemble de votre planning éditorial</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                onClick={fetchImportantDates}
                disabled={isLoadingDates}
                variant="outline"
                className="gap-2 border-gray-200 bg-white shadow-sm"
                data-testid="button-fetch-important-dates"
              >
                {isLoadingDates ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-violet-600" />
                )}
                Dates IA
              </Button>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: Views.MONTH, label: 'Mois' },
                  { key: Views.WEEK, label: 'Semaine' },
                  { key: Views.DAY, label: 'Jour' },
                  { key: Views.AGENDA, label: 'Agenda' },
                ].map(view => (
                  <button
                    key={view.key}
                    onClick={() => setCurrentView(view.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentView === view.key
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    data-testid={`view-${view.key}`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">

          {importantDates.length > 0 && (
            <div className="flex flex-wrap gap-2" data-testid="important-dates-legend">
              <span className="text-sm text-gray-500">Légende:</span>
              <Badge className="bg-red-100 text-red-700 border border-red-200">Jour férié</Badge>
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Marketing</Badge>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Sensibilisation</Badge>
              <Badge className="bg-green-100 text-green-700 border border-green-200">Saisonnier</Badge>
            </div>
          )}

          <Card className="shadow-sm border-gray-100 bg-white">
            <CardContent className="p-6 h-[700px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                culture="fr"
                view={currentView}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                onView={setCurrentView}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: CustomEvent,
                  agenda: {
                    event: AgendaEvent,
                  },
                }}
                messages={{
                  next: "Suivant",
                  previous: "Précédent",
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Heure",
                  event: "Événement",
                  noEventsInRange: "Aucun événement dans cette plage.",
                }}
                onSelectEvent={handleSelectEvent}
              />
            </CardContent>
          </Card>
          </div>
        </div>
      </main>

      <Sheet open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Détails du post</SheetTitle>
            <SheetDescription>
              Programmé pour le {selectedPost && format(new Date(selectedPost.date), "d MMMM yyyy à HH:mm", { locale: fr })}
            </SheetDescription>
          </SheetHeader>
          
          {selectedPost && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Statut</h4>
                <Badge className={
                  selectedPost.status === 'sent' || selectedPost.status === 'published'
                    ? 'bg-emerald-500'
                    : selectedPost.status === 'draft'
                    ? 'bg-gray-400'
                    : 'bg-amber-500'
                }>
                  {selectedPost.status === 'sent' || selectedPost.status === 'published'
                    ? 'Publié'
                    : selectedPost.status === 'draft'
                    ? 'Brouillon'
                    : 'Programmé'}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Plateformes</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedPost.platforms.map(p => (
                    <Badge key={p} variant="outline" className="capitalize flex items-center gap-1">
                      <PlatformIcon platform={p} />
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Contenu</h4>
                <div className="p-4 bg-muted/30 rounded-lg text-sm border whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
              </div>

              {selectedPost.image && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Média</h4>
                  <div className="rounded-lg overflow-hidden border">
                    <img src={selectedPost.image} alt="Post content" className="w-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedImportantDate && !isCreatePostOpen} onOpenChange={(open) => !open && setSelectedImportantDate(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-important-date">
          {selectedImportantDate && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <DialogTitle data-testid="text-important-date-title">
                      {selectedImportantDate.title}
                    </DialogTitle>
                    <DialogDescription>
                      {format(new Date(selectedImportantDate.date), "d MMMM yyyy", { locale: fr })}
                    </DialogDescription>
                  </div>
                  <Badge 
                    style={{ backgroundColor: getCategoryColor(selectedImportantDate.category) }}
                    className="text-white"
                  >
                    {getCategoryLabel(selectedImportantDate.category)}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm" data-testid="text-important-date-description">
                  {selectedImportantDate.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Hashtags suggérés</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedImportantDate.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-hashtag-${i}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => generatePostForDate(selectedImportantDate)}
                  disabled={isGeneratingPost}
                  className="w-full gap-2"
                  data-testid="button-create-post-for-date"
                >
                  {isGeneratingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  ✨ Créer un post
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-post">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Créer un post pour {selectedImportantDate?.title}
            </DialogTitle>
            <DialogDescription>
              Contenu généré par l'IA. Vous pouvez le modifier avant de l'ajouter au calendrier.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contenu du post</label>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={6}
                className="resize-none"
                data-testid="textarea-post-content"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Hashtags</label>
              <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg border">
                {generatedHashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Programmé pour le {selectedImportantDate && format(new Date(selectedImportantDate.date), "d MMMM yyyy", { locale: fr })} à 10:00
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Plateformes: LinkedIn, Instagram, Facebook
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreatePost}
              disabled={createPostMutation.isPending || !generatedContent}
              className="gap-2"
              data-testid="button-confirm-create-post"
            >
              {createPostMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarDays className="w-4 h-4" />
              )}
              Ajouter au calendrier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
