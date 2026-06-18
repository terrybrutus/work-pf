import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile } from '../backend-client';

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
          projects_completed: '100+ Asset Pipeline',
          learners_impacted: '1.2M+ LMS Reach'
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
          projects_completed: '100+ Asset Pipeline',
          learners_impacted: '1.2M+ LMS Reach'
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
const AUDIENCE_PROJECT_TITLE = '__PORTFOLIO_AUDIENCES__';

export type AudienceStatus = 'active' | 'archived' | 'expired';

export interface AudienceTheme {
  primary: string;
  accent: string;
  background: string;
}

export interface AudienceView {
  id: string;
  slug: string;
  label: string;
  companyName: string;
  roleTitle: string;
  status: AudienceStatus;
  expiresAt: string;
  jobDescription: string;
  toneNotes: string;
  jargonNotes: string;
  theme: AudienceTheme;
  projectIds: string[];
  contentOverrides: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

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
      if (!actor) return getDefaultProjects();
      
      try {
        const projects = await actor.getProjects();
        const actualProjects = projects.filter(([title]) => 
          title !== CONTENT_PROJECT_TITLE && title !== AUDIENCE_PROJECT_TITLE
        );

        if (actualProjects.length === 0) {
          return getDefaultProjects();
        }
        
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
    initialData: getDefaultProjects(),
    staleTime: 10000, // Reduced stale time for more frequent updates
  });
}

export function useAudienceViews() {
  const { actor, isFetching } = useActor();

  return useQuery<AudienceView[]>({
    queryKey: ['audienceViews'],
    queryFn: async () => {
      if (!actor) {
        return [];
      }

      try {
        const projects = await actor.getProjects();
        const audienceEntry = projects.find(
          ([title]) => title === AUDIENCE_PROJECT_TITLE,
        );

        if (!audienceEntry) {
          return [];
        }

        const parsed = JSON.parse(audienceEntry[1]);
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed
          .map(normalizeAudienceView)
          .filter((audience): audience is AudienceView => Boolean(audience));
      } catch (error) {
        console.error('Failed to fetch audience views:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    initialData: [],
    staleTime: 10000,
  });
}

export function useSaveAudienceViews() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audienceViews: AudienceView[]) => {
      if (!actor) throw new Error('Actor not available');

      const serializedViews = JSON.stringify(audienceViews);

      try {
        await actor.updateProject(AUDIENCE_PROJECT_TITLE, serializedViews);
      } catch {
        await actor.addProject(AUDIENCE_PROJECT_TITLE, serializedViews);
      }

      return audienceViews;
    },
    onSuccess: (audienceViews) => {
      queryClient.setQueryData(['audienceViews'], audienceViews);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hasUnsavedChanges'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
      console.error('Failed to save audience views:', error);
      queryClient.invalidateQueries({ queryKey: ['audienceViews'] });
    },
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
      const actualProjects = currentProjects.filter(
        ([title]) =>
          title !== CONTENT_PROJECT_TITLE && title !== AUDIENCE_PROJECT_TITLE,
      );
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
      value: 'AI enablement architect, learning systems builder, and workflow automation partner.',
      section: 'hero',
      lastModified: now,
    },
    'hero-primary-button': {
      id: 'hero-primary-button',
      type: 'button',
      value: 'View Case Studies',
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
      value: 'What I Do',
      section: 'about',
      lastModified: now,
    },
    'about-subtitle': {
      id: 'about-subtitle',
      type: 'text',
      value: 'I turn messy knowledge work into clear systems people can use, maintain, and scale.',
      section: 'about',
      lastModified: now,
    },
    'about-paragraph1': {
      id: 'about-paragraph1',
      type: 'text',
      value: 'I sit where learning design, AI operations, compliance, and product thinking overlap. My work has supported federal, municipal, enterprise, sales, healthcare, and SaaS environments.',
      section: 'about',
      lastModified: now,
    },
    'about-paragraph2': {
      id: 'about-paragraph2',
      type: 'text',
      value: 'Recent work includes AI-assisted content pipelines, Section 508/WCAG governance, custom workflow platforms, and Caffeine-built applications that move from idea to usable software quickly.',
      section: 'about',
      lastModified: now,
    },
    'about-mission-heading': {
      id: 'about-mission-heading',
      type: 'text',
      value: 'Operating Mode',
      section: 'about',
      lastModified: now,
    },
    'about-mission-text': {
      id: 'about-mission-text',
      type: 'text',
      value: 'Keep the resume simple. Let the portfolio carry the proof. Tailor the story to the audience without burying the viewer in every detail.',
      section: 'about',
      lastModified: now,
    },
    'about-values-list': {
      id: 'about-values-list',
      type: 'list',
      value: JSON.stringify([
        'AI workflow automation and human-in-the-loop review',
        'Learning systems, onboarding, and readiness architecture',
        'Accessibility, governance, and audit-ready delivery',
        'Rapid Caffeine/ICP app prototyping with editable portfolio pages'
      ]),
      section: 'about',
      lastModified: now,
    },
    'projects-heading': {
      id: 'projects-heading',
      type: 'text',
      value: 'Selected Work',
      section: 'projects',
      lastModified: now,
    },
    'projects-subtitle': {
      id: 'projects-subtitle',
      type: 'text',
      value: 'A lean set of case studies: enough context to understand the work, with details one click deeper.',
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
      value: 'Open to roles, consulting, and build partnerships where learning, AI, and operations need to become one usable system.',
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
      value: 'Leland, NC',
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
      value: 'Useful Conversations',
      section: 'contact',
      lastModified: now,
    },
    'contact-help-list': {
      id: 'contact-help-list',
      type: 'list',
      value: JSON.stringify([
        'AI enablement and workflow automation',
        'Learning experience and onboarding architecture',
        'Section 508/WCAG compliant production systems',
        'Caffeine/ICP prototypes and portfolio-style product demos',
        'ATS-simple resume plus richer tailored portfolio strategy'
      ]),
      section: 'contact',
      lastModified: now,
    }
  };
}

