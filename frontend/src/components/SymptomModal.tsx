import React, { useState } from 'react';
import { X, FileSpreadsheet, Thermometer, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { SymptomLog } from '../types';

interface SymptomModalProps {
  onClose: () => void;
  onLogSaved: (newLog: SymptomLog) => void;
}

const SymptomModal: React.FC<SymptomModalProps> = ({ onClose, onLogSaved }) => {
  const [painLevel, setPainLevel] = useState(3);
  const [temperature, setTemperature] = useState<string>('36.7');
  const [heartRate, setHeartRate] = useState<string>('72');
  const [systolicBp, setSystolicBp] = useState<string>('120');
  const [diastolicBp, setDiastolicBp] = useState<string>('80');
  const [oxygenSaturation, setOxygenSaturation] = useState<string>('98');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/patient/symptoms', {
        pain_level: painLevel,
        temperature: temperature ? parseFloat(temperature) : null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        systolic_bp: systolicBp ? parseInt(systolicBp) : null,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
        oxygen_saturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        notes: notes.trim() || null,
      });
      onLogSaved(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save vital entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100/50 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Generate Recovery Report</h3>
              <p className="text-[10px] text-slate-400 block font-medium">Record metrics & compute updated health score</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Pain Scale (0-10) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700">Pain Level</label>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                painLevel >= 7 ? 'bg-red-50 text-red-600' : painLevel >= 4 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
              }`}>
                {painLevel}/10 - {painLevel >= 7 ? 'Severe' : painLevel >= 4 ? 'Moderate' : 'Mild'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={painLevel} 
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-500" 
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-1">
              <span>0 (None)</span>
              <span>5 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* Grid inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Temperature (°C)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300"
                  placeholder="36.7"
                />
                <Thermometer className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Oxygen Saturation (%)</label>
              <input 
                type="number" 
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300"
                placeholder="98"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Heart Rate (BPM)</label>
              <input 
                type="number" 
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300"
                placeholder="72"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Sys BP</label>
                <input 
                  type="number" 
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Dia BP</label>
                <input 
                  type="number" 
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300"
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Symptoms & Observations</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-300 h-20 resize-none"
              placeholder="Describe incision discomfort, fatigue, swelling or other notes..."
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-slate-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-brand-100"
            >
              {isSubmitting ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SymptomModal;
