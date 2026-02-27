import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import type { Project } from '../../models';

interface ProjectFormModalProps {
  onClose: () => void;
  onSubmit: (data: Pick<Project, 'name' | 'gh_repo_url'> & { isLead: boolean }) => Promise<void>;
  initial?: Partial<Project>;
  title?: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  onClose, onSubmit, initial = {}, title = 'New Project',
}) => {
  const [name, setName] = useState(initial.name ?? '');
  const [repoUrl, setRepoUrl] = useState(initial.gh_repo_url?.join(', ') ?? '');
  const [isLead, setIsLead] = useState(initial.isLead ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const repoUrls = repoUrl.split(',').map(u => u.trim()).filter(Boolean);
    await onSubmit({ name: name.trim(), gh_repo_url: repoUrls, isLead });
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

        {/* Form */}
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

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              GitHub Repository URLs (comma-separated)
            </label>
            <input
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="github.com/org/repo1, github.com/org/repo2"
              className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
            <div className="flex gap-3">
              {[{ val: true, label: 'Lead' }, { val: false, label: 'Collaborator' }].map(({ val, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsLead(val)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all ${
                    isLead === val
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/40'
                      : 'bg-[#0B0E14] text-slate-400 border-[#374151] hover:border-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
