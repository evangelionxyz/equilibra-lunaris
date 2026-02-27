import React, { useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Badge } from '../../design-system/Badge';
import { useAlerts } from '../../controllers/useAlerts';
import { AlertDetailModal } from '../modals/AlertDetailModal';
import { useProjects } from '../../controllers/useProjects';
import type { Alert } from '../../models';

interface UrgentActionsProps {
  onNavigateProject: (id: number) => void;
  className?: string;
}

export const UrgentActions: React.FC<UrgentActionsProps> = ({ onNavigateProject, className = "" }) => {
  const { alerts, loading, resolveAlert } = useAlerts();
  const { leadProjects, collaboratingProjects } = useProjects();
  const allProjects = [...leadProjects, ...collaboratingProjects];
  
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const getProjectName = (id: number) => allProjects.find(p => p.id === id)?.name || `Project #${id}`;

  return (
    <>
      <SurfaceCard title="Urgent Action" icon={AlertCircle} className={className} rightElement={alerts.length > 0 ? <Badge variant="critical">{alerts.length} Items</Badge> : null}>
        <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2 min-h-0">
          {loading ? (
             <div className="text-slate-500 text-[12px] py-4 text-center">Scanning alerts...</div>
          ) : alerts.length === 0 ? (
             <div className="text-slate-500 text-[12px] py-8 text-center border border-dashed border-[#374151] rounded-xl">All clear. No urgent actions required.</div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-4 rounded-xl bg-[#1F2937] border group cursor-pointer transition-colors flex justify-between items-center ${
                  alert.severity === 'critical' ? 'border-[#EF4444]/30 hover:border-[#EF4444]' : 'border-[#F59E0B]/30 hover:border-[#F59E0B]'
                }`}
              >
                 <div>
                   <Badge variant={alert.severity === 'critical' ? 'critical' : 'warning'} className="!py-0.5 !px-1.5 !text-[8px] uppercase">
                     {alert.severity}
                   </Badge>
                   <h5 className="text-white font-semibold text-[13px] mt-2 line-clamp-1">{alert.title}</h5>
                   <p className="text-slate-400 text-[10px] mt-0.5">{getProjectName(alert.project_id)}</p>
                 </div>
                 <div className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-400 transition-all flex-shrink-0">
                   <ChevronRight size={14} />
                 </div>
              </div>
            ))
          )}
        </div>
      </SurfaceCard>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          projectName={getProjectName(selectedAlert.project_id)}
          onClose={() => setSelectedAlert(null)}
          onNavigate={() => onNavigateProject(selectedAlert.project_id)}
          onResolve={() => resolveAlert(selectedAlert.id)}
        />
      )}
    </>
  );
};
