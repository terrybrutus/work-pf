import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Trash2, Image, Video, File, Copy, Check } from 'lucide-react';
import { useFileUpload, useFileList, useFileDelete, useFileUrl } from '../blob-storage/FileStorage';

interface EditorModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditorMode({ isOpen, onClose }: EditorModeProps) {
  const { uploadFile, isUploading } = useFileUpload();
  const { data: files = [] } = useFileList();
  const { deleteFile } = useFileDelete();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = `portfolio/media/${Date.now()}-${file.name}`;
      await uploadFile(path, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(path);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-6">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Image className="w-6 h-6" />
            Media Library
          </DialogTitle>
          <p className="text-muted-foreground">
            Upload, organize, and manage your portfolio media files
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="h-full flex flex-col space-y-6">
            {/* Upload Section */}
            <Card className="flex-shrink-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Upload Media</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Media'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Files Grid */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="pr-4 pb-4">
                  {files.length === 0 ? (
                    <Card className="border-dashed border-2 border-muted-foreground/20">
                      <CardContent className="p-16 text-center">
                        <Upload className="w-20 h-20 mx-auto mb-8 opacity-50 text-muted-foreground" />
                        <h3 className="text-2xl font-medium mb-4">No media files uploaded yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                          Upload images, videos, or documents to get started. Supported formats include JPG, PNG, GIF, MP4, MOV, PDF, and DOC files.
                        </p>
                        <Button
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={isUploading}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-5 h-5" />
                          Upload Your First File
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {files.map((file) => (
                          <MediaFileCard
                            key={file.path}
                            file={file}
                            onDelete={() => handleDeleteFile(file.path)}
                          />
                        ))}
                      </div>
                      
                      <Card className="border-dashed border-2 border-muted-foreground/20">
                        <CardContent className="p-12 text-center">
                          <p className="text-muted-foreground mb-4 text-lg">
                            Upload more media files to expand your library
                          </p>
                          <p className="text-sm text-muted-foreground mb-6">
                            Copy file URLs to use them throughout your portfolio content
                          </p>
                          <Button
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={isUploading}
                            variant="outline"
                            size="lg"
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-5 h-5" />
                            Upload More Files
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={onClose} size="lg">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaFileCard({ file, onDelete }: { file: { path: string; hash: string }, onDelete: () => void }) {
  const { data: fileUrl } = useFileUrl(file.path);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const filename = file.path.split('/').pop() || file.path;
  const isImage = isImageFile(filename);

  const copyToClipboard = async () => {
    if (fileUrl) {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="w-8 h-8" />;
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
      return <Video className="w-8 h-8" />;
    }
    return <File className="w-8 h-8" />;
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
        {isImage && fileUrl ? (
          <img
            src={fileUrl}
            alt={filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
            {getFileIcon(filename)}
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium truncate" title={filename}>
          {filename}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="flex-1 text-xs h-8"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy URL
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-sm font-medium">Delete this file?</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function isImageFile(filename: string) {
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
}
