import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  Clock, 
  RotateCcw, 
  Eye, 
  Calendar,
  FileText,
  Image,
  MousePointer,
  List,
  Tag,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Edit
} from 'lucide-react';
import { useRevisionHistory, useRestoreRevision } from '../hooks/useQueries';
import { toast } from 'sonner';

interface RevisionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RevisionEntry {
  id: string;
  timestamp: Date;
  type: 'autosave' | 'manual' | 'edit';
  contentSnapshot: Record<string, any>;
  projectsSnapshot: any[];
  description: string;
  changedElements: string[];
}

export default function RevisionHistory({ isOpen, onClose }: RevisionHistoryProps) {
  const { data: revisions = [], isLoading, error, refetch } = useRevisionHistory();
  const restoreRevision = useRestoreRevision();
  const [selectedRevision, setSelectedRevision] = useState<RevisionEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const handleRestoreRevision = async (revision: RevisionEntry) => {
    try {
      await restoreRevision.mutateAsync(revision.id);
      toast.success(`Restored revision from ${revision.timestamp.toLocaleString()}`);
      setShowRestoreConfirm(false);
      setSelectedRevision(null);
      onClose();
    } catch (error) {
      console.error('Failed to restore revision:', error);
      toast.error('Failed to restore revision');
    }
  };

  const getRevisionTypeIcon = (type: 'autosave' | 'manual' | 'edit') => {
    if (type === 'autosave') {
      return <Clock className="w-4 h-4 text-blue-500" />;
    } else if (type === 'edit') {
      return <Edit className="w-4 h-4 text-orange-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getRevisionTypeBadge = (type: 'autosave' | 'manual' | 'edit') => {
    if (type === 'autosave') {
      return <Badge variant="secondary">Auto Save</Badge>;
    } else if (type === 'edit') {
      return <Badge variant="outline">Edit</Badge>;
    } else {
      return <Badge variant="default">Manual Save</Badge>;
    }
  };

  const getContentTypeIcon = (elementId: string) => {
    if (elementId.includes('image')) return <Image className="w-3 h-3" />;
    if (elementId.includes('button')) return <MousePointer className="w-3 h-3" />;
    if (elementId.includes('list')) return <List className="w-3 h-3" />;
    if (elementId.includes('tags')) return <Tag className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Revision History
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center py-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load revision history. This could be due to network issues or backend connectivity problems.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex-shrink-0 flex justify-center gap-3 pt-4 border-t">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Revision History
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              View and restore previous versions of your portfolio content
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                <p className="text-lg font-medium mb-2">Loading revision history...</p>
                <p className="text-muted-foreground">Please wait while we fetch your revisions</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Revision List */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="flex-shrink-0 pb-4">
                    <CardTitle className="text-lg">Revisions</CardTitle>
                    <CardDescription>
                      {revisions.length} revision{revisions.length !== 1 ? 's' : ''} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-3 p-6">
                        {revisions.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <History className="w-16 h-16 mx-auto mb-6 opacity-40" />
                            <h3 className="text-lg font-medium mb-3">No revisions yet</h3>
                            <p className="text-sm leading-relaxed">
                              Revisions are created automatically when you save changes to your portfolio
                            </p>
                          </div>
                        ) : (
                          revisions.map((revision) => (
                            <Card
                              key={revision.id}
                              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                selectedRevision?.id === revision.id
                                  ? 'ring-2 ring-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedRevision(revision)}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    {getRevisionTypeIcon(revision.type)}
                                    {getRevisionTypeBadge(revision.type)}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTimestamp(revision.timestamp)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1 break-words">{revision.description}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span className="break-words">{revision.timestamp.toLocaleString()}</span>
                                  </div>
                                </div>
                                {revision.changedElements.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {revision.changedElements.slice(0, 2).map((elementId) => (
                                      <Badge key={elementId} variant="outline" className="text-xs">
                                        {getContentTypeIcon(elementId)}
                                        <span className="ml-1 break-words">
                                          {elementId.replace(/^(hero|about|projects|contact)-/, '').replace(/-/g, ' ')}
                                        </span>
                                      </Badge>
                                    ))}
                                    {revision.changedElements.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{revision.changedElements.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Revision Details */}
              <div className="lg:col-span-3 flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="flex-shrink-0 pb-4">
                    <CardTitle className="text-lg">
                      {selectedRevision ? 'Revision Details' : 'Select a Revision'}
                    </CardTitle>
                    {selectedRevision && (
                      <CardDescription className="break-words">
                        {selectedRevision.description} • {selectedRevision.timestamp.toLocaleString()}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0">
                    {selectedRevision ? (
                      <ScrollArea className="h-full">
                        <div className="space-y-8 pr-4">
                          {/* Revision Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                              <div className="flex items-center gap-2 mt-2">
                                {getRevisionTypeIcon(selectedRevision.type)}
                                <span className="text-sm">
                                  {selectedRevision.type === 'manual' ? 'Manual Save' : 
                                   selectedRevision.type === 'edit' ? 'Content Edit' : 'Automatic Save'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Timestamp</Label>
                              <p className="text-sm mt-2 break-words">{selectedRevision.timestamp.toLocaleString()}</p>
                            </div>
                          </div>

                          <Separator />

                          {/* Changed Elements */}
                          {selectedRevision.changedElements.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-4 block">
                                Changed Elements ({selectedRevision.changedElements.length})
                              </Label>
                              <div className="grid gap-3">
                                {selectedRevision.changedElements.map((elementId) => (
                                  <div key={elementId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    {getContentTypeIcon(elementId)}
                                    <span className="text-sm font-medium flex-1 break-words">
                                      {elementId.replace(/^(hero|about|projects|contact)-/, '').replace(/-/g, ' ')}
                                    </span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {elementId.split('-')[0]}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Content Preview */}
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground mb-4 block">
                              Content Preview
                            </Label>
                            <div className="space-y-4">
                              {Object.entries(selectedRevision.contentSnapshot).slice(0, 5).map(([key, element]: [string, any]) => (
                                <div key={key} className="p-4 bg-muted/20 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-3">
                                    {getContentTypeIcon(key)}
                                    <span className="text-sm font-medium break-words">
                                      {key.replace(/^(hero|about|projects|contact)-/, '').replace(/-/g, ' ')}
                                    </span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {element.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                                    {element.type === 'list' || element.type === 'tags' 
                                      ? `${JSON.parse(element.value || '[]').length} items`
                                      : element.value || 'No content'
                                    }
                                  </p>
                                </div>
                              ))}
                              {Object.keys(selectedRevision.contentSnapshot).length > 5 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  +{Object.keys(selectedRevision.contentSnapshot).length - 5} more elements
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Projects Preview */}
                          {selectedRevision.projectsSnapshot.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-4 block">
                                Projects ({selectedRevision.projectsSnapshot.length})
                              </Label>
                              <div className="grid gap-3">
                                {selectedRevision.projectsSnapshot.slice(0, 3).map((project, index) => (
                                  <div key={index} className="p-4 bg-muted/20 rounded-lg border">
                                    <p className="text-sm font-medium mb-1 break-words">{project.title || 'Untitled Project'}</p>
                                    <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                                      {project.description || 'No description'}
                                    </p>
                                  </div>
                                ))}
                                {selectedRevision.projectsSnapshot.length > 3 && (
                                  <p className="text-sm text-muted-foreground text-center py-2">
                                    +{selectedRevision.projectsSnapshot.length - 3} more projects
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <History className="w-20 h-20 mx-auto mb-6 text-muted-foreground/40" />
                          <h3 className="text-xl font-medium mb-4">Select a Revision</h3>
                          <p className="text-muted-foreground max-w-md leading-relaxed break-words">
                            Choose a revision from the list to view its details and restore it if needed. 
                            Each revision contains a complete snapshot of your portfolio at that point in time.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t">
            <div className="flex items-center gap-3">
              {selectedRevision && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={restoreRevision.isPending}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {restoreRevision.isPending ? 'Restoring...' : 'Restore'}
                  </Button>
                </>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="break-words">
                This will restore your portfolio to the state from{' '}
                <strong>{selectedRevision?.timestamp.toLocaleString()}</strong>.
                Any unsaved changes will be lost.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRestoreConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedRevision && handleRestoreRevision(selectedRevision)}
                disabled={restoreRevision.isPending}
              >
                {restoreRevision.isPending ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (placeholder for future implementation) */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Revision Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Eye className="w-20 h-20 mx-auto mb-6 text-muted-foreground/40" />
              <h3 className="text-xl font-medium mb-4">Preview Coming Soon</h3>
              <p className="text-muted-foreground max-w-md break-words">
                Full revision preview functionality will be available in a future update. 
                For now, you can view revision details and restore them directly.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end pt-4 border-t">
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
