import React, { useState } from 'react';
import { EditableText } from '../editor/EditableText';
import ProjectCard from '../ProjectCard';
import AddProjectCard from '../AddProjectCard';
import AnimatedSection from '../common/AnimatedSection';
import { Project } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface ProjectsSectionProps {
  projects: Project[];
  canEdit: boolean;
  hasGlobalUnsavedChanges: boolean;
  getContentValue: (elementId: string, defaultValue?: string) => string;
  handleContentUpdate: (elementId: string, value: string) => void;
  editingElement: string | null;
  onStartEdit: (elementId: string) => void;
  onCancelEdit: () => void;
  onReorderProjects: any;
  onProjectClick?: (projectSlug: string) => void;
}

export default function ProjectsSection({
  projects,
  canEdit,
  hasGlobalUnsavedChanges,
  getContentValue,
  handleContentUpdate,
  editingElement,
  onStartEdit,
  onCancelEdit,
  onReorderProjects,
  onProjectClick
}: ProjectsSectionProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);

  const handleProjectDragStart = (e: React.DragEvent, project: Project) => {
    if (!canEdit) return;
    
    const startIndex = projects.findIndex(p => p.id === project.id);
    setDraggedProject(project);
    setDragStartIndex(startIndex);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleProjectDragEnd = (e: React.DragEvent) => {
    setDraggedProject(null);
    setDragOverIndex(null);
    setDragStartIndex(null);
    setIsDragging(false);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleProjectDragOver = (e: React.DragEvent, index: number) => {
    if (!canEdit || !draggedProject) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleProjectDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleProjectDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!canEdit || !draggedProject || dragStartIndex === null) return;

    if (dragStartIndex === dropIndex) {
      setDraggedProject(null);
      setDragOverIndex(null);
      setDragStartIndex(null);
      setIsDragging(false);
      return;
    }

    try {
      const projectsCopy = projects.map(p => ({ ...p }));
      const [movedProject] = projectsCopy.splice(dragStartIndex, 1);
      projectsCopy.splice(dropIndex, 0, movedProject);

      const reorderedProjects = projectsCopy.map((project, index) => ({
        ...project,
        order: index
      }));

      await onReorderProjects.mutateAsync(reorderedProjects);
      toast.success('Projects reordered successfully');
    } catch (error) {
      console.error('Failed to reorder projects:', error);
      toast.error('Failed to reorder projects');
    } finally {
      setDraggedProject(null);
      setDragOverIndex(null);
      setDragStartIndex(null);
      setIsDragging(false);
    }
  };

  // Calculate the number of items including the add card if in edit mode
  const totalItems = canEdit ? projects.length + 1 : projects.length;
  
  // Determine the appropriate grid classes based on the number of items
  const getGridClasses = () => {
    if (totalItems === 0) return 'grid grid-cols-1';
    if (totalItems === 1) return 'grid grid-cols-1 justify-items-center';
    if (totalItems === 2) return 'grid grid-cols-1 md:grid-cols-2 justify-items-center max-w-2xl mx-auto';
    if (totalItems === 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center max-w-4xl mx-auto';
    if (totalItems === 4) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-items-center max-w-5xl mx-auto';
    // For 5+ items, use responsive grid that centers incomplete rows
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center';
  };

  return (
    <section id="projects" className="py-20 bg-card/30 relative z-10">
      <div className="w-full px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <EditableText
              value={getContentValue('projects-heading', 'Featured Projects')}
              onSave={(value) => handleContentUpdate('projects-heading', value)}
              isEditing={editingElement === 'projects-heading'}
              onStartEdit={() => onStartEdit('projects-heading')}
              onCancelEdit={onCancelEdit}
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              canEdit={canEdit}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {getContentValue('projects-heading', 'Featured Projects')}
              </h2>
            </EditableText>
            <EditableText
              value={getContentValue('projects-subtitle', 'A showcase of learning experiences designed to engage, educate, and inspire')}
              onSave={(value) => handleContentUpdate('projects-subtitle', value)}
              multiline
              isEditing={editingElement === 'projects-subtitle'}
              onStartEdit={() => onStartEdit('projects-subtitle')}
              onCancelEdit={onCancelEdit}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              canEdit={canEdit}
            >
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {getContentValue('projects-subtitle', 'A showcase of learning experiences designed to engage, educate, and inspire')}
              </p>
            </EditableText>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className={`${getGridClasses()} gap-6 w-full`}>
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                style={{ animationDelay: `${index * 100}ms` }}
                draggable={canEdit}
                onDragStart={(e) => handleProjectDragStart(e, project)}
                onDragEnd={handleProjectDragEnd}
                onDragOver={(e) => handleProjectDragOver(e, index)}
                onDragLeave={handleProjectDragLeave}
                onDrop={(e) => handleProjectDrop(e, index)}
                className={`transition-all duration-200 w-full max-w-sm ${
                  canEdit ? 'cursor-move' : ''
                } ${
                  dragOverIndex === index && draggedProject?.id !== project.id
                    ? 'transform scale-105 ring-2 ring-primary/50 bg-primary/5'
                    : ''
                } ${
                  draggedProject?.id === project.id
                    ? 'opacity-50 transform rotate-2'
                    : ''
                } ${
                  isDragging && draggedProject?.id !== project.id
                    ? 'transition-transform duration-300'
                    : ''
                }`}
              >
                <ProjectCard
                  project={project}
                  canEdit={canEdit}
                  hasGlobalUnsavedChanges={hasGlobalUnsavedChanges}
                  onProjectClick={onProjectClick}
                />
              </div>
            ))}
            
            {canEdit && (
              <div 
                style={{ animationDelay: `${projects.length * 100}ms` }}
                className="w-full max-w-sm"
              >
                <AddProjectCard />
              </div>
            )}
          </div>
        </AnimatedSection>

        {!canEdit && projects.length === 0 && (
          <AnimatedSection delay={200}>
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-semibold mb-2">Projects Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Exciting learning experience projects are being prepared. Check back soon to see the latest work!
              </p>
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}
