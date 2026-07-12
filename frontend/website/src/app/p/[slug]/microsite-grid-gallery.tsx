'use client';

interface MediaItem {
  fileUrl: string;
  cdnUrl?: string | null;
  fileType: string;
  isCover: boolean;
}

interface MicrositeGridGalleryProps {
  media: MediaItem[];
  propertyTitle: string;
}

export function MicrositeGridGallery({ media, propertyTitle }: MicrositeGridGalleryProps) {
  // Only display photos and thumbnails
  const images = media.filter((m) => m.fileType === 'PHOTO' || m.fileType === 'THUMBNAIL');

  if (images.length === 0) return null;

  const handleImageClick = (index: number) => {
    const event = new CustomEvent('open-microsite-gallery', {
      detail: { index },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Photo Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((m, i) => (
          <div
            key={i}
            onClick={() => handleImageClick(i)}
            className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-100 cursor-pointer shadow-sm relative group active:scale-[0.98] transition-transform duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.cdnUrl ?? m.fileUrl}
              alt={`${propertyTitle} photo ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
