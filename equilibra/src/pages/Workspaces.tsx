import React, { useState } from 'react';
import { Briefcase, Target, Plus, Trash2 } from 'lucide-react';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { useProjects } from '../controllers/useProjects';
import { ProjectFormModal } from '../components/modals/ProjectFormModal';
import type { Project } from '../models';

interface WorkspacesPageProps {
  setPage: (page: string) => void;
  setProject: (id: number) => void;
}

type ModalMode = 'create' | 'edit' | null;

const statusVariant = (status?: string): 'critical' | 'success' | 'primary' | 'default' => {
  if (!status) return 'default';
  if (status === 'Blocked' || status === 'At Risk') return 'critical';
  if (status === 'On Track' || status === 'Healthy Flow') return 'success';
  if (status === 'Heavy Load') return 'primary';
  return 'default';
};

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ setPage, setProject }) => {
  const { leadProjects, collaboratingProjects, loading, createProject, deleteProject } = useProjects();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Partial<Project>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = async (data: Pick<Project, 'name' | 'gh_repo_url'> & Partial<Project>) => {
    await createProject(data);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await deleteProject(id);
    setDeletingId(null);
  };

  const openCreate = () => { setEditTarget({}); setModalMode('create'); };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> My Project • Workspaces Hub
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight">Workspaces</h1>
          <p className="text-[14px] italic text-slate-400 mt-1">Pilih flow Anda hari ini.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B82F6] text-white text-[13px] font-semibold hover:bg-[#2563EB] transition-all"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Lead Projects */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-[#3B82F6]/10 rounded"><Briefcase size={16} className="text-[#3B82F6]" /></div>
          <h2 className="text-white font-bold text-[14px] uppercase tracking-wider">
            Projects I Lead <span className="text-slate-400 normal-case font-medium text-[12px] ml-2">(Leadership Zone)</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-slate-500 text-[12px]">Scanning nodes...</div>
          ) : leadProjects.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-500 text-[13px] border border-dashed border-[#374151] rounded-xl">
              No lead projects. <button onClick={openCreate} className="text-[#3B82F6] hover:underline">Create one.</button>
            </div>
          ) : leadProjects.map(p => (
            <div key={p.id} className="relative group">
              <ProjectCard
                title={p.name}
                desc={p.issue || "System operating within normal parameters."}
                tag={p.status ?? 'Unknown'}
                variant={statusVariant(p.status)}
                progress={p.progress}
                isLead={p.isLead}
                onClick={() => { setProject(p.id!); setPage('project'); }}
              />
              <button
                onClick={() => handleDelete(p.id!)}
                disabled={deletingId === p.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-[#1F2937] text-slate-500 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Collaborating Projects */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-[#16A34A]/10 rounded"><Target size={16} className="text-[#22C55E]" /></div>
          <h2 className="text-white font-bold text-[14px] uppercase tracking-wider">
            Projects I'm In <span className="text-slate-400 normal-case font-medium text-[12px] ml-2">(Collaboration Zone)</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-slate-500 text-[12px]">Scanning nodes...</div>
          ) : collaboratingProjects.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-500 text-[13px] border border-dashed border-[#374151] rounded-xl">
              Not collaborating on any projects yet.
            </div>
          ) : collaboratingProjects.map(p => (
            <div key={p.id} className="relative group">
              <ProjectCard
                title={p.name}
                desc={p.issue || "System operating within normal parameters."}
                tag={p.status ?? 'Unknown'}
                variant={statusVariant(p.status)}
                tasks={p.tasksPending}
                onClick={() => { setProject(p.id!); setPage('project'); }}
              />
              <button
                onClick={() => handleDelete(p.id!)}
                disabled={deletingId === p.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-[#1F2937] text-slate-500 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {modalMode === 'create' && (
        <ProjectFormModal
          title="New Project"
          initial={editTarget}
          onClose={() => setModalMode(null)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
};
