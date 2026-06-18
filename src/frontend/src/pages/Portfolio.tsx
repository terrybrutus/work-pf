import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useContentElements, useUpdateContentElement, useProjects, useGlobalSave, useGlobalUndo, useGlobalRedo, useHasUnsavedChanges, useCanUndo, useCanRedo, useReorderProjects, useAutoSave, useAudienceViews } from '../hooks/useQueries';
import type { AudienceView, Project } from '../hooks/useQueries';
import { useScrollToSection } from '../hooks/useScrollToSection';
import { useAdminToggle } from '../hooks/useAdminToggle';
import { toast } from 'sonner';

import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ConstellationBackground from '../components/ConstellationBackground';
import Navigation from '../components/navigation/Navigation';
import EditModeBar from '../components/editor/EditModeBar';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import ProjectsSection from '../components/sections/ProjectsSection';
import ContactSection from '../components/sections/ContactSection';
import RevisionHistory from '../components/RevisionHistory';
import ProjectPage from '../components/pages/ProjectPage';
import AudienceViewManager from '../components/AudienceViewManager';

export default function Portfolio() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: contentElements = {}, isLoading: contentLoading, error: contentError } = useContentElements();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: audienceViews = [], isLoading: audienceViewsLoading } = useAudienceViews();
  const updateContentElement = useUpdateContentElement();
  const reorderProjects = useReorderProjects();
  const autoSave = useAutoSave();
  
  const globalSave = useGlobalSave();
  const globalUndo = useGlobalUndo();
  const globalRedo = useGlobalRedo();
  const { data: hasUnsavedChanges = false } = useHasUnsavedChanges();
  const { data: canUndo = false } = useCanUndo();
  const { data: canRedo = false } = useCanRedo();
  
  const scrollToSection = useScrollToSection();
  
  const isAuthenticated = !!identity;
  
  // Pass both authentication state and admin status to useAdminToggle
  // The hook will automatically show buttons when authenticated as admin
  const { showAdminButtons, handleLogoInteraction } = useAdminToggle(isAuthenticated, isAdmin);
  
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showAudienceManager, setShowAudienceManager] = useState(false);
  const [isWYSIWYGMode, setIsWYSIWYGMode] = useState(false);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<'portfolio' | 'project'>('portfolio');
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canEdit = isAuthenticated && isAdmin && isWYSIWYGMode;
  const audienceSlug = getAudienceSlugFromLocation();
  const activeAudience = audienceSlug
    ? audienceViews.find((audience) => audience.slug === audienceSlug) || null
    : null;
  const isAudienceView = Boolean(audienceSlug);
  const isAudienceUnavailable =
    isAudienceView && (!activeAudience || isAudienceExpired(activeAudience));
  const visibleProjects = getAudienceProjects(projects, activeAudience);
  const audienceStyle = getAudienceStyle(activeAudience);

  // Auto-save functionality for seamless data migration
  useEffect(() => {
    if (!canEdit) return;

    const autoSaveInterval = setInterval(() => {
      autoSave.mutate();
    }, 30000); // Auto-save every 30 seconds when in edit mode

    return () => clearInterval(autoSaveInterval);
  }, [canEdit, autoSave]);

  const handleGlobalSave = async () => {
    try {
      await globalSave.mutateAsync();
      setLastSaveTime(new Date());
      toast.success('All changes saved successfully');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleGlobalUndo = async () => {
    try {
      await globalUndo.mutateAsync();
      toast.success('Undid last change');
    } catch (error) {
      console.error('Failed to undo:', error);
      toast.error('Failed to undo change');
    }
  };

  const handleGlobalRedo = async () => {
    try {
      await globalRedo.mutateAsync();
      toast.success('Redid last change');
    } catch (error) {
      console.error('Failed to redo:', error);
      toast.error('Failed to redo change');
    }
  };

  const handleContentUpdate = async (elementId: string, value: string) => {
    try {
      // This now immediately persists to backend via the enhanced useUpdateContentElement
      await updateContentElement.mutateAsync({ id: elementId, value });
    } catch (error) {
      console.error('Failed to update content:', error);
      toast.error('Failed to update content');
    }
  };

  const handleListUpdate = async (elementId: string, items: string[]) => {
    try {
      // This now immediately persists to backend via the enhanced useUpdateContentElement
      await updateContentElement.mutateAsync({ id: elementId, value: JSON.stringify(items) });
    } catch (error) {
      console.error('Failed to update list:', error);
      toast.error('Failed to update list');
    }
  };

  const handleProjectNavigation = (projectSlug: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentProjectSlug(projectSlug);
      setCurrentView('project');
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleNavigateBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('portfolio');
      setCurrentProjectSlug(null);
      setIsTransitioning(false);
    }, 300);
  };

  const handleProjectCardClick = (projectSlug: string) => {
    handleProjectNavigation(projectSlug);
  };

  const getContentValue = (elementId: string, defaultValue: string = '') => {
    return activeAudience?.contentOverrides[elementId] ||
      contentElements[elementId]?.value ||
      defaultValue;
  };

  const getListItems = (elementId: string, defaultItems: string[] = []): string[] => {
    const value = getContentValue(elementId);
    if (!value) return defaultItems;
    
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultItems;
    } catch {
      return defaultItems;
    }
  };

  const startEdit = (elementId: string) => {
    if (canEdit) {
      setEditingElement(elementId);
    }
  };

  const cancelEdit = () => {
    setEditingElement(null);
  };

  const toggleWYSIWYGMode = () => {
    setIsWYSIWYGMode(!isWYSIWYGMode);
    setEditingElement(null);
    toast.success(isWYSIWYGMode ? 'Edit mode disabled' : 'Edit mode enabled');
  };

  const isLoading = contentLoading || projectsLoading || isAdminLoading || audienceViewsLoading;
  const hasError = contentError;
  
  if (hasError) {
    return <ErrorBoundary error={contentError} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAudienceUnavailable) {
    return (
      <ExpiredAudienceView
        audienceSlug={audienceSlug || ''}
        contactEmail={getContentValue('contact-email', 'terrbrutus@gmail.com')}
      />
    );
  }

  // Render project page if in project view
  if (currentView === 'project' && currentProjectSlug) {
    return (
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <ProjectPage 
          projectSlug={currentProjectSlug}
          onNavigateBack={handleNavigateBack}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-background relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      style={audienceStyle}
    >
      <ConstellationBackground />

      <Navigation
        showAdminButtons={showAdminButtons}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isWYSIWYGMode={isWYSIWYGMode}
        onLogoInteraction={handleLogoInteraction}
        onToggleWYSIWYGMode={toggleWYSIWYGMode}
        onShowRevisionHistory={() => setShowRevisionHistory(true)}
        onManageAudienceViews={() => setShowAudienceManager(true)}
        onScrollToSection={scrollToSection}
        getContentValue={getContentValue}
        handleContentUpdate={handleContentUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        canEdit={canEdit}
      />

      {activeAudience && (
        <div className="relative z-20 mx-auto mt-36 max-w-4xl px-6">
          <div
            className="rounded-md border border-white/15 bg-card/80 p-3 text-center text-sm text-white shadow-lg backdrop-blur"
            style={{ borderColor: activeAudience.theme.accent }}
          >
            Tailored portfolio view for {activeAudience.companyName || activeAudience.label}
            {activeAudience.roleTitle ? ` - ${activeAudience.roleTitle}` : ''}
          </div>
        </div>
      )}

      {isWYSIWYGMode && isAuthenticated && isAdmin && (
        <EditModeBar
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaveTime={lastSaveTime}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleGlobalSave}
          onUndo={handleGlobalUndo}
          onRedo={handleGlobalRedo}
          isSaving={globalSave.isPending}
          isUndoing={globalUndo.isPending}
          isRedoing={globalRedo.isPending}
        />
      )}

      <HeroSection
        getContentValue={getContentValue}
        handleContentUpdate={handleContentUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onScrollToSection={scrollToSection}
        canEdit={canEdit}
      />

      <AboutSection
        getContentValue={getContentValue}
        getListItems={getListItems}
        handleContentUpdate={handleContentUpdate}
        handleListUpdate={handleListUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        canEdit={canEdit}
      />

      <ProjectsSection
        projects={visibleProjects}
        canEdit={canEdit}
        hasGlobalUnsavedChanges={hasUnsavedChanges}
        getContentValue={getContentValue}
        handleContentUpdate={handleContentUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onReorderProjects={reorderProjects}
        onProjectClick={handleProjectCardClick}
      />

      <ContactSection
        getContentValue={getContentValue}
        getListItems={getListItems}
        handleContentUpdate={handleContentUpdate}
        handleListUpdate={handleListUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        canEdit={canEdit}
      />

      {isAuthenticated && isAdmin && (
        <RevisionHistory
          isOpen={showRevisionHistory}
          onClose={() => setShowRevisionHistory(false)}
        />
      )}

      {isAuthenticated && isAdmin && (
        <AudienceViewManager
          isOpen={showAudienceManager}
          onClose={() => setShowAudienceManager(false)}
          projects={projects}
        />
      )}
    </div>
  );
}

function getAudienceSlugFromLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  const pathMatch = window.location.pathname.match(/\/v\/([^/?#]+)/);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  return new URLSearchParams(window.location.search).get('v');
}

function getAudienceProjects(projects: Project[], audience: AudienceView | null) {
  if (!audience || audience.projectIds.length === 0) {
    return projects;
  }

  const projectById = new Map(projects.map((project) => [project.id, project]));
  return audience.projectIds
    .map((projectId) => projectById.get(projectId))
    .filter((project): project is Project => Boolean(project));
}

function getAudienceStyle(audience: AudienceView | null): React.CSSProperties | undefined {
  if (!audience) {
    return undefined;
  }

  return {
    backgroundColor: audience.theme.background,
  };
}

function isAudienceExpired(audience: AudienceView) {
  if (audience.status !== 'active') {
    return true;
  }

  if (!audience.expiresAt) {
    return false;
  }

  const expiresAt = new Date(`${audience.expiresAt}T23:59:59`);
  return Number.isFinite(expiresAt.getTime()) && expiresAt < new Date();
}

function ExpiredAudienceView({
  audienceSlug,
  contactEmail,
}: {
  audienceSlug: string;
  contactEmail: string;
}) {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-6">
      <ConstellationBackground />
      <div className="relative z-10 max-w-lg text-center">
        <h1 className="mb-4 text-3xl font-bold text-white">
          This portfolio view is no longer active.
        </h1>
        <p className="mb-6 text-white/80">
          The private view for <span className="font-mono">{audienceSlug}</span> has
          expired or been archived. Reach out and I can refresh the link.
        </p>
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Request a refreshed view
        </a>
      </div>
    </div>
  );
}
