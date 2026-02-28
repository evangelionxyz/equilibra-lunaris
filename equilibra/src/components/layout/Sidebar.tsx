import { LayoutDashboard, Briefcase, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getDisplayName } from '../../auth/displayName';
import logo from '../../assets/logo.png';
import { useAlerts } from '../../controllers/useAlerts';

import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'workspaces', icon: Briefcase },
  { id: 'notifications', icon: Bell },
];

interface SidebarProps {
  onOpenSettings?: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts } = useAlerts();

  // Extract base path for active state highlighting (e.g., "/workspaces" -> "workspaces")
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  const initials = getDisplayName(user!)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-[80px] border-r border-[#374151] flex flex-col items-center py-6 bg-[#0B0E14] z-40 flex-shrink-0 relative">
      {/* Logo */}
      <div
        className="w-10 h-10 rounded-xl border border-[#374151] bg-white flex items-center justify-center mb-8 cursor-pointer shadow-lg"
        onClick={() => navigate('/dashboard')}
      >
        <img src={logo} alt="Lunaris Logo" className='p-1' />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-4 w-full px-3">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = currentPage === id || (id === 'workspaces' && currentPage === 'projects');
          const hasUnread = id === 'notifications' && alerts.length > 0;
          return (
            <Link
              key={id}
              to={`/${id}`}
              className={`p-3 rounded-xl transition-all flex justify-center w-full relative ${isActive
                ? 'bg-[#1F2937] text-[#3B82F6]'
                : 'text-slate-500 hover:text-white hover:bg-[#151A22]'
                }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={2.5} />
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#151A22]" />
                )}
              </div>
              {isActive && (
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#3B82F6] rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto w-full flex flex-col gap-4 items-center">
        <button
          onClick={onOpenSettings}
          className="text-slate-500 hover:text-white p-2"
        >
          <Settings size={20} />
        </button>
        <button
          onClick={logout}
          title="Sign out"
          className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center text-[10px] font-bold text-white hover:border-[#EF4444] hover:text-[#EF4444] transition-all"
        >
          {initials}
        </button>
      </div>
    </aside>
  );
}
