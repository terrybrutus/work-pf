import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit } from 'lucide-react';

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
