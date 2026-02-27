import { useState } from 'react';
import { LayoutDashboard, Briefcase, Bell, Settings } from 'lucide-react';
import { DashboardPage } from './pages/Dashboard';
import { WorkspacesPage } from './pages/Workspaces';
import { ProjectDetailsPage } from './pages/ProjectDetails';
import { NotificationsPage } from './pages/Notifications';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [role, setRole] = useState<'PM' | 'DEV'>('PM'); // Defaulting to PM for demo

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'workspaces', icon: Briefcase },
    { id: 'notifications', icon: Bell },
  ];

  return (
    <div className="h-screen w-full bg-[#0B0E14] text-slate-300 font-sans flex overflow-hidden selection:bg-[#3B82F6]/30">
     
      {/* Global Sidebar */}
      <aside className="w-[80px] border-r border-[#374151] flex flex-col items-center py-6 bg-[#0B0E14] z-40 flex-shrink-0 relative">
        <div className="w-10 h-10 rounded-xl border border-[#374151] bg-[#151A22] flex flex-col items-center justify-center mb-8 cursor-pointer shadow-lg" onClick={() => setCurrentPage('dashboard')}>
          <div className="w-4 h-4 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin"/>
        </div>
       
        <nav className="flex flex-col gap-4 w-full px-3">
          {navItems.map(nav => (
            <button
              key={nav.id}
              onClick={() => setCurrentPage(nav.id)}
              className={`p-3 rounded-xl transition-all flex justify-center w-full relative ${
                currentPage === nav.id
                  ? 'bg-[#1F2937] text-[#3B82F6]'
                  : 'text-slate-500 hover:text-white hover:bg-[#151A22]'
              }`}
            >
              <nav.icon size={20} strokeWidth={2.5} />
              {currentPage === nav.id && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#3B82F6] rounded-r" />}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto w-full flex flex-col gap-4 items-center">
          {/* Debug Role Toggle */}
          <div className="flex flex-col items-center justify-center" title="Switch User Persona">
            <span className="text-[8px] text-slate-500 font-bold mb-1">VIEW AS</span>
            <button onClick={() => setRole(role === 'PM' ? 'DEV' : 'PM')} className="w-8 h-8 rounded-lg bg-[#1F2937] text-[#3B82F6] font-bold text-[10px] border border-[#3B82F6]/30 hover:bg-[#3B82F6] hover:text-white transition-all">
              {role}
            </button>
          </div>
          <button className="text-slate-500 hover:text-white p-2"><Settings size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center text-[10px] font-bold text-white">JD</div>
        </div>
      </aside>

      {/* Main Content Area: STRICT PADDING (Top 32, Left 32, Right 32, Bottom 128) */}
      {/* 32px is roughly p-8 in tailwind context (4 * 8px = 32px) */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full p-8 pb-[128px]">
        {currentPage === 'dashboard' && <DashboardPage role={role} setPage={setCurrentPage} />}
        {currentPage === 'workspaces' && <WorkspacesPage setPage={setCurrentPage} />}
        {currentPage === 'project' && <ProjectDetailsPage role={role} />}
        {currentPage === 'notifications' && <NotificationsPage />}
      </main>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

export default App;
