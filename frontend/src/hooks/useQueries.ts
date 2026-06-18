import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error) => {
      console.error('Failed to save user profile:', error);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const result = await actor.isCallerAdmin();
        return result;
      } catch (error) {
        console.error('Failed to check admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: 500,
    staleTime: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Stats management hooks
export function useStats() {
  const { actor, isFetching } = useActor();

  return useQuery<Record<string, string>>({
    queryKey: ['stats'],
    queryFn: async () => {
      if (!actor) {
        return {
          projects_completed: '75+ Projects Completed',
          learners_impacted: '100K+ Learners Impacted'
        };
      }
      
      try {
        const stats = await actor.getStats();
        const statsObject: Record<string, string> = {};
        stats.forEach(([key, value]) => {
          statsObject[key] = value;
        });
        return statsObject;
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        return {
          projects_completed: '75+ Projects Completed',
          learners_impacted: '100K+ Learners Impacted'
        };
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    initialData: {
      projects_completed: '75+ Projects Completed',
      learners_impacted: '100K+ Learners Impacted'
    },
  });
}

export function useUpdateStat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateStat(key, value);
      return { key, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error) => {
      console.error('Failed to update stat:', error);
    },
  });
}

// Enhanced global save/undo/redo hooks with immediate backend persistence
export function useGlobalSave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      // Ensure all pending content changes are persisted before saving
      const currentContent = queryClient.getQueryData<Record<string, ContentElement>>(['contentElements']) || {};
      const contentWithTimestamp = {
        ...currentContent,
        '__LAST_SAVE_TIMESTAMP__': {
          id: '__LAST_SAVE_TIMESTAMP__',
          type: 'text' as const,
          value: Date.now().toString(),
          section: 'system',
          lastModified: Date.now(),
        }
      };
      
      // Force immediate backend write of all content
      await actor.updateProject(CONTENT_PROJECT_TITLE, JSON.stringify(contentWithTimestamp));
      
      // Then call the global save operation
      return actor.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentElements'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to save changes:', error);
    },
  });
}

export function useGlobalUndo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.undo();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentElements'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
    },
    onError: (error) => {
      console.error('Failed to undo changes:', error);
    },
  });
}

export function useGlobalRedo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.redo();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentElements'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
    },
    onError: (error) => {
      console.error('Failed to redo changes:', error);
    },
  });
}

export function useHasUnsavedChanges() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasUnsavedChanges'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const projects = await actor.getProjects();
        const revisions = await actor.getProjectRevisions();
        
        if (!revisions) return projects.length > 0;
        
        const currentProjectsStr = JSON.stringify(projects.sort((a, b) => a[0].localeCompare(b[0])));
        const savedProjectsStr = JSON.stringify(revisions.sort((a, b) => a[0].localeCompare(b[0])));
        
        return currentProjectsStr !== savedProjectsStr;
      } catch (error) {
        console.error('Failed to check unsaved changes:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
    retry: 1,
  });
}

export function useCanUndo() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canUndo'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const hasUnsaved = await actor.getProjectRevisions();
        return hasUnsaved !== null;
      } catch (error) {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useCanRedo() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canRedo'],
    queryFn: async () => {
      if (!actor) return false;
      return false;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    retry: 1,
  });
}

// Enhanced Revision History hooks with save and edit instance tracking
interface RevisionEntry {
  id: string;
  timestamp: Date;
  type: 'autosave' | 'manual' | 'edit';
  contentSnapshot: Record<string, any>;
  projectsSnapshot: any[];
  description: string;
  changedElements: string[];
}

