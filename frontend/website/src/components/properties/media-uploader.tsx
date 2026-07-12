'use client';

import { useRef, useState } from 'react';
import { Upload, X, Star, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  useUploadMedia,
  useDeleteMedia,
  useSetCover,
  type Property,
} from '@/hooks/useProperties';

const MAX_PER_BATCH = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'video/mp4', 'application/octet-stream'];
const INPUT_ACCEPT = [...ACCEPT_MIMES, 'audio/*', '.mp3', '.m4a', '.wav', '.ogg', '.webm', '.aac', '.mp4'].join(',');

export function MediaUploader({ property }: { property: Property }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const upload = useUploadMedia(property.id);
  const remove = useDeleteMedia(property.id);
  const setCover = useSetCover(property.id);

  const imageMedia = property.media?.filter((m) => m.fileType !== 'AUDIO') ?? [];
  const audioMedia = property.media?.filter((m) => m.fileType === 'AUDIO') ?? [];

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(audioFile);
          pickFiles(dataTransfer.files);
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        toast({ title: 'Microphone access denied', description: 'Please allow microphone access to record voice notes.', variant: 'destructive' });
      }
    }
  };

  function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list).slice(0, MAX_PER_BATCH);
    const valid = files.filter((f) => {
      if (f.size === 0) {
        toast({ title: 'Empty file', description: `${f.name} has no content (0 bytes)`, variant: 'destructive' });
        return false;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast({ title: 'File too large', description: `${f.name} exceeds 10MB`, variant: 'destructive' });
        return false;
      }
      const isAudioExt = /\.(mp3|m4a|wav|ogg|webm|aac|mp4)$/i.test(f.name);
      const isAudio = f.type.startsWith('audio/') || isAudioExt;
      if (!ACCEPT_MIMES.includes(f.type) && !isAudio && !f.type.startsWith('image/')) {
        toast({ title: 'Unsupported file', description: `${f.name}: ${f.type || 'unknown'}`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    upload.mutate(valid, {
      onSuccess: () =>
        toast({ title: 'Uploaded', description: `${valid.length} ${valid.length === 1 ? 'file' : 'files'}` }),
      onError: (err: any) =>
        toast({ title: 'Upload failed', description: err.message || 'Try again or check your connection', variant: 'destructive' }),
    });
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          pickFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drag photos here, or</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending || isRecording}
          >
            {upload.isPending ? 'Uploading…' : 'Choose files'}
          </Button>
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'secondary'}
            size="sm"
            onClick={toggleRecording}
            disabled={upload.isPending}
            className="w-[140px]"
          >
            {isRecording ? (
              <><Square className="h-4 w-4 mr-2 fill-current" /> Stop Recording</>
            ) : (
              <><Mic className="h-4 w-4 mr-2" /> Record Audio</>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          JPG / PNG / WebP / HEIC / Audio · up to 10 files at a time · 10MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={INPUT_ACCEPT}
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>

      {imageMedia.length > 0 || audioMedia.length > 0 ? (
        <div className="space-y-6 mt-6">
          {imageMedia.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Photos & Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {imageMedia.map((m) => {
                  const url = m.cdnUrl ?? m.fileUrl;
                  return (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {m.isCover && (
                        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-primary text-white px-1.5 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-current" /> Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {!m.isCover && (
                          <button
                            type="button"
                            onClick={() => setCover.mutate(m.id)}
                            className="text-xs bg-white/90 px-2 py-1 rounded hover:bg-white"
                            title="Set as cover"
                          >
                            Set cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Remove this photo?')) remove.mutate(m.id);
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 inline-flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {audioMedia.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Voice Notes</h3>
              <div className="space-y-3">
                {audioMedia.map((m) => {
                  const url = m.cdnUrl ?? m.fileUrl;
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border bg-card">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Mic className="h-5 w-5" />
                      </div>
                      <audio controls className="w-full h-10">
                        <source src={url} />
                      </audio>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Remove this voice note?')) remove.mutate(m.id);
                        }}
                        className="text-xs shrink-0 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-4">No media yet. Upload photos or voice notes for your listing.</p>
      )}
    </div>
  );
}
