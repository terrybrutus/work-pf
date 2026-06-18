import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit, Plus, GripVertical } from 'lucide-react';

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
