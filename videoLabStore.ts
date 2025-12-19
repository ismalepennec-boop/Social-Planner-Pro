import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VideoStep = 'script' | 'voice' | 'visual' | 'music' | 'export';

export interface VideoProject {
  id: string;
  script: string;
  selectedTemplate: string | null;
  selectedHooks: string[];
  voiceSettings: {
    enabled: boolean;
    speed: number;
  };
  subtitles: {
    enabled: boolean;
    highlightKeywords: boolean;
    style: 'minimal' | 'bold' | 'neon';
  };
  videoFile: string | null;
  videoFileName: string | null;
  selectedPexelsVideo: string | null;
  selectedMusic: string | null;
  format: 'tiktok' | 'instagram-reel' | 'youtube-short';
  lastSaved: number;
}

interface VideoLabState {
  currentStep: VideoStep;
  project: VideoProject;
  savedProjects: VideoProject[];
  setStep: (step: VideoStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateProject: (updates: Partial<VideoProject>) => void;
  resetProject: () => void;
  calculateViralityScore: () => number;
  addProjects: (projects: Partial<VideoProject>[]) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
}

const STEPS: VideoStep[] = ['script', 'voice', 'visual', 'music', 'export'];

const defaultProject: VideoProject = {
  id: crypto.randomUUID(),
  script: '',
  selectedTemplate: null,
  selectedHooks: [],
  voiceSettings: {
    enabled: false,
    speed: 1,
  },
  subtitles: {
    enabled: true,
    highlightKeywords: true,
    style: 'bold',
  },
  videoFile: null,
  videoFileName: null,
  selectedPexelsVideo: null,
  selectedMusic: null,
  format: 'tiktok',
  lastSaved: Date.now(),
};

export const useVideoLabStore = create<VideoLabState>()(
  persist(
    (set, get) => ({
      currentStep: 'script',
      project: { ...defaultProject },
      savedProjects: [],
      
      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const currentIndex = STEPS.indexOf(get().currentStep);
        if (currentIndex < STEPS.length - 1) {
          set({ currentStep: STEPS[currentIndex + 1] });
        }
      },
      
      prevStep: () => {
        const currentIndex = STEPS.indexOf(get().currentStep);
        if (currentIndex > 0) {
          set({ currentStep: STEPS[currentIndex - 1] });
        }
      },
      
      updateProject: (updates) => set((state) => ({
        project: {
          ...state.project,
          ...updates,
          lastSaved: Date.now(),
        },
      })),
      
      resetProject: () => set({
        currentStep: 'script',
        project: { ...defaultProject, id: crypto.randomUUID() },
      }),
      
      addProjects: (projects) => set((state) => {
        const newProjects: VideoProject[] = projects.map((p) => ({
          id: crypto.randomUUID(),
          script: p.script || '',
          selectedTemplate: p.selectedTemplate || null,
          selectedHooks: p.selectedHooks || [],
          voiceSettings: {
            enabled: false,
            speed: 1,
          },
          subtitles: {
            enabled: true,
            highlightKeywords: true,
            style: 'bold' as const,
          },
          videoFile: null,
          videoFileName: null,
          selectedPexelsVideo: null,
          selectedMusic: null,
          format: p.format || 'tiktok',
          lastSaved: Date.now(),
        }));
        return {
          savedProjects: [...state.savedProjects, ...newProjects],
        };
      }),
      
      loadProject: (id) => {
        const { savedProjects } = get();
        const found = savedProjects.find((p) => p.id === id);
        if (found) {
          set({ project: found, currentStep: 'script' });
        }
      },
      
      deleteProject: (id) => set((state) => ({
        savedProjects: state.savedProjects.filter((p) => p.id !== id),
      })),
      
      calculateViralityScore: () => {
        const { project } = get();
        let score = 0;
        
        const hasHook = project.selectedHooks.length > 0 || 
          project.script.toLowerCase().includes('saviez-vous') ||
          project.script.toLowerCase().includes('astuce') ||
          project.script.match(/^\d+\s/);
        if (hasHook) score += 30;
        
        const duration = project.script.length * 0.05;
        if (duration >= 7 && duration <= 30) score += 25;
        
        if (project.subtitles.enabled) score += 25;
        
        if (project.selectedMusic) score += 20;
        
        return Math.min(score, 100);
      },
    }),
    {
      name: 'video-lab-storage',
      partialize: (state) => ({ 
        project: state.project, 
        currentStep: state.currentStep,
        savedProjects: state.savedProjects,
      }),
    }
  )
);
