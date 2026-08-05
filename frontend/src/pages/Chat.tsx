import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { ChatMessage } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are my lifting restrictions?",
    "I missed my afternoon dose of Metoprolol, what do I do?",
    "What foods should I avoid after my bypass surgery?",
    "Do I have any follow-up appointments scheduled?",
    "मेरी रिकवरी के बारे में बताएं (Tell me about my recovery)"
  ];

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await api.get('/api/patient/chat');
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    fetchChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setIsSending(true);
    setError('');
    
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      patient_id: 0,
      sender: 'user',
      message: text,
      timestamp: new Date().toISOString(),
      has_warning: false
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');

    try {
      const response = await api.post('/api/patient/chat', { message: text });
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, tempUserMsg, response.data];
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const getAgentBadgeStyle = (sender: string) => {
    switch (sender) {
      case 'EmergencyAgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'AnalysisAgent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'TrackingAgent':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MedicationAgent':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'NutritionAgent':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'AppointmentAgent':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatAgentName = (sender: string) => {
    if (sender === 'user') return 'You';
    return sender.replace('Agent', ' Agent');
  };

  return (
    <div className="h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 flex flex-col relative animate-fade-in">
      
      {/* Clean Full-Width Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto p-4 md:p-6">
        
        {/* Messages Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
              <div className="bg-brand-50 p-4 rounded-3xl text-brand-600 shadow-sm border border-brand-100">
                <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Welcome to AfterCare AI Chat</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold mt-1">
                  Ask recovery queries in any language. Check drug schedules, review lab tests, or verify symptoms.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm
                  ${msg.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-500 text-white'}`}
                >
                  {msg.sender === 'user' ? 'U' : 'AI'}
                </div>

                <div className="space-y-1.5">
                  {/* Name Header / Agent Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-extrabold">
                      {formatAgentName(msg.sender)}
                    </span>
                    {msg.sender !== 'user' && (
                      <span className={`text-[8px] font-extrabold border px-2 py-0.2 rounded-full uppercase tracking-wider ${getAgentBadgeStyle(msg.sender)}`}>
                        {msg.sender === 'General' ? 'Central Supervisor' : 'Worker'}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-4.5 py-3 rounded-2xl text-xs font-semibold leading-relaxed border shadow-sm
                    ${msg.sender === 'user' 
                      ? 'bg-brand-500 text-white border-brand-500 rounded-tr-none' 
                      : msg.has_warning 
                        ? 'bg-red-50 border-red-100 text-slate-700 rounded-tl-none pulse-emergency' 
                        : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'}`}
                  >
                    {msg.has_warning && (
                      <div className="flex gap-2 items-center text-red-700 font-extrabold mb-2 text-xs border-b border-red-100 pb-1.5">
                        <ShieldAlert className="h-4 w-4 text-red-600 animate-bounce" />
                        <span>EMERGENCY PROTOCOL RECOMMENDATION</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{msg.message}</div>
                  </div>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex gap-3 mr-auto">
              <div className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">AI</div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold">Supervisor routing...</span>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4.5 w-4.5 text-brand-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Synthesizing clinical advice...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Replies */}
        {messages.length === 0 && (
          <div className="py-3 flex flex-wrap gap-2 justify-center">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="bg-white hover:bg-slate-50 text-[10px] text-slate-600 font-bold border border-slate-100 px-3.5 py-1.5 rounded-full transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }} 
          className="py-4 flex gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Type your recovery query here in any language..."
            className="flex-1 bg-white border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-300 shadow-sm transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white p-3.5 rounded-2xl transition-colors shadow-md shadow-brand-100 flex items-center justify-center"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Chat;
