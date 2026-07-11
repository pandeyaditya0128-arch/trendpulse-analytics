import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Upload, Database, FileSpreadsheet, Trash2, Clock, 
  CheckCircle2, AlertCircle, FileJson, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const DatasetManager: React.FC = () => {
  const { authToken } = useAuth();
  
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchDatasets = async () => {
    if (!authToken) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/datasets`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [authToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    // Read local file preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setPreviewData(parsed.slice(0, 5));
            setDetectedColumns(Object.keys(parsed[0] || {}));
          }
        } catch (e) {
          console.error("Failed to parse JSON file preview");
        }
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n");
        const headers = lines[0]?.split(",").map(h => h.trim()) || [];
        setDetectedColumns(headers);
        
        const previewRows = lines.slice(1, 6).map(line => {
          const values = line.split(",");
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx]?.trim() || "";
          });
          return rowObj;
        });
        setPreviewData(previewRows);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !authToken) return;
    setUploadLoading(true);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` },
        body: formData
      });
      if (res.ok) {
        alert("Dataset uploaded and processed successfully!");
        setUploadedFile(null);
        setPreviewData([]);
        setDetectedColumns([]);
        fetchDatasets();
      } else {
        const err = await res.json();
        alert(err.detail || "Upload failed");
      }
    } catch (e) {
      console.error(e);
      alert("Upload failed due to network error");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!authToken) return;
    if (!confirm("Are you sure you want to delete this dataset? This will reload the default mock workspace dataset.")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/datasets/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        setDatasets(prev => prev.filter(d => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dataset Manager</h1>
        <p className="text-xs text-slate-500">Upload CSV or JSON files to feed your custom trend data directly into the analytical dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload form panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Uploader Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Upload size={14} className="text-purple-400" /> Upload New Dataset</span>
            
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-950/20">
                <div className="h-12 w-12 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold">Choose a file to upload</span>
                  <span className="text-[10px] text-slate-500">Supports standard CSV or formatted JSON up to 10MB</span>
                </div>
                <input
                  type="file"
                  required
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="dataset-file-input"
                />
                <label
                  htmlFor="dataset-file-input"
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Select File
                </label>
              </div>

              {uploadedFile && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3.5 bg-purple-950/10 border border-purple-500/10 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      {uploadedFile.name.endsWith(".json") ? <FileJson size={16} className="text-yellow-400" /> : <FileSpreadsheet size={16} className="text-emerald-400" />}
                      <span className="text-xs font-bold text-slate-300">{uploadedFile.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-500/10 cursor-pointer"
                  >
                    {uploadLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play size={12} fill="white" />
                        <span>Process and Save Dataset</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Local Preview Card */}
          <AnimatePresence>
            {previewData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4 overflow-hidden"
              >
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> File Schema Validation & Preview</span>
                <div className="flex flex-wrap gap-2 py-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase self-center mr-1">Detected Columns:</span>
                  {detectedColumns.map(col => (
                    <span key={col} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px] border border-slate-800">
                      {col}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto border border-slate-900 rounded-xl">
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-900 text-slate-400">
                        {detectedColumns.slice(0, 5).map(col => (
                          <th key={col} className="px-4 py-2.5 font-bold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-900/40 last:border-0 hover:bg-slate-900/10">
                          {detectedColumns.slice(0, 5).map(col => (
                            <td key={col} className="px-4 py-2 max-w-[120px] truncate text-slate-400">{JSON.stringify(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History panel */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Clock size={14} className="text-cyan-400" /> Dataset Upload History</span>
          {loadingHistory ? (
            <div className="h-48 flex items-center justify-center">
              <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-slate-500">
              <AlertCircle size={24} />
              <p className="text-xs italic">No datasets uploaded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-1">
              {datasets.map((ds) => (
                <div key={ds.id} className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-slate-200 truncate">{ds.filename}</span>
                    <span className="text-[10px] text-slate-500">{ds.row_count} rows • {new Date(ds.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(ds.id)}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
