import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Upload, Database, Trash2, Eye, RefreshCw, FileText,
  CheckCircle2, AlertCircle, Hash, Calendar, Type, BarChart2,
  Search, X, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface UploadResult {
  id: number;
  filename: string;
  rows: number;
  columns: number;
  file_size_kb: number;
  all_columns: string[];
  text_col: string | null;
  date_col: string | null;
  keyword_col: string | null;
  category_col: string | null;
  numeric_cols: string[];
  preview: Record<string, any>[];
  uploaded_at: string;
  message: string;
}

interface DatasetRecord {
  id: number;
  filename: string;
  row_count: number;
  columns: string[];
  uploaded_at: string;
}

export const DatasetManager: React.FC = () => {
  const { authToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: any[]; total: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchingId, setSearchingId] = useState<number | null>(null);

  const fetchDatasets = useCallback(async () => {
    if (!authToken) return;
    setLoadingDatasets(true);
    try {
      const res = await fetch(`${BACKEND}/api/datasets`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.ok) setDatasets(await res.json());
    } catch {}
    finally { setLoadingDatasets(false); }
  }, [authToken]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const uploadFile = async (file: File) => {
    if (!authToken) return;
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".json")) {
      setUploadError("Only CSV and JSON files are supported.");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${BACKEND}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${authToken}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setUploadResult(data);
      fetchDatasets();
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) uploadFile(f);
  };

  const handleDelete = async (id: number) => {
    if (!authToken || !window.confirm("Delete this dataset?")) return;
    setDeletingId(id);
    try {
      await fetch(`${BACKEND}/api/datasets/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${authToken}` } });
      setDatasets(prev => prev.filter(d => d.id !== id));
      if (uploadResult?.id === id) setUploadResult(null);
    } catch {}
    finally { setDeletingId(null); }
  };

  const handleReanalyze = async (id: number) => {
    if (!authToken) return;
    setReanalyzingId(id);
    try {
      const res = await fetch(`${BACKEND}/api/datasets/${id}/reanalyze`, { method: "POST", headers: { Authorization: `Bearer ${authToken}` } });
      const data = await res.json();
      alert(data.message || "Re-loaded into analytics engine.");
    } catch {}
    finally { setReanalyzingId(null); }
  };

  const handlePreview = async (id: number) => {
    if (previewId === id) { setPreviewId(null); setPreviewData(null); return; }
    setPreviewId(id);
    setLoadingPreview(true);
    try {
      const res = await fetch(`${BACKEND}/api/datasets/${id}/preview`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.ok) setPreviewData(await res.json());
    } catch {}
    finally { setLoadingPreview(false); }
  };

  const handleSearch = async (id: number) => {
    if (!searchKeyword.trim()) return;
    setSearchingId(id);
    try {
      const res = await fetch(`${BACKEND}/api/datasets/${id}/search?keyword=${encodeURIComponent(searchKeyword)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
        alert(`Found ${data.matches} matching records for "${searchKeyword}"`);
      }
    } catch {}
    finally { setSearchingId(null); }
  };

  const InfoChip = ({ icon: Icon, label, value, color = "text-slate-400" }: any) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-800/60">
      <Icon size={12} className={color} />
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-bold ml-auto ${color}`}>{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Dataset Manager</h1>
        <p className="text-xs text-slate-500 mt-1">Upload CSV or JSON datasets. Data is parsed, stored, and automatically used in Dashboard and Keyword Intelligence.</p>
      </div>

      {/* DROP ZONE */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`glass-card rounded-3xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
          isDragging ? "border-purple-500 bg-purple-950/20" : "border-slate-800 hover:border-slate-600"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFileSelect} />
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${isDragging ? "bg-purple-900/40 text-purple-400" : "bg-slate-900 text-slate-500"}`}>
          {uploading ? <RefreshCw size={24} className="animate-spin" /> : <Upload size={24} />}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-300">{uploading ? "Uploading and parsing…" : isDragging ? "Drop to upload" : "Drop CSV or JSON here"}</p>
          <p className="text-xs text-slate-600 mt-1">{uploading ? "Please wait" : "or click to browse · CSV and JSON supported"}</p>
        </div>
      </div>

      {/* UPLOAD ERROR */}
      {uploadError && (
        <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-xs text-red-400">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto cursor-pointer"><X size={12} /></button>
        </div>
      )}

      {/* UPLOAD RESULT CARD */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-3xl p-6 border border-emerald-900/30 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-900/60 pb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle2 size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-200">{uploadResult.filename}</p>
                <p className="text-[10px] text-slate-500">Uploaded {new Date(uploadResult.uploaded_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setUploadResult(null)} className="ml-auto cursor-pointer text-slate-600 hover:text-slate-400"><X size={14} /></button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <InfoChip icon={BarChart2}  label="Total Rows"    value={uploadResult.rows.toLocaleString()}     color="text-purple-400" />
              <InfoChip icon={Database}   label="Total Columns" value={uploadResult.columns}                   color="text-cyan-400" />
              <InfoChip icon={FileText}   label="File Size"     value={`${uploadResult.file_size_kb} KB`}      color="text-emerald-400" />
              <InfoChip icon={Type}       label="Text Column"   value={uploadResult.text_col}                  color="text-yellow-400" />
              <InfoChip icon={Calendar}   label="Date Column"   value={uploadResult.date_col}                  color="text-pink-400" />
              <InfoChip icon={Hash}       label="Keyword Col"   value={uploadResult.keyword_col}               color="text-indigo-400" />
              <InfoChip icon={Hash}       label="Category Col"  value={uploadResult.category_col}              color="text-orange-400" />
              {uploadResult.numeric_cols.length > 0 && (
                <InfoChip icon={BarChart2} label="Numeric Cols" value={uploadResult.numeric_cols.join(", ")} color="text-teal-400" />
              )}
            </div>

            {/* All columns */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">All Detected Columns</p>
              <div className="flex flex-wrap gap-1.5">
                {uploadResult.all_columns.map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400">{col}</span>
                ))}
              </div>
            </div>

            {/* Preview table */}
            {uploadResult.preview.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preview (first 10 rows)</p>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800">
                        {uploadResult.all_columns.slice(0, 6).map(col => (
                          <th key={col} className="px-3 py-2 text-left font-bold text-slate-400 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.preview.map((row, i) => (
                        <tr key={i} className="border-b border-slate-900/40 last:border-0 hover:bg-slate-900/20">
                          {uploadResult.all_columns.slice(0, 6).map(col => (
                            <td key={col} className="px-3 py-2 text-slate-400 max-w-[140px] truncate">{String(row[col] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[11px] text-emerald-400">
              <CheckCircle2 size={13} />
              Dataset is now available in Dashboard, Keyword Intelligence, and Trend Comparison.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVED DATASETS LIST */}
      <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Database size={14} className="text-cyan-400" /> Saved Datasets ({datasets.length})
          </span>
          <button onClick={fetchDatasets} disabled={loadingDatasets}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-500 hover:text-slate-300 cursor-pointer disabled:opacity-50">
            <RefreshCw size={12} className={loadingDatasets ? "animate-spin" : ""} />
          </button>
        </div>

        {loadingDatasets ? (
          <div className="h-32 flex items-center justify-center">
            <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-slate-600 text-center">
            <Database size={28} />
            <p className="text-xs italic">No datasets uploaded yet. Drop a CSV above to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="flex gap-2 items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-purple-500 transition-colors">
              <Search size={13} className="text-slate-500" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Search keyword across datasets…"
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1"
              />
              {searchKeyword && <button onClick={() => { setSearchKeyword(""); setSearchResults(null); }} className="text-slate-600 hover:text-slate-400 cursor-pointer"><X size={12} /></button>}
            </div>

            {datasets.map(ds => (
              <div key={ds.id} className="flex flex-col gap-3 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                {/* Dataset header row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{ds.filename}</p>
                      <p className="text-[10px] text-slate-500">{ds.row_count.toLocaleString()} rows · {ds.columns.length} cols · {new Date(ds.uploaded_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSearch(ds.id)}
                      disabled={!searchKeyword.trim() || searchingId === ds.id}
                      title="Search this dataset"
                      className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-500 hover:text-cyan-400 disabled:opacity-40 cursor-pointer transition-colors">
                      {searchingId === ds.id ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                    </button>
                    <button
                      onClick={() => handlePreview(ds.id)}
                      title="Preview dataset"
                      className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-500 hover:text-purple-400 cursor-pointer transition-colors">
                      {previewId === ds.id ? <ChevronUp size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      onClick={() => handleReanalyze(ds.id)}
                      disabled={reanalyzingId === ds.id}
                      title="Re-load into analytics"
                      className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-500 hover:text-emerald-400 disabled:opacity-50 cursor-pointer transition-colors">
                      <RefreshCw size={12} className={reanalyzingId === ds.id ? "animate-spin" : ""} />
                    </button>
                    <button
                      onClick={() => handleDelete(ds.id)}
                      disabled={deletingId === ds.id}
                      title="Delete dataset"
                      className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-500 hover:text-red-400 disabled:opacity-50 cursor-pointer transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Column pills */}
                <div className="flex flex-wrap gap-1">
                  {ds.columns.slice(0, 10).map(col => (
                    <span key={col} className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-500 border border-slate-700/60">{col}</span>
                  ))}
                  {ds.columns.length > 10 && <span className="text-[9px] text-slate-600 self-center">+{ds.columns.length - 10} more</span>}
                </div>

                {/* Inline preview */}
                <AnimatePresence>
                  {previewId === ds.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      {loadingPreview ? (
                        <div className="h-20 flex items-center justify-center">
                          <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : previewData && (
                        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-[9px] border-collapse">
                            <thead>
                              <tr className="bg-slate-950 border-b border-slate-800">
                                {previewData.columns.slice(0, 7).map(col => (
                                  <th key={col} className="px-3 py-2 text-left font-bold text-slate-400 whitespace-nowrap">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.rows.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-slate-900/40 last:border-0 hover:bg-slate-900/20">
                                  {previewData.columns.slice(0, 7).map(col => (
                                    <td key={col} className="px-3 py-1.5 text-slate-500 max-w-[120px] truncate">{String(row[col] ?? "")}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-[9px] text-slate-600 px-3 py-2">Showing 20 of {previewData.total} rows</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOW TO USE */}
      <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider">How Datasets Are Used</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400">
          {[
            { icon: BarChart2, title: "Dashboard", desc: "Dataset records populate trend volume charts and KPI metrics." },
            { icon: Search,    title: "Keyword Intelligence", desc: "Searches run against dataset text and keyword columns." },
            { icon: Database,  title: "Trend Comparison", desc: "Dataset records are included when comparing two keywords." },
            { icon: RefreshCw, title: "Re-analyze", desc: "Click the ↺ icon to re-inject any saved dataset into the analytics engine." }
          ].map(item => (
            <div key={item.title} className="flex gap-3 p-3 bg-slate-900/30 rounded-xl">
              <item.icon size={14} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-300">{item.title}</p>
                <p className="text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
