import React from 'react';
import {
  Calendar,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Bell,
  ArrowUpRight
} from 'lucide-react';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { Button } from '../design-system/Button';
import { UrgentActions } from '../components/dashboard/UrgentActions';
import { MyQueue } from '../components/dashboard/MyQueue';
import { CriticalWatchlist } from '../components/dashboard/CriticalWatchlist';
import { useAuth } from '../auth/useAuth';
import { getDisplayName } from '../auth/displayName';

interface DashboardPageProps {
  setPage: (page: string) => void;
  setProject: (id: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setPage, setProject }) => {
  const { user } = useAuth();
  const displayName = user ? getDisplayName(user) : '…';
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, isCurrent: true }));
  const nextMonthDays = Array.from({ length: 4 }, (_, i) => ({ day: i + 1, isCurrent: false }));
  const calendarDays = [...currentMonthDays, ...nextMonthDays];

  const getEvents = (day: number) => {
    if (day === 5) return [{ color: 'bg-[#3B82F6]', title: 'Sprint Planning' }];
    if (day === 12) return [{ color: 'bg-[#EF4444]', title: 'Hotfix Deployment' }, { color: 'bg-[#16A34A]', title: 'Release v1.2' }];
    if (day === 24) return [{ color: 'bg-[#3B82F6]', title: 'Sync Sync' }, { color: 'bg-[#16A34A]', title: 'Client Demo' }];
    if (day === 29) return [{ color: 'bg-[#F59E0B]', title: 'Database Migration' }];
    return [];
  };

  const handleEventNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage('project');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
      {/* Header & Banner */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" /> Overview • Personal Space
            </span>
            <h1 className="text-[32px] font-bold text-white leading-tight">Halo, {displayName}.</h1>
            <p className="text-[14px] italic text-slate-400 mt-1">Hari ini terasa seimbang.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input placeholder="Search..." className="bg-[#151A22] border border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-[12px] text-white w-64 focus:outline-none focus:border-[#3B82F6]" />
            </div>
            <button className="p-2.5 rounded-lg bg-[#151A22] border border-[#374151] text-slate-400 hover:text-white"><Bell size={18} /></button>
          </div>
        </div>

        {/* Action Banner (Matches Reference layout) */}
        <div className="bg-[#151A22] border border-[#374151] rounded-2xl p-6 flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-6">
              <button className="w-8 h-8 rounded-lg bg-[#1F2937] text-slate-400 flex items-center justify-center hover:text-white border border-[#374151]"><ChevronLeft size={16}/></button>
              <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-3 rounded-xl flex-shrink-0">
                <Zap className="text-[#3B82F6]" size={24} />
              </div>
              <div>
                <h4 className="text-white font-medium text-[16px]">Meeting <span className="text-[#3B82F6] italic font-semibold">Sprint Review</span> besok belum memiliki agenda. Generate otomatis?</h4>
                <p className="text-slate-400 text-[10px] mt-1.5 uppercase font-bold tracking-widest">Equilibra Assistant • Meeting Prep</p>
              </div>
              <button className="w-8 h-8 rounded-lg bg-[#1F2937] text-slate-400 flex items-center justify-center hover:text-white border border-[#374151]"><ChevronRight size={16}/></button>
           </div>
           <Button variant="white">Generate Agenda</Button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar - Left Column */}
        <div className="xl:col-span-8 flex flex-col h-full relative z-10">
          <SurfaceCard title="Schedule Sync" subtitle="Global Timeline" icon={Calendar} className="h-full flex flex-col" rightElement={<MoreHorizontal className="text-slate-500 cursor-pointer" size={18}/>}>
            <div className="grid grid-cols-7 gap-px bg-[#374151] border border-[#374151] rounded-xl flex-1">
              {days.map((d, i) => (
                <div key={`day-label-${i}`} className={`bg-[#1F2937] py-3 text-center text-[10px] text-slate-400 font-bold uppercase ${i === 0 ? 'rounded-tl-xl' : ''} ${i === 6 ? 'rounded-tr-xl' : ''}`}>{d}</div>
              ))}
              {calendarDays.map((d, i) => {
                const events = d.isCurrent ? getEvents(d.day) : [];
                return (
                  <div key={`cal-day-${i}`} className={`bg-[#151A22] p-3 min-h-[90px] relative group hover:bg-[#1F2937]/50 transition-colors flex flex-col ${events.length > 0 ? 'cursor-pointer hover:z-[60]' : ''}`}>
                    <span className={`text-[12px] font-semibold ${d.isCurrent && d.day === 24 ? 'text-[#22C55E]' : d.isCurrent ? 'text-slate-300' : 'text-slate-600'}`}>
                      {d.day < 10 ? `0${d.day}` : d.day}
                    </span>
                    <div className="mt-auto flex flex-col gap-1 w-full pb-1">
                       {events.length > 0 && (
                          <div className="flex gap-1 w-full px-1">
                            {events.map((ev, idx) => (
                               <div key={idx} className={`h-1 flex-1 rounded-sm ${ev.color}`} />
                            ))}
                          </div>
                       )}
                    </div>
                    {/* Hover Tooltip (Interactive Bridge) */}
                    {events.length > 0 && (
                      <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 pb-2 hidden group-hover:block z-[60] w-56">
                         <div className="bg-[#1F2937] border border-[#374151] rounded-lg p-2 shadow-2xl">
                           <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 px-1 pt-1">Events on {d.day}</div>
                           {events.map((ev, idx) => (
                             <div key={idx} onClick={handleEventNavigation} className="flex items-center justify-between gap-2 p-2 hover:bg-[#374151] rounded-lg cursor-pointer transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${ev.color}`} />
                                  <span className="text-white text-[12px] font-medium">{ev.title}</span>
                                </div>
                                <ArrowUpRight size={14} className="text-slate-400" />
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </SurfaceCard>
        </div>

        {/* Action Columns - Right Column */}
        <div className="xl:col-span-4 space-y-6 flex flex-col min-h-0 max-h-[750px] relative z-0">
          <UrgentActions className="flex-1 min-h-0" onNavigateProject={(id) => { setProject(id); setPage('project'); }} />
          <MyQueue className="flex-1 min-h-0" />
        </div>
      </div>

      {/* Critical Watchlist - Bottom Row */}
      <CriticalWatchlist onNavigate={(id) => { setProject(id); setPage('project'); }} />
    </div>
  );
};
