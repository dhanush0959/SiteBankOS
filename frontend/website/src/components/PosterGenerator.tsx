'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { unwrap } from '@/lib/api';
import { Sparkles, Loader2, Download, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface PosterTemplate {
  id: string;
  name: string;
  description: string;
}

interface GeneratedAsset {
  id: string;
  imageUrl: string;
  aspectRatio: string;
  headline: string;
}

interface PosterGeneratorProps {
  propertyId: string;
  propertyTitle: string;
  coverImageUrl?: string;
}

export function PosterGenerator({ propertyId, propertyTitle, coverImageUrl }: PosterGeneratorProps) {
  const api = useApi();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState('premium');
  const [headline, setHeadline] = useState(propertyTitle);
  const [keySpec, setKeySpec] = useState('');
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);

  const templates = useQuery({
    queryKey: ['thumbnails', 'templates'],
    queryFn: async () => unwrap<PosterTemplate[]>(await api.get('/thumbnails/templates')),
  });

  const suggestAI = useMutation({
    mutationFn: async () => unwrap<{ headline: string; highlight: string }>(await api.post(`/thumbnails/properties/${propertyId}/suggest-headlines`)),
    onSuccess: (res) => {
      setHeadline(res.headline);
      if (res.highlight) setKeySpec(res.highlight);
      toast({ title: 'AI Suggestion ready', description: 'Headline updated with a catchy copy.' });
    }
  });

  const generate = useMutation({
    mutationFn: async () =>
      unwrap<{ assets: GeneratedAsset[] }>(
        await api.post(`/thumbnails/properties/${propertyId}/poster`, {
          templateId: selectedTemplate,
          headline: headline || undefined,
          keySpec: keySpec || undefined,
        }),
      ),
    onSuccess: (res) => {
      setAssets(res.assets);
      qc.invalidateQueries({ queryKey: ['thumbnails', 'properties', propertyId] });
      toast({ title: 'Poster generated', description: `${res.assets.length} images created` });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Make sure you have uploaded at least one photo.';
      toast({ title: 'Generation failed', description: Array.isArray(msg) ? msg.join(', ') : msg, variant: 'destructive' });
    },
  });

  if (!coverImageUrl) {
    return (
      <Card className="border-0 shadow-premium">
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Upload a cover photo first to generate posters.</p>
        </CardContent>
      </Card>
    );
  }

  const aspectLabels: Record<string, string> = {
    '16:9': 'Link Preview',
    '1:1': 'Instagram / Post',
    '9:16': 'WhatsApp Status',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Template selector */}
          <Card className="border-0 shadow-premium overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-50/50 border-b border-white/20">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
                1. Choose a style
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              {templates.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {(templates.data ?? []).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all relative group ${
                        selectedTemplate === tpl.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{tpl.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editable fields */}
          <Card className="border-0 shadow-premium overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-50/50 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  2. Branding & Content
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => suggestAI.mutate()}
                  disabled={suggestAI.isPending}
                  className="rounded-xl text-accent hover:bg-accent/5 hover:text-accent font-bold h-9"
                >
                  {suggestAI.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                  AI Suggest
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Headline</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={100}
                  className="h-12 rounded-xl bg-slate-50/50 focus:bg-white transition-colors text-sm font-medium"
                  placeholder="e.g. Modern Luxury Villa in Jubilee Hills"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Key Specs / Highlights</Label>
                <Input
                  value={keySpec}
                  onChange={(e) => setKeySpec(e.target.value)}
                  maxLength={60}
                  className="h-12 rounded-xl bg-slate-50/50 focus:bg-white transition-colors text-sm font-medium"
                  placeholder="e.g. 3 BHK · 2400 sqft · West Facing"
                />
              </div>
              
              <Button
                className="w-full h-14 rounded-2xl bg-primary-gradient text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Designing assets…
                  </>
                ) : (
                  'Generate Marketing Kit'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview / Results Placeholder */}
        <div className="space-y-6">
          {assets.length === 0 ? (
            <div className="rounded-[40px] border-4 border-dashed border-slate-100 bg-slate-50/30 aspect-[4/5] flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
                <ImageIcon className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Marketing Kit Preview</h3>
              <p className="text-slate-300 max-w-xs mt-2 text-sm">
                Choose a template and click generate to create high-resolution posters for WhatsApp and social media.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-extrabold tracking-tight px-1">Your Marketing Assets</h2>
              {assets.map((asset) => (
                <Card key={asset.id} className="border-0 shadow-premium overflow-hidden rounded-[32px] group bg-white">
                  <div className="relative aspect-video bg-slate-100">
                    <img
                      src={asset.imageUrl}
                      alt={asset.headline}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Button variant="secondary" className="rounded-2xl font-bold px-6 h-11" asChild>
                        <a href={asset.imageUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> View Original
                        </a>
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{aspectLabels[asset.aspectRatio.split('-')[0]] || asset.aspectRatio}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Optimized for sharing</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-200 hover:border-primary hover:text-primary transition-all font-bold h-10 px-4"
                      asChild
                    >
                      <a href={asset.imageUrl} download>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="ghost" 
                className="w-full h-14 rounded-2xl border-2 border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600 font-bold"
                onClick={() => setAssets([])}
              >
                Reset & Create New
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
