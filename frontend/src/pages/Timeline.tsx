import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  FileText, 
  Activity, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Loader2 
} from 'lucide-react';
import api from '../services/api';
import { TimelineEvent } from '../types';

const Timeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const response = await api.get('/api/patient/timeline');
        setEvents(response.data);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'symptom':
        return <Activity className="h-4.5 w-4.5 text-emerald-600" />;
      case 'medication':
        return <CheckCircle className="h-4.5 w-4.5 text-purple-600" />;
      case 'report':
        return <FileText className="h-4.5 w-4.5 text-blue-600" />;
      case 'appointment':
        return <Calendar className="h-4.5 w-4.5 text-indigo-600" />;
      case 'milestone':
        return <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
      default:
        return <Clock className="h-4.5 w-4.5 text-slate-500" />;
    }
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'symptom':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'medication':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'report':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'appointment':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'milestone':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] pl-[18rem] items-center justify-center bg-slate-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Assembling recovery clinical history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 space-y-6 animate-fade-in">
      
      <div className="max-w-3xl bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50">
        <h3 className="font-extrabold text-slate-800 text-base mb-6">Patient Clinical History</h3>

        <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium py-3 text-center">No history events logged.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="relative flex gap-4 items-start">
                
                {/* Visual Bullet Icon */}
                <div className="absolute -left-11.5 top-0.5 h-7 w-7 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center z-10">
                  {getEventIcon(event.event_type)}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-xs font-extrabold text-slate-700 leading-none">
                      {event.title}
                    </h4>
                    <span className={`text-[8px] font-extrabold border px-2 py-0.2 rounded-full uppercase tracking-wider ${getEventBadgeStyle(event.event_type)}`}>
                      {event.event_type}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(event.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                      {event.description}
                    </p>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Timeline;
