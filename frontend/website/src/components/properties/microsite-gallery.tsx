'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface GalleryProps {
  media: { fileUrl: string; cdnUrl?: string | null; isCover: boolean; fileType: string }[];
  title: string;
}

export function MicrositeGallery({ media, title }: GalleryProps) {
  const images = media
    .filter((m) => m.fileType === 'PHOTO' || m.fileType === 'THUMBNAIL')
    .map((m) => m.cdnUrl ?? m.fileUrl);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const handleOpenGallery = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      const idx = customEvent.detail?.index;
      if (typeof idx === 'number' && idx >= 0 && idx < images.length) {
        setActiveIndex(idx);
        setIsFullscreen(true);
      }
    };
    window.addEventListener('open-microsite-gallery', handleOpenGallery);
    return () => {
      window.removeEventListener('open-microsite-gallery', handleOpenGallery);
    };
  }, [images.length]);

  if (images.length === 0) {
    return null;
  }

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex(index);
  };

  // Mobile Touch Swiping handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
  };

  return (
    <>
      {/* ─── Carousel Slider ─── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[300px] sm:h-[450px] overflow-hidden bg-slate-900 group"
      >
        <div
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setIsFullscreen(true)}
              className="w-full h-full shrink-0 relative cursor-zoom-in select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${title} view ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Hover zoom-in hint icon */}
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 flex items-center gap-1.5 px-3 shadow-lg">
          <ZoomIn className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider md:hidden">Tap to Expand</span>
        </div>

        {/* Left/Right Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Dots Page Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/25 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => goToSlide(idx, e)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/70 w-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Fullscreen Lightbox Overlay ─── */}
      {isFullscreen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between items-center py-6 px-4 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Top Info Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white/90 z-10">
            <span className="text-sm font-semibold tracking-wide bg-white/10 px-3 py-1 rounded-full">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Centered Image */}
          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center select-none my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={`${title} fullscreen view`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Lightbox navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => prevSlide(e)}
                  className="absolute left-0 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8 stroke-[2.5]" />
                </button>
                <button
                  onClick={(e) => nextSlide(e)}
                  className="absolute right-0 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Indicator Dots */}
          {images.length > 1 && (
            <div className="flex gap-2 bg-white/5 px-4 py-2.5 rounded-full backdrop-blur-sm z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => goToSlide(idx, e)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'bg-white w-6'
                      : 'bg-white/20 hover:bg-white/50 w-2'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
