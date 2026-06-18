import React from 'react';
import { Button } from '@/components/ui/button';
import { EditableText } from '../editor/EditableText';
import { EditableButton } from '../editor/EditableButton';
import ProfileImage from '../ProfileImage';
import AnimatedSection from '../common/AnimatedSection';
import NameEntranceAnimation from '../NameEntranceAnimation';

interface HeroSectionProps {
  getContentValue: (elementId: string, defaultValue?: string) => string;
  handleContentUpdate: (elementId: string, value: string) => void;
  editingElement: string | null;
  onStartEdit: (elementId: string) => void;
  onCancelEdit: () => void;
  onScrollToSection: (sectionId: string) => void;
  canEdit: boolean;
}

export default function HeroSection({
  getContentValue,
  handleContentUpdate,
  editingElement,
  onStartEdit,
  onCancelEdit,
  onScrollToSection,
  canEdit
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[86vh] flex items-center justify-center overflow-hidden pt-32 z-10">
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <div className="mb-8">
            <ProfileImage canEdit={canEdit} />
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={200}>
          <NameEntranceAnimation>
            <EditableText
              value={getContentValue('hero-name', 'Terry Brutus')}
              onSave={(value) => handleContentUpdate('hero-name', value)}
              isEditing={editingElement === 'hero-name'}
              onStartEdit={() => onStartEdit('hero-name')}
              onCancelEdit={onCancelEdit}
              className="text-6xl md:text-8xl font-bold mb-6 text-hero-name animate-hero-name-glow"
              canEdit={canEdit}
            >
              <h1 className="text-6xl md:text-8xl font-bold mb-6 text-hero-name animate-hero-name-glow">
                {getContentValue('hero-name', 'Terry Brutus')}
              </h1>
            </EditableText>
          </NameEntranceAnimation>
        </AnimatedSection>
        
        <AnimatedSection delay={400}>
          <EditableText
            value={getContentValue('hero-tagline', 'Learning Experience Designer crafting engaging educational journeys that inspire and transform')}
            onSave={(value) => handleContentUpdate('hero-tagline', value)}
            multiline
            isEditing={editingElement === 'hero-tagline'}
            onStartEdit={() => onStartEdit('hero-tagline')}
            onCancelEdit={onCancelEdit}
            className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
            canEdit={canEdit}
          >
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {getContentValue('hero-tagline', 'Learning Experience Designer crafting engaging educational journeys that inspire and transform')}
            </p>
          </EditableText>
        </AnimatedSection>
        
        <AnimatedSection delay={600}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <EditableButton
              value={getContentValue('hero-primary-button', 'View My Work')}
              onSave={(value) => handleContentUpdate('hero-primary-button', value)}
              isEditing={editingElement === 'hero-primary-button'}
              onStartEdit={() => onStartEdit('hero-primary-button')}
              onCancelEdit={onCancelEdit}
              onClick={() => !canEdit && onScrollToSection('projects')}
              canEdit={canEdit}
            >
              <Button
                type="button"
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {getContentValue('hero-primary-button', 'View My Work')}
              </Button>
            </EditableButton>
            <EditableButton
              value={getContentValue('hero-secondary-button', 'Get In Touch')}
              onSave={(value) => handleContentUpdate('hero-secondary-button', value)}
              isEditing={editingElement === 'hero-secondary-button'}
              onStartEdit={() => onStartEdit('hero-secondary-button')}
              onCancelEdit={onCancelEdit}
              onClick={() => !canEdit && onScrollToSection('contact')}
              canEdit={canEdit}
            >
              <Button
                type="button"
                size="lg"
                variant="outline"
              >
                {getContentValue('hero-secondary-button', 'Get In Touch')}
              </Button>
            </EditableButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
