import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useContentElements, useUpdateContentElement, useProjects, useGlobalSave, useGlobalUndo, useGlobalRedo, useHasUnsavedChanges, useCanUndo, useCanRedo, useReorderProjects, useAutoSave } from '../hooks/useQueries';
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

export default function Portfolio() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin = false, isLoading: isAdminLoading, isFetched: isAdminFetched } = useIsCallerAdmin();
  const { data: contentElements = {}, isLoading: contentLoading, error: contentError } = useContentElements();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
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
  const [isWYSIWYGMode, setIsWYSIWYGMode] = useState(false);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<'portfolio' | 'project'>('portfolio');
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canEdit = isAuthenticated && isAdmin && isWYSIWYGMode;

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
    return contentElements[elementId]?.value || defaultValue;
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

  const isLoading = contentLoading || projectsLoading || isAdminLoading;
  const hasError = contentError;
  
  if (hasError) {
    return <ErrorBoundary error={contentError} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
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
    <div className={`min-h-screen bg-background relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <ConstellationBackground />

      <Navigation
        showAdminButtons={showAdminButtons}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isWYSIWYGMode={isWYSIWYGMode}
        onLogoInteraction={handleLogoInteraction}
        onToggleWYSIWYGMode={toggleWYSIWYGMode}
        onShowRevisionHistory={() => setShowRevisionHistory(true)}
        onScrollToSection={scrollToSection}
        getContentValue={getContentValue}
        handleContentUpdate={handleContentUpdate}
        editingElement={editingElement}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        canEdit={canEdit}
      />

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
        projects={projects}
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
    </div>
  );
}
