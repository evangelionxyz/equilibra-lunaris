import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from '../../design-system/Badge';

interface KanbanColumnProps {
  id: number | string;
  name: string;
  colorClass: string;
  statusText: string;
  taskCount: number;
  onDropTask: (taskId: number | string, newBucketId: number | string, targetTaskId?: number | string) => void;
  onDragStartColumn?: (e: React.DragEvent<HTMLDivElement>, columnId: number | string) => void;
  onDropColumn?: (e: React.DragEvent<HTMLDivElement>, targetColumnId: number | string) => void;
  onAddTask?: (bucketId: number | string) => void;
  onDeleteBucket?: (bucketId: number | string) => void;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  name,
  colorClass,
  statusText,
  taskCount,
  onDropTask,
  onDragStartColumn,
  onDropColumn,
  onAddTask,
  onDeleteBucket,
  children
}) => {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsOver(false);
    const taskIdString = e.dataTransfer.getData('taskId');
    const columnIdString = e.dataTransfer.getData('columnId');

    if (taskIdString) {
      e.preventDefault();
      e.stopPropagation();
      onDropTask(taskIdString, id);
    } else if (columnIdString && onDropColumn) {
      e.preventDefault();
      e.stopPropagation();
      onDropColumn(e, columnIdString);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStartColumn) {
      onDragStartColumn(e, id);
    }
  };

  return (
    <div
      draggable={!!onDragStartColumn}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group min-w-[280px] w-[280px] border rounded-xl flex flex-col max-h-full transition-colors ${isOver ? 'bg-[#1F2937]/50 border-[#3B82F6]' : 'bg-[#0B0E14] border-[#374151]'
        }`}
    >
      <div className="p-4 border-b border-[#374151]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full opacity-20 flex items-center justify-center ${colorClass.replace('bg-', 'text-')}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
            </div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">{name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1F2937] text-slate-400 flex items-center justify-center text-[10px] font-bold">{taskCount}</span>
            {onDeleteBucket && (
              <button
                onClick={() => {
                  onDeleteBucket(id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-slate-500 hover:text-[#EF4444] transition-all"
                title="Delete column"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <Badge variant={statusText === 'RUNNING' ? 'success' : statusText === 'PAUSED' ? 'warning' : 'default'} className="!text-[8px] !py-0.5">
          <CheckCircle2 size={10} /> {statusText}
        </Badge>
      </div>
      <div className="p-3 overflow-y-auto space-y-3 no-scrollbar flex-1 relative min-h-[100px]">
        {children}
        <button
          onClick={() => onAddTask && onAddTask(id)}
          className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-slate-500 hover:text-white border border-dashed border-[#374151] hover:border-[#3B82F6] hover:bg-[#1F2937]/30 rounded-lg transition-all text-[12px] font-medium"
        >
          <span className="text-xl leading-none">+</span> Add Task
        </button>
      </div>
    </div>
  );
};
