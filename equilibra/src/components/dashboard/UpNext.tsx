import React from 'react';
import { Clock, MoreHorizontal } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';

export const UpNext: React.FC = () => (
  <SurfaceCard title="Up Next" icon={Clock} rightElement={<MoreHorizontal className="text-slate-500" size={16}/>}>
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] px-2.5 py-1 rounded text-[11px] font-bold font-mono">10:00</div>
        <div>
          <h5 className="text-white text-[13px] font-semibold">Sprint Planning</h5>
          <p className="text-slate-400 text-[10px] mt-0.5">Room 3A</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] px-2.5 py-1 rounded text-[11px] font-bold font-mono">14:30</div>
        <div>
          <h5 className="text-white text-[13px] font-semibold">Sprint Exec</h5>
          <p className="text-slate-400 text-[10px] mt-0.5">Room 3B</p>
        </div>
      </div>
    </div>
  </SurfaceCard>
);
