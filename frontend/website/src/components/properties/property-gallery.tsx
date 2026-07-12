'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Media {
  id: string;
  cdnUrl?: string | null;
  fileUrl: string;
  fileType?: string;
}

export function PropertyGallery({ media, title }: { media: Media[], title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-slide effect (optional, maybe not if they can swipe. I will implement a swipeable container)
  const images = media.filter(m => !m.fileType || m.fileType === 'PHOTO');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/8] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        <Building2 className="h-16 w-16 text-muted-foreground/20" />
      </div>
    );
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  // Swipe logic
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  return (
    <>
      {/* Main Hero Slider */}
      <div 
        className="relative w-full aspect-[16/8] sm:aspect-[21/9] bg-black group overflow-hidden cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img) => (
            <div key={img.id} className="w-full h-full flex-shrink-0" onClick={() => setIsFullscreen(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.cdnUrl || img.fileUrl} alt={title} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 text-white absolute top-0 w-full z-10 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-sm font-medium opacity-80">{currentIndex + 1} / {images.length}</span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setIsFullscreen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div 
            className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={images[currentIndex].cdnUrl || images[currentIndex].fileUrl} 
              alt={title} 
              className="w-full h-full object-contain p-2 sm:p-4 animate-in zoom-in-95 duration-300"
            />
          </div>

          {images.length > 1 && (
            <>
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors hidden sm:block"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors hidden sm:block"
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
