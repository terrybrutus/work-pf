import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Save, X, Upload, Edit, Plus, Trash2, GripVertical } from 'lucide-react';
import { useFileUpload } from '../blob-storage/FileStorage';

interface EditableTextProps {
  children: React.ReactNode;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  canEdit?: boolean;
}

interface EditableImageProps {
  src?: string;
  alt: string;
  onSave: (newSrc: string) => void;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  canEdit?: boolean;
}

interface EditableButtonProps {
  children: React.ReactNode;
  value: string;
  onSave: (value: string) => void;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onClick?: () => void;
  canEdit?: boolean;
}

interface EditableListProps {
  children: React.ReactNode;
  items: string[];
  onSave: (items: string[]) => void;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  canEdit?: boolean;
  itemClassName?: string;
}

interface EditableTagGroupProps {
  children: React.ReactNode;
  tags: string[];
  onSave: (tags: string[]) => void;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  canEdit?: boolean;
}

export function EditableText({ 
  children, 
  value, 
  onSave, 
  multiline = false, 
  className = '', 
  placeholder = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  canEdit = true
}: EditableTextProps) {
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
      <div className="relative group">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${className} min-h-[100px]`}
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
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} relative group transition-all ${
        canEdit ? 'cursor-pointer hover:bg-accent/10 hover:outline hover:outline-2 hover:outline-accent/30 rounded p-1 -m-1' : ''
      }`}
      onClick={canEdit ? onStartEdit : undefined}
    >
      {children}
      {canEdit && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Edit className="w-2 h-2" />
            Edit
          </Badge>
        </div>
      )}
    </div>
  );
}

export function EditableImage({ 
  src, 
  alt, 
  onSave, 
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  canEdit = true
}: EditableImageProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setShowUploadDialog(true);
    }
  }, [isEditing]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = `portfolio/images/${Date.now()}-${file.name}`;
      const result = await uploadFile(path, file);
      onSave(result.url);
      setShowUploadDialog(false);
      onCancelEdit();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleClose = () => {
    setShowUploadDialog(false);
    onCancelEdit();
  };

  return (
    <>
      <div 
        className={`${className} relative group transition-all ${
          canEdit ? 'cursor-pointer' : ''
        }`}
        onClick={canEdit ? onStartEdit : undefined}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full bg-muted/20 flex items-center justify-center">
            <div className="text-muted-foreground/50 text-center">
              <div className="text-sm">No image</div>
            </div>
          </div>
        )}
        {canEdit && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Upload className="w-3 h-3" />
              {src ? 'Click to replace' : 'Click to add'}
            </Badge>
          </div>
        )}
      </div>

      <Dialog open={showUploadDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{src ? 'Replace Image' : 'Add Image'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditableButton({ 
  children, 
  value, 
  onSave, 
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  onClick,
  canEdit = true
}: EditableButtonProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancelEdit();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (onClick) {
      onClick();
    } else if (canEdit) {
      onStartEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="relative inline-block">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="min-w-[120px]"
        />
        <div className="absolute -top-8 right-0 flex gap-1 bg-background border rounded-md p-1 shadow-md z-50">
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group inline-block">
      <div 
        className={`${className} transition-all ${
          canEdit ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-accent/30 rounded' : ''
        }`}
        onClick={handleClick}
      >
        {children}
      </div>
      {canEdit && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Edit className="w-2 h-2" />
            Edit
          </Badge>
        </div>
      )}
    </div>
  );
}

export function EditableList({
  children,
  items,
  onSave,
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  canEdit = true,
  itemClassName = ''
}: EditableListProps) {
  const [editItems, setEditItems] = useState<string[]>(items);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setEditItems(items);
  }, [items]);

  const handleSave = () => {
    onSave(editItems);
    onCancelEdit();
  };

  const handleAddItem = () => {
    setEditItems([...editItems, 'New item']);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...editItems];
    updated[index] = value;
    setEditItems(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const updated = [...editItems];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);
    
    setEditItems(updated);
    setDraggedIndex(null);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <div className="space-y-2 p-4 border rounded-lg bg-background">
          {editItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded bg-muted/20"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              <Input
                value={item}
                onChange={(e) => handleUpdateItem(index, e.target.value)}
                className="flex-1"
                placeholder="List item"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveItem(index)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Item
          </Button>
        </div>
        <div className="absolute -top-8 right-0 flex gap-1 bg-background border rounded-md p-1 shadow-md z-50">
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} relative group transition-all ${
        canEdit ? 'cursor-pointer hover:bg-accent/10 hover:outline hover:outline-2 hover:outline-accent/30 rounded p-1 -m-1' : ''
      }`}
      onClick={canEdit ? onStartEdit : undefined}
    >
      {children}
      {canEdit && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Edit className="w-2 h-2" />
            Edit List
          </Badge>
        </div>
      )}
    </div>
  );
}

export function EditableTagGroup({
  children,
  tags,
  onSave,
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
  canEdit = true
}: EditableTagGroupProps) {
  const [editTags, setEditTags] = useState<string[]>(tags);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setEditTags(tags);
  }, [tags]);

  const handleSave = () => {
    onSave(editTags);
    onCancelEdit();
  };

  const handleAddTag = () => {
    setEditTags([...editTags, 'New Tag']);
  };

  const handleRemoveTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index));
  };

  const handleUpdateTag = (index: number, value: string) => {
    const updated = [...editTags];
    updated[index] = value;
    setEditTags(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const updated = [...editTags];
    const draggedTag = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedTag);
    
    setEditTags(updated);
    setDraggedIndex(null);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <div className="space-y-2 p-4 border rounded-lg bg-background">
          <div className="flex flex-wrap gap-2">
            {editTags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-1 p-1 border rounded bg-muted/20"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
                <Input
                  value={tag}
                  onChange={(e) => handleUpdateTag(index, e.target.value)}
                  className="min-w-[80px] h-6 text-xs"
                  placeholder="Tag"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveTag(index)}
                  className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                >
                  <X className="w-2 h-2" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTag}
            className="flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Tag
          </Button>
        </div>
        <div className="absolute -top-8 right-0 flex gap-1 bg-background border rounded-md p-1 shadow-md z-50">
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} relative group transition-all ${
        canEdit ? 'cursor-pointer hover:bg-accent/10 hover:outline hover:outline-2 hover:outline-accent/30 rounded p-1 -m-1' : ''
      }`}
      onClick={canEdit ? onStartEdit : undefined}
    >
      {children}
      {canEdit && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Edit className="w-2 h-2" />
            Edit Tags
          </Badge>
        </div>
      )}
    </div>
  );
}
