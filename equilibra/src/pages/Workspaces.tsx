import React from 'react';
import { Briefcase, Target } from 'lucide-react';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { useProjects } from '../controllers/useProjects';

interface WorkspacesPageProps {
  setPage: (page: string) => void;
}

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ setPage }) => {
  const { leadProjects, collaboratingProjects, loading } = useProjects();

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto w-full">
      <div>
        <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> My Project • Workspaces Hub
        </span>
        <h1 className="text-[32px] font-bold text-white leading-tight">Workspaces</h1>
        <p className="text-[14px] italic text-slate-400 mt-1">Pilih flow Anda hari ini.</p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-[#3B82F6]/10 rounded"><Briefcase size={16} className="text-[#3B82F6]" /></div>
          <h2 className="text-white font-bold text-[14px] uppercase tracking-wider">Projects I Lead <span className="text-slate-400 normal-case font-medium text-[12px] ml-2">(Leadership Zone)</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {loading ? (
             <div className="text-slate-500 text-[12px]">Scanning nodes...</div>
          ) : (
            leadProjects.map(p => (
              <ProjectCard 
                key={p.id}
                title={p.name} 
                desc={p.issue || "System operating within normal parameters."} 
                tag={p.status ?? 'Unknown'} 
                variant={p.status === "Blocked" || p.status === "At Risk" ? "critical" : p.status === "On Track" || p.status === "Healthy Flow" ? "success" : "default"} 
                progress={p.progress} 
                isLead={p.isLead} 
                onClick={() => setPage('project')} 
              />
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-[#16A34A]/10 rounded"><Target size={16} className="text-[#22C55E]" /></div>
          <h2 className="text-white font-bold text-[14px] uppercase tracking-wider">Projects I'm In <span className="text-slate-400 normal-case font-medium text-[12px] ml-2">(Collaboration Zone)</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="text-slate-500 text-[12px]">Scanning nodes...</div>
          ) : (
            collaboratingProjects.map(p => (
              <ProjectCard 
                key={p.id}
                title={p.name} 
                desc={p.issue || "System operating within normal parameters."} 
                tag={p.status ?? 'Unknown'} 
                variant={p.status === "Blocked" || p.status === "At Risk" ? "critical" : p.status === "Heavy Load" ? "primary" : p.status === "On Track" ? "success" : "default"} 
                tasks={p.tasksPending} 
                onClick={() => setPage('project')} 
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
