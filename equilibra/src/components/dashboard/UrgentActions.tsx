import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';

export const UrgentActions: React.FC = () => (
  <SurfaceCard title="Urgent Action" icon={AlertCircle} rightElement={<Badge variant="critical">2 Items</Badge>}>
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-[#1F2937] border border-[#EF4444]/30 group cursor-pointer hover:border-[#EF4444] transition-colors flex justify-between items-center">
         <div>
           <Badge variant="critical" className="!py-0.5 !px-1.5 !text-[8px]">Kritis</Badge>
           <h5 className="text-white font-semibold text-[13px] mt-2">Refactor Auth</h5>
           <p className="text-slate-400 text-[10px] mt-0.5">Project Alpha</p>
         </div>
         <div className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-400 transition-all"><ChevronRight size={14} /></div>
      </div>
      <div className="p-4 rounded-xl bg-[#1F2937] border border-[#F59E0B]/30 group cursor-pointer hover:border-[#F59E0B] transition-colors flex justify-between items-center">
         <div>
           <Badge variant="warning" className="!py-0.5 !px-1.5 !text-[8px]">Atensi</Badge>
           <h5 className="text-white font-semibold text-[13px] mt-2">API Documentation</h5>
           <p className="text-slate-400 text-[10px] mt-0.5">Marketing AI</p>
         </div>
         <div className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-400 transition-all"><ChevronRight size={14} /></div>
      </div>
    </div>
  </SurfaceCard>
);
