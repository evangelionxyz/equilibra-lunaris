import React from 'react';
import { Filter, MoreHorizontal, TrendingDown, ArrowUpRight } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';
import { ProgressBar } from '../../design-system/ProgressBar';

export const CriticalWatchlist: React.FC = () => (
  <SurfaceCard title="Critical Watchlist" subtitle="Contextual Project Bottlenecks" icon={Filter} rightElement={<MoreHorizontal className="text-slate-500 cursor-pointer" size={18}/>}>
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[
        { name: "Project Alpha", status: "Blocked", variant: "critical", progress: 65, issue: "3 dependencies pending, team velocity dropping" },
        { name: "Legacy Migration", status: "At Risk", variant: "critical", progress: 58, issue: "Resource allocation conflict, deadline approaching" },
        { name: "Internal Tools", status: "Stalled", variant: "critical", progress: 42, issue: "No active tasks, team reassignment needed" },
      ].map((proj, i) => (
        <div key={`watchlist-${i}`} className="p-5 rounded-xl border border-[#374151] bg-[#0B0E14] hover:border-[#3B82F6]/50 transition-all cursor-pointer relative flex flex-col justify-between h-40 group">
           <div>
             <div className="flex justify-between items-start mb-3">
               <h4 className="text-white font-bold text-[12px] uppercase tracking-wider">{proj.name}</h4>
               <Badge variant={proj.variant as any} className="!text-[8px]">{proj.status}</Badge>
             </div>
             <p className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-2">
               <TrendingDown size={14} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
               <span className="line-clamp-2">{proj.issue}</span>
             </p>
           </div>
           <div className="flex justify-between items-end gap-4 mt-2">
              <ProgressBar value={proj.progress} label="Team Velocity" colorClass="bg-[#EF4444]" />
              <div className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#374151] text-slate-400 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all flex-shrink-0 mb-0.5">
                <ArrowUpRight size={14} />
              </div>
           </div>
        </div>
      ))}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-[#374151] hover:border-[#3B82F6] hover:bg-[#1F2937]/50 transition-all cursor-pointer group">
         <div className="w-10 h-10 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center text-slate-400 group-hover:text-white transition-all mb-3">
           <ArrowUpRight size={18} />
         </div>
         <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider group-hover:text-white transition-colors">View All</span>
      </div>
    </div>
  </SurfaceCard>
);