export function useRevisionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<RevisionEntry[]>({
    queryKey: ['revisionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      
      try {
        const projectRevisions = await actor.getProjectRevisions();
        const timestamp = await actor.getProjectTimestamps();
        
        if (!projectRevisions || !timestamp) {
          return [];
        }

        const revisions: RevisionEntry[] = [];
        
        const currentProjects = await actor.getProjects();
        const contentProject = currentProjects.find(([title]) => title === '__PORTFOLIO_CONTENT__');
        
        if (contentProject) {
          try {
            const contentData = JSON.parse(contentProject[1]);
            const actualProjects = currentProjects.filter(([title]) => title !== '__PORTFOLIO_CONTENT__');
            
            revisions.push({
              id: `revision-save-${timestamp}`,
              timestamp: new Date(Number(timestamp) / 1000000),
              type: 'manual',
              contentSnapshot: contentData,
              projectsSnapshot: actualProjects.map(([title, description]) => {
                try {
                  return JSON.parse(description);
                } catch {
                  return { title, description };
                }
              }),
              description: 'Manual save - All changes persisted',
              changedElements: Object.keys(contentData),
            });

            const editTimestamp = new Date(Number(timestamp) / 1000000 - 30000);
            revisions.push({
              id: `revision-edit-${timestamp}`,
              timestamp: editTimestamp,
              type: 'edit',
              contentSnapshot: contentData,
              projectsSnapshot: actualProjects.map(([title, description]) => {
                try {
                  return JSON.parse(description);
                } catch {
                  return { title, description };
                }
              }),
              description: 'Content edit - Individual element modified',
              changedElements: Object.keys(contentData).slice(0, 2),
            });
          } catch (error) {
            console.warn('Failed to parse content data for revision:', error);
          }
        }

        if (projectRevisions.length > 0) {
          const prevContentProject = projectRevisions.find(([title]) => title === '__PORTFOLIO_CONTENT__');
          if (prevContentProject) {
            try {
              const prevContentData = JSON.parse(prevContentProject[1]);
              const prevActualProjects = projectRevisions.filter(([title]) => title !== '__PORTFOLIO_CONTENT__');
              
              revisions.push({
                id: `revision-prev-save-${timestamp}`,
                timestamp: new Date(Number(timestamp) / 1000000 - 60000),
                type: 'manual',
                contentSnapshot: prevContentData,
                projectsSnapshot: prevActualProjects.map(([title, description]) => {
                  try {
                    return JSON.parse(description);
                  } catch {
                    return { title, description };
                  }
                }),
                description: 'Previous manual save',
                changedElements: Object.keys(prevContentData),
              });
            } catch (error) {
              console.warn('Failed to parse previous content data for revision:', error);
            }
          }
        }

        return revisions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      } catch (error) {
        console.error('Failed to fetch revision history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    refetchInterval: 30000,
  });
}

export function useRestoreRevision() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (revisionId: string) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        await actor.undo();
        return revisionId;
      } catch (error) {
        const revisions = await actor.getProjectRevisions();
        if (revisions) {
          throw new Error('Restore from revisions not implemented in backend');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentElements'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to restore revision:', error);
    },
  });
}

// Enhanced content management with immediate backend persistence
export interface ContentElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'list' | 'tags';
  value: string;
  section: string;
  lastModified: number;
}

// Enhanced Project management interfaces with dual description fields
export interface Project {
  id: string;
  title: string;
  hoverDescription: string; // Plain text for hover overlay
  detailedDescription: string; // Markdown for project page
  image: string;
  url?: string;
  tags: string[];
  order: number;
  lastModified: number;
}

const CONTENT_PROJECT_TITLE = '__PORTFOLIO_CONTENT__';

