import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Archive, Copy, Eye, Link2, Plus, RotateCcw, Save, TimerOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAudienceViews,
  useSaveAudienceViews,
} from '../hooks/useQueries';
import type { AudienceView, Project } from '../hooks/useQueries';

interface AudienceViewManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

const DEFAULT_PROJECT_IDS = [
  'career-city',
  'ai-talent-pipeline',
  'work-portfolio-studio',
];

export default function AudienceViewManager({
  isOpen,
  onClose,
  projects,
}: AudienceViewManagerProps) {
  const { data: savedAudienceViews = [] } = useAudienceViews();
  const saveAudienceViews = useSaveAudienceViews();
  const [audienceViews, setAudienceViews] = useState<AudienceView[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    setAudienceViews(savedAudienceViews);
    setSelectedId((currentSelectedId) =>
      currentSelectedId || savedAudienceViews[0]?.id || '',
    );
  }, [savedAudienceViews]);

  const selectedAudience = useMemo(
    () => audienceViews.find((audience) => audience.id === selectedId) ?? null,
    [audienceViews, selectedId],
  );

  const updateSelectedAudience = (updates: Partial<AudienceView>) => {
    if (!selectedAudience) {
      return;
    }

    setAudienceViews((currentViews) =>
      currentViews.map((audience) =>
        audience.id === selectedAudience.id
          ? {
              ...audience,
              ...updates,
              updatedAt: Date.now(),
            }
          : audience,
      ),
    );
  };

  const updateContentOverride = (elementId: string, value: string) => {
    if (!selectedAudience) {
      return;
    }

    updateSelectedAudience({
      contentOverrides: {
        ...selectedAudience.contentOverrides,
        [elementId]: value,
      },
    });
  };

  const createAudienceView = () => {
    const now = Date.now();
    const slug = createOpaqueSlug();
    const newAudience: AudienceView = {
      id: `audience-${slug}`,
      slug,
      label: 'New tailored view',
      companyName: '',
      roleTitle: '',
      status: 'active',
      expiresAt: '',
      jobDescription: '',
      toneNotes: '',
      jargonNotes: '',
      theme: {
        primary: '#42d3a5',
        accent: '#d8b25c',
        background: '#111827',
      },
      projectIds: projects
        .filter((project) => DEFAULT_PROJECT_IDS.includes(project.id))
        .map((project) => project.id),
      contentOverrides: {
        'hero-tagline':
          'AI-enabled learning systems and workflow tools tailored to your team.',
        'projects-subtitle':
          'Selected proof points mapped to this role and the problems your team is hiring around.',
        'contact-subtitle':
          'If this view matches the work ahead, I would be glad to compare notes.',
      },
      createdAt: now,
      updatedAt: now,
    };

    setAudienceViews((currentViews) => [newAudience, ...currentViews]);
    setSelectedId(newAudience.id);
  };

  const saveChanges = async () => {
    try {
      await saveAudienceViews.mutateAsync(audienceViews);
      toast.success('Audience views saved');
    } catch {
      toast.error('Could not save audience views');
    }
  };

  const copyAudienceLink = async (audience: AudienceView) => {
    const url = `${window.location.origin}/v/${audience.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Tailored link copied');
    } catch {
      toast.error(url);
    }
  };

  const toggleProject = (projectId: string) => {
    if (!selectedAudience) {
      return;
    }

    const hasProject = selectedAudience.projectIds.includes(projectId);
    updateSelectedAudience({
      projectIds: hasProject
        ? selectedAudience.projectIds.filter((id) => id !== projectId)
        : [...selectedAudience.projectIds, projectId],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Link2 className="h-5 w-5" />
            Tailored Portfolio Views
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <Button
              type="button"
              onClick={createAudienceView}
              className="w-full justify-start gap-2"
            >
              <Plus className="h-4 w-4" />
              New View
            </Button>

            <div className="space-y-2">
              {audienceViews.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Create a private view for each company, role, or job
                  description.
                </p>
              )}

              {audienceViews.map((audience) => (
                <button
                  key={audience.id}
                  type="button"
                  onClick={() => setSelectedId(audience.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    audience.id === selectedId
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/70 hover:bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-white">
                      {audience.label}
                    </span>
                    <AudienceStatusBadge audience={audience} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /v/{audience.slug}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          {selectedAudience ? (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedAudience.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Opaque public URL: /v/{selectedAudience.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyAudienceLink(selectedAudience)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    type="button"
                    onClick={saveChanges}
                    disabled={saveAudienceViews.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saveAudienceViews.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LabeledInput
                  id="audience-label"
                  label="Internal label"
                  value={selectedAudience.label}
                  onChange={(value) => updateSelectedAudience({ label: value })}
                />
                <LabeledInput
                  id="audience-company"
                  label="Company"
                  value={selectedAudience.companyName}
                  onChange={(value) =>
                    updateSelectedAudience({ companyName: value })
                  }
                />
                <LabeledInput
                  id="audience-role"
                  label="Role / JD target"
                  value={selectedAudience.roleTitle}
                  onChange={(value) =>
                    updateSelectedAudience({ roleTitle: value })
                  }
                />
                <LabeledInput
                  id="audience-expiry"
                  label="Expires on"
                  type="date"
                  value={selectedAudience.expiresAt}
                  onChange={(value) =>
                    updateSelectedAudience({ expiresAt: value })
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusButton
                  active={selectedAudience.status === 'active'}
                  icon={<Eye className="h-4 w-4" />}
                  label="Active"
                  onClick={() => updateSelectedAudience({ status: 'active' })}
                />
                <StatusButton
                  active={selectedAudience.status === 'archived'}
                  icon={<Archive className="h-4 w-4" />}
                  label="Archived"
                  onClick={() => updateSelectedAudience({ status: 'archived' })}
                />
                <StatusButton
                  active={selectedAudience.status === 'expired'}
                  icon={<TimerOff className="h-4 w-4" />}
                  label="Expired"
                  onClick={() => updateSelectedAudience({ status: 'expired' })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateSelectedAudience({
                      expiresAt: '',
                      status: 'active',
                    })
                  }
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reactivate
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <ColorInput
                  id="audience-primary"
                  label="Primary"
                  value={selectedAudience.theme.primary}
                  onChange={(value) =>
                    updateSelectedAudience({
                      theme: { ...selectedAudience.theme, primary: value },
                    })
                  }
                />
                <ColorInput
                  id="audience-accent"
                  label="Accent"
                  value={selectedAudience.theme.accent}
                  onChange={(value) =>
                    updateSelectedAudience({
                      theme: { ...selectedAudience.theme, accent: value },
                    })
                  }
                />
                <ColorInput
                  id="audience-background"
                  label="Background"
                  value={selectedAudience.theme.background}
                  onChange={(value) =>
                    updateSelectedAudience({
                      theme: { ...selectedAudience.theme, background: value },
                    })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <LabeledTextarea
                  id="audience-jd"
                  label="Job description / company notes"
                  value={selectedAudience.jobDescription}
                  onChange={(value) =>
                    updateSelectedAudience({ jobDescription: value })
                  }
                />
                <LabeledTextarea
                  id="audience-tone"
                  label="Tone and visual direction"
                  value={selectedAudience.toneNotes}
                  onChange={(value) =>
                    updateSelectedAudience({ toneNotes: value })
                  }
                />
                <LabeledTextarea
                  id="audience-jargon"
                  label="Their language, your proof"
                  value={selectedAudience.jargonNotes}
                  onChange={(value) =>
                    updateSelectedAudience({ jargonNotes: value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <LabeledTextarea
                  id="audience-hero"
                  label="Hero line"
                  value={selectedAudience.contentOverrides['hero-tagline'] ?? ''}
                  onChange={(value) =>
                    updateContentOverride('hero-tagline', value)
                  }
                />
                <LabeledTextarea
                  id="audience-project-copy"
                  label="Project intro"
                  value={
                    selectedAudience.contentOverrides['projects-subtitle'] ?? ''
                  }
                  onChange={(value) =>
                    updateContentOverride('projects-subtitle', value)
                  }
                />
                <LabeledTextarea
                  id="audience-contact-copy"
                  label="Contact note"
                  value={
                    selectedAudience.contentOverrides['contact-subtitle'] ?? ''
                  }
                  onChange={(value) =>
                    updateContentOverride('contact-subtitle', value)
                  }
                />
              </div>

              <div>
                <h4 className="mb-3 text-sm font-medium text-white">
                  Projects shown to this audience
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-start gap-3 rounded-md border border-border bg-card/70 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAudience.projectIds.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-white">
                          {project.title || project.id}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {project.tags.slice(0, 4).join(', ')}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">
                Create a tailored portfolio view to start.
              </p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AudienceStatusBadge({ audience }: { audience: AudienceView }) {
  const isDateExpired = hasAudienceExpired(audience);
  const label = isDateExpired ? 'expired' : audience.status;

  return (
    <Badge variant="secondary" className="capitalize">
      {label}
    </Badge>
  );
}

function StatusButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className="gap-2"
    >
      {icon}
      {label}
    </Button>
  );
}

function LabeledInput({
  id,
  label,
  value,
  type = 'text',
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ColorInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 rounded border border-border bg-transparent"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} hex color`}
        />
      </div>
    </div>
  );
}

function LabeledTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[120px]"
      />
    </div>
  );
}

function createOpaqueSlug() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

function hasAudienceExpired(audience: AudienceView) {
  if (audience.status === 'expired') {
    return true;
  }

  if (!audience.expiresAt) {
    return false;
  }

  const expiresAt = new Date(`${audience.expiresAt}T23:59:59`);
  return Number.isFinite(expiresAt.getTime()) && expiresAt < new Date();
}
