import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Alert } from '../../models';
import { Badge } from '../../design-system/Badge';

interface AlertDetailModalProps {
  alert: Alert;
  projectName: string;
  onClose: () => void;
  onNavigate: () => void;
  onResolve: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  projectName,
  onClose,
  onNavigate,
  onResolve
}) => {
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B0E14] border border-[#374151] rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-6 border-b border-[#374151] flex items-start gap-4 ${alert.severity === 'critical' ? 'bg-[#EF4444]/10' : 'bg-[#F59E0B]/10'}`}>
          <div className={`p-3 rounded-xl ${alert.severity === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 mt-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={alert.severity === 'critical' ? 'critical' : 'warning'} className="uppercase">
                {alert.severity}
              </Badge>
              <span className="text-slate-400 text-[12px] font-medium">{projectName}</span>
            </div>
            <h2 className="text-white text-[20px] font-bold leading-tight">{alert.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-300 text-[14px] leading-relaxed mb-6">
            {alert.description}
          </p>

          <div className="bg-[#151A22] rounded-xl border border-[#374151] p-4 mb-8">
            <h4 className="text-white text-[12px] font-bold uppercase tracking-wider mb-3">Suggested Actions</h4>
            <ul className="space-y-2">
              {alert.suggested_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[13px] text-slate-400">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end">
             <button
               onClick={() => { onResolve(); onClose(); }}
               className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1F2937] text-[13px] font-semibold transition-colors"
             >
               <CheckCircle2 size={16} /> Dismiss
             </button>
             <button
               onClick={() => { onNavigate(); onClose(); }}
               className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3B82F6] text-white text-[13px] font-semibold hover:bg-[#2563EB] transition-colors"
             >
               View Project <ArrowRight size={16} />
             </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
