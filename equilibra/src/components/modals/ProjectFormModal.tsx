import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import type { Project } from '../../models';

interface ProjectFormModalProps {
  onClose: () => void;
  onSubmit?: (data: Pick<Project, 'name' | 'gh_repo_url'> & {}) => Promise<void>;
  initial?: Partial<Project>;
  title?: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  onClose, onSubmit, initial = {}, title = 'New Project',
}) => {
  const [name, setName] = useState(initial.name ?? '');
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: name.trim(), gh_repo_url: [] } as Pick<Project, 'name' | 'gh_repo_url'> & {};
    if (onSubmit) {
      await onSubmit(payload);
    }
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
              <Briefcase size={16} />
            </div>
            <h2 className="text-white font-semibold text-[15px]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Form Project Name */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Project Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Project Alpha"
              className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          {/* Cancel / Create Button */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] text-slate-400 border border-[#374151] hover:text-white hover:border-slate-500 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
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
