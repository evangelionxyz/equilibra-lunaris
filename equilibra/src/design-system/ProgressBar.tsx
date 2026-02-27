import React from 'react';

interface ProgressBarProps {
  value: number;
  label: string;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  label, 
  colorClass = "bg-[#EF4444]" 
}) => (
  <div className="w-full mt-auto">
    <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
      <span className="text-slate-400">{label}</span>
      <span className="text-white">{value}%</span>
    </div>
    <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
      <div className={`h-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);
