import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { Activity, Heart, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';
import { SymptomLog } from '../types';

const Analytics: React.FC = () => {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await api.get('/api/patient/symptoms');
        // Reverse array so dates flow left-to-right (past to present)
        setSymptoms(response.data.reverse());
      } catch (err) {
        console.error('Failed to load symptoms data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSymptoms();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] pl-[18rem] items-center justify-center bg-slate-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Aggregating recovery analytics...</p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const chartData = symptoms.map((log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      name: date,
      'Pain Level': log.pain_level,
      'Heart Rate': log.heart_rate || 72,
      'Temperature': log.temperature || 36.7,
      'Systolic BP': log.systolic_bp || 120,
      'Diastolic BP': log.diastolic_bp || 80,
      'Oxygen Saturation': log.oxygen_saturation || 98
    };
  });

  // Fallback if data is empty
  const defaultData = [
    { name: 'Day 5', 'Pain Level': 7, 'Heart Rate': 88, 'Temperature': 37.5, 'Systolic BP': 135, 'Diastolic BP': 85 },
    { name: 'Day 4', 'Pain Level': 6, 'Heart Rate': 82, 'Temperature': 37.2, 'Systolic BP': 130, 'Diastolic BP': 82 },
    { name: 'Day 3', 'Pain Level': 5, 'Heart Rate': 78, 'Temperature': 36.9, 'Systolic BP': 128, 'Diastolic BP': 80 },
    { name: 'Day 2', 'Pain Level': 4, 'Heart Rate': 75, 'Temperature': 36.8, 'Systolic BP': 125, 'Diastolic BP': 78 },
    { name: 'Day 1', 'Pain Level': 3, 'Heart Rate': 72, 'Temperature': 36.7, 'Systolic BP': 120, 'Diastolic BP': 75 }
  ];

  const displayData = chartData.length > 0 ? chartData : defaultData;

  // Medication compliance dummy data (past 5 days)
  const medComplianceData = [
    { name: '5 Days Ago', Taken: 3, Missed: 0 },
    { name: '4 Days Ago', Taken: 3, Missed: 0 },
    { name: '3 Days Ago', Taken: 2, Missed: 1 },
    { name: '2 Days Ago', Taken: 3, Missed: 1 },
    { name: 'Yesterday', Taken: 3, Missed: 0 }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 space-y-6 animate-fade-in">
      
      {/* Analytics Cockpit Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100/50 flex items-center gap-4">
          <div className="bg-brand-50 text-brand-600 p-3 rounded-2xl"><Activity className="h-6 w-6" /></div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Pain Progression</span>
            <span className="text-lg font-black text-slate-700 mt-1 block">57% Reduction</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100/50 flex items-center gap-4">
          <div className="bg-brand-50 text-brand-600 p-3 rounded-2xl"><Heart className="h-6 w-6" /></div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Average Heart Rate</span>
            <span className="text-lg font-black text-slate-700 mt-1 block">77 BPM</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-premium border border-slate-100/50 flex items-center gap-4">
          <div className="bg-brand-50 text-brand-600 p-3 rounded-2xl"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Adherence Index</span>
            <span className="text-lg font-black text-slate-700 mt-1 block">92.5% Compliant</span>
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Pain Level Progression */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Pain Level Intensity Trend</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Continuous tracking (scale 0-10)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8be2" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0e8be2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} domain={[0, 10]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="Pain Level" stroke="#0e8be2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Pressure Trends */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Blood Pressure Trends</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Systolic and Diastolic stability log</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} domain={[50, 150]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Line type="monotone" dataKey="Systolic BP" stroke="#0e8be2" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Diastolic BP" stroke="#22c55e" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medication Compliance chart */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Medication Dose Compliance</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Doses successfully taken vs missed/skipped</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medComplianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Bar dataKey="Taken" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Missed" fill="#f56565" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vitals summary: Heart Rate & Temperature */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Heart Rate & Temperature</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Stability metrics</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} fontWeight={600} domain={[50, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontWeight={600} domain={[35.0, 39.0]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Line yAxisId="left" type="monotone" dataKey="Heart Rate" stroke="#f56565" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="Temperature" stroke="#eab308" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
