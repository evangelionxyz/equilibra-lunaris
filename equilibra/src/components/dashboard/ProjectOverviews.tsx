import React from 'react';
import { 
  AlertCircle, 
  ChevronRight, 
  Users, 
  BarChart3, 
  TrendingDown, 
  GitPullRequest, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Target 
} from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { ProgressBar } from '../../design-system/ProgressBar';

export const ProjectOverviewPM: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
    <div className="lg:col-span-4">
       <SurfaceCard className="border-[#EF4444]/30 bg-[#EF4444]/5 h-full">
          <div className="flex items-center gap-3 text-[#EF4444] mb-2">
            <AlertCircle size={18} />
            <h4 className="font-bold text-[14px]">3 Blocking Dependencies</h4>
          </div>
          <p className="text-slate-300 text-[12px] leading-relaxed mb-4">Auth module waiting for API keys from DevOps team.</p>
          <button className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] flex items-center gap-1 hover:underline">View Details <ChevronRight size={12} /></button>
       </SurfaceCard>
    </div>
    <div className="lg:col-span-4">
       <SurfaceCard className="border-[#3B82F6]/30 bg-[#3B82F6]/5 h-full">
          <div className="flex items-center gap-3 text-[#3B82F6] mb-2">
            <Users size={18} />
            <h4 className="font-bold text-[14px]">Reallocation Recommended</h4>
          </div>
          <p className="text-slate-300 text-[12px] leading-relaxed mb-4">Alex is overloaded (120%). Suggest moving 2 tasks to Shinta.</p>
          <button className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-1 hover:underline">Review Suggestion <ChevronRight size={12} /></button>
       </SurfaceCard>
    </div>
    <div className="lg:col-span-4">
       <SurfaceCard className="border-[#16A34A]/30 bg-[#16A34A]/5 h-full">
          <div className="flex items-center gap-3 text-[#22C55E] mb-2">
            <BarChart3 size={18} />
            <h4 className="font-bold text-[14px]">Breakdown Opportunity</h4>
          </div>
          <p className="text-slate-300 text-[12px] leading-relaxed mb-4">Payment API Epic could be split into 5 subtasks for better velocity.</p>
          <button className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-1 hover:underline">Optimize Now <ChevronRight size={12} /></button>
       </SurfaceCard>
    </div>

    {/* Row 2 */}
    <div className="lg:col-span-4">
      <SurfaceCard title="Tasks at Risk" subtitle="Detect tasks to nudge" rightElement={<Badge variant="primary">3 Selected</Badge>} className="h-full">
         <div className="space-y-3">
            {['Database Schema', 'Design System UI', 'Auth Refactor'].map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#1F2937] border border-[#374151] cursor-pointer">
                 <div className={`w-3 h-3 rounded-full border-2 ${i===0 ? 'border-[#EF4444]' : 'border-[#F59E0B]'}`} />
                 <div><p className="text-white text-[12px] font-semibold">{task}</p><p className="text-slate-400 text-[10px]">Backend Group</p></div>
              </div>
            ))}
         </div>
         <Button variant="outline" className="w-full mt-4 !text-[10px] !py-2 bg-[#1F2937]">Nudge Selected</Button>
      </SurfaceCard>
    </div>
    <div className="lg:col-span-8">
      <SurfaceCard title="Stagnation Radar" subtitle="Granular Bottleneck Analysis" icon={TrendingDown} className="h-full">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white text-[12px] font-bold uppercase tracking-wider">Code Review Cycle</span>
                <Badge variant="critical" className="!text-[8px]">Critical</Badge>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[32px] text-white font-bold leading-none">48<span className="text-[16px] text-slate-500 font-medium ml-1">h</span></span>
              </div>
              <ProgressBar value={85} colorClass="bg-[#EF4444]" label="" />
              <p className="text-slate-400 text-[10px] mt-1 font-medium">Target &lt; 12h</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white text-[12px] font-bold uppercase tracking-wider">Deployment Freq</span>
                <Badge variant="success" className="!text-[8px]">Healthy</Badge>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[32px] text-white font-bold leading-none">4<span className="text-[16px] text-slate-500 font-medium ml-1">/ day</span></span>
              </div>
              <ProgressBar value={90} colorClass="bg-[#16A34A]" label="" />
              <p className="text-slate-400 text-[10px] mt-1 font-medium">High velocity</p>
            </div>
         </div>
      </SurfaceCard>
    </div>

    {/* Row 3 */}
    <div className="lg:col-span-8">
      <SurfaceCard title="Workload Distribution" subtitle="Team Capacity" icon={Users} className="h-full">
         <div className="flex items-end justify-between h-40 mt-6 gap-2">
            {[ {n:'Sarah',v:60,c:'bg-[#EF4444]'},{n:'Tono',v:85,c:'bg-[#F59E0B]'},{n:'Shinta',v:70,c:'bg-[#F59E0B]'},{n:'Budi',v:90,c:'bg-[#F59E0B]'},{n:'Alex',v:40,c:'bg-[#16A34A]'},{n:'Lisa',v:115,c:'bg-[#3B82F6]'},{n:'Joko',v:50,c:'bg-[#16A34A]'} ].map((u, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                 <div className="w-full bg-[#1F2937] rounded-t-sm h-32 relative overflow-hidden">
                    <div className={`absolute bottom-0 left-0 right-0 ${u.c} transition-all`} style={{height: `${u.v > 100 ? 100 : u.v}%`}} />
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{u.n}</span>
                 <span className={`text-[10px] font-bold mt-0.5 ${u.v > 100 ? 'text-[#EF4444]' : 'text-slate-300'}`}>{u.v}%</span>
              </div>
            ))}
         </div>
         <div className="mt-6 pt-4 border-t border-[#374151] flex justify-between">
            <div className="text-center"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Load</p><p className="text-white font-bold text-[14px]">68%</p></div>
            <div className="text-center"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Overloaded</p><p className="text-[#EF4444] font-bold text-[14px]">1 <span className="text-[10px] text-slate-500">MEMBER</span></p></div>
            <div className="text-center"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Balance</p><p className="text-[#F59E0B] font-bold text-[14px]">FAIR</p></div>
         </div>
      </SurfaceCard>
    </div>
    <div className="lg:col-span-4">
      <SurfaceCard title="Project Pulse" subtitle="Activity Feed" className="h-full">
         <div className="space-y-4">
            {[ {u:'Sarah', a:'pushed', t:'auth-v2'}, {u:'Tono', a:'moved', t:'Task A to QA'}, {u:'AI summarizer', a:'generated', t:'Sprint Review 2'} ].map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5" />
                 <div className="text-slate-400 text-[12px]">
                   <span className="text-white font-semibold">{act.u}</span> {act.a} <span className="text-[#3B82F6] font-semibold">{act.t}</span>
                 </div>
              </div>
            ))}
         </div>
      </SurfaceCard>
    </div>
  </div>
);

