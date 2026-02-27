import React from 'react';
import { Briefcase, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../design-system/Badge';
import { ProgressBar } from '../../design-system/ProgressBar';

interface ProjectCardProps {
  title: string;
  desc: string;
  tag: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'critical';
  progress?: number;
  tasks?: number;
  isLead?: boolean;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  title, 
  desc, 
  tag, 
  variant, 
  progress, 
  tasks, 
  isLead,
  onClick 
}) => (
  <div onClick={onClick} className="bg-[#151A22] border border-[#374151] rounded-2xl p-6 hover:border-[#3B82F6]/50 transition-all cursor-pointer group flex flex-col h-full">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-xl ${isLead ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-[#1F2937] text-slate-400 border border-[#374151]'}`}>
        <Briefcase size={20} />
      </div>
      <Badge variant={variant}>{tag}</Badge>
    </div>
    <h3 className="text-white text-[18px] font-semibold mb-2">{title}</h3>
    <p className="text-slate-400 text-[12px] leading-relaxed mb-8 line-clamp-2">{desc}</p>
    
    {progress !== undefined ? (
      <ProgressBar value={progress} label="Team Velocity" colorClass={progress < 60 ? "bg-[#EF4444]" : "bg-[#16A34A]"} />
    ) : (
      <div className="flex justify-between items-end border-t border-[#374151] pt-5 mt-auto">
        <div>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">My Tasks</p>
          <p className="text-white text-[16px] font-bold">{tasks} <span className="text-slate-500 font-medium text-[12px]">Pending</span></p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#374151] text-slate-400 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
          <ArrowUpRight size={14} />
        </div>
      </div>
    )}
  </div>
);
