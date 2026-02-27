import React from 'react';
import { Filter, MoreHorizontal, TrendingDown, ArrowUpRight } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';
import { ProgressBar } from '../../design-system/ProgressBar';
import { useProjects } from '../../controllers/useProjects';

import { CardSkeleton } from '../../design-system/Skeleton';

const CRITICAL_STATUSES = ['Blocked', 'At Risk', 'Stalled'];

const statusVariant = (status: string): 'critical' | 'warning' | 'default' => {
  if (status === 'Blocked' || status === 'Stalled') return 'critical';
  if (status === 'At Risk') return 'warning';
  return 'default';
};

interface CriticalWatchlistProps {
  onNavigate: (projectId: number) => void;
}

export const CriticalWatchlist: React.FC<CriticalWatchlistProps> = ({ onNavigate }) => {
  const { leadProjects, collaboratingProjects, loading } = useProjects();
  const allProjects = [...leadProjects, ...collaboratingProjects];
  const criticalProjects = allProjects.filter(p => p.status && CRITICAL_STATUSES.includes(p.status));

  return (
    <SurfaceCard title="Critical Watchlist" subtitle="Contextual Project Bottlenecks" icon={Filter} rightElement={<MoreHorizontal className="text-slate-500 cursor-pointer" size={18} />}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
        ) : criticalProjects.length === 0 ? (
          <div className="col-span-4 text-slate-500 text-[13px] text-center py-10 border border-dashed border-[#374151] rounded-xl">
            No critical projects detected.
          </div>
        ) : (
          criticalProjects.map(proj => (
            <div
              key={proj.id}
              onClick={() => onNavigate(proj.id)}
              className="p-5 rounded-xl border border-[#374151] bg-[#0B0E14] hover:border-[#3B82F6]/50 transition-all cursor-pointer relative flex flex-col justify-between h-40 group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-white font-bold text-[12px] uppercase tracking-wider line-clamp-1">{proj.name}</h4>
                  <Badge variant={statusVariant(proj.status!)} className="!text-[8px] flex-shrink-0 ml-2">{proj.status}</Badge>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-2">
                  <TrendingDown size={14} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{proj.issue || 'No issue summary available.'}</span>
                </p>
              </div>
              <div className="flex justify-between items-end gap-4 mt-2">
                <ProgressBar value={proj.progress ?? 0} label="Team Velocity" colorClass="bg-[#EF4444]" />
                <div className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#374151] text-slate-400 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all flex-shrink-0 mb-0.5">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          ))
        )}

        {/* View All stub */}
        {!loading && criticalProjects.length > 0 && (
          <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-[#374151] hover:border-[#3B82F6] hover:bg-[#1F2937]/50 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center text-slate-400 group-hover:text-white transition-all mb-3">
              <ArrowUpRight size={18} />
            </div>
            <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider group-hover:text-white transition-colors">View All</span>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
};
