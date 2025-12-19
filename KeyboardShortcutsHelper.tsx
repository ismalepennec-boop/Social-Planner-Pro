import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { category: "Navigation", items: [
    { keys: ["P"], description: "Ouvrir Planificateur" },
    { keys: ["V"], description: "Ouvrir Laboratoire Vidéo" },
    { keys: ["C"], description: "Ouvrir Calendrier" },
    { keys: ["K"], description: "Ouvrir vue Kanban" },
    { keys: ["A"], description: "Voir Analytiques" },
  ]},
  { category: "Général", items: [
    { keys: ["Esc"], description: "Fermer modal" },
    { keys: ["?"], description: "Afficher cette aide" },
  ]},
];

export function KeyboardShortcutsHelper({ open, onOpenChange }: KeyboardShortcutsHelperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600" />
            Raccourcis clavier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Appuyez sur <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">?</kbd> n'importe où pour afficher cette aide
        </p>
      </DialogContent>
    </Dialog>
  );
}
