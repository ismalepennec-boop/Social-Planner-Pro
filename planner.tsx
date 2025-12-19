import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Upload, Trash2, Send, Download, Loader2, Sparkles, Linkedin, Instagram, Facebook, Rocket, Copy, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Post } from "@shared/schema";
import * as api from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { SmartPreview } from "@/components/SmartPreview";
import { Separator } from "@/components/ui/separator";
import { TemplateLibrary } from "@/components/Templates/TemplateLibrary";
import { MultiPlatformPreview } from "@/components/Planner/MultiPlatformPreview";
import { AIAssistant } from "@/components/AI/AIAssistant";
import { QualityScore } from "@/components/AI/QualityScore";
import { ImageGenerator } from "@/components/AI/ImageGenerator";

const formSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  platforms: z.array(z.string()).min(1, "Sélectionnez au moins une plateforme"),
});

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, activeClass: "bg-[#0A66C2] border-[#0A66C2] text-white", inactiveClass: "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200" },
  { id: "facebook", label: "Facebook", icon: Facebook, activeClass: "bg-[#1877F2] border-[#1877F2] text-white", inactiveClass: "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200" },
  { id: "instagram", label: "Instagram", icon: Instagram, activeClass: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] border-pink-500 text-white", inactiveClass: "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200" },
];

const WEBHOOK_URL = "https://hook.eu2.make.com/ggpl39kbqjli1tfyldlyqxxd12ns1nxy";

