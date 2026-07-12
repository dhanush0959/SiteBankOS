import { leadStatusBadgeClass, hotScoreColor } from '@/lib/property-helpers';
import type { LeadStatus } from '@/hooks/useLeads';

export function LeadStatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded ${leadStatusBadgeClass(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function HotScoreChip({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded border tabular-nums ${hotScoreColor(score)}`}>
      🔥 {score}
    </span>
  );
}
