import { useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHotkeys } from "react-hotkeys-hook";
import NotFound from "@/pages/not-found";
import PlannerView from "@/pages/planner";
import VideoLabView from "@/pages/video-lab";
import CalendarView from "@/pages/calendar";
import AnalyticsView from "@/pages/analytics";
import KanbanView from "@/pages/kanban";
import { KeyboardShortcutsHelper } from "@/components/KeyboardShortcutsHelper";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/planner" />} />
      <Route path="/planner" component={PlannerView} />
      <Route path="/video-lab" component={VideoLabView} />
      <Route path="/calendar" component={CalendarView} />
      <Route path="/kanban" component={KanbanView} />
      <Route path="/analytics" component={AnalyticsView} />
      <Route path="/settings" component={() => <div className="p-8 ml-64">Paramètres (Non implémenté)</div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [, setLocation] = useLocation();

  useHotkeys("shift+/", () => setShowShortcuts(true), { preventDefault: true });
  useHotkeys("p", () => setLocation("/planner"));
  useHotkeys("v", () => setLocation("/video-lab"));
  useHotkeys("c", () => setLocation("/calendar"));
  useHotkeys("k", () => setLocation("/kanban"));
  useHotkeys("a", () => setLocation("/analytics"));
  useHotkeys("escape", () => setShowShortcuts(false));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <KeyboardShortcutsHelper open={showShortcuts} onOpenChange={setShowShortcuts} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