export default function PlannerView() {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);
  const [isPublishingNow, setIsPublishingNow] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const createPostMutation = useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      form.reset();
      setImagePreview(null);
      toast({
        title: "🚀 Post envoyé au calendrier avec succès !",
        description: "Votre contenu est programmé et prêt à être publié.",
        className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-lg",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de créer le post : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Post supprimé",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le post : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (!importJson.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller du contenu JSON.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const parsed = JSON.parse(importJson);
      
      const items = Array.isArray(parsed) ? parsed : [parsed];

      let successCount = 0;
      
      for (const item of items) {
        if (!item.content) {
          continue;
        }
        
        let platforms: string[] = [];
        if (item.platforms && Array.isArray(item.platforms)) {
          platforms = item.platforms.map((p: string) => p.toLowerCase());
        } else if (item.platform) {
          platforms = [String(item.platform).toLowerCase()];
        } else {
          platforms = ["linkedin"];
        }
        
        const dateStr = item.date || new Date().toISOString().split('T')[0];
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
          dateObj.setTime(Date.now());
        }
        dateObj.setHours(10, 0, 0, 0);
        
        await api.createPost({
          content: item.content,
          date: dateObj,
          platforms: platforms,
          status: "scheduled",
        });
        
        successCount++;
      }
      
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast({
        title: "Import réussi !",
        description: `✅ ${successCount} posts importés avec succès !`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
      
      setImportJson("");
      setIsImportModalOpen(false);
      
    } catch (error: any) {
      console.error("Import error:", error);
      alert(`Erreur technique : ${error.message || error}`);
      toast({
        title: "Erreur d'import",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      date: "",
      time: "",
      platforms: [],
    },
  });

  // Watch form values for live preview
  const watchedContent = form.watch("content");
  const watchedPlatforms = form.watch("platforms");
  const watchedDate = form.watch("date");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const dateTime = new Date(`${values.date}T${values.time}`);
    
    createPostMutation.mutate({
      content: values.content,
      date: dateTime,
      platforms: values.platforms,
      image: imagePreview || undefined,
      status: "scheduled",
    });
  };
  
  const handlePublishNow = () => {
    const values = form.getValues();
    const isValid = values.content && values.platforms.length > 0;
    
    if (!isValid) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir le contenu et sélectionner au moins une plateforme.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPublishingNow(true);
    
    createPostMutation.mutate({
      content: values.content,
      date: new Date(),
      platforms: values.platforms,
      image: imagePreview || undefined,
      status: "sent",
    }, {
      onSettled: () => {
        setIsPublishingNow(false);
      }
    });
  };

  const handleDelete = (id: number) => {
    deletePostMutation.mutate(id);
  };

  const sendToMakeMutation = useMutation({
    mutationFn: api.sendToMake,
    onMutate: (id) => {
      setIsSending(id);
      toast({
        title: "Envoi en cours...",
        description: "Communication avec Make.com...",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Succès !",
        description: "Post publié via Make.com avec succès !",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'envoi",
        description: error instanceof Error ? error.message : "Erreur réseau inconnue",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSending(null);
    },
  });

  const handleSendScheduledPost = (postId: number) => {
    sendToMakeMutation.mutate(postId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-6 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Planificateur</h1>
              <p className="text-sm text-gray-500">Créez, prévisualisez et planifiez vos contenus.</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Input Form */}
          <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-100 bg-white">
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center justify-between">
                            Contenu du post
                            <div className="flex gap-2">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => setIsTemplateModalOpen(true)}
                                data-testid="button-open-templates"
                              >
                                📝 Templates
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => setIsImportModalOpen(true)}
                                data-testid="button-open-import"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                📥 Importer IA
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                                onClick={() => setIsAIAssistantOpen(true)}
                                data-testid="button-open-ai-assistant"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                ✨ Assistant IA
                              </Button>
                            </div>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rédigez votre contenu ici..."
                              className="min-h-[160px] resize-none text-base focus-visible:ring-primary shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground">{field.value?.length || 0} caractères</span>
                          </div>
                          <QualityScore 
                            content={field.value || ""} 
                            hasImage={!!imagePreview} 
                            platforms={watchedPlatforms}
                          />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center justify-between">
                        Média visuel
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                          onClick={() => setIsImageGeneratorOpen(true)}
                          data-testid="button-open-image-generator"
                        >
                          Générer image IA
                        </Button>
                      </Label>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-border hover:border-primary/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      {imagePreview && (
                        <div className="relative mt-2 rounded-md overflow-hidden border aspect-video bg-muted/50 group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setImagePreview(null)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de publication</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="shadow-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heure</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="shadow-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="platforms"
                      render={() => (
                        <FormItem>
                          <FormLabel className="mb-4 block">Destination(s)</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {PLATFORMS.map((platform) => (
                              <FormField
                                key={platform.id}
                                control={form.control}
                                name="platforms"
                                render={({ field }) => {
                                  const isActive = field.value?.includes(platform.id);
                                  const Icon = platform.icon;
                                  return (
                                    <FormItem
                                      key={platform.id}
                                      className="space-y-0"
                                    >
                                      <FormControl>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isActive) {
                                              field.onChange(field.value?.filter((v) => v !== platform.id));
                                            } else {
                                              field.onChange([...field.value, platform.id]);
                                            }
                                          }}
                                          className={`
                                            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 transform hover:scale-105
                                            ${isActive ? platform.activeClass : platform.inactiveClass}
                                          `}
                                          data-testid={`toggle-platform-${platform.id}`}
                                        >
                                          <Icon className="w-5 h-5" />
                                          {platform.label}
                                        </button>
                                      </FormControl>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 font-bold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg transition-all duration-200 transform hover:scale-[1.02]" size="lg">
                        <Rocket className="w-5 h-5 mr-2" />
                        Planifier le post
                      </Button>
                      <Button 
                        type="button" 
                        className="flex-1 font-bold shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg transition-all duration-200 transform hover:scale-[1.02]"
                        size="lg"
                        onClick={handlePublishNow}
                        disabled={isPublishingNow}
                        data-testid="button-publish-now"
                      >
                        {isPublishingNow ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 mr-2" />
                        )}
                        Publier maintenant
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        className="py-6 px-4 border-2 hover:bg-indigo-50 hover:border-indigo-300"
                        onClick={() => {
                          const content = form.getValues("content");
                          if (content) setIsDuplicateModalOpen(true);
                        }}
                        data-testid="button-duplicate"
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Webhook Configuration Display */}
            <div className="mt-8 mb-6">
              <Card className="bg-muted/30 border-dashed" data-testid="webhook-config-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <Wifi className="w-4 h-4 text-green-600" data-testid="webhook-status-icon" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid="text-webhook-label">Webhook Make.com</p>
                        <p className="text-xs text-muted-foreground font-mono" data-testid="text-webhook-url">
                          https://hook.eu2.make.com/••••••••••••
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid="badge-webhook-status">
                      Connecté
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* List of Scheduled Posts (Mini View) */}
            <div className="mt-6">
              <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                File d'attente récente
              </h3>
              <Card className="shadow-sm border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Contenu</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Aucun post programmé
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.slice(-5).reverse().map((post) => {
                        const getStatusBadge = (status: string) => {
                          switch (status) {
                            case 'sent':
                            case 'published':
                              return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-3 py-1 text-xs font-medium">Envoyé</Badge>;
                            case 'draft':
                              return <Badge className="bg-gray-400 hover:bg-gray-500 text-white rounded-full px-3 py-1 text-xs font-medium">Brouillon</Badge>;
                            default:
                              return <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-3 py-1 text-xs font-medium">Programmé</Badge>;
                          }
                        };
                        return (
                          <TableRow key={post.id} className="group">
                            <TableCell className="font-medium text-xs whitespace-nowrap">
                              {format(new Date(post.date), "dd/MM HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {post.platforms.map(p => (
                                  <div key={p} className={`w-2 h-2 rounded-full ${p === 'linkedin' ? 'bg-[#0A66C2]' : p === 'instagram' ? 'bg-pink-500' : 'bg-[#1877F2]'}`} title={p} />
                                ))}
                                <span className="truncate max-w-[150px] text-xs text-muted-foreground block">
                                  {post.content}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(post.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {post.status === 'scheduled' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                                    onClick={() => handleSendScheduledPost(post.id)}
                                    disabled={isSending === post.id}
                                    title="Publier maintenant"
                                    data-testid={`button-publish-now-${post.id}`}
                                  >
                                    {isSending === post.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3" />
                                        <span className="hidden sm:inline">Publier</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(post.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>

          {/* Right: Smart Preview */}
          <div className="w-1/2 bg-muted/20 p-8 flex flex-col items-center justify-center border-l border-border relative">
            <div className="absolute top-6 right-6">
              <Badge variant="outline" className="bg-background text-muted-foreground px-3 py-1">
                Aperçu Mobile
              </Badge>
            </div>
            
            <SmartPreview 
              content={watchedContent} 
              image={imagePreview}
              date={watchedDate}
              platforms={watchedPlatforms}
            />
          </div>
        </div>
      </main>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              Collez la réponse de votre IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder='[{ "date": "2024-12-20", "platform": "LinkedIn", "content": "Mon post..." }]'
              className="min-h-[200px] font-mono text-sm"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              data-testid="textarea-import-json"
            />
            <p className="text-xs text-muted-foreground">
              Collez ici le JSON généré par votre LLM. Format attendu : une liste avec date, platform et content.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              data-testid="button-cancel-import"
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-validate-import"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                "Valider et Ajouter au Calendrier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateLibrary
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onSelectTemplate={(content) => form.setValue("content", content)}
      />

      <MultiPlatformPreview
        open={isDuplicateModalOpen}
        onOpenChange={setIsDuplicateModalOpen}
        originalContent={form.watch("content") || ""}
        onDuplicate={async (platforms, adaptedContents) => {
          const date = form.getValues("date");
          const time = form.getValues("time");
          if (!date || !time) {
            toast({
              title: "Erreur",
              description: "Veuillez d'abord sélectionner une date et une heure.",
              variant: "destructive",
            });
            return;
          }
          const fullDate = new Date(`${date}T${time}`);
          for (const platform of platforms) {
            await createPostMutation.mutateAsync({
              content: adaptedContents[platform],
              date: fullDate,
              platforms: [platform],
              status: "scheduled",
            });
          }
          toast({
            title: "Posts dupliqués !",
            description: `${platforms.length} versions créées pour vos plateformes.`,
          });
        }}
      />

      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        content={watchedContent || ""}
        platforms={watchedPlatforms || []}
        onUpdateContent={(newContent) => form.setValue("content", newContent)}
      />

      <ImageGenerator
        isOpen={isImageGeneratorOpen}
        onClose={() => setIsImageGeneratorOpen(false)}
        onSelectImage={(imageUrl) => setImagePreview(imageUrl)}
      />
    </div>
  );
}
