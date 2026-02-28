import React, { useState } from 'react';
import { useBoard } from '../controllers/useBoard';
import { useTasks } from '../controllers/useTasks';
import { useMeetings } from '../controllers/useMeetings';
import { useBuckets } from '../controllers/useBuckets';
import { useDashboard } from '../controllers/useDashboard';
import { LayoutDashboard, Briefcase, Video, Settings, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { ProjectOverviewPM, ProjectOverviewDev } from '../components/dashboard/ProjectOverviews';
import { ProjectSettingsTab } from '../components/dashboard/ProjectSettingsTab';
import { MeetingAccordion } from '../components/dashboard/MeetingAccordion';
import { MeetingIntelligenceTab } from '../components/dashboard/MeetingIntelligenceTab';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskDetailModal } from '../components/modals/TaskDetailModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { TaskFormModal } from '../components/modals/TaskFormModal';
import { MeetingFormModal } from '../components/modals/MeetingFormModal';
import { useAuth } from '../auth/useAuth';
import { useCurrentUserRole } from '../controllers/useCurrentUserRole';
import { useProjectMembers } from '../controllers/useProjectMembers';
import { projectService } from '../services/projectService';
import { useNavigate } from 'react-router-dom';

import type { TaskType, Project, Task, BucketState } from '../models';

interface ProjectDetailsProps {
  projectId: string | number;
}

const STATUS_COLORS: Record<BucketState, string> = {
  'DRAFT': 'bg-slate-500',
  'PENDING': 'bg-[#F59E0B]',
  'TODO': 'bg-[#3B82F6]',
  'ONGOING': 'bg-[#16A34A]',
  'ON_REVIEW': 'bg-[#8B5CF6]',
  'COMPLETED': 'bg-slate-400',
};