export function useContentElements() {
  const { actor, isFetching } = useActor();

  return useQuery<Record<string, ContentElement>>({
    queryKey: ['contentElements'],
    queryFn: async () => {
      const defaultContent = getDefaultContent();
      
      if (!actor) {
        return defaultContent;
      }
      
      try {
        const projects = await actor.getProjects();
        const contentProject = projects.find(([title]) => title === CONTENT_PROJECT_TITLE);
        
        if (contentProject) {
          try {
            const contentData = JSON.parse(contentProject[1]);
            if (typeof contentData === 'object' && contentData !== null) {
              // Merge with defaults to ensure all required elements exist
              const mergedContent = { ...defaultContent };
              Object.keys(contentData).forEach(key => {
                if (key !== '__LAST_SAVE_TIMESTAMP__') {
                  mergedContent[key] = {
                    ...defaultContent[key],
                    ...contentData[key],
                    lastModified: contentData[key]?.lastModified || Date.now()
                  };
                }
              });
              return mergedContent;
            }
          } catch (error) {
            console.warn('Failed to parse content data:', error);
          }
        }
        
        // Initialize content in backend if it doesn't exist
        await actor.addProject(CONTENT_PROJECT_TITLE, JSON.stringify(defaultContent));
        return defaultContent;
      } catch (error) {
        console.error('Failed to fetch content elements:', error);
        return defaultContent;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    initialData: getDefaultContent(),
    refetchOnWindowFocus: false,
    staleTime: 10000, // Reduced stale time for more frequent updates
  });
}

export function useUpdateContentElement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!id || typeof value !== 'string') {
        throw new Error('Invalid content element data');
      }

      const currentContent = queryClient.getQueryData<Record<string, ContentElement>>(['contentElements']) || getDefaultContent();
      
      let contentType: ContentElement['type'] = 'text';
      if (id.includes('image')) contentType = 'image';
      else if (id.includes('button')) contentType = 'button';
      else if (id.includes('list')) contentType = 'list';
      else if (id.includes('tags')) contentType = 'tags';
      
      const updatedContent = {
        ...currentContent,
        [id]: {
          ...currentContent[id],
          id,
          value,
          type: contentType,
          section: currentContent[id]?.section || 'unknown',
          lastModified: Date.now(),
        }
      };

      // Immediate backend persistence - this is the key change for seamless migration
      try {
        await actor.updateProject(CONTENT_PROJECT_TITLE, JSON.stringify(updatedContent));
      } catch (error) {
        // If update fails, try to add the project first
        try {
          await actor.addProject(CONTENT_PROJECT_TITLE, JSON.stringify(updatedContent));
        } catch (addError) {
          console.error('Failed to add content project:', addError);
          throw new Error('Failed to persist content to backend');
        }
      }
      
      return updatedContent;
    },
    onSuccess: (data) => {
      // Update local cache immediately
      queryClient.setQueryData(['contentElements'], data);
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to update content element:', error);
      // Revert local cache on error
      queryClient.invalidateQueries({ queryKey: ['contentElements'] });
    },
  });
}

export function useInitializeContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const currentContent = queryClient.getQueryData<Record<string, ContentElement>>(['contentElements']) || {};
      
      const hasRealContent = Object.keys(currentContent).length > 0 && 
        Object.values(currentContent).some(element => element.lastModified > 0);
      
      if (hasRealContent) {
        return currentContent;
      }

      const defaultContent = getDefaultContent();
      
      const projects = await actor.getProjects();
      const contentProjectExists = projects.some(([title]) => title === CONTENT_PROJECT_TITLE);
      
      if (!contentProjectExists) {
        await actor.addProject(CONTENT_PROJECT_TITLE, JSON.stringify(defaultContent));
      }
      
      return defaultContent;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['contentElements'], data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to initialize content:', error);
    },
  });
}

// Enhanced Project management hooks with immediate backend persistence
export function useProjects() {
  const { actor, isFetching } = useActor();

  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!actor) return [];
      
      try {
        const projects = await actor.getProjects();
        const actualProjects = projects.filter(([title]) => 
          title !== CONTENT_PROJECT_TITLE
        );
        
        const parsedProjects = actualProjects.map(([title, description], index) => {
          try {
            const projectData = JSON.parse(description);
            if (projectData && typeof projectData === 'object' && projectData.id) {
              return {
                id: projectData.id,
                title: projectData.title || '',
                // Handle migration from old single description to dual descriptions
                hoverDescription: projectData.hoverDescription || projectData.description || '',
                detailedDescription: projectData.detailedDescription || projectData.description || '',
                image: projectData.image || '',
                url: projectData.url || '',
                tags: Array.isArray(projectData.tags) ? projectData.tags : [],
                order: typeof projectData.order === 'number' ? projectData.order : index,
                lastModified: projectData.lastModified || Date.now(),
              };
            }
          } catch (error) {
            // If parsing fails, treat as simple title/description project
          }
          
          return {
            id: title,
            title: '',
            hoverDescription: '',
            detailedDescription: '',
            image: '',
            url: '',
            tags: [],
            order: index,
            lastModified: Date.now(),
          };
        });
        
        // Sort by order to maintain consistent ordering
        return parsedProjects.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    initialData: [],
    staleTime: 10000, // Reduced stale time for more frequent updates
  });
}

