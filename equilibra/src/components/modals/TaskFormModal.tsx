import React, { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import type { Task, TaskType } from '../../models';

const TASK_TYPES: TaskType[] = ['CODE', 'REQUIREMENT', 'DESIGN', 'NON-CODE', 'OTHER'];

interface TaskFormModalProps {
  projectId: number | string;
  onClose: () => void;
  onSubmit: (data: { project_id: number | string; title: string; type: TaskType; weight: number; bucket_id?: number | string }) => Promise<void>;
  initial?: Partial<Task>;
  title?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  projectId, onClose, onSubmit, initial = {}, title = 'New Task',
}) => {
  const [taskTitle, setTaskTitle] = useState(initial.title ?? '');
  const [type, setType] = useState<TaskType>(initial.type ?? 'CODE');
  const [weight, setWeight] = useState(initial.weight ?? 3);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSaving(true);
    await onSubmit({ project_id: projectId, title: taskTitle.trim(), type, weight, bucket_id: initial.bucket_id });
    setSaving(false);
    onClose();
  };



  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#151A22] border border-[#374151] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F2937] text-[#3B82F6] border border-[#374151]">
              <CheckSquare size={16} />
            </div>
            <h2 className="text-white font-semibold text-[15px]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Task Title <span className="text-[#EF4444]">*</span>
            </label>
            <input
              autoFocus
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="e.g. Refactor authentication module"
              className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
              >
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Weight (1–5)</label>
              <input
                type="number"
                min={1} max={5}
                value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>
          </div>



          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] text-slate-400 border border-[#374151] hover:text-white hover:border-slate-500 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !taskTitle.trim()}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
