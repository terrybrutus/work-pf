import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { EditableText } from '../editor/EditableText';
import { EditableList } from '../editor/EditableList';
import AnimatedSection from '../common/AnimatedSection';

interface ContactSectionProps {
  getContentValue: (elementId: string, defaultValue?: string) => string;
  getListItems: (elementId: string, defaultItems?: string[]) => string[];
  handleContentUpdate: (elementId: string, value: string) => void;
  handleListUpdate: (elementId: string, items: string[]) => void;
  editingElement: string | null;
  onStartEdit: (elementId: string) => void;
  onCancelEdit: () => void;
  canEdit: boolean;
}

export default function ContactSection({
  getContentValue,
  getListItems,
  handleContentUpdate,
  handleListUpdate,
  editingElement,
  onStartEdit,
  onCancelEdit,
  canEdit
}: ContactSectionProps) {
  return (
    <section id="contact" className="py-20 relative z-10">
      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <EditableText
              value={getContentValue('contact-heading', 'Let\'s Connect')}
              onSave={(value) => handleContentUpdate('contact-heading', value)}
              isEditing={editingElement === 'contact-heading'}
              onStartEdit={() => onStartEdit('contact-heading')}
              onCancelEdit={onCancelEdit}
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              canEdit={canEdit}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {getContentValue('contact-heading', 'Let\'s Connect')}
              </h2>
            </EditableText>
            <EditableText
              value={getContentValue('contact-subtitle', 'Ready to create exceptional learning experiences together? I\'d love to hear about your goals')}
              onSave={(value) => handleContentUpdate('contact-subtitle', value)}
              multiline
              isEditing={editingElement === 'contact-subtitle'}
              onStartEdit={() => onStartEdit('contact-subtitle')}
              onCancelEdit={onCancelEdit}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              canEdit={canEdit}
            >
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {getContentValue('contact-subtitle', 'Ready to create exceptional learning experiences together? I\'d love to hear about your goals')}
              </p>
            </EditableText>
          </div>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <AnimatedSection delay={200}>
              <div className="space-y-8">
                <EditableText
                  value={getContentValue('contact-get-in-touch', 'Get In Touch')}
                  onSave={(value) => handleContentUpdate('contact-get-in-touch', value)}
                  isEditing={editingElement === 'contact-get-in-touch'}
                  onStartEdit={() => onStartEdit('contact-get-in-touch')}
                  onCancelEdit={onCancelEdit}
                  className="text-2xl font-semibold mb-6"
                  canEdit={canEdit}
                >
                  <h3 className="text-2xl font-semibold mb-6">
                    {getContentValue('contact-get-in-touch', 'Get In Touch')}
                  </h3>
                </EditableText>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <EditableText
                        value={getContentValue('contact-email', 'terrbrutus@gmail.com')}
                        onSave={(value) => handleContentUpdate('contact-email', value)}
                        isEditing={editingElement === 'contact-email'}
                        onStartEdit={() => onStartEdit('contact-email')}
                        onCancelEdit={onCancelEdit}
                        className="text-muted-foreground"
                        canEdit={canEdit}
                      >
                        <a 
                          href={`mailto:${getContentValue('contact-email', 'terrbrutus@gmail.com')}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {getContentValue('contact-email', 'terrbrutus@gmail.com')}
                        </a>
                      </EditableText>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <EditableText
                        value={getContentValue('contact-phone', '(212) 603-9163')}
                        onSave={(value) => handleContentUpdate('contact-phone', value)}
                        isEditing={editingElement === 'contact-phone'}
                        onStartEdit={() => onStartEdit('contact-phone')}
                        onCancelEdit={onCancelEdit}
                        className="text-muted-foreground"
                        canEdit={canEdit}
                      >
                        <a 
                          href={`tel:${getContentValue('contact-phone', '(212) 603-9163').replace(/[^\d]/g, '')}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {getContentValue('contact-phone', '(212) 603-9163')}
                        </a>
                      </EditableText>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <EditableText
                        value={getContentValue('contact-location', 'Arlington, VA')}
                        onSave={(value) => handleContentUpdate('contact-location', value)}
                        isEditing={editingElement === 'contact-location'}
                        onStartEdit={() => onStartEdit('contact-location')}
                        onCancelEdit={onCancelEdit}
                        className="text-muted-foreground"
                        canEdit={canEdit}
                      >
                        <p className="text-muted-foreground">
                          {getContentValue('contact-location', 'Arlington, VA')}
                        </p>
                      </EditableText>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <EditableText
                        value={getContentValue('contact-linkedin', 'https://www.linkedin.com/in/terrybrutus/')}
                        onSave={(value) => handleContentUpdate('contact-linkedin', value)}
                        isEditing={editingElement === 'contact-linkedin'}
                        onStartEdit={() => onStartEdit('contact-linkedin')}
                        onCancelEdit={onCancelEdit}
                        className="text-muted-foreground"
                        canEdit={canEdit}
                      >
                        <a 
                          href={getContentValue('contact-linkedin', 'https://www.linkedin.com/in/terrybrutus/')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          Connect on LinkedIn
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </EditableText>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="space-y-8">
                <EditableText
                  value={getContentValue('contact-help-heading', 'What I Can Help With')}
                  onSave={(value) => handleContentUpdate('contact-help-heading', value)}
                  isEditing={editingElement === 'contact-help-heading'}
                  onStartEdit={() => onStartEdit('contact-help-heading')}
                  onCancelEdit={onCancelEdit}
                  className="text-2xl font-semibold mb-6"
                  canEdit={canEdit}
                >
                  <h3 className="text-2xl font-semibold mb-6">
                    {getContentValue('contact-help-heading', 'What I Can Help With')}
                  </h3>
                </EditableText>
                
                <EditableList
                  items={getListItems('contact-help-list', [
                    'Learning experience design and strategy',
                    'Curriculum development and assessment',
                    'Educational technology implementation',
                    'Learning analytics and optimization',
                    'Team training and workshops'
                  ])}
                  onSave={(items) => handleListUpdate('contact-help-list', items)}
                  isEditing={editingElement === 'contact-help-list'}
                  onStartEdit={() => onStartEdit('contact-help-list')}
                  onCancelEdit={onCancelEdit}
                  canEdit={canEdit}
                  className="space-y-3"
                >
                  <div className="space-y-3">
                    {getListItems('contact-help-list', [
                      'Learning experience design and strategy',
                      'Curriculum development and assessment',
                      'Educational technology implementation',
                      'Learning analytics and optimization',
                      'Team training and workshops'
                    ]).map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </EditableList>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
