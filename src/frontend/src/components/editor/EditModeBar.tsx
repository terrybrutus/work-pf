import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, Undo, Redo, Clock } from 'lucide-react';

interface EditModeBarProps {
  hasUnsavedChanges: boolean;
  lastSaveTime: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isSaving: boolean;
  isUndoing: boolean;
  isRedoing: boolean;
}

export default function EditModeBar({
  hasUnsavedChanges,
  lastSaveTime,
  canUndo,
  canRedo,
  onSave,
  onUndo,
  onRedo,
  isSaving,
  isUndoing,
  isRedoing
}: EditModeBarProps) {
  return (
    <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Mode Active</span>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
          {lastSaveTime && !hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Saved {lastSaveTime.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={onUndo}
            disabled={isUndoing || !canUndo}
            className="h-6 px-2"
            title="Undo last change"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRedo}
            disabled={isRedoing || !canRedo}
            className="h-6 px-2"
            title="Redo last change"
          >
            <Redo className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="h-6 px-3 bg-green-600 hover:bg-green-700 text-white disabled:bg-green-600/50"
            title="Save all changes"
          >
            <Save className="w-3 h-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
