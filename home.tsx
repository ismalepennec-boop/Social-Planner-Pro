import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Upload, Plus, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post, getPosts, savePost, deletePost } from "@/lib/storage";

const formSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  platforms: z.array(z.string()).min(1, "Sélectionnez au moins une plateforme"),
});

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
];

const WEBHOOK_URL = "https://hook.eu2.make.com/ggpl39kbqjli1tfyldlyqxxd12ns1nxy";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      date: "",
      time: "",
      platforms: [],
    },
  });

  useEffect(() => {
    setPosts(getPosts());
  }, []);

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
    
    savePost({
      content: values.content,
      date: dateTime.toISOString(),
      platforms: values.platforms,
      image: imagePreview || undefined,
    });

    setPosts(getPosts());
    form.reset();
    setImagePreview(null);
    toast({
      title: "Post planifié !",
      description: "Votre post a été ajouté à la file d'attente.",
    });
  };

  const handleDelete = (id: string) => {
    deletePost(id);
    setPosts(getPosts());
    toast({
      title: "Post supprimé",
      variant: "destructive",
    });
  };

  const handleTestWebhook = async (post: Post) => {
    try {
      toast({
        title: "Envoi en cours...",
        description: "Communication avec Make...",
      });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(post),
      });

      if (response.ok) {
        toast({
          title: "Succès !",
          description: "Données envoyées à Make avec succès !",
          className: "bg-green-50 border-green-200 text-green-900",
        });
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Webhook error:", error);
      toast({
        title: "Erreur d'envoi",
        description: `Impossible de contacter le webhook : ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar Form */}
      <aside className="w-[400px] border-r bg-card h-full flex flex-col shadow-xl z-10">
        <div className="p-6 border-b bg-sidebar-primary text-sidebar-primary-foreground">
          <h1 className="text-xl font-bold font-heading flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Social Scheduler
          </h1>
          <p className="text-xs opacity-80 mt-1">Planifiez vos posts en toute simplicité</p>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Contenu du post</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Quoi de neuf aujourd'hui ?"
                        className="min-h-[120px] resize-none focus-visible:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Image (Optionnel)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer file:text-primary hover:file:bg-primary/10"
                    />
                  </div>
                </div>
                {imagePreview && (
                  <div className="relative mt-2 rounded-md overflow-hidden border aspect-video bg-muted/50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => setImagePreview(null)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input type="time" {...field} />
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
                    <FormLabel className="mb-4 block">Plateformes</FormLabel>
                    <div className="grid grid-cols-1 gap-2 border rounded-lg p-4 bg-muted/20">
                      {PLATFORMS.map((platform) => (
                        <FormField
                          key={platform.id}
                          control={form.control}
                          name="platforms"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={platform.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(platform.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, platform.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== platform.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {platform.label}
                                </FormLabel>
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

              <Button type="submit" className="w-full font-semibold shadow-md" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Planifier le post
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </aside>

      {/* Main Dashboard */}
      <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-heading tracking-tight text-foreground">Tableau de Bord</h2>
              <p className="text-muted-foreground mt-1">Vue d'ensemble de vos publications programmées.</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                {posts.length} Posts prévus
              </Badge>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="px-6 py-4 border-b bg-muted/30">
              <CardTitle className="text-lg font-medium">File d'attente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Aucun post planifié</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Utilisez le formulaire à gauche pour créer et planifier votre premier contenu.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[180px]">Date & Heure</TableHead>
                      <TableHead className="w-[200px]">Plateformes</TableHead>
                      <TableHead>Aperçu</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[180px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((post) => (
                      <TableRow key={post.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-foreground">
                              {format(new Date(post.date), "d MMM yyyy", { locale: fr })}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(post.date), "HH:mm")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {post.platforms.map((p) => (
                              <Badge key={p} variant="outline" className="capitalize bg-background">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Thumbnail"
                                className="w-10 h-10 rounded object-cover border bg-muted"
                              />
                            )}
                            <p className="line-clamp-2 text-sm text-muted-foreground max-w-[300px]">
                              {post.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none border-blue-200">
                            Planifié
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleTestWebhook(post)}
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Test
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
