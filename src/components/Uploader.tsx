import React, { useCallback, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageItem } from '@/types';

interface UploaderProps {
  onImagesAdded: (images: ImageItem[]) => void;
}

export function Uploader({ onImagesAdded }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  }, []);

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      const newImages: ImageItem[] = data.files.map((file: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        url: file.url,
        caption: file.originalName
      }));
      
      if (newImages.length > 0) {
        onImagesAdded(newImages);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload images.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm relative",
        isDragging 
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
        isUploading && "pointer-events-none opacity-80"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={isUploading}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-500 dark:text-zinc-400">
        {isUploading ? (
          <Loader2 className="w-10 h-10 mb-3 animate-spin text-blue-500" />
        ) : (
          <UploadCloud className="w-10 h-10 mb-3" />
        )}
        <p className="mb-2 text-sm font-medium">
          {isUploading ? (
            <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
          ) : (
            <><span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop</>
          )}
        </p>
        <p className="text-xs">Supports up to 100 images (JPG, PNG, WebP)</p>
      </div>
    </div>
  );
}
