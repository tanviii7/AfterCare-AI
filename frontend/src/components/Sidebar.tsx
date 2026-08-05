import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  MessageSquare, 
  FileText, 
  Clock, 
  Settings, 
  LogOut,
  Info
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userName }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: Activity, label: 'Analytics' },
    { to: '/chat', icon: MessageSquare, label: 'AI Health Chat' },
    { to: '/reports', icon: FileText, label: 'Medical Reports' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/about', icon: Info, label: 'About & Architecture' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Prominent Brand Header with Larger Logo */}
      <div className="h-24 flex items-center px-6 border-b border-slate-100 gap-3 bg-slate-50/30">
        <img 
          src="/logo.png" 
          alt="AfterCare AI Logo" 
          className="h-14 w-auto object-contain flex-shrink-0 drop-shadow-sm"
        />
        <div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight block leading-tight">AfterCare AI</span>
          <span className="text-[10px] block font-extrabold text-brand-600 tracking-wider uppercase mt-0.5">Smarter Recovery</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
              ${isActive 
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-100 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-slate-50/50 rounded-xl">
          <div className="h-9 w-9 bg-brand-100 text-brand-700 font-bold rounded-xl flex items-center justify-center text-sm shadow-sm">
            {(userName || 'U').charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs text-slate-700 truncate">{userName || 'User'}</h4>
            <span className="text-[10px] text-slate-400 block font-medium">Demo Patient</span>
          </div>
        </div>
        
        <button
          onClick={handleLogoutClick}
          className="flex w-full items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
