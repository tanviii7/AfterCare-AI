import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Mail, Phone, Loader2, Save, Users } from 'lucide-react';
import api from '../services/api';
import { PatientProfile } from '../types';

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [conditions, setConditions] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  
  // Emergency Contact 1
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Emergency Contact 2
  const [emergency2Name, setEmergency2Name] = useState('');
  const [emergency2Phone, setEmergency2Phone] = useState('');
  
  const [notifs, setNotifs] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/patient/settings');
        setProfile(response.data);
        
        // Populate inputs
        setAge(response.data.age?.toString() || '');
        setGender(response.data.gender || '');
        setConditions(response.data.medical_conditions || '');
        setSurgeryType(response.data.surgery_type || '');
        setEmergencyName(response.data.emergency_contact_name || '');
        setEmergencyPhone(response.data.emergency_contact_phone || '');
        setEmergency2Name(response.data.emergency_contact_2_name || '');
        setEmergency2Phone(response.data.emergency_contact_2_phone || '');
        setNotifs(response.data.notification_preferences?.split(',') || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleNotif = (preference: string) => {
    setNotifs(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference) 
        : [...prev, preference]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/patient/settings', {
        age: age ? parseInt(age) : null,
        gender: gender || null,
        medical_conditions: conditions || null,
        surgery_type: surgeryType || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        emergency_contact_2_name: emergency2Name || null,
        emergency_contact_2_phone: emergency2Phone || null,
        notification_preferences: notifs.join(',')
      });
      setProfile(response.data);
      setSuccess('Settings updated successfully.');
    } catch (err) {
      setError('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] pl-[18rem] items-center justify-center bg-slate-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Retrieving patient preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 space-y-6 animate-fade-in">
      <form onSubmit={handleSave} className="max-w-2xl bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50 space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><SettingsIcon className="h-4.5 w-4.5" /></div>
            <h3 className="font-extrabold text-slate-800 text-base">Configuration & Preferences</h3>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors duration-200"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Settings</span>
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3.5 text-xs text-green-700 flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs text-red-600 flex items-center gap-2 font-semibold">
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Demographic Profile</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Age</label>
              <input 
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                placeholder="65"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Gender</label>
              <input 
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                placeholder="Male"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Recent Surgery / Procedure</label>
              <input 
                type="text"
                value={surgeryType}
                onChange={(e) => setSurgeryType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                placeholder="Coronary Bypass Graft (CABG)"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Chronic Conditions</label>
              <input 
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                placeholder="Hypertension"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Emergency Contacts (At least 2 contacts) */}
        <div className="space-y-4 border-t border-slate-50 pt-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" />
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Emergency Response Contacts (Min 2)</h4>
          </div>
          
          {/* Contact 1 */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Emergency Contact 1 (Primary)</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Contact Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 pl-9 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                    placeholder="Mary Doe"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 pl-9 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                    placeholder="+1-555-0199"
                  />
                  <Phone className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact 2 */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Emergency Contact 2 (Secondary)</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Contact Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={emergency2Name}
                    onChange={(e) => setEmergency2Name(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 pl-9 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                    placeholder="Robert Doe"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={emergency2Phone}
                    onChange={(e) => setEmergency2Phone(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 pl-9 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300"
                    placeholder="+1-555-0288"
                  />
                  <Phone className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section 3: Notification Preferences */}
        <div className="space-y-4 border-t border-slate-50 pt-5">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Alert Delivery Settings</h4>
          
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={notifs.includes('in-app')}
                onChange={() => handleToggleNotif('in-app')}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-500"
              />
              <span className="text-xs text-slate-600 font-bold">In-App Notifications</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={notifs.includes('email')}
                onChange={() => handleToggleNotif('email')}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-500"
              />
              <span className="text-xs text-slate-600 font-bold">Email Summaries</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={notifs.includes('sms')}
                onChange={() => handleToggleNotif('sms')}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-500"
              />
              <span className="text-xs text-slate-600 font-bold">SMS Emergency Alerts</span>
            </label>
          </div>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;
