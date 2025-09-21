'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  maxSizeKB?: number;
  acceptedTypes?: string[];
}

export function ImageUpload({
  value = '',
  onChange,
  disabled = false,
  label = 'Image',
  description,
  maxSizeKB = 2048, // 2MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Please select a valid image file (${acceptedTypes.map(t => t.split('/')[1]).join(', ')})`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      setError(`File size must be less than ${maxSizeKB}KB`);
      return;
    }

    // If replacing an existing uploaded image, clean up the old one
    const currentUploadedUrl = lastUploadedUrl || (value.startsWith('/uploads/') ? value : null);
    if (currentUploadedUrl) {
      try {
        await fetch('/api/upload/image/cleanup', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: currentUploadedUrl }),
        });
        console.log('Cleaned up previous uploaded image:', currentUploadedUrl);
      } catch (err) {
        console.error('Failed to cleanup previous image:', err);
      }
    }

    try {
      setUploading(true);
      console.log('Starting file upload:', file.name, file.type, file.size);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'subjects'); // Organize uploads by type

      // Upload file
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      setLastUploadedUrl(data.url);
      onChange(data.url);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setError(null);
    }
  };

  const handleRemove = async () => {
    // If this was an uploaded file (not an external URL), clean it up
    if (lastUploadedUrl && value === lastUploadedUrl && value.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload/image/cleanup', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: value }),
        });
        console.log('Cleaned up unused uploaded image:', value);
      } catch (err) {
        console.error('Failed to cleanup uploaded image:', err);
      }
    }

    onChange('');
    setUrlInput('');
    setError(null);
    setLastUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={uploadMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('upload')}
            disabled={disabled}
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('url')}
            disabled={disabled}
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            URL
          </Button>
        </div>
      </div>

      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Image Preview */}
      {value && (
        <div className="relative group">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', value);
                setError(`Failed to load image: ${value}`);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', value);
                setError(null);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
            </Badge>
            {isValidUrl(value) && (
              <Badge variant="secondary" className="text-xs">
                External URL
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Upload Interface */}
      {!value && uploadMode === 'upload' && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Uploading...' : 'Upload an image'}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your image here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Supports: {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max {maxSizeKB}KB
            </p>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      {!value && uploadMode === 'url' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput.trim()}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter a direct link to an image file
          </p>
        </div>
      )}
    </div>
  );
}