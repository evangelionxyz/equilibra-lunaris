import React from 'react';

interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  icon?: React.ElementType;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({ 
  children, 
  className = "", 
  title, 
  subtitle, 
  rightElement, 
  icon: Icon 
}) => (
  <div className={`p-6 rounded-2xl border border-[#374151] bg-[#151A22] shadow-sm flex flex-col ${className}`}>
    {(title || rightElement || Icon) && (
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-[#1F2937] text-[#3B82F6] border border-[#374151] flex-shrink-0">
              <Icon size={16} />
            </div>
          )}
          <div>
            {title && <h3 className="text-white font-semibold text-[14px] uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-slate-400 text-[11px] mt-0.5 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
        {rightElement}
      </div>
    )}
    {children}
  </div>
);
