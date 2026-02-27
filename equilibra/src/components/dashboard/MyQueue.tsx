import React from 'react';
import { Target, Play, Code } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';

export const MyQueue: React.FC = () => (
  <SurfaceCard title="My Queue" icon={Target}>
    <div className="space-y-3">
      <div className="p-3.5 rounded-xl bg-[#1F2937] border border-[#374151] hover:border-[#3B82F6]/50 transition-all group flex justify-between items-center">
         <div>
            <div className="flex gap-2 mb-1.5">
              <Badge variant="primary" className="!py-0.5 !px-1.5 !text-[8px]"><Code size={8}/> CODE</Badge>
              <span className="text-[10px] text-slate-400 font-mono">EQ-104</span>
            </div>
            <h5 className="text-white text-[13px] font-semibold">Implement OAuth 2.0</h5>
         </div>
         <Button variant="success" className="!p-2"><Play size={14}/></Button>
      </div>
    </div>
  </SurfaceCard>
);
