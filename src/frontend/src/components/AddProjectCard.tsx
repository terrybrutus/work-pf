import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAddProject } from '../hooks/useQueries';
import { toast } from 'sonner';

interface AddProjectCardProps {
  onProjectAdd?: () => void;
}

export default function AddProjectCard({ onProjectAdd }: AddProjectCardProps) {
  const addProject = useAddProject();

  const handleAddProject = async () => {
    try {
      const newProject = await addProject.mutateAsync();
      if (onProjectAdd) {
        onProjectAdd();
      }
      toast.success('New project added successfully');
    } catch (error) {
      console.error('Failed to add project:', error);
      toast.error('Failed to add project. Please try again.');
    }
  };

  return (
    <Card className="group relative transition-all duration-200 hover:shadow-lg border-dashed border-2 border-muted-foreground/25 hover:border-primary/50">
      <CardContent className="flex items-center justify-center h-full min-h-[300px] p-6">
        <Button
          onClick={handleAddProject}
          disabled={addProject.isPending}
          variant="ghost"
          size="lg"
          className="flex flex-col items-center gap-4 h-auto py-8 px-12 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className={`w-8 h-8 ${addProject.isPending ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-center">
            <div className="font-medium text-lg mb-1">
              {addProject.isPending ? 'Adding Project...' : 'Add New Project'}
            </div>
            <div className="text-sm text-muted-foreground/70">
              {addProject.isPending ? 'Creating new project card' : 'Click to create a new project card'}
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
