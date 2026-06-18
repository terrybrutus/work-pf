import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit, Plus, Trash2, GripVertical } from 'lucide-react';

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
