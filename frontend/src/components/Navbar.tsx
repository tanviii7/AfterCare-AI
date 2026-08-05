import React, { useState } from 'react';
import { Bell, FileSpreadsheet, Heart, ShieldAlert } from 'lucide-react';
import { DashboardStats } from '../types';

interface NavbarProps {
  title: string;
  stats: DashboardStats | null;
  onOpenSymptomModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, stats, onOpenSymptomModal }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const alerts = [];
  if (stats) {
    if (stats.symptoms_status !== 'Stable') {
      alerts.push({
        id: 1,
        type: 'critical',
        message: 'Elevated pain levels recorded in last log entry.',
        time: 'Just now'
      });
    }
    const pendingMeds = stats.today_medications.filter(m => m.status === 'pending');
    if (pendingMeds.length > 0) {
      alerts.push({
        id: 2,
        type: 'info',
        message: `You have ${pendingMeds.length} medications pending for today.`,
        time: '1 hour ago'
      });
    }
    if (stats.upcoming_appointments.length > 0) {
      const nextApp = stats.upcoming_appointments[0];
      alerts.push({
        id: 3,
        type: 'calendar',
        message: `Upcoming: ${nextApp.title} with ${nextApp.doctor_name || 'Dr.'}`,
        time: '3 hours ago'
      });
    }
  } else {
    alerts.push({
      id: 0,
      type: 'info',
      message: 'Welcome to AfterCare AI recovery platform.',
      time: '1 day ago'
    });
  }

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 pl-[18rem]">
      {/* Page Title */}
      <div>
        <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">{title}</h2>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-5">
        {/* Make Report Action Button */}
        <button
          onClick={onOpenSymptomModal}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-brand-100 transition-all duration-200"
        >
          <FileSpreadsheet className="h-4 w-4 text-white" />
          <span>Make Report</span>
        </button>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all duration-200 relative"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-30 animate-slide-up">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Notifications</span>
                <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                  {alerts.length} New
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="p-4 border-b border-slate-50 hover:bg-slate-50/50 flex gap-3 transition-colors duration-150"
                  >
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${alert.type === 'critical' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}
                    `}>
                      {alert.type === 'critical' ? <ShieldAlert className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 leading-snug">{alert.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1 font-medium">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-50 text-center">
                <span className="text-[10px] text-brand-700 font-bold hover:underline cursor-pointer">
                  Mark all as read
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
