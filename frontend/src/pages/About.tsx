import React from 'react';
import { 
  Bot, 
  Cpu, 
  Database, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  Activity, 
  Pill, 
  Utensils, 
  Calendar,
  Globe
} from 'lucide-react';

const About: React.FC = () => {
  const agents = [
    {
      name: 'Supervisor Agent',
      badge: 'Central Orchestrator',
      color: 'bg-brand-50 text-brand-700 border-brand-200',
      icon: Bot,
      description: 'Intelligently analyzes patient query intent, chat memory, and vitals to route work to specialized agents.'
    },
    {
      name: 'Emergency Agent',
      badge: 'High Priority Triage',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: ShieldAlert,
      description: 'Pre-checks vitals and text for red-flag symptoms (chest pain, dyspnea). Triggers emergency caregiver notifications.'
    },
    {
      name: 'Analysis Agent',
      badge: 'Lab & Clinical RAG',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: FileText,
      description: 'Parses uploaded PDFs/images using Gemini Vision OCR, performs clinical guideline vector search (RAG), and compares test history.'
    },
    {
      name: 'Tracking Agent',
      badge: 'Vitals & Milestones',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Activity,
      description: 'Monitors daily symptom trends, computes dynamic health scores, and tracks recovery milestone completion.'
    },
    {
      name: 'Medication Agent',
      badge: 'Pharmacology Guide',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Pill,
      description: 'Manages drug schedules, handles missed dosage queries, checks adherence rates, and provides safety warnings.'
    },
    {
      name: 'Nutrition Agent',
      badge: 'Dietary Guidance',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Utensils,
      description: 'Generates personalized post-operative dietary advice (foods to eat, foods to avoid, protein goals) based on procedure type.'
    },
    {
      name: 'Appointment Agent',
      badge: 'Follow-up Scheduler',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Calendar,
      description: 'Reminds patients of upcoming outpatient consultations and post-discharge imaging diagnostics.'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 space-y-8 animate-fade-in">
      
      {/* Main Hero Card with Watermark Logo */}
      <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50 relative overflow-hidden">
        {/* Transparent Logo Watermark Background */}
        <div className="absolute right-[-2rem] bottom-[-2rem] opacity-[0.06] pointer-events-none select-none">
          <img src="/logo.png" alt="AfterCare AI Watermark" className="w-[32rem] h-auto object-contain" />
        </div>

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AfterCare AI Logo" className="h-12 w-auto object-contain" />
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">AfterCare AI</h2>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Smarter Recovery • Multi-Agent Healthcare Platform</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            AfterCare AI is an enterprise-grade post-treatment care guidance platform designed for hospital discharge recovery. 
            It features an intelligent **Supervisor-Worker Multi-Agent Architecture**, Retrieval-Augmented Generation (RAG) over clinical guidelines, 
            multilingual AI processing, and real-time vital monitoring.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-500" />
              <span className="text-xs font-bold text-slate-700">Native Multilingual Support</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">RAG Clinical Guidelines</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-xs font-bold text-slate-700">Emergency Red-Flag Triage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Cards */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-800 text-base">Technology Stack</h3>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl w-fit"><Cpu className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-xs text-slate-800">Backend API</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-snug">FastAPI • Python 3.13 • Uvicorn • Pydantic v2</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl w-fit"><Layers className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-xs text-slate-800">Frontend UI</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-snug">React 18 • TypeScript • Tailwind CSS v3 • Recharts</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl w-fit"><Bot className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-xs text-slate-800">AI & Multi-Agents</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-snug">Gemini 2.5 Flash • LangChain / LangGraph Architecture</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit"><Database className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-xs text-slate-800">Database & Vector Storage</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-snug">SQLAlchemy • SQLite / PostgreSQL • Vector Cosine Similarity</p>
          </div>
        </div>
      </div>

      {/* Multi-Agent Architecture Details */}
      <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50 space-y-6 relative overflow-hidden">
        {/* Secondary Watermark */}
        <div className="absolute left-[-3rem] top-[-3rem] opacity-[0.04] pointer-events-none select-none">
          <img src="/logo.png" alt="Watermark" className="w-96 h-auto" />
        </div>

        <div className="relative z-10 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Supervisor-Worker Agent Specifications</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
            Our multi-agent system decouples complex medical inquiries into domain-specific worker agents, orchestrated by a central Supervisor Agent:
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {agents.map((agent, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3.5 items-start">
                <div className={`p-2.5 rounded-xl border flex-shrink-0 ${agent.color}`}>
                  <agent.icon className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-800">{agent.name}</h4>
                    <span className={`text-[8px] font-extrabold px-2 py-0.2 rounded-full border ${agent.color}`}>
                      {agent.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
