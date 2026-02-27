import React, { useState } from 'react';
import { Target, Clock, ArrowRight, Bell } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useAlerts } from '../controllers/useAlerts';
import { useProjects } from '../controllers/useProjects';

export const NotificationsPage: React.FC = () => {
  const { alerts, loading, resolveAlert } = useAlerts();
  const { leadProjects, collaboratingProjects } = useProjects();
  const allProjects = [...leadProjects, ...collaboratingProjects];

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getProjectName = (id: number) => allProjects.find(p => p.id === id)?.name || `Project #${id}`;

  const getTimeAgo = (dateStr: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500 w-full">
      <div className="mb-8 border-b border-[#374151] pb-6 flex justify-between items-end">
        <div>
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Notifications • Updates and Suggestions
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight">Notifications</h1>
          <p className="text-[14px] italic text-slate-400 mt-1">Tetap update dengan projectmu.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${filter === 'all' ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${filter === 'unread' ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-slate-400 hover:text-white'}`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Retrieving nexus updates...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4 border border-dashed border-[#374151] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center text-slate-500">
               <Bell size={32} />
            </div>
            <p className="text-slate-400 text-[14px]">No notifications found.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-[#151A22] border border-[#374151] p-6 rounded-2xl flex gap-6 items-center hover:bg-[#1F2937] transition-colors group">
              <div className={`w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                alert.severity === 'critical' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' : 'bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]'
              }`}>
                <Target size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant={alert.severity === 'critical' ? 'critical' : 'primary'} className="!py-0.5 !text-[8px] uppercase">
                    {alert.type}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock size={10} /> {getTimeAgo(alert.created_at)}
                  </span>
                  <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider">• {getProjectName(alert.project_id)}</span>
                </div>
                <h3 className="text-white font-bold text-[16px] truncate">{alert.title}</h3>
                <p className="text-slate-400 text-[12px] mt-0.5 line-clamp-1">{alert.description}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => resolveAlert(alert.id)}
                  className="px-4 py-2 rounded-lg border border-[#374151] text-slate-400 text-[12px] font-bold hover:bg-[#374151] hover:text-white transition-all"
                >
                  Dismiss
                </button>
                <Button variant="outline" className="!bg-transparent hover:!bg-[#3B82F6] hover:!border-[#3B82F6] transition-all">
                  View Detail <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
