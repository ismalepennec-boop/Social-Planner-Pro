import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Linkedin, Instagram, Facebook } from "lucide-react";
import templatesData from "@/data/templates.json";

interface Template {
  id: string;
  name: string;
  content: string;
  platforms: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  templates: Template[];
}

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (content: string) => void;
}

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

export function TemplateLibrary({ open, onOpenChange, onSelectTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const categories = templatesData.categories as Category[];

  const filteredTemplates = categories.flatMap((cat) => {
    if (selectedCategory && cat.id !== selectedCategory) return [];
    return cat.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(t => ({ ...t, categoryName: cat.name, categoryIcon: cat.icon }));
  });

  const handleUseTemplate = (content: string) => {
    onSelectTemplate(content);
    onOpenChange(false);
    setPreviewTemplate(null);
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Bibliothèque de Templates
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Sidebar categories */}
          <div className="w-48 border-r pr-4 space-y-2">
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => setSelectedCategory(null)}
            >
              Tous les templates
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                className="w-full justify-start text-sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-template"
              />
            </div>

            {/* Templates grid or preview */}
            {previewTemplate ? (
              <div className="flex-1 flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start mb-4"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ← Retour aux templates
                </Button>
                <div className="flex-1 border rounded-lg p-6 bg-muted/30">
                  <h3 className="font-semibold text-lg mb-2">{previewTemplate.name}</h3>
                  <div className="flex gap-1 mb-4">
                    {previewTemplate.platforms.map((p) => (
                      <PlatformIcon key={p} platform={p} />
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-4 border whitespace-pre-wrap text-sm">
                    {previewTemplate.content}
                  </div>
                </div>
                <Button
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleUseTemplate(previewTemplate.content)}
                  data-testid="button-use-template"
                >
                  Utiliser ce template
                </Button>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
                      onClick={() => setPreviewTemplate(template)}
                      data-testid={`template-card-${template.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {(template as any).categoryIcon} {(template as any).categoryName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                        {template.content}
                      </p>
                      <div className="flex gap-1">
                        {template.platforms.map((p) => (
                          <PlatformIcon key={p} platform={p} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      Aucun template trouvé
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
