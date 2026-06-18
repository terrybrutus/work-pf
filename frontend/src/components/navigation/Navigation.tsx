import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, History } from 'lucide-react';
import { EditableButton } from '../editor/EditableButton';
import LoginButton from '../LoginButton';

interface NavigationProps {
  showAdminButtons: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWYSIWYGMode: boolean;
  onLogoInteraction: () => void;
  onToggleWYSIWYGMode: () => void;
  onShowRevisionHistory: () => void;
  onScrollToSection: (sectionId: string) => void;
  getContentValue: (elementId: string, defaultValue?: string) => string;
  handleContentUpdate: (elementId: string, value: string) => void;
  editingElement: string | null;
  onStartEdit: (elementId: string) => void;
  onCancelEdit: () => void;
  canEdit: boolean;
}

export default function Navigation({
  showAdminButtons,
  isAuthenticated,
  isAdmin,
  isWYSIWYGMode,
  onLogoInteraction,
  onToggleWYSIWYGMode,
  onShowRevisionHistory,
  onScrollToSection,
  getContentValue,
  handleContentUpdate,
  editingElement,
  onStartEdit,
  onCancelEdit,
  canEdit
}: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <img 
            src="https://i.imgur.com/DHmkhf9.gif" 
            alt="Terry Brutus Logo" 
            className="h-24 w-auto object-contain select-none cursor-default"
            onClick={onLogoInteraction}
            onTouchEnd={onLogoInteraction}
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          />
          <div className="flex items-center gap-4">
            <div className="hidden md:flex space-x-6">
              <EditableButton
                value={getContentValue('nav-about', 'About')}
                onSave={(value) => handleContentUpdate('nav-about', value)}
                isEditing={editingElement === 'nav-about'}
                onStartEdit={() => onStartEdit('nav-about')}
                onCancelEdit={onCancelEdit}
                onClick={() => !canEdit && onScrollToSection('about')}
                canEdit={canEdit}
                className="text-white/80 hover:text-white transition-colors"
              >
                <button
                  onClick={() => onScrollToSection('about')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {getContentValue('nav-about', 'About')}
                </button>
              </EditableButton>
              
              <EditableButton
                value={getContentValue('nav-projects', 'Projects')}
                onSave={(value) => handleContentUpdate('nav-projects', value)}
                isEditing={editingElement === 'nav-projects'}
                onStartEdit={() => onStartEdit('nav-projects')}
                onCancelEdit={onCancelEdit}
                onClick={() => !canEdit && onScrollToSection('projects')}
                canEdit={canEdit}
                className="text-white/80 hover:text-white transition-colors"
              >
                <button
                  onClick={() => onScrollToSection('projects')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {getContentValue('nav-projects', 'Projects')}
                </button>
              </EditableButton>
              
              <EditableButton
                value={getContentValue('nav-contact', 'Contact')}
                onSave={(value) => handleContentUpdate('nav-contact', value)}
                isEditing={editingElement === 'nav-contact'}
                onStartEdit={() => onStartEdit('nav-contact')}
                onCancelEdit={onCancelEdit}
                onClick={() => !canEdit && onScrollToSection('contact')}
                canEdit={canEdit}
                className="text-white/80 hover:text-white transition-colors"
              >
                <button
                  onClick={() => onScrollToSection('contact')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {getContentValue('nav-contact', 'Contact')}
                </button>
              </EditableButton>
            </div>
            <div className="flex items-center gap-2">
              {showAdminButtons && (
                <>
                  {isAuthenticated && isAdmin && (
                    <>
                      <Button
                        onClick={onToggleWYSIWYGMode}
                        variant={isWYSIWYGMode ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        {isWYSIWYGMode ? 'Exit Edit' : 'Edit Page'}
                      </Button>
                      <Button
                        onClick={onShowRevisionHistory}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        History
                      </Button>
                    </>
                  )}
                  <LoginButton />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
