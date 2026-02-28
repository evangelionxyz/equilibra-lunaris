import React from 'react';
import {
  AlertCircle,
  ChevronRight,
  Users,
  TrendingDown,
  GitPullRequest,
  Clock,
  Zap,
  Target,
  GitBranch
} from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { ProgressBar } from '../../design-system/ProgressBar';
import { useAlerts } from '../../controllers/useAlerts';
import { useDashboard } from '../../controllers/useDashboard';
import { useTasks } from '../../controllers/useTasks';
import { useUserProjectStats } from '../../controllers/useUserProjectStats';
import { useAuth } from '../../auth/useAuth';

import { Skeleton } from '../../design-system/Skeleton';
import type { Task, Bucket } from '../../models';

interface ProjectOverviewProps {
  projectId: string | number;
}

interface ProjectOverviewDevProps extends ProjectOverviewProps {
  tasks: Task[];
  buckets: Bucket[];
  onDropTask: (taskId: string | number, newBucketId: string | number, targetTaskId?: string | number) => Promise<void>;
}

export const ProjectOverviewPM: React.FC<ProjectOverviewProps> = ({ projectId }) => {
  const { alerts, loading: alertsLoading } = useAlerts(projectId);
  const { metrics, members, activity, loading: dashboardLoading } = useDashboard(projectId);
  const { tasks, loading: tasksLoading } = useTasks(projectId);

  const activities = activity; // Alias for consistency in the template

  const criticalInsights = alerts.filter(a => a.severity === 'critical').slice(0, 3);
  const tasksAtRisk = tasks.filter(t => t.warnStagnant || t.status === 'ON_REVIEW').slice(0, 3);

  const getTimeAgo = (dateStr: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isLoading = alertsLoading || dashboardLoading || tasksLoading;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Dynamic Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="lg:col-span-4">
              <SurfaceCard className="h-full border-[#374151]/30 bg-[#1F2937]/5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton variant="circle" width={20} height={20} />
                  <Skeleton width="60%" height={16} />
                </div>
                <div className="space-y-2 mb-6">
                  <Skeleton width="100%" height={12} />
                  <Skeleton width="80%" height={12} />
                </div>
                <Skeleton width="30%" height={10} />
              </SurfaceCard>
            </div>
          ))
        ) : (
          criticalInsights.map((alert) => (
            <div key={alert.id!} className="lg:col-span-4">
              <SurfaceCard className={`h-full ${alert.severity === 'critical' ? 'border-[#EF4444]/30 bg-[#EF4444]/5' : 'border-[#F59E0B]/30 bg-[#F59E0B]/5'}`}>
                <div className={`flex items-center gap-3 mb-2 ${alert.severity === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  <AlertCircle size={18} />
                  <h4 className="font-bold text-[14px]">{alert.title}</h4>
                </div>
                <p className="text-slate-300 text-[12px] leading-relaxed mb-4 line-clamp-2">{alert.description}</p>
                <button className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline ${alert.severity === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  View Details <ChevronRight size={12} />
                </button>
              </SurfaceCard>
            </div>
          ))
        )}
        {!isLoading && criticalInsights.length === 0 && (
          <div className="lg:col-span-12 text-slate-500 text-[12px] py-8 text-center border border-dashed border-[#374151] rounded-xl bg-[#151A22]">
            No critical insights at this time.
          </div>
        )}
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-4">
          <SurfaceCard title="Tasks at Risk" subtitle="Detect tasks to nudge" rightElement={isLoading ? <Skeleton width={40} height={18} /> : <Badge variant="primary">{tasksAtRisk.length} Detected</Badge>} className="h-full">
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[300px] pr-1">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#1F2937] border border-[#374151]">
                    <Skeleton variant="circle" width={12} height={12} />
                    <div className="flex-1">
                      <Skeleton width="80%" height={12} className="mb-1" />
                      <Skeleton width="40%" height={8} />
                    </div>
                  </div>
                ))
              ) : (
                tasksAtRisk.map((task) => (
                  <div key={task.id!} className="flex items-center gap-3 p-3 rounded-lg bg-[#1F2937] border border-[#374151] cursor-pointer hover:border-[#3B82F6] transition-colors">
                    <div className={`w-3 h-3 rounded-full border-2 ${task.warnStagnant ? 'border-[#EF4444]' : 'border-[#F59E0B]'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[12px] font-semibold truncate">{task.title}</p>
                      <p className="text-slate-400 text-[10px]">{task.type}</p>
                    </div>
                  </div>
                ))
              )}
              {!isLoading && tasksAtRisk.length === 0 && <p className="text-slate-500 text-[11px] text-center py-4">All tasks on track.</p>}
            </div>
            {!isLoading && tasksAtRisk.length > 0 && <Button variant="outline" className="w-full mt-4 !text-[10px] !py-2 bg-[#1F2937]">Nudge Selected</Button>}
          </SurfaceCard>
        </div>
        <div className="lg:col-span-8">
          <SurfaceCard title="Stagnation Radar" subtitle="Granular Bottleneck Analysis" icon={TrendingDown} className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-2">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton width="40%" height={12} />
                      <Skeleton width="15%" height={14} />
                    </div>
                    <Skeleton width="30%" height={32} className="mb-2" />
                    <Skeleton width="100%" height={8} className="mb-2" />
                    <Skeleton width="50%" height={10} />
                  </div>
                ))
              ) : (
                metrics.map(m => (
                  <div key={m.id!}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-[12px] font-bold uppercase tracking-wider">{m.label}</span>
                      <Badge variant={m.status as "success" | "warning" | "critical" | "primary" | "default" | "outline"} className="!text-[8px] uppercase">{m.status}</Badge>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-[32px] text-white font-bold leading-none">{m.value.replace(/[^0-9]/g, '')}<span className="text-[16px] text-slate-500 font-medium ml-1">{m.value.replace(/[0-9]/g, '')}</span></span>
                    </div>
                    <ProgressBar value={m.progress} colorClass={m.status === 'critical' ? 'bg-[#EF4444]' : m.status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'} label="" />
                    <p className="text-slate-400 text-[10px] mt-1 font-medium">{m.target_label}</p>
                  </div>
                ))
              )}
              {!isLoading && metrics.length === 0 && <div className="col-span-2 text-slate-500 text-[12px] text-center py-8">No metrics available.</div>}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Capacity & Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8">
          <SurfaceCard title="Workload Distribution" subtitle="Team Capacity" icon={Users} className="h-full">
            <div className="flex items-end justify-between h-40 mt-6 gap-2">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <Skeleton width="100%" height={50 + (i * 10) % 40} className="rounded-t-sm" />
                    <Skeleton width="60%" height={8} className="mt-2" />
                    <Skeleton width="40%" height={8} className="mt-1" />
                  </div>
                ))
              ) : (
                members.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-[#1F2937] rounded-t-sm h-32 relative overflow-hidden">
                      <div className={`absolute bottom-0 left-0 right-0 ${m.current_load > 100 ? 'bg-[#EF4444]' : m.current_load > 80 ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'} transition-all`} style={{ height: `${m.current_load > 100 ? 100 : m.current_load}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider truncate w-full text-center">User {m.user_id}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${m.current_load > 100 ? 'text-[#EF4444]' : 'text-slate-300'}`}>{m.current_load}%</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-[#374151] flex justify-between">
              <div className="text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Load</p>
                {isLoading ? <Skeleton width={40} height={20} /> : (
                  <p className="text-white font-bold text-[14px]">
                    {members.length ? Math.round(members.reduce((acc, m) => acc + m.current_load, 0) / members.length) : 0}%
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Overloaded</p>
                {isLoading ? <Skeleton width={40} height={20} /> : (
                  <p className="text-[#EF4444] font-bold text-[14px]">
                    {members.filter(m => m.current_load > 100).length} <span className="text-[10px] text-slate-500">MEMBER</span>
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Balance</p>
                {isLoading ? <Skeleton width={40} height={20} /> : (
                  <p className={`${members.filter(m => m.current_load > 100).length > 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'} font-bold text-[14px]`}>
                    {members.filter(m => m.current_load > 100).length > 0 ? 'POOR' : 'FAIR'}
                  </p>
                )}
              </div>
            </div>
          </SurfaceCard>
        </div>
        <div className="lg:col-span-4">
          <SurfaceCard title="Project Pulse" subtitle="Activity Feed" className="h-full">
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[300px] pr-1">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton variant="circle" width={6} height={6} className="mt-1.5" />
                    <div className="flex-1">
                      <Skeleton width="50%" height={12} className="mb-1" />
                      <Skeleton width="90%" height={10} className="mb-1" />
                      <Skeleton width="30%" height={8} />
                    </div>
                  </div>
                ))
              ) : (
                activities.map((act) => (
                  <div key={act.id!} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
                    <div className="text-slate-400 text-[12px] min-w-0 flex-1">
                      <span className="text-white font-semibold truncate block">{act.user_name}</span>
                      <span className="text-[11px] block mt-0.5">{act.action} <span className="text-[#3B82F6] font-semibold">{act.target}</span></span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold mt-1 block">{getTimeAgo(act.created_at!)}</span>
                    </div>
                  </div>
                ))
              )}
              {!isLoading && activities.length === 0 && <div className="text-slate-500 text-[12px] text-center py-8">No recent activity.</div>}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
};

export const ProjectOverviewDev: React.FC<ProjectOverviewDevProps> = ({
  projectId,
  tasks,
  buckets,
  onDropTask
}) => {
  const { user } = useAuth();
  const { activity: activities } = useDashboard(projectId);
  const { stats } = useUserProjectStats(projectId);

  const myUserId = user?.db_user?.id;

  // Find which tasks are in which buckets based on state
  const getTasksByBucketState = (state: string) => {
    const bucketIds = buckets.filter(b => b.state === state).map(b => String(b.id));
    return tasks.filter(t => bucketIds.includes(String(t.bucket_id)) && String(t.lead_assignee_id) === String(myUserId));
  };

  const activeTask = getTasksByBucketState('ONGOING')[0];
  const myReviewTasks = getTasksByBucketState('ON_REVIEW');
  const myQueueTasks = getTasksByBucketState('TODO').slice(0, 3);

  const handleStartWork = async (taskId: string | number) => {
    const ongoingBucket = buckets.find(b => b.state === 'ONGOING');
    if (!ongoingBucket) return;
    await onDropTask(taskId, ongoingBucket.id!);
  };


  const getTimeAgo = (dateStr: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      <div className="lg:col-span-8 space-y-6">
        {activeTask ? (
          <SurfaceCard className="p-8 border-[#3B82F6]/30">
            <Badge variant="primary" className="mb-4">IN FLOW • Active Now</Badge>
            <h2 className="text-[28px] text-white font-bold mb-3">{activeTask.title}</h2>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-6">
              {activeTask.description || "Project task currently under development. Work in progress."}
            </p>
            <div className="flex items-center gap-3 bg-[#1F2937] border border-[#374151] px-4 py-2.5 rounded-lg w-fit mb-8">
              <GitPullRequest className="text-[#3B82F6]" size={16} />
              <span className="text-[12px] text-slate-300 font-mono font-semibold">{activeTask.branch_name || 'no-branch'}</span>
              <div className="w-px h-4 bg-[#374151] mx-2" />
              <Clock className="text-slate-400" size={14} />
              <span className="text-[12px] text-slate-400 font-medium">Started {activeTask.last_activity_at ? getTimeAgo(String(activeTask.last_activity_at)) : 'Recently'}</span>
            </div>
            <div className="flex gap-4">
              <Button variant="success" onClick={() => handleStartWork(activeTask.id!)}><GitBranch size={16} /> Ready to Code</Button>
              <Button variant="outline" className="text-[#EF4444] border-[#EF4444]/30"><AlertCircle size={16} /> Report Blocker</Button>
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard className="p-12 border-dashed flex flex-col items-center justify-center text-center">
            <Zap className="text-slate-600 mb-4" size={48} />
            <h3 className="text-white font-bold text-[18px]">Ready to start?</h3>
            <p className="text-slate-400 text-[14px] mt-2 mb-6">You don't have an active task for this project.</p>
            {myQueueTasks.length > 0 && (
              <Button variant="primary" onClick={() => handleStartWork(myQueueTasks[0].id!)}>Ready to Code: {myQueueTasks[0].title}</Button>
            )}
            {myQueueTasks.length === 0 && (
              <p className="text-slate-500 text-[12px]">No tasks assigned to you in the queue.</p>
            )}
          </SurfaceCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SurfaceCard title="PR Status" subtitle="In Review" icon={GitPullRequest}>
            <div className="space-y-3">
              {myReviewTasks.map(task => (
                <div key={task.id!} className="bg-[#1F2937] border border-[#374151] p-3 rounded-lg flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <Badge variant="primary" className="!text-[8px] mb-1">Open PR</Badge>
                    <p className="text-white text-[11px] font-mono truncate">{task.title}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex-shrink-0 ml-2">Active</span>
                </div>
              ))}
              {myReviewTasks.length === 0 && <div className="text-slate-500 text-[11px] text-center py-8">No PRs in review.</div>}
            </div>
          </SurfaceCard>
          <SurfaceCard title="Team Pulse" subtitle="Recent Activity" icon={TrendingDown}>
            <div className="space-y-4">
              {activities.slice(0, 3).map((act: { id?: string | number; user_name?: string; action?: string; target?: string }) => (
                <div key={act.id!} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
                  <div className="text-slate-400 text-[12px] min-w-0 flex-1">
                    <span className="text-white font-semibold truncate block">{act.user_name}</span>
                    <span className="text-[11px] block mt-0.5">{act.action} <span className="text-[#3B82F6] font-semibold">{act.target}</span></span>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <div className="text-slate-500 text-[12px] text-center py-8">No recent activity.</div>}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <SurfaceCard title="My Velocity" subtitle="Sprint Contribution" icon={Zap}>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-[32px] font-bold text-white leading-none">{stats?.points_completed || 0}</span>
            <span className="text-[12px] text-slate-400 font-medium pb-1">points done</span>
          </div>
          <ProgressBar value={stats?.velocity_percentile || 0} label="" colorClass="bg-[#22C55E]" />
          <p className="text-right text-[10px] text-[#22C55E] font-bold mt-1 uppercase">Top {100 - (stats?.velocity_percentile || 0)}% in team</p>
        </SurfaceCard>

        <SurfaceCard title="My Queue" subtitle="Up Next" icon={Target} rightElement={<Badge>{myQueueTasks.length} Pending</Badge>}>
          <div className="space-y-3">
            {myQueueTasks.map((t) => (
              <div
                key={t.id!}
                className="p-3 rounded-lg bg-[#1F2937] border border-[#374151] flex flex-col gap-1 hover:border-[#3B82F6] transition-colors cursor-pointer"
                onClick={() => handleStartWork(t.id!)}
              >
                <div className="flex justify-between items-center">
                  <Badge variant={t.weight > 5 ? 'warning' : 'default'} className="!py-0 !px-1.5 !text-[8px]">{t.type}</Badge>
                  <span className="text-[10px] text-slate-400"><Clock size={10} className="inline mr-1" />{t.weight} pts</span>
                </div>
                <h5 className="text-white text-[13px] font-semibold mt-1 truncate">{t.title}</h5>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-2 flex justify-between items-center">
                  <span>{t.bucket_id ? buckets.find(b => String(b.id) === String(t.bucket_id))?.state : 'TODO'}</span>
                  <div className="w-5 h-5 rounded-full bg-[#1F2937] border border-[#374151] text-white flex items-center justify-center text-[8px] font-bold">ME</div>
                </div>
              </div>
            ))}
            {myQueueTasks.length === 0 && <div className="text-slate-500 text-[12px] text-center py-8">Queue is empty.</div>}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};