export const ProjectOverviewDev: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
    <div className="lg:col-span-8 space-y-6">
      <SurfaceCard className="p-8 border-[#3B82F6]/30">
         <Badge variant="primary" className="mb-4">IN FLOW • Started 1h 20m ago</Badge>
         <h2 className="text-[28px] text-white font-bold mb-3">Refactor Authentication Service</h2>
         <p className="text-[14px] text-slate-400 leading-relaxed mb-6">
           Modernize auth flow with OAuth 2.0 support, improved session management, and better error handling for the core banking platform.
         </p>
         <div className="flex items-center gap-3 bg-[#1F2937] border border-[#374151] px-4 py-2.5 rounded-lg w-fit mb-8">
           <GitPullRequest className="text-[#3B82F6]" size={16} />
           <span className="text-[12px] text-slate-300 font-mono font-semibold">feat/login-component</span>
           <div className="w-px h-4 bg-[#374151] mx-2" />
           <Clock className="text-slate-400" size={14} />
           <span className="text-[12px] text-slate-400 font-medium">2h ago</span>
         </div>
         <div className="flex gap-4">
           <Button variant="success"><CheckCircle2 size={16} /> Mark as Done</Button>
           <Button variant="outline" className="text-[#EF4444] border-[#EF4444]/30"><AlertCircle size={16} /> Report Blocker</Button>
         </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <SurfaceCard title="PR Status" subtitle="Code Review" icon={GitPullRequest}>
            <div className="space-y-3">
              <div className="bg-[#1F2937] border border-[#374151] p-3 rounded-lg flex justify-between items-center">
                <div><Badge variant="success" className="!text-[8px] mb-1">Approved</Badge><p className="text-white text-[11px] font-mono">fix: auth service refactor</p></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">2h ago</span>
              </div>
              <div className="bg-[#1F2937] border border-[#374151] p-3 rounded-lg flex justify-between items-center opacity-60">
                <div><Badge variant="warning" className="!text-[8px] mb-1">Changes Requested</Badge><p className="text-white text-[11px] font-mono">feat: mobile layout</p></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">1d ago</span>
              </div>
            </div>
         </SurfaceCard>
         <SurfaceCard title="Team Pulse" subtitle="Recent Activity" icon={TrendingDown}>
            <div className="space-y-4">
              {[ {u:'Sarah', a:'pushed', t:'auth-v2'}, {u:'Tono', a:'moved', t:'Task A to QA'}, {u:'AI summarizer', a:'generated', t:'Sprint Review 2'} ].map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5" />
                   <div className="text-slate-400 text-[12px]">
                     <span className="text-white font-semibold">{act.u}</span> {act.a} <span className="text-[#3B82F6] font-semibold">{act.t}</span>
                   </div>
                </div>
              ))}
            </div>
         </SurfaceCard>
      </div>
    </div>

    <div className="lg:col-span-4 space-y-6">
      <SurfaceCard title="My Velocity" subtitle="Sprint Contribution" icon={Zap}>
         <div className="flex items-end gap-2 mb-3">
           <span className="text-[32px] font-bold text-white leading-none">12</span>
           <span className="text-[12px] text-slate-400 font-medium pb-1">points done</span>
         </div>
         <ProgressBar value={80} label="" colorClass="bg-[#22C55E]" />
         <p className="text-right text-[10px] text-[#22C55E] font-bold mt-1 uppercase">Top 10% in team</p>
      </SurfaceCard>

      <SurfaceCard title="My Queue" subtitle="Up Next" icon={Target} rightElement={<Badge>3 Pending</Badge>}>
         <div className="space-y-3">
           {[ { title: 'Build account dashboard', tag: 'High', grp: 'Frontend' }, { title: 'Implement OAuth 2.0 flow', tag: 'High', grp: 'Backend' }, { title: 'Write API integration tests', tag: 'Medium', grp: 'Testing' } ].map((t, i) => (
             <div key={i} className="p-3 rounded-lg bg-[#1F2937] border border-[#374151] flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Badge variant={t.tag === 'High' ? 'warning' : 'default'} className="!py-0 !px-1.5 !text-[8px]">{t.tag}</Badge>
                  <span className="text-[10px] text-slate-400"><Clock size={10} className="inline mr-1"/>{i*4}h</span>
                </div>
                <h5 className="text-white text-[13px] font-semibold mt-1">{t.title}</h5>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-2 flex justify-between items-center">
                  <span>{t.grp}</span> <div className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-[8px]">AK</div>
                </div>
             </div>
           ))}
         </div>
      </SurfaceCard>
    </div>
  </div>
);
