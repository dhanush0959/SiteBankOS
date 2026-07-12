import Link from 'next/link';
import { Building2, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PropertiesEmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/40 dark:border-white/[0.08] bg-gradient-to-br from-amber-500/[0.04] via-transparent to-amber-400/[0.04] p-12 text-center">
      {/* Icon */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="relative w-20 h-20 rounded-2xl bg-primary text-primary-foreground dark:from-amber-500/15 dark:to-amber-400/15 flex items-center justify-center ring-1 ring-foreground/10">
          <Building2 className="h-9 w-9 text-white" />
        </div>
      </div>
      <h2 className="mt-6 text-xl font-bold tracking-tight">No properties yet</h2>
      <p className="mt-2.5 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        Add your first property to start generating shareable smart links and tracking buyer interest.
      </p>
      <div className="flex items-center justify-center gap-3 mt-7">
        <Button asChild className="rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300 border-0 font-semibold">
          <Link href="/properties/new">
            <Plus className="h-4 w-4 mr-1.5" /> Add your first property
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl dark:border-white/[0.08]">
          <Link href="/map">
            <MapPin className="h-4 w-4 mr-1.5" /> View map
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 dark:border-white/[0.06] bg-card overflow-hidden shadow-premium">
      <div className="aspect-[4/3] shimmer-skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 shimmer-skeleton rounded-full" />
        <div className="h-3 w-1/2 shimmer-skeleton rounded-full" />
        <div className="h-5 w-1/3 shimmer-skeleton rounded-full" />
      </div>
    </div>
  );
}