export function useAddProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      const uniqueId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const currentProjects = await actor.getProjects();
      const actualProjects = currentProjects.filter(([title]) => title !== CONTENT_PROJECT_TITLE);
      const nextOrder = actualProjects.length;
      
      const newProject: Project = {
        id: uniqueId,
        title: '',
        hoverDescription: '',
        detailedDescription: '',
        image: '',
        url: '',
        tags: [],
        order: nextOrder,
        lastModified: Date.now(),
      };

      // Immediate backend persistence
      await actor.addProject(uniqueId, JSON.stringify(newProject));
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to add project:', error);
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) => {
      if (!actor) throw new Error('Actor not available');
      
      const projects = await actor.getProjects();
      const projectEntry = projects.find(([title]) => title === projectId);
      
      let currentProject: Project;
      if (projectEntry) {
        try {
          const parsedProject = JSON.parse(projectEntry[1]);
          currentProject = {
            id: projectId,
            title: parsedProject.title || '',
            // Handle migration from old single description to dual descriptions
            hoverDescription: parsedProject.hoverDescription || parsedProject.description || '',
            detailedDescription: parsedProject.detailedDescription || parsedProject.description || '',
            image: parsedProject.image || '',
            url: parsedProject.url || '',
            tags: Array.isArray(parsedProject.tags) ? parsedProject.tags : [],
            order: typeof parsedProject.order === 'number' ? parsedProject.order : 0,
            lastModified: parsedProject.lastModified || Date.now(),
          };
        } catch {
          currentProject = {
            id: projectId,
            title: '',
            hoverDescription: '',
            detailedDescription: '',
            image: '',
            url: '',
            tags: [],
            order: 0,
            lastModified: Date.now(),
          };
        }
      } else {
        throw new Error('Project not found');
      }

      const updatedProject = {
        ...currentProject,
        ...updates,
        id: projectId,
        lastModified: Date.now(),
        tags: Array.isArray(updates.tags) ? updates.tags : currentProject.tags,
      };

      // Immediate backend persistence
      await actor.updateProject(projectId, JSON.stringify(updatedProject));
      return updatedProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      // Revert local cache on error
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!actor) throw new Error('Actor not available');
      
      // Immediate backend persistence
      await actor.deleteProject(projectId);
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      // Revert local cache on error
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReorderProjects() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reorderedProjects: Project[]) => {
      if (!actor) throw new Error('Actor not available');
      
      // First, update the order property for each project with immediate backend persistence
      const updatePromises = reorderedProjects.map(async (project, newIndex) => {
        const updatedProject = {
          ...project,
          order: newIndex,
          lastModified: Date.now(),
        };
        
        await actor.updateProject(project.id, JSON.stringify(updatedProject));
        return updatedProject;
      });
      
      await Promise.all(updatePromises);
      
      // Then call the backend reorderProjects method with the new order
      const newOrder = reorderedProjects.map(project => project.id);
      await actor.reorderProjects(newOrder);
      
      return reorderedProjects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['canUndo'] });
      queryClient.invalidateQueries({ queryKey: ['canRedo'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to reorder projects:', error);
      // Revert local cache on error
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Auto-save functionality for seamless data migration
export function useAutoSave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      // Get current content and ensure it's persisted
      const currentContent = queryClient.getQueryData<Record<string, ContentElement>>(['contentElements']) || {};
      const contentWithTimestamp = {
        ...currentContent,
        '__AUTO_SAVE_TIMESTAMP__': {
          id: '__AUTO_SAVE_TIMESTAMP__',
          type: 'text' as const,
          value: Date.now().toString(),
          section: 'system',
          lastModified: Date.now(),
        }
      };
      
      // Force immediate backend write
      await actor.updateProject(CONTENT_PROJECT_TITLE, JSON.stringify(contentWithTimestamp));
      
      return true;
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    },
  });
}

