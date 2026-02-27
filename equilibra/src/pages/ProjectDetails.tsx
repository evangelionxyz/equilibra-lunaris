import React, { useState } from 'react';
import { useTasks } from '../controllers/useTasks';
import { useMeetings } from '../controllers/useMeetings';
import { LayoutDashboard, Briefcase, Video, Settings, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { ProjectOverviewPM, ProjectOverviewDev } from '../components/dashboard/ProjectOverviews';
import { MeetingAccordion } from '../components/dashboard/MeetingAccordion';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { TaskFormModal } from '../components/modals/TaskFormModal';
import { MeetingFormModal } from '../components/modals/MeetingFormModal';
import { useCurrentUserRole } from '../controllers/useCurrentUserRole';
import { projectService } from '../services/mockService';
import type { TaskType, TaskStatus, Project } from '../models';

interface ProjectDetailsProps {
  projectId: number;
}

const KANBAN_COLUMNS = [
  { id: 'DRAFT',       name: 'DRAFT',       color: 'bg-slate-500',    desc: 'AI Output / PM Verify',  status: 'INACTIVE' },
  { id: 'PENDING',     name: 'PENDING',     color: 'bg-[#F59E0B]',    desc: 'Needs Assignee',          status: 'INACTIVE' },
  { id: 'TODO',        name: 'TODO',        color: 'bg-[#3B82F6]',    desc: 'Ready for Devs',          status: 'WAITING'  },
  { id: 'ONGOING',     name: 'ONGOING',     color: 'bg-[#16A34A]',    desc: 'Active Development',      status: 'RUNNING'  },
  { id: 'ON REVIEW',   name: 'ON REVIEW',   color: 'bg-[#8B5CF6]',    desc: 'GitHub PR Open',          status: 'PAUSED'   },
  { id: 'COMPLETED',   name: 'COMPLETED',   color: 'bg-slate-400',    desc: 'Merged & Done',           status: 'DONE'     },
] as const;

export const ProjectDetailsPage: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showTaskModal, setShowTaskModal]     = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  React.useEffect(() => {
    projectService.getProjectById(projectId).then(p => setProject(p || null));
  }, [projectId]);

  const { role, loading: roleLoading } = useCurrentUserRole(projectId);
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask }       = useTasks(projectId);
  const { meetings, loading: meetingsLoading, createMeeting, deleteMeeting } = useMeetings(projectId);

  const handleCreateTask = async (data: { project_id: number; title: string; type: TaskType; weight: number; status: TaskStatus }) => {
    await createTask(data);
  };

  const handleDropTask = async (taskId: number, newStatus: string) => {
    await updateTask(taskId, { status: newStatus as TaskStatus });
  };

  const handleCreateMeeting = async (data: { project_id: number; title: string; date: string; time: string; duration?: string }) => {
    await createMeeting(data);
  };

  const tabs = ['Overview', 'Tasks', 'MoM & Meetings', 'Settings'];

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button className="w-10 h-10 rounded-lg bg-[#151A22] border border-[#374151] flex items-center justify-center text-slate-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <div>
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest mb-1 block">Project Deep Dive</span>
          <h1 className="text-[28px] font-bold text-white leading-none">{project ? project.name : 'Loading...'}</h1>
          <p className="text-[12px] text-slate-400 mt-1">{project ? project.issue || "System operating normally." : '...'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#151A22] p-1.5 rounded-lg border border-[#374151] w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[12px] font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab ? 'bg-[#3B82F6] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'Overview'       && <LayoutDashboard size={14} />}
            {tab === 'Tasks'          && <Briefcase size={14} />}
            {tab === 'MoM & Meetings' && <Video size={14} />}
            {tab === 'Settings'       && <Settings size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {/* Overview */}
        {activeTab === 'Overview' && (
           roleLoading ? <div className="text-slate-500 py-10 text-center">Resolving permissions...</div> :
           role === 'MANAGER' ? <ProjectOverviewPM projectId={projectId} /> : <ProjectOverviewDev projectId={projectId} />
        )}

        {/* Tasks — Kanban */}
        {activeTab === 'Tasks' && (
          <div className="bg-[#151A22] border border-[#374151] rounded-xl p-6 flex flex-col min-h-[600px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-white">Task Flow Pipeline</h2>
                <p className="text-[12px] text-slate-400 mt-1">6-Stage Flow System • DRAFT → COMPLETED</p>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-[12px] font-semibold hover:bg-[#2563EB] transition-all"
              >
                <Plus size={14} /> New Task
              </button>
            </div>

            {tasksLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-[14px]">Loading board state...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 flex-1 no-scrollbar items-start">
                {KANBAN_COLUMNS.map(col => {
                  const colTasks = tasks.filter(t => t.status === col.id);
                  return (
                    <KanbanColumn
                      key={col.id}
                      id={col.id}
                      name={col.name}
                      colorClass={col.color}
                      description={col.desc}
                      statusText={col.status}
                      taskCount={colTasks.length}
                      onDropTask={handleDropTask}
                    >
                      {colTasks.map(task => (
                        <div key={task.id} className="relative group/card">
                          <KanbanCard
                            id={task.id}
                            title={task.title}
                            type={task.type}
                            weight={task.weight.toString() as any}
                            assignee={task.lead_assignee_id ? 'JD' : undefined}
                            pr={!!task.prUrl}
                            warnStagnant={task.warnStagnant}
                            isSuggested={task.isSuggested}
                          />
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 p-1 rounded bg-[#1F2937] text-slate-500 hover:text-[#EF4444] transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </KanbanColumn>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MoM & Meetings */}
        {activeTab === 'MoM & Meetings' && (
          <SurfaceCard
            title="Meetings & Minutes"
            subtitle={`${meetings.length} Meetings Recorded`}
            icon={Video}
            rightElement={
              <button
                onClick={() => setShowMeetingModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-[11px] font-semibold hover:bg-[#2563EB] transition-all"
              >
                <Plus size={12} /> Schedule Meeting
              </button>
            }
          >
            {meetingsLoading ? (
              <div className="text-slate-500 text-[13px] text-center py-8">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="text-slate-500 text-[13px] text-center py-12 border border-dashed border-[#374151] rounded-xl">
                No meetings recorded. <button onClick={() => setShowMeetingModal(true)} className="text-[#3B82F6] hover:underline">Schedule one.</button>
              </div>
            ) : meetings.map((mtg, idx) => (
              <div key={mtg.id} className="relative group/mtg">
                <MeetingAccordion meeting={mtg} isDefaultExpanded={idx === 0} />
                <button
                  onClick={() => deleteMeeting(mtg.id)}
                  className="absolute top-3 right-10 opacity-0 group-hover/mtg:opacity-100 p-1.5 rounded-lg bg-[#1F2937] text-slate-500 hover:text-[#EF4444] transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </SurfaceCard>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskFormModal
          projectId={projectId}
          title="New Task"
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
      {showMeetingModal && (
        <MeetingFormModal
          projectId={projectId}
          onClose={() => setShowMeetingModal(false)}
          onSubmit={handleCreateMeeting}
        />
      )}
    </div>
  );
};
