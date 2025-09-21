'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

interface ImageUrlInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export function ImageUrlInput({
  label,
  description,
  value,
  onChange,
  disabled = false,
  placeholder = "https://example.com/image.jpg",
  required = false
}: ImageUrlInputProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl);
    setImageError(false);
    if (newUrl) {
      setImageLoading(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const clearImage = () => {
    onChange('');
    setImageError(false);
    setImageLoading(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="imageUrl">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <div className="space-y-3">
        {/* URL Input */}
        <div className="flex space-x-2">
          <Input
            id="imageUrl"
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearImage}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Image Preview */}
        {value && (
          <div className="border rounded-lg p-4 bg-gray-50">
            {imageLoading && (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading image...</span>
              </div>
            )}

            {!imageLoading && !imageError && (
              <div className="space-y-2">
                <img
                  src={value}
                  alt="Preview"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="max-w-full h-auto max-h-48 rounded border object-cover mx-auto"
                />
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>Image preview</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(value, '_blank')}
                    className="h-auto p-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {imageError && (
              <div className="flex items-center justify-center h-32 bg-red-50 rounded border-red-200">
                <div className="text-center">
                  <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Failed to load image</p>
                  <p className="text-xs text-red-500">Please check the URL</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Enter a direct image URL. Supports JPG, PNG, GIF, and WebP formats.
      </p>
    </div>
  );
}