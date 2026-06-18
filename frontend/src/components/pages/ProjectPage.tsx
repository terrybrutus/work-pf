import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Save, X, Plus, Image, Type, Video, Upload, Trash2 } from 'lucide-react';
import { EditableText } from '../editor/EditableText';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { useProjects, useUpdateProject } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { useScrollToSection } from '../../hooks/useScrollToSection';
import { useFileUpload, useFileUrl } from '../../blob-storage/FileStorage';
import ConstellationBackground from '../ConstellationBackground';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  type: 'text' | 'markdown' | 'image' | 'carousel' | 'video';
  content: string;
  order: number;
}

interface ProjectPageData {
  blocks: ContentBlock[];
  lastModified: number;
}

interface ProjectPageProps {
  projectSlug: string;
  onNavigateBack: () => void;
}

export default function ProjectPage({ projectSlug, onNavigateBack }: ProjectPageProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: projects = [] } = useProjects();
  const updateProject = useUpdateProject();
  const scrollToSection = useScrollToSection();
  const { uploadFile, isUploading } = useFileUpload();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [projectPageData, setProjectPageData] = useState<ProjectPageData>({
    blocks: [],
    lastModified: Date.now()
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageUploadDialog, setImageUploadDialog] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const canEdit = isAuthenticated && isAdmin;

  // Improved project finding with better slug matching
  const project = projects.find(p => {
    if (!p.title || !p.title.trim()) {
      return p.id === projectSlug;
    }
    
    const generatedSlug = p.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    return generatedSlug === projectSlug || p.id === projectSlug;
  });

  useEffect(() => {
    if (project && project.url) {
      try {
        // Try to parse project page data from URL field (temporary storage)
        const pageData = JSON.parse(project.url);
        if (pageData.blocks) {
          setProjectPageData(pageData);
        }
      } catch {
        // If URL is not JSON, initialize with default blocks using detailed description
        setProjectPageData({
          blocks: [
            {
              id: 'intro-text',
              type: 'markdown',
              content: project.detailedDescription || '# Project Overview\n\nProject description goes here...\n\n## Features\n\n* Feature 1\n* Feature 2\n* Feature 3\n\n## Technologies Used\n\n**Frontend:** React, TypeScript\n**Backend:** Node.js\n**Database:** PostgreSQL',
              order: 0
            }
          ],
          lastModified: Date.now()
        });
      }
    } else if (project) {
      // Initialize with default markdown content using detailed description
      setProjectPageData({
        blocks: [
          {
            id: 'intro-text',
            type: 'markdown',
            content: project.detailedDescription || '# Project Overview\n\nProject description goes here...\n\n## Features\n\n* Feature 1\n* Feature 2\n* Feature 3\n\n## Technologies Used\n\n**Frontend:** React, TypeScript\n**Backend:** Node.js\n**Database:** PostgreSQL',
            order: 0
          }
        ],
        lastModified: Date.now()
      });
    }
  }, [project]);

  const handleBlockUpdate = async (blockId: string, content: string) => {
    const updatedBlocks = projectPageData.blocks.map(block =>
      block.id === blockId ? { ...block, content } : block
    );

    const updatedPageData = {
      ...projectPageData,
      blocks: updatedBlocks,
      lastModified: Date.now()
    };

    setProjectPageData(updatedPageData);
    setHasUnsavedChanges(true);

    if (project) {
      try {
        await updateProject.mutateAsync({
          projectId: project.id,
          updates: { url: JSON.stringify(updatedPageData) }
        });
        setHasUnsavedChanges(false);
        toast.success('Content updated');
      } catch (error) {
        console.error('Failed to update project page:', error);
        toast.error('Failed to update content');
      }
    }
  };

  const addContentBlock = async (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'text' ? 'New content block...' : 
               type === 'markdown' ? '## New Section\n\nAdd your **markdown** content here...' : 
               type === 'image' ? '' : '',
      order: projectPageData.blocks.length
    };

    const updatedPageData = {
      ...projectPageData,
      blocks: [...projectPageData.blocks, newBlock],
      lastModified: Date.now()
    };

    setProjectPageData(updatedPageData);
    setHasUnsavedChanges(true);

    // If it's an image block, immediately open the upload dialog
    if (type === 'image') {
      setImageUploadDialog(newBlock.id);
    }

    if (project) {
      try {
        await updateProject.mutateAsync({
          projectId: project.id,
          updates: { url: JSON.stringify(updatedPageData) }
        });
        setHasUnsavedChanges(false);
        toast.success('Content block added');
      } catch (error) {
        console.error('Failed to add content block:', error);
        toast.error('Failed to add content block');
      }
    }
  };

  const removeContentBlock = async (blockId: string) => {
    const updatedBlocks = projectPageData.blocks.filter(block => block.id !== blockId);
    const updatedPageData = {
      ...projectPageData,
      blocks: updatedBlocks,
      lastModified: Date.now()
    };

    setProjectPageData(updatedPageData);
    setHasUnsavedChanges(true);

    if (project) {
      try {
        await updateProject.mutateAsync({
          projectId: project.id,
          updates: { url: JSON.stringify(updatedPageData) }
        });
        setHasUnsavedChanges(false);
        toast.success('Content block removed');
      } catch (error) {
        console.error('Failed to remove content block:', error);
        toast.error('Failed to remove content block');
      }
    }
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    try {
      const path = `projects/${project?.id || 'unknown'}/${Date.now()}-${file.name}`;
      const result = await uploadFile(path, file);
      
      // Update the block content with the uploaded image URL
      await handleBlockUpdate(blockId, result.url);
      setImageUploadDialog(null);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSaveAll = async () => {
    if (project && hasUnsavedChanges) {
      try {
        await updateProject.mutateAsync({
          projectId: project.id,
          updates: { url: JSON.stringify(projectPageData) }
        });
        setHasUnsavedChanges(false);
        toast.success('All changes saved');
      } catch (error) {
        console.error('Failed to save changes:', error);
        toast.error('Failed to save changes');
      }
    }
  };

  const handleBackToPortfolio = () => {
    onNavigateBack();
    // Use setTimeout to ensure the navigation happens first, then scroll
    setTimeout(() => {
      scrollToSection('projects');
    }, 100);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <ConstellationBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">Project Not Found</h1>
          <p className="text-white/90 mb-8">The project you're looking for doesn't exist or the link may be incorrect.</p>
          <Button type="button" onClick={handleBackToPortfolio}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ConstellationBackground />
      
      {/* Edit Mode Active Bar */}
      {isEditMode && canEdit && (
        <div className="fixed top-20 left-0 right-0 z-40 bg-blue-600 text-white px-6 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">Edit Mode Active</span>
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-100 border-yellow-500/30">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges}
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`relative z-10 ${isEditMode ? 'pt-44' : 'pt-32'} pb-20`}>
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleBackToPortfolio}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
              </Button>
              
              {canEdit && (
                <Button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  variant={isEditMode ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isEditMode ? 'Exit Edit' : 'Edit Page'}
                </Button>
              )}
            </div>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                {project.title || 'Untitled Project'}
              </h1>
              
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {project.image && (
                <div className="aspect-video max-w-2xl mx-auto mb-8 rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Blocks */}
          <div className="space-y-8">
            {projectPageData.blocks
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <Card key={block.id} className="relative group bg-card/80 backdrop-blur-sm border-gray-700">
                  {isEditMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeContentBlock(block.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    {block.type === 'text' && (
                      <EditableText
                        value={block.content}
                        onSave={(value) => handleBlockUpdate(block.id, value)}
                        multiline
                        isEditing={editingBlock === block.id}
                        onStartEdit={() => setEditingBlock(block.id)}
                        onCancelEdit={() => setEditingBlock(null)}
                        className="prose prose-lg max-w-none text-white"
                        canEdit={isEditMode}
                      >
                        <div className="prose prose-lg max-w-none text-white">
                          {block.content.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </div>
                      </EditableText>
                    )}

                    {block.type === 'markdown' && (
                      <>
                        {isEditMode && editingBlock === block.id ? (
                          <div className="relative">
                            <Textarea
                              value={block.content}
                              onChange={(e) => {
                                const updatedBlocks = projectPageData.blocks.map(b =>
                                  b.id === block.id ? { ...b, content: e.target.value } : b
                                );
                                setProjectPageData({
                                  ...projectPageData,
                                  blocks: updatedBlocks
                                });
                                setHasUnsavedChanges(true);
                              }}
                              className="min-h-[300px] font-mono text-sm bg-gray-900/80 text-gray-100 border-gray-700"
                              placeholder="Enter markdown content..."
                            />
                            <div className="absolute -top-8 right-0 flex gap-1 bg-background border rounded-md p-1 shadow-md z-50">
                              <Button 
                                type="button"
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  handleBlockUpdate(block.id, block.content);
                                  setEditingBlock(null);
                                }} 
                                className="h-6 w-6 p-0"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setEditingBlock(null)} 
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={`${isEditMode ? 'cursor-pointer hover:bg-accent/10 hover:outline hover:outline-2 hover:outline-accent/30 rounded p-2 -m-2' : ''}`}
                            onClick={isEditMode ? () => setEditingBlock(block.id) : undefined}
                          >
                            <MarkdownRenderer content={block.content} />
                            {isEditMode && (
                              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <Edit className="w-2 h-2" />
                                  Edit Markdown
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    
                    {block.type === 'image' && (
                      <ImageBlock
                        block={block}
                        isEditMode={isEditMode}
                        onUpload={(file) => handleImageUpload(block.id, file)}
                        onEdit={() => setImageUploadDialog(block.id)}
                        isUploading={isUploading}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}

            {/* Add Content Block Buttons */}
            {isEditMode && (
              <Card className="border-dashed border-2 bg-card/60 backdrop-blur-sm border-gray-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-white/90 mb-4">Add new content block</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addContentBlock('markdown')}
                        className="flex items-center gap-2"
                      >
                        <Type className="w-4 h-4" />
                        Markdown Block
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addContentBlock('text')}
                        className="flex items-center gap-2"
                      >
                        <Type className="w-4 h-4" />
                        Text Block
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addContentBlock('image')}
                        className="flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Image Block
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        isOpen={!!imageUploadDialog}
        onClose={() => setImageUploadDialog(null)}
        onUpload={(file) => {
          if (imageUploadDialog) {
            handleImageUpload(imageUploadDialog, file);
          }
        }}
        isUploading={isUploading}
      />
    </div>
  );
}

// Image Block Component
interface ImageBlockProps {
  block: ContentBlock;
  isEditMode: boolean;
  onUpload: (file: File) => void;
  onEdit: () => void;
  isUploading: boolean;
}

function ImageBlock({ block, isEditMode, onUpload, onEdit, isUploading }: ImageBlockProps) {
  const { data: imageUrl } = useFileUrl(block.content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const displayUrl = imageUrl || block.content;

  return (
    <div className="text-center">
      {displayUrl ? (
        <div className="relative group">
          <img 
            src={displayUrl} 
            alt="Project content"
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
          />
          {isEditMode && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onEdit}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Replace Image'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center min-h-[200px]">
          {isEditMode ? (
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <p className="text-sm text-white/90 mt-2">
                Click to upload an image for this block
              </p>
            </div>
          ) : (
            <div className="text-white/90 text-center">
              <Image className="w-12 h-12 mx-auto mb-2" />
              <p>No image uploaded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Image Upload Dialog Component
interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

function ImageUploadDialog({ isOpen, onClose, onUpload, isUploading }: ImageUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </Button>
            <p className="text-sm text-white/90 mt-2">
              Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
