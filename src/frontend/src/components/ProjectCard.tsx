import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Save, X, Upload, Plus, Tag, ExternalLink, GripVertical, Settings } from 'lucide-react';
import { Project, useUpdateProject, useDeleteProject } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { toast } from 'sonner';

interface ProjectCardProps {
  project: Project;
  canEdit: boolean;
  hasGlobalUnsavedChanges?: boolean;
  onProjectClick?: (projectSlug: string) => void;
}

interface EditableProjectFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  canEdit: boolean;
}

function EditableProjectField({
  value,
  onSave,
  multiline = false,
  placeholder = '',
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  canEdit
}: EditableProjectFieldProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancelEdit();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${className} min-h-[80px] resize-none whitespace-pre-wrap break-words`}
            placeholder={placeholder}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={className}
            placeholder={placeholder}
          />
        )}
        <div className="absolute -top-8 right-0 flex gap-1 bg-background border rounded-md p-1 shadow-md z-50">
          <Button type="button" size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} ${canEdit ? 'cursor-pointer hover:bg-accent/10 hover:outline hover:outline-1 hover:outline-accent/30 rounded p-1 -m-1 transition-all' : ''} ${multiline ? 'whitespace-pre-wrap break-words' : ''}`}
      onClick={canEdit ? onStartEdit : undefined}
    >
      {value || placeholder}
      {canEdit && (
        <Edit className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

export default function ProjectCard({ project, canEdit, hasGlobalUnsavedChanges = false, onProjectClick }: ProjectCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectKey = `project-${project.id}`;

  const handleFieldUpdate = async (field: keyof Project, value: string | string[]) => {
    try {
      const updates: Partial<Project> = {};
      
      if (field === 'tags' && Array.isArray(value)) {
        updates.tags = value;
      } else if (typeof value === 'string') {
        (updates as any)[field] = value;
      }
      
      await updateProject.mutateAsync({ 
        projectId: project.id, 
        updates 
      });
      toast.success('Project updated');
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = `portfolio/projects/${project.id}/${Date.now()}-${file.name}`;
      const result = await uploadFile(path, file);
      
      await handleFieldUpdate('image', result.url);
      
      setShowImageUpload(false);
      toast.success('Project image updated');
    } catch (error) {
      console.error('Failed to upload project image:', error);
      toast.error('Failed to upload project image');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !project.tags.includes(newTag.trim())) {
      const updatedTags = [...project.tags, newTag.trim()];
      handleFieldUpdate('tags', updatedTags);
      setNewTag('');
      setShowTagDialog(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = project.tags.filter(tag => tag !== tagToRemove);
    handleFieldUpdate('tags', updatedTags);
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (canEdit) {
      return;
    }
    
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, input, textarea, a, [role="button"]');
    if (isInteractiveElement) return;
    
    const projectSlug = generateProjectSlug(project);
    if (onProjectClick) {
      onProjectClick(projectSlug);
    }
  };

  const generateProjectSlug = (project: Project): string => {
    if (project.title && project.title.trim()) {
      return project.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    return project.id;
  };

  const startEdit = (field: string) => {
    if (canEdit) {
      setEditingField(`${projectKey}-${field}`);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const isClickable = !canEdit && (project.title || project.hoverDescription || project.image);

  return (
    <>
      <Card 
        className={`group relative transition-all duration-300 hover:shadow-xl overflow-hidden h-full ${
          isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {canEdit && (
          <>
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="p-1 bg-background/80 rounded cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditPanel(true);
                }}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.title || 'this project'}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {hasGlobalUnsavedChanges && canEdit && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
              Unsaved
            </Badge>
          </div>
        )}

        {isClickable && !canEdit && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
              <ExternalLink className="w-3 h-3" />
              View
            </Badge>
          </div>
        )}

        {/* Project card with 4:3 aspect ratio - image fills entire card area with no padding */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted/10">
          {project.image ? (
            <img 
              src={project.image} 
              alt={project.title || 'Project image'}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}
          
          {/* Hover overlay with project summary - only hover description shown */}
          {isHovered && !canEdit && project.hoverDescription && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300 animate-in fade-in-0">
              <div className="text-center max-w-xs">
                <p className="text-gray-800 text-lg leading-relaxed font-medium">
                  {project.hoverDescription}
                </p>
              </div>
            </div>
          )}
          
          {canEdit && (
            <div 
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageUpload(true);
              }}
            >
              <Badge variant="secondary" className="flex items-center gap-1">
                <Upload className="w-3 h-3" />
                {project.image ? 'Change image' : 'Add image'}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Panel Dialog for Edit Mode */}
      <Dialog open={showEditPanel} onOpenChange={setShowEditPanel}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Project Title</label>
              <EditableProjectField
                value={project.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                placeholder="Project Title"
                className="text-lg font-semibold break-words w-full"
                isEditing={editingField === `${projectKey}-title`}
                onStartEdit={() => startEdit('title')}
                onCancelEdit={cancelEdit}
                canEdit={canEdit}
              />
            </div>

            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hover Description (Plain Text)
                <span className="text-xs text-muted-foreground/70 block mt-1">
                  This text appears when hovering over the project card
                </span>
              </label>
              <EditableProjectField
                value={project.hoverDescription}
                onSave={(value) => handleFieldUpdate('hoverDescription', value)}
                multiline
                placeholder="Brief description shown on hover (plain text only)"
                className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap w-full"
                isEditing={editingField === `${projectKey}-hoverDescription`}
                onStartEdit={() => startEdit('hoverDescription')}
                onCancelEdit={cancelEdit}
                canEdit={canEdit}
              />
            </div>

            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Detailed Description (Markdown)
                <span className="text-xs text-muted-foreground/70 block mt-1">
                  This content appears on the project page and supports markdown formatting
                </span>
              </label>
              <EditableProjectField
                value={project.detailedDescription}
                onSave={(value) => handleFieldUpdate('detailedDescription', value)}
                multiline
                placeholder="Detailed project description with **markdown** support for the project page"
                className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap w-full font-mono"
                isEditing={editingField === `${projectKey}-detailedDescription`}
                onStartEdit={() => startEdit('detailedDescription')}
                onCancelEdit={cancelEdit}
                canEdit={canEdit}
              />
            </div>

            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Project URL (optional)</label>
              <EditableProjectField
                value={project.url || ''}
                onSave={(value) => handleFieldUpdate('url', value)}
                placeholder="https://example.com or example.com"
                className="text-sm text-muted-foreground break-all w-full"
                isEditing={editingField === `${projectKey}-url`}
                onStartEdit={() => startEdit('url')}
                onCancelEdit={cancelEdit}
                canEdit={canEdit}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 items-center">
                {project.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs break-words group cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <span className="break-words">{tag}</span>
                    <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTagDialog(true)}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Tag
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Project Image</label>
              <div className="space-y-2">
                {project.image && (
                  <div className="aspect-[4/3] w-full max-w-md rounded-lg overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title || 'Project image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageUpload(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {project.image ? 'Change Image' : 'Add Image'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEditPanel(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{project.image ? 'Change Project Image' : 'Add Project Image'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Choose Image'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Supported formats: JPG, PNG, GIF
              </p>
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Uploading image...</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowImageUpload(false)} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowTagDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                <Tag className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