export const ProjectDetailsPage: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedBucketTarget, setSelectedBucketTarget] = useState<number | string | undefined>(undefined);
  const [bucketToDelete, setBucketToDelete] = useState<number | string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  React.useEffect(() => {
    projectService.getProjectById(projectId).then(p => setProject(p || null));
  }, [projectId]);

  const { user } = useAuth();
  const dbUserId = user?.db_user?.id;

  const { role, loading: roleLoading } = useCurrentUserRole(projectId, dbUserId);
  
  const isManager = role?.toUpperCase() === 'MANAGER' || role?.toUpperCase() === 'OWNER';
  const { members } = useProjectMembers(projectId);
  // useBoard: single request for both buckets and tasks (strict data contract)
  const { buckets, tasks, loading: boardLoading, refreshBoard } = useBoard(projectId);
  const { refreshDashboard } = useDashboard(projectId);
  // Keep mutation hooks — they still POST/PUT/DELETE via the original endpoints
  const { createBucket, reorderBuckets, deleteBucket } = useBuckets(projectId);
  const { createTask, updateTask, deleteTask, reorderTasks } = useTasks(projectId);
  const { meetings, loading: meetingsLoading, createMeeting, deleteMeeting } = useMeetings(projectId);

  const bucketsLoading = boardLoading;
  const tasksLoading = boardLoading;

  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketState, setNewBucketState] = useState<BucketState>('TODO');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);

  const handleCreateTask = async (data: { project_id: number | string; title: string; type: TaskType; weight: number; bucket_id?: number | string }) => {
    await createTask(data);
    await Promise.all([refreshBoard(true), refreshDashboard(true)]);
  };

  const handleUpdateTask = async (taskId: number | string, data: Partial<Task>) => {
    await updateTask(taskId, data);
    await Promise.all([refreshBoard(true), refreshDashboard(true)]);
  };

  const handleDropTask = async (taskId: number | string, newBucketId: number | string, targetTaskId?: number | string) => {
    // Determine the task order within the target bucket based on where it was dropped
    const bucketTasks = tasks.filter(t => String(t.bucket_id) === String(newBucketId)).sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
    const draggedTask = tasks.find(t => String(t.id) === String(taskId));
    if (!draggedTask) return;

    // Filter out the dragged task to avoid self-collision
    const filteredTasks = bucketTasks.filter(t => String(t.id) !== String(taskId));

    // Calculate new position
    let newIndex = filteredTasks.length; // Default to end
    if (targetTaskId) {
      const targetIndex = filteredTasks.findIndex(t => t.id === targetTaskId);
      if (targetIndex !== -1) {
        newIndex = targetIndex;
      }
    }

    // Insert into new array
    filteredTasks.splice(newIndex, 0, draggedTask);

    // Build reordered IDs
    const taskIds = filteredTasks.map(t => t.id!);

    await reorderTasks(newBucketId, taskIds);
    await Promise.all([refreshBoard(true), refreshDashboard(true)]);
  };

  const handleCreateMeeting = async (data: { project_id: number | string; title: string; date: string; time: string; duration?: string }) => {
    await createMeeting(data);
  };

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return;
    try {
      await createBucket(newBucketName.trim(), newBucketState);
      setNewBucketName('');
      setNewBucketState('TODO');
      setIsCreatingBucket(false);
      await Promise.all([refreshBoard(true), refreshDashboard(true)]);
    } catch (e) {
      console.error(e);
      alert('Failed to create bucket');
    }
  };

  const handleDragStartColumn = (e: React.DragEvent<HTMLDivElement>, columnId: string | number) => {
    e.dataTransfer.setData('columnId', columnId.toString());
  };

  const handleDropColumn = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: string | number) => {
    e.stopPropagation();
    const draggedColumnId = e.dataTransfer.getData('columnId');
    if (!draggedColumnId || String(draggedColumnId) === String(targetColumnId)) return;

    const oldIndex = buckets.findIndex(b => String(b.id) === String(draggedColumnId));
    const newIndex = buckets.findIndex(b => String(b.id) === String(targetColumnId));

    if (oldIndex === -1 || newIndex === -1) return;

    const newBuckets = [...buckets];
    const [removed] = newBuckets.splice(oldIndex, 1);
    newBuckets.splice(newIndex, 0, removed);

    // Call reorder api with new IDs
    await reorderBuckets(newBuckets.map(b => b.id!));
    await Promise.all([refreshBoard(true), refreshDashboard(true)]);
  };
 
  const tabs = isManager 
    ? ['Overview', 'Tasks', 'MoM & Meetings', 'Settings'] 
    : ['Overview', 'Tasks', 'MoM & Meetings'];

  const isLoading = roleLoading || boardLoading || meetingsLoading;
 
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-[14px] min-h-[400px]">
        Syncing permissions & data...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg bg-[#151A22] border border-[#374151] flex items-center justify-center text-slate-400 hover:text-white"
        >
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
            className={`px-4 py-2 text-[12px] font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-[#3B82F6] text-white' : 'text-slate-400 hover:text-white'
              }`}
          >
            {tab === 'Overview' && <LayoutDashboard size={14} />}
            {tab === 'Tasks' && <Briefcase size={14} />}
            {tab === 'MoM & Meetings' && <Video size={14} />}
            {tab === 'Settings' && <Settings size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {/* Overview */}
        {activeTab === 'Overview' && (
          roleLoading ? <div className="text-slate-500 py-10 text-center">Resolving permissions...</div> :
            isManager ? <ProjectOverviewPM projectId={projectId} /> : (
              <ProjectOverviewDev 
                projectId={projectId} 
                tasks={tasks} 
                buckets={buckets} 
                onDropTask={handleDropTask}
              />
            )
        )}

        {/* Tasks — Kanban */}
        {activeTab === 'Tasks' && (
          <div className="bg-[#151A22] border border-[#374151] rounded-xl p-6 flex flex-col min-h-[600px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-white">Task Flow Pipeline</h2>
                <p className="text-[12px] text-slate-400 mt-1">6-Stage Flow System • DRAFT → COMPLETED</p>
              </div>
            </div>

            {tasksLoading || bucketsLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-[14px]">Loading board state...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 flex-1 no-scrollbar items-start">
                {buckets.map(bucket => {
                  const colTasks = tasks.filter(t => String(t.bucket_id) === String(bucket.id));
                  return (
                    <KanbanColumn
                      key={bucket.id}
                      id={bucket.id!}
                      name={bucket.name || bucket.state}
                      colorClass={STATUS_COLORS[bucket.state] || 'bg-slate-500'}
                      statusText="ACTIVE"
                      taskCount={colTasks.length}
                      onDropTask={handleDropTask}
                      onDragStartColumn={handleDragStartColumn}
                      onDropColumn={handleDropColumn}
                      onAddTask={(bId) => { setSelectedBucketTarget(bId); setShowTaskModal(true); }}
                      onDeleteBucket={(bId) => setBucketToDelete(bId)}
                    >
                      {colTasks.map(task => (
                        <div key={task.id} className="relative group/card">
                          <KanbanCard
                            id={task.id!}
                            title={task.title}
                            type={task.type}
                            weight={task.weight}
                            assignee={task.lead_assignee_id ? 'JD' : undefined}
                            pr={!!task.prUrl}
                            description={task.description}
                            warnStagnant={task.warnStagnant}
                            isSuggested={task.isSuggested}
                            onClick={() => setSelectedTaskForEdit(task)}
                            onDropTask={(draggedTaskId, targetTaskId) => handleDropTask(draggedTaskId, bucket.id!, targetTaskId)}
                          />
                          <button
                            onClick={async () => { await deleteTask(task.id!); await Promise.all([refreshBoard(true), refreshDashboard(true)]); }}
                            className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 p-1 rounded bg-[#1F2937] text-slate-500 hover:text-[#EF4444] transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </KanbanColumn>

                  );
                })}

                {/* Add New Bucket Column */}
                <div className="min-w-[280px] w-[280px]">
                  {!isCreatingBucket ? (
                    <button
                      onClick={() => setIsCreatingBucket(true)}
                      className="w-full h-12 border border-dashed border-[#374151] rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-[#3B82F6] hover:bg-[#151A22] transition-all text-[13px] font-semibold"
                    >
                      <Plus size={16} /> Add Column
                    </button>
                  ) : (
                    <div className="border border-[#3B82F6] rounded-xl bg-[#151A22] p-3 space-y-3">
                      <input
                        type="text"
                        autoFocus
                        value={newBucketName}
                        onChange={e => setNewBucketName(e.target.value)}
                        placeholder="Column Name"
                        className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#3B82F6] focus:outline-none"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Behavior State</label>
                        <select
                          value={newBucketState}
                          onChange={(e) => setNewBucketState(e.target.value as BucketState)}
                          className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#3B82F6] focus:outline-none appearance-none"
                        >
                          <option value="DRAFT">DRAFT (AI Suggestions)</option>
                          <option value="PENDING">PENDING (Approval Needed)</option>
                          <option value="TODO">TODO (Task Queue)</option>
                          <option value="ONGOING">ONGOING (Active Work)</option>
                          <option value="ON_REVIEW">ON_REVIEW (Testing/QA)</option>
                          <option value="COMPLETED">COMPLETED (Finished)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCreateBucket}
                          disabled={!newBucketName.trim()}
                          className="flex-1 bg-[#3B82F6] text-white text-[12px] font-bold py-1.5 rounded-lg hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setIsCreatingBucket(false); setNewBucketName(''); setNewBucketState('TODO'); }}
                          className="flex-1 bg-[#1F2937] text-white text-[12px] font-bold py-1.5 rounded-lg hover:bg-[#374151] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MoM & Meetings */}
        {activeTab === 'MoM & Meetings' && (
          <div className="space-y-6">
            <MeetingIntelligenceTab
              projectId={projectId}
              onMeetingCreated={createMeeting}
            />

            <SurfaceCard
              title="Historical Meetings"
              subtitle={`${meetings.length} Past Sessions`}
              icon={Video}
              rightElement={null}
            >
              {meetingsLoading ? (
                <div className="text-slate-500 text-[13px] text-center py-8">Loading meetings...</div>
              ) : meetings.length === 0 ? (
                <div className="text-slate-500 text-[13px] text-center py-12 border border-dashed border-[#374151] rounded-xl">
                  No meeting history.
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((mtg, idx) => (
                    <div key={mtg.id} className="relative group/mtg">
                      <MeetingAccordion meeting={mtg} isDefaultExpanded={idx === 0} />
                      <button
                        onClick={() => deleteMeeting(mtg.id!)}
                        className="absolute top-3 right-10 opacity-0 group-hover/mtg:opacity-100 p-1.5 rounded-lg bg-[#1F2937] text-slate-500 hover:text-[#EF4444] transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'Settings' && (
          <ProjectSettingsTab projectId={projectId} />
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskFormModal
          projectId={projectId}
          title="New Task"
          initial={{ bucket_id: selectedBucketTarget }}
          onClose={() => { setShowTaskModal(false); setSelectedBucketTarget(undefined); }}
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
      {selectedTaskForEdit && (
        <TaskDetailModal
          task={selectedTaskForEdit}
          buckets={buckets}
          members={members}
          onClose={() => setSelectedTaskForEdit(null)}
          onUpdate={handleUpdateTask}
        />
      )}

      {bucketToDelete && (
        <ConfirmModal
          title="Delete Column"
          message="Are you sure you want to delete this column? This action cannot be undone and only works if the column is empty."
          confirmLabel="Delete Column"
          onConfirm={async () => {
            try {
              await deleteBucket(bucketToDelete);
              setBucketToDelete(null);
              await Promise.all([refreshBoard(true), refreshDashboard(true)]);
            } catch (err) {
              setBucketToDelete(null);
            }
          }}
          onCancel={() => setBucketToDelete(null)}
          variant="danger"
        />
      )}
    </div>
  );
};
