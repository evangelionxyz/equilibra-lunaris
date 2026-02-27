import React, { useState } from 'react';
import { Badge } from '../../design-system/Badge';
import { Calendar, Clock, Target, FileText, ChevronRight, Download, CheckCircle2, Loader2, Plus } from 'lucide-react';

import type { Meeting } from '../../models';
import { useTasks } from '../../controllers/useTasks';
import { useToast } from '../../design-system/Toast';

interface MeetingProps {
  meeting: Meeting;
  isDefaultExpanded?: boolean;
}

export const MeetingAccordion: React.FC<MeetingProps> = ({ meeting, isDefaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  const { createTask } = useTasks(meeting.project_id);
  const { showToast } = useToast();
  const [syncingTasks, setSyncingTasks] = useState<Record<number, boolean>>({});
  const [syncedTasks, setSyncedTasks] = useState<Record<number, boolean>>({});

  const handleSyncTask = async (index: number, taskTitle: string) => {
    setSyncingTasks(prev => ({ ...prev, [index]: true }));
    try {
      await createTask({
        project_id: meeting.project_id,
        title: taskTitle,
        type: 'OTHER',
        weight: 5,
        status: 'DRAFT'
      });
      setSyncedTasks(prev => ({ ...prev, [index]: true }));
      showToast("Task created from history", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create task", "error");
    } finally {
      setSyncingTasks(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[#374151] bg-[#0B0E14] overflow-hidden transition-all duration-300">
       <div
         className="p-6 flex justify-between items-center bg-[#151A22] cursor-pointer hover:bg-[#1F2937] transition-colors"
         onClick={() => setIsExpanded(!isExpanded)}
       >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-[18px] font-bold text-white">{meeting.title}</h4>
              <Badge variant="primary">{meeting.source_type}</Badge>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-slate-400 font-medium">
               <span className="flex items-center gap-1.5"><Calendar size={14}/> {meeting.date}</span>
               <span className="flex items-center gap-1.5"><Clock size={14}/> {meeting.time} • {meeting.duration}</span>
               <div className="flex -space-x-2 ml-2">
                  {meeting.attendees?.map((att, i) => <div key={i} className="w-6 h-6 rounded-full bg-[#3B82F6] border border-[#151A22] flex items-center justify-center text-[8px] font-bold text-white">{att}</div>)}
               </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
             <button className="w-8 h-8 rounded-lg bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors" onClick={(e) => e.stopPropagation()} title="Open Recording">
               <Target size={14}/>
             </button>
             <button className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#22C55E] flex items-center justify-center hover:bg-[#16A34A]/20 transition-colors" onClick={(e) => e.stopPropagation()} title="Open Transcript">
               <FileText size={14}/>
             </button>
             <div className="w-px h-6 bg-[#374151] mx-2"></div>
             <button className="w-8 h-8 rounded-lg bg-[#1F2937] text-slate-400 flex items-center justify-center hover:text-white transition-colors">
               <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
             </button>
          </div>
       </div>
       
       {isExpanded && (
         <div className="p-8 bg-[#151A22] animate-in slide-in-from-top-2 fade-in duration-300 border-t border-[#374151]">
            <div className="flex justify-between items-center mb-6">
               <h5 className="text-[#22C55E] text-[12px] font-bold uppercase tracking-widest">Minutes of Meeting</h5>
               <button className="text-slate-400 hover:text-white"><Download size={16}/></button>
            </div>
           
            <div className="space-y-8">
               <section>
                  <h6 className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest mb-3">Key Points Discussed</h6>
                  <ul className="space-y-3 pl-2">
                     {meeting.mom_summary?.split('\n').map((pt, i) => (
                       <li key={i} className="text-[13px] text-slate-300 flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 flex-shrink-0"/>
                         <span className="leading-relaxed">{pt}</span>
                       </li>
                     ))}
                  </ul>
               </section>

               <section>
                  <h6 className="text-[#22C55E] text-[10px] font-bold uppercase tracking-widest mb-3">Decisions Made</h6>
                  <div className="space-y-2">
                     {meeting.key_decisions?.map((d: string, i: number) => (
                       <div key={i} className="flex items-center gap-3 text-[13px] text-slate-300">
                         <CheckCircle2 className="text-[#22C55E]" size={16} /> {d}
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <h6 className="text-[#F59E0B] text-[10px] font-bold uppercase tracking-widest mb-3">Action Items</h6>
                   <div className="space-y-3">
                      {meeting.action_items?.map((act, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-[#1F2937] border border-[#374151] group/item hover:border-[#3B82F6]/50 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[10px] font-bold">{act.initials}</div>
                              <div className="flex flex-col">
                                 <span className="text-[13px] font-bold text-white">{act.task}</span>
                                 <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={12}/> {act.deadline}</span>
                              </div>
                           </div>
                           
                           <button 
                             onClick={() => handleSyncTask(i, act.task)}
                             disabled={syncingTasks[i] || syncedTasks[i]}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm ${
                               syncedTasks[i] 
                               ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                               : 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 hover:bg-[#3B82F6] hover:text-white'
                             }`}
                           >
                              {syncingTasks[i] ? <Loader2 size={12} className="animate-spin" /> : syncedTasks[i] ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                              {syncingTasks[i] ? 'Syncing...' : syncedTasks[i] ? 'Synced' : 'Add to Board'}
                           </button>
                        </div>
                      ))}
                   </div>
               </section>
            </div>
         </div>
       )}
    </div>
  );
};
