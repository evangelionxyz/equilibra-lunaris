import React from 'react';
import { Target, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

export const NotificationsPage: React.FC = () => (
  <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500 w-full">
     <div className="mb-8 border-b border-[#374151] pb-6">
       <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
         Notifications • Updates and Suggestion
       </span>
       <h1 className="text-[32px] font-bold text-white leading-tight">Notifications</h1>
       <p className="text-[14px] italic text-slate-400 mt-1">Tetap update dengan projectmu.</p>
     </div>

     <div className="flex gap-2 mb-6">
        <Button variant="primary">All</Button>
        <Button variant="outline">Unread</Button>
     </div>

     <div className="space-y-4">
       {[1,2,3].map((_, i) => (
         <div key={i} className="bg-[#151A22] border border-[#374151] p-6 rounded-2xl flex gap-6 items-center hover:bg-[#1F2937] transition-colors cursor-pointer">
           <div className="w-14 h-14 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] flex-shrink-0">
             <Target size={24}/>
           </div>
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-1">
                <Badge variant="critical" className="!py-0.5 !text-[8px]">Critical</Badge>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={10}/> 14h</span>
             </div>
             <h3 className="text-white font-bold text-[16px]">Stagnation Alert: Project Alpha</h3>
             <p className="text-slate-400 text-[12px] mt-0.5">Code review cycle for 'Auth Module' has exceeded 48 h.</p>
           </div>
           <Button variant="outline" className="!bg-transparent hover:!bg-[#374151]">View Radar <ArrowRight size={14}/></Button>
         </div>
       ))}
     </div>
  </div>
);