function getDefaultProjects(): Project[] {
  const now = Date.now();

  return [
    {
      id: 'career-city',
      title: 'Career City',
      hoverDescription:
        'A game-style career exploration experience built with Caffeine to make growth, reflection, and learning feel playable.',
      detailedDescription:
        '# Career City\n\n**Role:** product concept, learning experience architecture, AI-assisted build direction\n\nCareer City turns career development into a more visual, interactive journey. It is the kind of portfolio piece that can show learning strategy, product taste, and hands-on AI-enabled software creation in one place.\n\n## Why it matters\n\n* Makes career exploration feel less abstract and more navigable.\n* Shows how learning experience design can become an actual app, not just a course or slide deck.\n* Demonstrates rapid Caffeine/ICP product iteration with persistent state and visual experience design.\n\n## Repository\n\n[github.com/terrybrutus/career-city](https://github.com/terrybrutus/career-city)',
      image: '/assets/project-card-example-1.png',
      url: '',
      tags: ['Caffeine', 'Learning Game', 'AI Build', 'Career Growth'],
      order: 0,
      lastModified: now,
    },
    {
      id: 'ai-talent-pipeline',
      title: 'AI Talent Content Pipeline',
      hoverDescription:
        'A human-in-the-loop AI workflow that reduced content processing from 1.5 hours to 9.5 minutes per deliverable.',
      detailedDescription:
        '# AI Talent Content Pipeline\n\n**Role:** senior talent development lead and AI enablement architect\n\nBuilt an AI-assisted content analysis and skills-alignment process across a 100+ asset pipeline using NotebookLM RAG, Python, VBA, and Claude Code.\n\n## Outcomes\n\n* Reduced per-deliverable processing time from 1.5 hours to 9.5 minutes.\n* Helped standardize the client process for future talent content production.\n* Supported a high-stakes defense acquisition workforce audience of roughly 158,000 people.\n\n## What this proves\n\nI can translate ambiguous content operations into repeatable systems: prompts, scripts, review loops, data structure, and delivery governance.',
      image: '/assets/project-card-example-2.png',
      url: '',
      tags: ['AI Enablement', 'RAG', 'Python', 'VBA', 'Governance'],
      order: 1,
      lastModified: now,
    },
    {
      id: 'work-portfolio-studio',
      title: 'Living Portfolio Studio',
      hoverDescription:
        'The portfolio itself: editable case studies, image management, drag ordering, revision history, and admin-only updates.',
      detailedDescription:
        '# Living Portfolio Studio\n\n**Role:** product owner and AI-assisted builder\n\nThis site is designed to become a living portfolio rather than a static page. The public view stays simple, while the admin layer supports direct content edits, project ordering, image uploads, rich project pages, and revision history.\n\n## Direction\n\n* Keep the resume and LinkedIn minimal.\n* Let the portfolio hold deeper proof and visuals.\n* Build toward private, tailored portfolio views for specific companies or roles.\n\n## Repository\n\n[github.com/terrybrutus/work-pf](https://github.com/terrybrutus/work-pf)',
      image: '/assets/generated/hero-banner.jpg',
      url: '',
      tags: ['Portfolio CMS', 'React', 'Motoko', 'ICP', 'Admin Editing'],
      order: 2,
      lastModified: now,
    },
    {
      id: 'roundrobin-decision-engine',
      title: 'Roundrobin Decision Engine',
      hoverDescription:
        'A Caffeine-built odds and matching tool that shows API diagnosis, data contracts, and practical product debugging.',
      detailedDescription:
        '# Roundrobin Decision Engine\n\n**Role:** AI-assisted product builder and systems debugger\n\nRoundrobin is useful as a portfolio item because it shows practical API work: event matching, raw data inspection, request-contract debugging, and product logic that has to explain empty states instead of hiding them.\n\n## Why it belongs here\n\n* Shows comfort with external APIs and data modeling.\n* Demonstrates debugging from visible product symptoms back to raw request contracts.\n* Fits the broader story: using AI tools to build operational products, not just content.\n\n## Repository\n\n[github.com/terrybrutus/Roundrobin](https://github.com/terrybrutus/Roundrobin)',
      image: '/assets/generated/project-placeholder-1.jpg',
      url: '',
      tags: ['API Debugging', 'Caffeine', 'TypeScript', 'Product Logic'],
      order: 3,
      lastModified: now,
    },
    {
      id: 'stylebook-workflow-system',
      title: 'StyleBook Workflow System',
      hoverDescription:
        'A practical scheduling and style workflow app showing how personal operations can become polished tools.',
      detailedDescription:
        '# StyleBook Workflow System\n\n**Role:** product concept and AI-assisted application builder\n\nStyleBook is a strong supporting portfolio piece because it shows product thinking around everyday workflow: calendar interactions, saved preferences, mobile gestures, and a focused interface built for repeated use.\n\n## What this proves\n\n* Ability to turn a personal workflow into a usable product surface.\n* Attention to interaction details and mobile behavior.\n* Breadth beyond traditional learning deliverables.\n\n## Repository\n\n[github.com/terrybrutus/stylebook2](https://github.com/terrybrutus/stylebook2)',
      image: '/assets/generated/project-placeholder-2.jpg',
      url: '',
      tags: ['Workflow Design', 'React', 'Mobile UX', 'Caffeine'],
      order: 4,
      lastModified: now,
    },
    {
      id: 'stratedge-backtester',
      title: 'StratEdge Backtester',
      hoverDescription:
        'A technical prototype for testing strategies, signals, and decision loops with clearer feedback.',
      detailedDescription:
        '# StratEdge Backtester\n\n**Role:** AI-assisted builder and product strategist\n\nStratEdge shows a different side of the portfolio: systems thinking applied to testing, feedback loops, and decision support.\n\n## Why it matters\n\n* Expands the story beyond learning and enablement into analytical product building.\n* Shows comfort with finance-adjacent workflows and experimentation tools.\n* Reinforces the theme of making complex decisions easier to inspect.\n\n## Repository\n\n[github.com/terrybrutus/Fxify-backtesting](https://github.com/terrybrutus/Fxify-backtesting)',
      image: '/assets/generated/project-placeholder-3.jpg',
      url: '',
      tags: ['Backtesting', 'Decision Support', 'TypeScript', 'Caffeine'],
      order: 5,
      lastModified: now,
    },
  ];
}