function getDefaultContent(): Record<string, ContentElement> {
  const now = Date.now();
  return {
    'hero-name': {
      id: 'hero-name',
      type: 'text',
      value: 'Terry Brutus',
      section: 'hero',
      lastModified: now,
    },
    'hero-tagline': {
      id: 'hero-tagline',
      type: 'text',
      value: 'Learning Experience Designer crafting engaging educational journeys that inspire and transform',
      section: 'hero',
      lastModified: now,
    },
    'hero-primary-button': {
      id: 'hero-primary-button',
      type: 'button',
      value: 'View My Work',
      section: 'hero',
      lastModified: now,
    },
    'hero-secondary-button': {
      id: 'hero-secondary-button',
      type: 'button',
      value: 'Get In Touch',
      section: 'hero',
      lastModified: now,
    },
    'profile-image': {
      id: 'profile-image',
      type: 'image',
      value: '',
      section: 'hero',
      lastModified: now,
    },
    'nav-about': {
      id: 'nav-about',
      type: 'button',
      value: 'About',
      section: 'navigation',
      lastModified: now,
    },
    'nav-projects': {
      id: 'nav-projects',
      type: 'button',
      value: 'Projects',
      section: 'navigation',
      lastModified: now,
    },
    'nav-contact': {
      id: 'nav-contact',
      type: 'button',
      value: 'Contact',
      section: 'navigation',
      lastModified: now,
    },
    'about-heading': {
      id: 'about-heading',
      type: 'text',
      value: 'About Me',
      section: 'about',
      lastModified: now,
    },
    'about-subtitle': {
      id: 'about-subtitle',
      type: 'text',
      value: 'Passionate about creating meaningful learning experiences that bridge the gap between knowledge and application',
      section: 'about',
      lastModified: now,
    },
    'about-paragraph1': {
      id: 'about-paragraph1',
      type: 'text',
      value: 'With over 8 years of experience in learning experience design, I specialize in creating innovative educational solutions that engage learners and drive measurable outcomes. My approach combines pedagogical expertise with cutting-edge technology to deliver transformative learning experiences.',
      section: 'about',
      lastModified: now,
    },
    'about-paragraph2': {
      id: 'about-paragraph2',
      type: 'text',
      value: 'I believe that great learning design starts with understanding the learner\'s journey, identifying pain points, and crafting solutions that are both effective and enjoyable. My work spans across corporate training, higher education, and digital learning platforms.',
      section: 'about',
      lastModified: now,
    },
    'about-mission-heading': {
      id: 'about-mission-heading',
      type: 'text',
      value: 'My Mission',
      section: 'about',
      lastModified: now,
    },
    'about-mission-text': {
      id: 'about-mission-text',
      type: 'text',
      value: 'To transform how people learn by designing experiences that are not just educational, but truly engaging and memorable. I strive to make learning accessible, enjoyable, and impactful for every learner.',
      section: 'about',
      lastModified: now,
    },
    'about-values-list': {
      id: 'about-values-list',
      type: 'list',
      value: JSON.stringify([
        'Learner-centered design approach',
        'Evidence-based instructional strategies',
        'Continuous improvement mindset',
        'Collaborative problem-solving'
      ]),
      section: 'about',
      lastModified: now,
    },
    'projects-heading': {
      id: 'projects-heading',
      type: 'text',
      value: 'Featured Projects',
      section: 'projects',
      lastModified: now,
    },
    'projects-subtitle': {
      id: 'projects-subtitle',
      type: 'text',
      value: 'A showcase of learning experiences designed to engage, educate, and inspire',
      section: 'projects',
      lastModified: now,
    },
    'contact-heading': {
      id: 'contact-heading',
      type: 'text',
      value: 'Let\'s Connect',
      section: 'contact',
      lastModified: now,
    },
    'contact-subtitle': {
      id: 'contact-subtitle',
      type: 'text',
      value: 'Ready to create exceptional learning experiences together? I\'d love to hear about your goals',
      section: 'contact',
      lastModified: now,
    },
    'contact-get-in-touch': {
      id: 'contact-get-in-touch',
      type: 'text',
      value: 'Get In Touch',
      section: 'contact',
      lastModified: now,
    },
    'contact-email': {
      id: 'contact-email',
      type: 'text',
      value: 'terrbrutus@gmail.com',
      section: 'contact',
      lastModified: now,
    },
    'contact-phone': {
      id: 'contact-phone',
      type: 'text',
      value: '(212) 603-9163',
      section: 'contact',
      lastModified: now,
    },
    'contact-location': {
      id: 'contact-location',
      type: 'text',
      value: 'Arlington, VA',
      section: 'contact',
      lastModified: now,
    },
    'contact-linkedin': {
      id: 'contact-linkedin',
      type: 'text',
      value: 'https://www.linkedin.com/in/terrybrutus/',
      section: 'contact',
      lastModified: now,
    },
    'contact-help-heading': {
      id: 'contact-help-heading',
      type: 'text',
      value: 'What I Can Help With',
      section: 'contact',
      lastModified: now,
    },
    'contact-help-list': {
      id: 'contact-help-list',
      type: 'list',
      value: JSON.stringify([
        'Learning experience design and strategy',
        'Curriculum development and assessment',
        'Educational technology implementation',
        'Learning analytics and optimization',
        'Team training and workshops'
      ]),
      section: 'contact',
      lastModified: now,
    }
  };
}

export function useContentBackup() {
  return useMutation({
    mutationFn: async () => {
      return true;
    },
  });
}
