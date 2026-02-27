import React, { useState } from 'react';
import { useTasks } from '../controllers/useTasks';
import { mockMeetings } from '../services/mockData';
import { LayoutDashboard, Briefcase, Video, Settings, ChevronLeft } from 'lucide-react';
import { ProjectOverviewPM, ProjectOverviewDev } from '../components/dashboard/ProjectOverviews';
import { MeetingAccordion } from '../components/dashboard/MeetingAccordion';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { Button } from '../design-system/Button';
import { Plus } from 'lucide-react';

interface ProjectDetailsProps {
  role: 'PM' | 'DEV';
}

export const ProjectDetailsPage: React.FC<ProjectDetailsProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const { tasks, loading: tasksLoading } = useTasks(10);

  const kanbanColumns = [
    { id: 'DRAFT', name: 'DRAFT', color: 'bg-slate-500', desc: 'AI Output / PM Verify', status: 'INACTIVE' },
    { id: 'PENDING', name: 'PENDING', color: 'bg-[#F59E0B]', desc: 'Needs Assignee', status: 'INACTIVE' },
    { id: 'TODO', name: 'TODO', color: 'bg-[#3B82F6]', desc: 'Ready for Devs', status: 'WAITING' },
    { id: 'ONGOING', name: 'ONGOING', color: 'bg-[#16A34A]', desc: 'Active Development', status: 'RUNNING' },
    { id: 'ON REVIEW', name: 'ON REVIEW', color: 'bg-[#8B5CF6]', desc: 'GitHub PR Open', status: 'PAUSED' },
    { id: 'COMPLETED', name: 'COMPLETED', color: 'bg-slate-400', desc: 'Merged & Done', status: 'DONE' }
  ];

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button className="w-10 h-10 rounded-lg bg-[#151A22] border border-[#374151] flex items-center justify-center text-slate-400 hover:text-white">
          <ChevronLeft size={20}/>
        </button>
        <div>
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest mb-1 block">Project Deep Dive</span>
          <h1 className="text-[28px] font-bold text-white leading-none">Project Alpha</h1>
          <p className="text-[12px] text-slate-400 mt-1">Core banking system overhaul using microservices architecture.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#151A22] p-1.5 rounded-lg border border-[#374151] w-fit">
        {['Overview', 'Tasks', 'MoM & Meetings', 'Settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[12px] font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-[#3B82F6] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'Overview' && <LayoutDashboard size={14}/>}
            {tab === 'Tasks' && <Briefcase size={14}/>}
            {tab === 'MoM & Meetings' && <Video size={14}/>}
            {tab === 'Settings' && <Settings size={14}/>}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
         {activeTab === 'Overview' && (role === 'PM' ? <ProjectOverviewPM /> : <ProjectOverviewDev />)}
         
         {activeTab === 'Tasks' && (
           <div className="bg-[#151A22] border border-[#374151] rounded-xl p-6 flex flex-col min-h-[600px]">
              <div className="mb-6">
                 <h2 className="text-[18px] font-bold text-white">Task Flow Pipeline</h2>
                 <p className="text-[12px] text-slate-400 mt-1">6-Stage Flow System • DRAFT → PENDING → TODO → ONGOING → ON REVIEW → COMPLETED</p>
              </div>
              {tasksLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-[14px]">Loading board state...</div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 flex-1 no-scrollbar items-start">
                   {kanbanColumns.map((col, i) => {
                     const colTasks = tasks.filter(t => t.status === col.id);
                     return (
                       <KanbanColumn 
                         key={i} 
                         name={col.name} 
                         colorClass={col.color} 
                         description={col.desc} 
                         statusText={col.status} 
                         taskCount={colTasks.length}
                       >
                         {colTasks.map((k) => (
                           <KanbanCard 
                             key={k.id} 
                             title={k.title} 
                             type={k.type} 
                             weight={k.weight.toString() as any} 
                             assignee={k.lead_assignee_id ? "JD" : undefined} 
                             pr={!!k.prUrl} 
                             warnStagnant={k.warnStagnant} 
                             isSuggested={k.isSuggested} 
                           />
                         ))}
                       </KanbanColumn>
                     );
                   })}
                </div>
              )}
           </div>
         )}

         {activeTab === 'MoM & Meetings' && (
           <SurfaceCard title="Meetings & Minutes" subtitle={`${mockMeetings.length} Meetings Recorded`} icon={Video} rightElement={<Button variant="primary"><Plus size={14}/> Schedule Meeting</Button>}>
              {mockMeetings.map((mtg, idx) => (
                <MeetingAccordion key={mtg.id} meeting={mtg} isDefaultExpanded={idx === 0} />
              ))}
           </SurfaceCard>
         )}
      </div>
    </div>
  );
};
