'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Maximize,
  Award,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageGalleryProps {
  gallery: {
    id: string;
    title: string;
    description: string;
    category: 'diagrams' | 'photos' | 'charts' | 'schematics';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    images: {
      id: string;
      title: string;
      description: string;
      url: string;
      thumbnail: string;
      tags: string[];
      annotations?: {
        x: number;
        y: number;
        label: string;
        description: string;
      }[];
    }[];
  };
  onComplete: (galleryId: string, imagesViewed: number, timeSpent: number, points: number) => void;
  viewedImages?: string[];
  isCompleted?: boolean;
}

export function ImageGallery({ 
  gallery, 
  onComplete, 
  viewedImages = [],
  isCompleted = false 
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'lightbox'>('grid');
  const [localViewedImages, setLocalViewedImages] = useState<Set<string>>(new Set(viewedImages));
  const [timeSpent, setTimeSpent] = useState(0);

  const selectedImage = selectedImageIndex !== null ? gallery.images[selectedImageIndex] : null;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setViewMode('lightbox');
    setZoom(1);
    setRotation(0);
    
    const imageId = gallery.images[index].id;
    if (!localViewedImages.has(imageId)) {
      const newViewedImages = new Set(localViewedImages);
      newViewedImages.add(imageId);
      setLocalViewedImages(newViewedImages);
      
      // Check if all images have been viewed
      if (newViewedImages.size === gallery.images.length && !isCompleted) {
        onComplete(gallery.id, newViewedImages.size, timeSpent, gallery.points);
      }
    }
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < gallery.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage.url;
      link.download = `${selectedImage.title}.jpg`;
      link.click();
    }
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    setViewMode('grid');
    setZoom(1);
    setRotation(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diagrams': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'photos': return 'bg-green-100 text-green-800 border-green-200';
      case 'charts': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'schematics': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progressPercentage = Math.round((localViewedImages.size / gallery.images.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(gallery.difficulty)}`}>
              {gallery.difficulty}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(gallery.category)}`}>
              {gallery.category}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Completed</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="font-medium">{gallery.points} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{localViewedImages.size}/{gallery.images.length}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{gallery.title}</h3>
        <p className="text-gray-600 mb-4">{gallery.description}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Viewing Progress</span>
            <span className="text-sm text-gray-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid View
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer"
              onClick={() => handleImageClick(index)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-all duration-200">
                <Image
                  src={image.thumbnail}
                  alt={image.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Viewed Indicator */}
                {localViewedImages.has(image.id) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                  </div>
                )}

                {/* Annotations Indicator */}
                {image.annotations && image.annotations.length > 0 && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {image.annotations.length} notes
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{image.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{image.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {image.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {image.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{image.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && viewMode === 'lightbox' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <Button
                onClick={closeLightbox}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Navigation */}
              {selectedImageIndex! > 0 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {selectedImageIndex! < gallery.images.length - 1 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}

              {/* Controls */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <Button
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-5 h-5" />
                </Button>
                {selectedImage.annotations && (
                  <Button
                    onClick={(e) => { e.stopPropagation(); setShowAnnotations(!showAnnotations); }}
                    variant="ghost"
                    size="icon"
                    className={`text-white hover:bg-white/20 ${showAnnotations ? 'bg-white/20' : ''}`}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Image */}
              <div 
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  animate={{ 
                    scale: zoom,
                    rotate: rotation
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="relative"
                >
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    width={800}
                    height={600}
                    className="max-w-full max-h-[80vh] object-contain"
                  />

                  {/* Annotations */}
                  {showAnnotations && selectedImage.annotations?.map((annotation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="absolute group"
                      style={{
                        left: `${annotation.x}%`,
                        top: `${annotation.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform">
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white p-2 rounded-lg text-sm whitespace-nowrap z-10">
                        <div className="font-semibold">{annotation.label}</div>
                        <div className="text-xs">{annotation.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Image Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white">
                <h3 className="text-lg font-semibold mb-1">{selectedImage.title}</h3>
                <p className="text-sm text-gray-300 mb-2">{selectedImage.description}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 text-white text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Stats */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{localViewedImages.size}</div>
            <div className="text-sm text-gray-600">Images Viewed</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {isCompleted ? gallery.points : Math.round((localViewedImages.size / gallery.images.length) * gallery.points)}
            </div>
            <div className="text-sm text-gray-600">XP Earned</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 