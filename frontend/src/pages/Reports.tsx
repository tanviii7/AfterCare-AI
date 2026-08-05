import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  Calendar, 
  FileSignature, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { MedicalReport } from '../types';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/patient/reports');
      setReports(response.data);
      if (response.data.length > 0) {
        setSelectedReport(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/patient/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setReports(prev => [response.data, ...prev]);
      setSelectedReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and analyze report.');
    } finally {
      setIsUploading(false);
      // Reset input element value
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] pl-[18rem] items-center justify-center bg-slate-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Parsing report library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pl-[18rem] bg-slate-50/30 p-8 grid grid-cols-3 gap-8 animate-fade-in">
      
      {/* Left panel: upload & list */}
      <div className="col-span-1 space-y-6 flex flex-col h-full">
        {/* Upload Container */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Upload Clinical Record</h3>
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            Upload PDF reports, blood works, or images. CareFlow will extract data, summarize results, and compare against historic benchmarks.
          </p>

          <label className={`
            border-2 border-dashed border-slate-200 hover:border-brand-300 rounded-2xl p-6
            flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors duration-200
            ${isUploading ? 'bg-slate-50/50 pointer-events-none' : 'bg-white'}`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                <span className="text-xs font-extrabold text-slate-600 mt-2">OCR text extraction in progress...</span>
                <span className="text-[9px] text-slate-400 font-medium">This may take a few seconds</span>
              </>
            ) : (
              <>
                <Upload className="h-7 w-7 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Select clinical document</span>
                <span className="text-[9px] text-slate-400 font-medium">Supports PDF, PNG, JPG</span>
              </>
            )}
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={isUploading}
            />
          </label>

          {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
        </div>

        {/* Reports History */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100/50 flex-1 flex flex-col space-y-4 overflow-hidden">
          <h3 className="font-extrabold text-slate-800 text-sm">Clinical Report History</h3>
          
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3 text-center">No reports uploaded yet.</p>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`
                    w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left
                    ${selectedReport?.id === report.id 
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-100' 
                      : 'bg-white border-slate-100 hover:border-brand-200 text-slate-700'}`}
                >
                  <FileText className={`h-5 w-5 flex-shrink-0 mt-0.5 ${selectedReport?.id === report.id ? 'text-white' : 'text-slate-400'}`} />
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold truncate leading-snug">{report.filename}</h4>
                    <span className={`text-[9px] font-semibold block mt-1 ${selectedReport?.id === report.id ? 'text-brand-100' : 'text-slate-400'}`}>
                      {new Date(report.upload_timestamp).toLocaleDateString()} • {report.file_type.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: analysis details */}
      <div className="col-span-2 space-y-6">
        {selectedReport ? (
          <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50 space-y-6 h-full flex flex-col justify-between">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-50 pb-5">
              <div className="space-y-1">
                <span className="text-[9px] text-brand-600 bg-brand-50 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI-Analyzed Record
                </span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">{selectedReport.filename}</h2>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Uploaded on {new Date(selectedReport.upload_timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-400 bg-slate-50 px-3 py-1 rounded-xl">
                {selectedReport.file_type.toUpperCase()}
              </span>
            </div>

            {/* AI Summary Block */}
            <div className="space-y-3.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="h-4.5 w-4.5 text-brand-500 animate-pulse" />
                <span>Patient-Friendly AI Summary</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {selectedReport.summary || 'Summary analysis processing...'}
              </p>
            </div>

            {/* AI Comparison Block */}
            <div className="space-y-3.5 bg-brand-50/20 p-5 rounded-2xl border border-brand-100/30">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
                <ShieldCheck className="h-4.5 w-4.5 text-brand-600" />
                <span>Comparative Trend Analysis</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {selectedReport.comparison_result || 'Historical trend comparisons complete.'}
              </p>
            </div>

            {/* Raw Extracted Data Block */}
            <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden min-h-[12rem] mt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-t border-slate-50 pt-5">
                <FileSignature className="h-4.5 w-4.5 text-slate-400" />
                <span>Raw Extracted Document Data</span>
              </div>
              <div className="flex-1 bg-slate-50/30 border border-slate-100 rounded-2xl p-4 overflow-y-auto text-[11px] font-mono text-slate-500 leading-normal whitespace-pre-wrap">
                {selectedReport.extracted_text || 'No text extracted.'}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-100/50 flex flex-col items-center justify-center text-center h-full space-y-4">
            <FileText className="h-10 w-10 text-slate-300" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">No Report Selected</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Select a document in the history list or upload a new record.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
