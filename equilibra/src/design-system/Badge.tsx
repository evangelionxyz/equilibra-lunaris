import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: "critical" | "success" | "warning" | "primary" | "default" | "outline";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  const styles = {
    critical: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
    success: "bg-[#16A34A]/10 text-[#22C55E] border-[#16A34A]/30",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
    primary: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
    default: "bg-[#1F2937] text-slate-300 border-[#374151]",
    outline: "bg-transparent text-slate-400 border-[#374151]"
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[variant]} flex items-center gap-1 w-fit ${className}`}>
      {children}
    </span>
  );
};
