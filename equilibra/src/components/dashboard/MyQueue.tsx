import React from 'react';
import { Target, Play, Code, GitMerge } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { taskService } from '../../services/taskService';

// Represents the current user's ID in mock — matches mockUsers[0]
const CURRENT_USER_ID = 1;

const TYPE_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'default'> = {
  CODE:        'primary',
  'NON-CODE':  'default',
  DESIGN:      'warning',
  REQUIREMENT: 'success',
};

export const MyQueue: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [tasks, setTasks] = React.useState<Awaited<ReturnType<typeof taskService.getMyTasks>>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    taskService.getMyTasks(CURRENT_USER_ID).then(t => {
      setTasks(t.filter(task => task.status !== 'COMPLETED'));
      setLoading(false);
    });
  }, []);

  return (
    <SurfaceCard title="My Queue" icon={Target} className={className} rightElement={tasks.length > 0 ? <Badge variant="primary">{tasks.length}</Badge> : null}>
      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2 min-h-0">
        {loading ? (
          <div className="text-slate-500 text-[12px] py-4 text-center">Loading queue...</div>
        ) : tasks.length === 0 ? (
          <div className="text-slate-500 text-[12px] py-8 text-center border border-dashed border-[#374151] rounded-xl">
            Queue is empty. No tasks assigned to you.
          </div>
        ) : tasks.map(task => (
          <div key={task.id} className="p-3.5 rounded-xl bg-[#151A22] border border-[#374151] hover:border-[#3B82F6]/50 transition-all group flex justify-between items-center">
            <div>
              <div className="flex gap-2 mb-1.5 flex-wrap">
                <Badge variant={TYPE_VARIANTS[task.type] ?? 'default'} className="!py-0.5 !px-1.5 !text-[8px]">
                  {task.type === 'CODE' ? <Code size={8} /> : <GitMerge size={8} />}
                  {task.type}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">EQ-{task.id}</span>
              </div>
              <h5 className="text-white text-[13px] font-semibold line-clamp-1">{task.title}</h5>
              <p className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider">{task.status}</p>
            </div>
            <Button variant="success" className="!p-2 flex-shrink-0">
              <Play size={14} />
            </Button>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
};