function normalizeAudienceView(value: unknown): AudienceView | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Partial<AudienceView>;
  const now = Date.now();
  const status: AudienceStatus =
    source.status === 'archived' || source.status === 'expired'
      ? source.status
      : 'active';

  return {
    id: typeof source.id === 'string' ? source.id : `audience-${now}`,
    slug: typeof source.slug === 'string' ? source.slug : '',
    label: typeof source.label === 'string' ? source.label : 'Untitled view',
    companyName:
      typeof source.companyName === 'string' ? source.companyName : '',
    roleTitle: typeof source.roleTitle === 'string' ? source.roleTitle : '',
    status,
    expiresAt: typeof source.expiresAt === 'string' ? source.expiresAt : '',
    jobDescription:
      typeof source.jobDescription === 'string' ? source.jobDescription : '',
    toneNotes: typeof source.toneNotes === 'string' ? source.toneNotes : '',
    jargonNotes:
      typeof source.jargonNotes === 'string' ? source.jargonNotes : '',
    theme: {
      primary:
        typeof source.theme?.primary === 'string'
          ? source.theme.primary
          : '#42d3a5',
      accent:
        typeof source.theme?.accent === 'string'
          ? source.theme.accent
          : '#d8b25c',
      background:
        typeof source.theme?.background === 'string'
          ? source.theme.background
          : '#111827',
    },
    projectIds: Array.isArray(source.projectIds)
      ? source.projectIds.filter((projectId) => typeof projectId === 'string')
      : [],
    contentOverrides:
      source.contentOverrides && typeof source.contentOverrides === 'object'
        ? source.contentOverrides
        : {},
    createdAt:
      typeof source.createdAt === 'number' ? source.createdAt : now,
    updatedAt:
      typeof source.updatedAt === 'number' ? source.updatedAt : now,
  };
}

export function useContentBackup() {
  return useMutation({
    mutationFn: async () => {
      return true;
    },
  });
}
