import React from 'react';
import { Badge } from '../../design-system/Badge';
import { Clock, GitPullRequest, MoreHorizontal, UserCircle2 } from 'lucide-react';

interface KanbanCardProps {
  id: number;
  title: string;
  type: string;
  weight: string;
  assignee?: string;
  status?: string;
  warnStagnant?: boolean;
  isSuggested?: boolean;
  pr?: boolean;
  onDropTask?: (taskId: number, targetTaskId?: number) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  id,
  title,
  type,
  weight,
  assignee,
  warnStagnant,
  isSuggested,
  pr,
  onDropTask
}) => {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    if (onDropTask) {
      const draggedId = e.dataTransfer.getData('taskId');
      if (draggedId) {
        onDropTask(parseInt(draggedId, 10), id);
      }
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-4 rounded-xl bg-[#151A22] border group flex flex-col gap-3 shadow-sm ${isOver ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30' :
        warnStagnant ? 'border-[#EF4444]' : isSuggested ? 'border-[#F59E0B]' : 'border-[#374151] hover:border-[#3B82F6]'
        } transition-all cursor-grab active:cursor-grabbing`}
    >
      <div className="text-white text-[13px] font-semibold leading-snug">{title}</div>
      <p className="text-[10px] text-slate-400">Add theme switcher to user settings and sync with system preferences.</p>

      <div className="flex gap-2 flex-wrap mt-1">
        <Badge variant={type === 'CODE' ? 'primary' : 'default'} className="!py-0.5 !px-1.5 !text-[8px]">
          {type === 'CODE' ? 'FEATURE' : 'NON-CODE'}
        </Badge>
        <Badge variant="default" className="!py-0.5 !px-1.5 !text-[8px]">{weight}</Badge>
      </div>

      {warnStagnant && (
        <div className="mt-2 text-[#EF4444] text-[10px] font-bold flex items-center gap-1 bg-[#EF4444]/10 w-fit px-2 py-1 rounded">
          <Clock size={12} /> Last commit 2h ago
        </div>
      )}

      {pr && (
        <div className="mt-2 text-[#F59E0B] text-[10px] font-bold flex items-center gap-1 border border-[#F59E0B]/30 w-fit px-2 py-1 rounded">
          <GitPullRequest size={12} /> PR #42 • Waiting QA
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#374151] flex items-center justify-between">
        {assignee ? (
          <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-[10px] font-bold">{assignee}</div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-[#374151] flex items-center justify-center">
            <UserCircle2 size={12} className="text-slate-400" />
          </div>
        )}
        <MoreHorizontal size={14} className="text-slate-400" />
      </div>
    </div>
  );
};
