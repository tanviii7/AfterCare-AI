import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import api from '../services/api';

interface LoginProps {
  onLoginSuccess: (token: string, userName: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post('/api/auth/demo-login');
      const { access_token, full_name, role } = response.data;
      onLoginSuccess(access_token, full_name || 'User', role);
      navigate('/');
    } catch (err: any) {
      setError('Demo login failed. Make sure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token, full_name, role } = response.data;
      onLoginSuccess(access_token, full_name || 'User', role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success-200/20 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8 relative">
        {/* Prominent Brand Header with Large Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <img 
            src="/logo.png" 
            alt="AfterCare AI Logo" 
            className="h-24 w-auto object-contain mb-4 drop-shadow-sm"
          />
          <h1 className="font-extrabold text-slate-800 text-2xl tracking-tight">AfterCare AI</h1>
          <p className="text-xs text-brand-600 font-extrabold uppercase tracking-wider mt-1">Smarter Recovery</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 mb-5 border border-red-100">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 pl-1">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 pl-10 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300 focus:bg-white transition-all duration-200"
                placeholder="patient@example.com"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <span className="text-[10px] text-brand-600 font-bold hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 pl-10 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300 focus:bg-white transition-all duration-200"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md shadow-brand-100 transition-colors duration-200 mt-2"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo Sandbox</span>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition-colors duration-200"
        >
          {isSubmitting ? 'Accessing...' : 'Demo Patient Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;
