'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Mail, MessageCircle, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShareDialog({
  isOpen,
  onClose,
  url,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Copy failed', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Check out this property: ${title}\n\n${url}`);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div 
        className="relative bg-card w-full max-w-md rounded-2xl shadow-premium border overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Link2 className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-lg">Share Property</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* URL Display & Copy */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Smart Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg border px-3 py-2 text-sm text-foreground truncate select-all">
                {url}
              </div>
              <Button 
                onClick={handleCopy} 
                className={`shrink-0 transition-all duration-300 ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
              >
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">Or share via</span>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-12 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#25D366] hover:text-[#25D366] border-[#25D366]/20 transition-colors"
            >
              <a href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-12 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 hover:text-blue-700 border-blue-500/20 transition-colors"
            >
              <a href={`mailto:?subject=${encodeURIComponent(`Check out ${title}`)}&body=${encodedText}`} target="_blank" rel="noopener noreferrer">
                <Mail className="h-5 w-5 mr-2" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
