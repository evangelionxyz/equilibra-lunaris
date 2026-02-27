import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../design-system/Badge';

interface KanbanColumnProps {
  id: string;
  name: string;
  colorClass: string;
  description: string;
  statusText: string;
  taskCount: number;
  onDropTask: (taskId: number, newStatus: string) => void;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  name,
  colorClass,
  description,
  statusText,
  taskCount,
  onDropTask,
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
    e.preventDefault();
    setIsOver(false);
    const taskIdString = e.dataTransfer.getData('taskId');
    if (taskIdString) {
      onDropTask(parseInt(taskIdString, 10), id);
    }
  };

  return (
  <div 
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`min-w-[280px] w-[280px] border rounded-xl flex flex-col max-h-full transition-colors ${
      isOver ? 'bg-[#1F2937]/50 border-[#3B82F6]' : 'bg-[#0B0E14] border-[#374151]'
    }`}
  >
     <div className="p-4 border-b border-[#374151]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full opacity-20 flex items-center justify-center ${colorClass.replace('bg-', 'text-')}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}/>
            </div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">{name}</h3>
          </div>
          <span className="w-5 h-5 rounded-full bg-[#1F2937] text-slate-400 flex items-center justify-center text-[10px] font-bold">{taskCount}</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">{description}</p>
        <Badge variant={statusText === 'RUNNING' ? 'success' : statusText === 'PAUSED' ? 'warning' : 'default'} className="!text-[8px] !py-0.5">
          <CheckCircle2 size={10}/> {statusText}
        </Badge>
     </div>
     <div className="p-3 overflow-y-auto space-y-3 no-scrollbar flex-1">
        {children}
     </div>
  </div>
  );
};
