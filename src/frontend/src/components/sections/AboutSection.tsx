import React from 'react';
import { EditableText } from '../editor/EditableText';
import { EditableList } from '../editor/EditableList';
import AnimatedSection from '../common/AnimatedSection';
import { useStats, useUpdateStat } from '../../hooks/useQueries';

interface AboutSectionProps {
  getContentValue: (elementId: string, defaultValue?: string) => string;
  getListItems: (elementId: string, defaultItems?: string[]) => string[];
  handleContentUpdate: (elementId: string, value: string) => void;
  handleListUpdate: (elementId: string, items: string[]) => void;
  editingElement: string | null;
  onStartEdit: (elementId: string) => void;
  onCancelEdit: () => void;
  canEdit: boolean;
}

export default function AboutSection({
  getContentValue,
  getListItems,
  handleContentUpdate,
  handleListUpdate,
  editingElement,
  onStartEdit,
  onCancelEdit,
  canEdit
}: AboutSectionProps) {
  const { data: stats = {} } = useStats();
  const updateStat = useUpdateStat();

  const handleStatUpdate = async (key: string, value: string) => {
    try {
      await updateStat.mutateAsync({ key, value });
    } catch (error) {
      console.error('Failed to update stat:', error);
    }
  };

  const projectsCompleted = stats.projects_completed || '75+ Projects Completed';
  const learnersImpacted = stats.learners_impacted || '100K+ Learners Impacted';

  return (
    <section id="about" className="py-20 bg-card/30 relative z-10">
      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <EditableText
              value={getContentValue('about-heading', 'About Me')}
              onSave={(value) => handleContentUpdate('about-heading', value)}
              isEditing={editingElement === 'about-heading'}
              onStartEdit={() => onStartEdit('about-heading')}
              onCancelEdit={onCancelEdit}
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
              canEdit={canEdit}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                {getContentValue('about-heading', 'About Me')}
              </h2>
            </EditableText>
            <EditableText
              value={getContentValue('about-subtitle', 'Passionate about creating meaningful learning experiences that bridge the gap between knowledge and application')}
              onSave={(value) => handleContentUpdate('about-subtitle', value)}
              multiline
              isEditing={editingElement === 'about-subtitle'}
              onStartEdit={() => onStartEdit('about-subtitle')}
              onCancelEdit={onCancelEdit}
              className="text-xl text-white/90 max-w-2xl mx-auto"
              canEdit={canEdit}
            >
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {getContentValue('about-subtitle', 'Passionate about creating meaningful learning experiences that bridge the gap between knowledge and application')}
              </p>
            </EditableText>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <AnimatedSection delay={200}>
            <div className="space-y-6">
              <EditableText
                value={getContentValue('about-paragraph1', 'With over 8 years of experience in learning experience design, I specialize in creating innovative educational solutions that engage learners and drive measurable outcomes. My approach combines pedagogical expertise with cutting-edge technology to deliver transformative learning experiences.')}
                onSave={(value) => handleContentUpdate('about-paragraph1', value)}
                multiline
                isEditing={editingElement === 'about-paragraph1'}
                onStartEdit={() => onStartEdit('about-paragraph1')}
                onCancelEdit={onCancelEdit}
                className="text-lg text-white/85 leading-relaxed"
                canEdit={canEdit}
              >
                <p className="text-lg text-white/85 leading-relaxed">
                  {getContentValue('about-paragraph1', 'With over 8 years of experience in learning experience design, I specialize in creating innovative educational solutions that engage learners and drive measurable outcomes. My approach combines pedagogical expertise with cutting-edge technology to deliver transformative learning experiences.')}
                </p>
              </EditableText>
              <EditableText
                value={getContentValue('about-paragraph2', 'I believe that great learning design starts with understanding the learner\'s journey, identifying pain points, and crafting solutions that are both effective and enjoyable. My work spans across corporate training, higher education, and digital learning platforms.')}
                onSave={(value) => handleContentUpdate('about-paragraph2', value)}
                multiline
                isEditing={editingElement === 'about-paragraph2'}
                onStartEdit={() => onStartEdit('about-paragraph2')}
                onCancelEdit={onCancelEdit}
                className="text-lg text-white/85 leading-relaxed"
                canEdit={canEdit}
              >
                <p className="text-lg text-white/85 leading-relaxed">
                  {getContentValue('about-paragraph2', 'I believe that great learning design starts with understanding the learner\'s journey, identifying pain points, and crafting solutions that are both effective and enjoyable. My work spans across corporate training, higher education, and digital learning platforms.')}
                </p>
              </EditableText>
              
              <div className="grid grid-cols-2 gap-4 pt-6">
                <EditableText
                  value={projectsCompleted}
                  onSave={(value) => handleStatUpdate('projects_completed', value)}
                  isEditing={editingElement === 'stat-projects'}
                  onStartEdit={() => onStartEdit('stat-projects')}
                  onCancelEdit={onCancelEdit}
                  className="text-center p-4 bg-background rounded-lg border"
                  canEdit={canEdit}
                >
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{projectsCompleted.split(' ')[0]}</div>
                    <div className="text-sm text-white/80">{projectsCompleted.split(' ').slice(1).join(' ')}</div>
                  </div>
                </EditableText>
                <EditableText
                  value={learnersImpacted}
                  onSave={(value) => handleStatUpdate('learners_impacted', value)}
                  isEditing={editingElement === 'stat-learners'}
                  onStartEdit={() => onStartEdit('stat-learners')}
                  onCancelEdit={onCancelEdit}
                  className="text-center p-4 bg-background rounded-lg border"
                  canEdit={canEdit}
                >
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{learnersImpacted.split(' ')[0]}</div>
                    <div className="text-sm text-white/80">{learnersImpacted.split(' ').slice(1).join(' ')}</div>
                  </div>
                </EditableText>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <div className="space-y-6">
              <EditableText
                value={getContentValue('about-mission-heading', 'My Mission')}
                onSave={(value) => handleContentUpdate('about-mission-heading', value)}
                isEditing={editingElement === 'about-mission-heading'}
                onStartEdit={() => onStartEdit('about-mission-heading')}
                onCancelEdit={onCancelEdit}
                className="text-2xl font-semibold mb-4 text-white"
                canEdit={canEdit}
              >
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  {getContentValue('about-mission-heading', 'My Mission')}
                </h3>
              </EditableText>
              
              <EditableText
                value={getContentValue('about-mission-text', 'To transform how people learn by designing experiences that are not just educational, but truly engaging and memorable. I strive to make learning accessible, enjoyable, and impactful for every learner.')}
                onSave={(value) => handleContentUpdate('about-mission-text', value)}
                multiline
                isEditing={editingElement === 'about-mission-text'}
                onStartEdit={() => onStartEdit('about-mission-text')}
                onCancelEdit={onCancelEdit}
                className="text-lg text-white/85 leading-relaxed"
                canEdit={canEdit}
              >
                <p className="text-lg text-white/85 leading-relaxed">
                  {getContentValue('about-mission-text', 'To transform how people learn by designing experiences that are not just educational, but truly engaging and memorable. I strive to make learning accessible, enjoyable, and impactful for every learner.')}
                </p>
              </EditableText>
              
              <EditableList
                items={getListItems('about-values-list', [
                  'Learner-centered design approach',
                  'Evidence-based instructional strategies',
                  'Continuous improvement mindset',
                  'Collaborative problem-solving'
                ])}
                onSave={(items) => handleListUpdate('about-values-list', items)}
                isEditing={editingElement === 'about-values-list'}
                onStartEdit={() => onStartEdit('about-values-list')}
                onCancelEdit={onCancelEdit}
                canEdit={canEdit}
                className="grid gap-4"
              >
                <div className="grid gap-4">
                  {getListItems('about-values-list', [
                    'Learner-centered design approach',
                    'Evidence-based instructional strategies',
                    'Continuous improvement mindset',
                    'Collaborative problem-solving'
                  ]).map((value, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </EditableList>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
