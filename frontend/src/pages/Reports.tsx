import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, Download, Trash2, Calendar, AlertCircle, 
  FileSpreadsheet, File
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const Reports: React.FC = () => {
  const { authToken } = useAuth();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const fetchReports = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [authToken]);

  const handleDelete = async (id: number) => {
    if (!authToken) return;
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("pdf-report-content");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#020617" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`trendpulse_${selectedReport.keyword}_report.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Generated Reports</h1>
        <p className="text-xs text-slate-500">View and export your saved Gemini AI research analysis reports in PDF, Excel, or CSV formats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Reports List */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><FileText size={14} className="text-purple-400" /> Saved AI Reports</span>
          
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-slate-500">
              <AlertCircle size={24} />
              <p className="text-xs italic">No saved reports found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] pr-1">
              {reports.map((r) => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedReport(r)}
                  className={`p-3.5 border rounded-2xl flex justify-between items-center text-xs cursor-pointer transition-colors ${
                    selectedReport?.id === r.id 
                      ? "bg-purple-950/20 border-purple-500/35" 
                      : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-slate-200 truncate">#{r.keyword} Intelligence Report</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} /> {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Report Details */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="flex flex-col gap-4">
              {/* EXPORT ACTION BAR */}
              <div className="flex flex-wrap items-center justify-between p-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl gap-3">
                <span className="text-xs font-bold text-slate-200">#Export Formats for {selectedReport.keyword}</span>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg font-semibold flex items-center gap-1.5 border border-purple-500/20 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>PDF</span>
                  </button>
                  <a
                    href={`${BACKEND_URL}/api/reports/export/csv?keyword=${selectedReport.keyword}`}
                    download
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <File size={12} className="text-cyan-400" />
                    <span>CSV</span>
                  </a>
                  <a
                    href={`${BACKEND_URL}/api/reports/export/excel?keyword=${selectedReport.keyword}`}
                    download
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={12} className="text-emerald-400" />
                    <span>Excel</span>
                  </a>
                </div>
              </div>

              {/* REPORT PREVIEW */}
              <div 
                id="pdf-report-content"
                className="glass-card rounded-3xl p-8 border border-slate-900/60 flex flex-col gap-6 text-slate-300"
              >
                <div className="border-b border-slate-900 pb-6 flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white">TrendPulse AI Report</h2>
                    <span className="text-xs text-slate-500">Platform intelligence and market velocity summaries</span>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <p>Report ID: tp_rep_{selectedReport.id}</p>
                    <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-purple-400 text-sm">#Executive Summary</span>
                    <p className="leading-relaxed text-slate-400 text-[11px]">{selectedReport.report.executive_summary}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-purple-400 text-sm">#Sentiment & Public Emotion</span>
                    <p className="leading-relaxed text-slate-400 text-[11px]">{selectedReport.report.sentiment_summary}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-purple-400 text-sm">#Business & Strategic Insights</span>
                    <p className="leading-relaxed text-slate-400 text-[11px]">{selectedReport.report.business_insights}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-purple-400 text-sm">#Future Growth Projection</span>
                    <p className="leading-relaxed text-slate-400 text-[11px]">{selectedReport.report.future_prediction}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 border border-dashed border-slate-900 rounded-3xl flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-600 bg-slate-950/10">
              <FileText size={32} />
              <p className="text-xs italic">Select a report from the sidebar to view details and export.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
