import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  CircleDot,
  Loader2
} from 'lucide-react';
import { DashboardStats, MedicationToday } from '../types';
import api from '../services/api';

interface DashboardProps {
  stats: DashboardStats | null;
  onRefreshStats: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onRefreshStats }) => {
  const [medsList, setMedsList] = useState<MedicationToday[]>([]);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);

  useEffect(() => {
    if (stats) {
      setMedsList(stats.today_medications);
    }
  }, [stats]);

  const handleMedCheck = async (medId: number, currentStatus: string) => {
    if (currentStatus === 'taken') return;
    
    setMedsList(prev => prev.map(m => m.id === medId ? { ...m, status: 'taken' } : m));

    try {
      await api.post('/api/patient/medications/adherence', {
        medication_id: medId,
        status: 'taken'
      });
      onRefreshStats();
    } catch (err) {
      setMedsList(prev => prev.map(m => m.id === medId ? { ...m, status: currentStatus as any } : m));
    }
  };

  const handleTriggerEmergency = async () => {
    setIsEmergencySubmitting(true);
    try {
      await api.post('/api/patient/chat', {
        message: 'I have severe chest pain and crushing pressure. Call hospital.'
      });
      setEmergencyTriggered(true);
      onRefreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEmergencySubmitting(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex h-[calc(100vh-4rem)] pl-[18rem] items-center justify-center bg-slate-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Synchronizing AfterCare AI dashboard...</p>
        </div>
      </div>
    );
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.recovery_score / 100) * circumference;

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 space-y-6 animate-fade-in">
      
      {/* Emergency alert card if triggered */}
      {(emergencyTriggered || stats.symptoms_status === 'Critical') && (
        <div className="bg-red-500 text-white rounded-3xl p-6 shadow-xl shadow-red-200 border border-red-400 flex items-start gap-4 pulse-emergency animate-slide-up">
          <ShieldAlert className="h-10 w-10 flex-shrink-0 text-white animate-bounce" />
          <div>
            <h3 className="font-extrabold text-base">🚨 CRITICAL ALERTS TRIGGERED</h3>
            <p className="text-xs text-red-50 mt-1 leading-relaxed">
              AfterCare AI flagged potential emergency symptoms. Notifications were dispatched to emergency contacts **Mary Doe (+1-555-0199)**, **Robert Doe (+1-555-0288)**, and **Dr. Sarah Smith**. 
              Please rest immediately and call **911 / 108** if symptoms worsen.
            </p>
          </div>
        </div>
      )}

      {/* Row 1: Welcome & Recovery Core */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 flex items-center justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] bg-brand-50 text-brand-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active Recovery Profile
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1.5">Cardiac Bypass Healing</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Discharged 5 days ago from St. Mary's Hospital</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Med Adherence</span>
                <span className="text-sm font-extrabold text-brand-600">{stats.medication_adherence_rate}%</span>
              </div>
              <div className="bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Vitals Status</span>
                <span className={`text-sm font-extrabold ${stats.symptoms_status === 'Stable' ? 'text-green-600' : 'text-red-500'}`}>
                  {stats.symptoms_status}
                </span>
              </div>
              <div className="bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Today's Checklists</span>
                <span className="text-sm font-extrabold text-slate-700">{stats.daily_checklist_percentage}%</span>
              </div>
            </div>
          </div>

          {/* Recovery Score Dial */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="64" cy="64" r="50" 
                  className="stroke-slate-100" 
                  strokeWidth="8" fill="transparent" 
                />
                <circle 
                  cx="64" cy="64" r="50" 
                  className="stroke-brand-500" 
                  strokeWidth="8" fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 leading-none">{stats.recovery_score}%</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">Health Score</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500">Target Milestone: 100%</span>
          </div>

        </div>

        {/* Emergency Help Action Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-800 text-sm">Emergency Assistance</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Experiencing warning signs like chest pain, heavy breathing, or sudden bleeding? Trigger emergency contact dispatch.
            </p>
          </div>
          
          <button
            onClick={handleTriggerEmergency}
            disabled={isEmergencySubmitting || emergencyTriggered}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
              ${emergencyTriggered 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-default' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-100 hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>{isEmergencySubmitting ? 'Triggering...' : emergencyTriggered ? 'Alert Sent' : 'TRIGGER EMERGENCY HELP'}</span>
          </button>
        </div>

      </div>

      {/* Row 2: AI Insights & Medication Checklist */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Medication checklist */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><CheckCircle2 className="h-4 w-4" /></div>
              <h3 className="font-extrabold text-slate-800 text-sm">Today's Medication Adherence</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Log timings to keep track</span>
          </div>

          <div className="space-y-2.5">
            {medsList.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3 text-center">No active medications loaded.</p>
            ) : (
              medsList.map((med) => (
                <div 
                  key={med.id} 
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200
                    ${med.status === 'taken' 
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                      : 'bg-white border-slate-100 text-slate-700 hover:border-brand-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleMedCheck(med.id, med.status)}
                      disabled={med.status === 'taken'}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-150
                        ${med.status === 'taken'
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'border-slate-300 hover:border-brand-500 bg-white'}`}
                    >
                      {med.status === 'taken' && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                    <div>
                      <span className={`text-xs font-bold ${med.status === 'taken' ? 'line-through' : ''}`}>
                        {med.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">{med.dosage} • Time: {med.times_of_day}</span>
                    </div>
                  </div>
                  
                  {med.status !== 'taken' && (
                    <span className="text-[10px] text-brand-600 bg-brand-50 font-bold px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                  {med.status === 'taken' && (
                    <span className="text-[10px] text-success-700 bg-success-50 font-bold px-2 py-0.5 rounded-full">
                      Logged Taken
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Health Insights */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><Sparkles className="h-4 w-4" /></div>
              <h3 className="font-extrabold text-slate-800 text-sm">AI Health Insights</h3>
            </div>

            <div className="space-y-3.5">
              {stats.ai_insights.map((insight, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <CircleDot className="h-3 w-3 mt-1.5 text-brand-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Followups & Recent History */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Appointments Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><Calendar className="h-4 w-4" /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Upcoming Consultations</h3>
          </div>

          <div className="space-y-3">
            {stats.upcoming_appointments.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3 text-center">No appointments scheduled.</p>
            ) : (
              stats.upcoming_appointments.map((app) => (
                <div key={app.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <div className="bg-brand-100 text-brand-700 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-700 truncate">{app.title}</h4>
                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">{app.doctor_name || 'Dr.'} • {app.location}</span>
                    <span className="text-[9px] text-brand-600 block mt-1.5 font-bold">
                      {new Date(app.date_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Highlights */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><Clock className="h-4 w-4" /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Recent History & Milestones</h3>
          </div>

          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
            {stats.recent_events.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3 text-center">No logs generated.</p>
            ) : (
              stats.recent_events.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-6.5 top-1.5 h-2.5 w-2.5 bg-brand-500 rounded-full border-2 border-white ring-4 ring-brand-50"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{event.title}</span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
