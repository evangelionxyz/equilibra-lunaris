import React, { useState } from 'react';
import { Bell, Clock, CheckCircle2, ArrowRight, Sparkles, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../design-system/Badge';
import { useAlerts } from '../controllers/useAlerts';
import { useProjects } from '../controllers/useProjects';
import type { Alert } from '../models';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, loading, resolveAlert } = useAlerts();
  const { leadProjects, collaboratingProjects } = useProjects();
  const allProjects = [...leadProjects, ...collaboratingProjects];

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const getProjectName = (id: number) => allProjects.find(p => p.id === id)?.name || `Project #${id}`;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleNavigateToProject = (alert: Alert) => {
    if (alert.project_id) {
      navigate(`/projects/${alert.project_id}`);
    }
    setSelectedAlert(null);
  };

  const getAlertIcon = (type: string) => {
    if (type === 'DRAFT_APPROVAL') return <Sparkles size={22} />;
    return <AlertTriangle size={22} />;
  };

  const getAlertColors = (type: string, severity: string) => {
    if (type === 'DRAFT_APPROVAL') return {
      bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/20', text: 'text-[#3B82F6]',
      headerBg: 'bg-[#3B82F6]/10'
    };
    if (severity === 'critical') return {
      bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', text: 'text-[#EF4444]',
      headerBg: 'bg-[#EF4444]/10'
    };
    return {
      bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', text: 'text-[#F59E0B]',
      headerBg: 'bg-[#F59E0B]/10'
    };
  };

  const displayed = filter === 'unread' ? alerts.filter(a => !a.is_resolved) : alerts;

  return (
    <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="mb-8 border-b border-[#374151] pb-6 flex justify-between items-end">
        <div>
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Notifications
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight">Notifications</h1>
          <p className="text-[14px] italic text-slate-400 mt-1">Tetap update dengan projectmu.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all capitalize ${filter === f ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-slate-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Retrieving nexus updates...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4 border border-dashed border-[#374151] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center text-slate-500">
              <Bell size={32} />
            </div>
            <p className="text-slate-400 text-[14px]">No notifications found.</p>
          </div>
        ) : (
          displayed.map(alert => {
            const colors = getAlertColors(alert.type, alert.severity);
            return (
              <div
                key={alert.id!}
                className="bg-[#151A22] border border-[#374151] p-5 rounded-2xl flex gap-5 items-center hover:bg-[#1A2030] transition-colors cursor-pointer group"
                onClick={() => {
                  if (!alert.is_resolved) resolveAlert(alert.id!);
                  setSelectedAlert(alert);
                }}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} ${colors.text}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={alert.type === 'DRAFT_APPROVAL' ? 'primary' : alert.severity === 'critical' ? 'critical' : 'warning'} className="!py-0.5 !text-[8px] uppercase">
                      {alert.type?.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock size={10} /> {getTimeAgo(alert.created_at!)}
                    </span>
                    <span className="text-[#3B82F6] text-[10px] font-bold">• {getProjectName(alert.project_id)}</span>
                  </div>
                  <h3 className="text-white font-bold text-[15px] truncate">{alert.title}</h3>
                  <p className="text-slate-400 text-[12px] mt-0.5 line-clamp-1">{alert.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); resolveAlert(alert.id!); }}
                    className="px-3 py-1.5 rounded-lg border border-[#374151] text-slate-400 text-[11px] font-bold hover:bg-[#374151] hover:text-white transition-all"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (!alert.is_resolved) resolveAlert(alert.id!);
                      setSelectedAlert(alert);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-[11px] font-bold hover:bg-[#3B82F6] hover:text-white transition-all flex items-center gap-1.5"
                  >
                    View <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (() => {
        const colors = getAlertColors(selectedAlert.type, selectedAlert.severity);
        const isDraftApproval = selectedAlert.type === 'DRAFT_APPROVAL';
        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedAlert(null)}>
            <div
              className="bg-[#0B0E14] border border-[#374151] rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b border-[#374151] flex items-start gap-4 ${colors.headerBg}`}>
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border ${colors.text}`}>
                  {getAlertIcon(selectedAlert.type)}
                </div>
                <div className="flex-1 mt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isDraftApproval ? 'primary' : selectedAlert.severity === 'critical' ? 'critical' : 'warning'} className="uppercase">
                      {selectedAlert.type?.replace('_', ' ')}
                    </Badge>
                    <span className="text-slate-400 text-[12px] font-medium">{getProjectName(selectedAlert.project_id)}</span>
                  </div>
                  <h2 className="text-white text-[18px] font-bold leading-tight">{selectedAlert.title}</h2>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-2 text-slate-400 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-slate-300 text-[14px] leading-relaxed mb-6">{selectedAlert.description}</p>

                {isDraftApproval && (
                  <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-xl p-4 mb-6">
                    <h4 className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles size={12} /> What to do
                    </h4>
                    <p className="text-slate-400 text-[13px] leading-relaxed">
                      Navigate to your project's <strong className="text-white">MoM & Meetings</strong> tab to review the extracted tasks and commit them to your project board.
                    </p>
                  </div>
                )}

                {(selectedAlert.suggested_actions?.length ?? 0) > 0 && (
                  <div className="bg-[#151A22] rounded-xl border border-[#374151] p-4 mb-6">
                    <h4 className="text-white text-[12px] font-bold uppercase tracking-wider mb-3">Suggested Actions</h4>
                    <ul className="space-y-2">
                      {selectedAlert.suggested_actions!.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-[13px] text-slate-400">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { resolveAlert(selectedAlert.id!); setSelectedAlert(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1F2937] text-[13px] font-semibold transition-colors"
                  >
                    <CheckCircle2 size={16} /> Dismiss
                  </button>
                  <button
                    onClick={() => handleNavigateToProject(selectedAlert)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3B82F6] text-white text-[13px] font-semibold hover:bg-[#2563EB] transition-colors"
                  >
                    {isDraftApproval ? (
                      <><Sparkles size={14} /> Review Meeting Tasks</>
                    ) : (
                      <><ExternalLink size={14} /> View Project</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

