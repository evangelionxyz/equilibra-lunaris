import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../design-system/Badge';

interface KanbanColumnProps {
  name: string;
  colorClass: string;
  description: string;
  statusText: string;
  taskCount: number;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  name,
  colorClass,
  description,
  statusText,
  taskCount,
  children
}) => (
  <div className="min-w-[280px] w-[280px] bg-[#0B0E14] border border-[#374151] rounded-xl flex flex-col max-h-full">
     <div className="p-4 border-b border-[#374151]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full opacity-20 flex items-center justify-center ${colorClass.replace('bg-', 'text-')}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}/>
            </div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">{name}</h3>
          </div>
          <span className="w-5 h-5 rounded-full bg-[#1F2937] text-slate-400 flex items-center justify-center text-[10px] font-bold">{taskCount}</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">{description}</p>
        <Badge variant={statusText === 'RUNNING' ? 'success' : statusText === 'PAUSED' ? 'warning' : 'default'} className="!text-[8px] !py-0.5">
          <CheckCircle2 size={10}/> {statusText}
        </Badge>
     </div>
     <div className="p-3 overflow-y-auto space-y-3 no-scrollbar flex-1">
        {children}
     </div>
  </div>
);
