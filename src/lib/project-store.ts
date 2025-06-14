// src/lib/project-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Page {
  id: string;
  name: string;
  projectId: string;
  width: number;
  height: number;
  thumbnail?: string;
  json?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  isPro: boolean;
  userId: string;
  thumbnailUrl?: string | null;
  isTemplate?: boolean;
  pages: Page[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  currentPageId: string | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  
  // Page actions
  addPage: (projectId: string, page: Page) => void;
  updatePage: (projectId: string, pageId: string, updates: Partial<Page>) => void;
  deletePage: (projectId: string, pageId: string) => void;
  setCurrentPage: (projectId: string, pageId: string) => void;
  
  // Helpers
  getCurrentProject: () => Project | null;
  getCurrentPage: () => Page | null;
  getCurrentPageData: (projectId: string, pageId: string) => Page | null;
  updateCurrentPage: (canvasJson: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentPageId: null,

      setProjects: (projects) => set({ projects }),

      addProject: (project) => 
        set((state) => ({ 
          projects: [...state.projects, project] 
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId 
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          ),
        })),

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId,
          currentPageId: state.currentProjectId === projectId ? null : state.currentPageId,
        })),

      addPage: (projectId, page) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { 
                  ...project, 
                  pages: [...project.pages, page],
                  updatedAt: new Date()
                }
              : project
          ),
        })),

      updatePage: (projectId, pageId, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  pages: project.pages.map((page) =>
                    page.id === pageId
                      ? { ...page, ...updates, updatedAt: new Date() }
                      : page
                  ),
                  updatedAt: new Date(),
                }
              : project
          ),
        })),

      deletePage: (projectId, pageId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  pages: project.pages.filter((p) => p.id !== pageId),
                  updatedAt: new Date(),
                }
              : project
          ),
          currentPageId: state.currentPageId === pageId ? null : state.currentPageId,
        })),

      setCurrentPage: (projectId, pageId) =>
        set({
          currentProjectId: projectId,
          currentPageId: pageId,
        }),

      getCurrentProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.currentProjectId) || null;
      },

      getCurrentPage: () => {
        const state = get();
        const project = state.getCurrentProject();
        if (!project) return null;
        return project.pages.find((p) => p.id === state.currentPageId) || null;
      },

      getCurrentPageData: (projectId, pageId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return null;
        return project.pages.find((p) => p.id === pageId) || null;
      },

      updateCurrentPage: (canvasJson) => {
        const state = get();
        if (state.currentProjectId && state.currentPageId) {
          state.updatePage(
            state.currentProjectId, 
            state.currentPageId, 
            { json: canvasJson }
          );
        }
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);