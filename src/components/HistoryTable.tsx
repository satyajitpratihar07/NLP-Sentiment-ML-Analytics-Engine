import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Trash2, Calendar, Cpu, Smile, Download, ChevronLeft, ChevronRight,
  Eye, Filter, AlertCircle, X, ShieldAlert
} from "lucide-react";
import { PredictionRecord, SentimentClass } from "../types.ts";

interface HistoryTableProps {
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
  refreshStatsTrigger: number;
  onTriggerRefreshStats: () => void;
}

export default function HistoryTable({ onShowNotification, refreshStatsTrigger, onTriggerRefreshStats }: HistoryTableProps) {
  const [historyList, setHistoryList] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination state
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected record for deep detail view modal
  const [selectedRecord, setSelectedRecord] = useState<PredictionRecord | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/history", window.location.origin);
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("limit", "10");
      if (search) url.searchParams.append("search", search);
      if (sentimentFilter !== "all") url.searchParams.append("sentiment", sentimentFilter);
      if (emotionFilter !== "all") url.searchParams.append("emotion", emotionFilter);
      if (modelFilter !== "all") url.searchParams.append("modelUsed", modelFilter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load history list.");
      const data = await res.json();
      setHistoryList(data.history);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.totalCount);
    } catch (err: any) {
      onShowNotification(err.message || "Failed to load history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, search, sentimentFilter, emotionFilter, modelFilter, refreshStatsTrigger]);

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening modal
    if (!confirm("Are you sure you want to delete this analysis record?")) return;

    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record.");
      onShowNotification("Record deleted successfully.", "success");
      onTriggerRefreshStats(); // Trigger re-render of charts & stats
    } catch (err: any) {
      onShowNotification(err.message || "Deletion failed", "error");
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to delete ALL sentiment prediction history? This action is irreversible.")) return;

    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear history.");
      onShowNotification("All history logs cleared.", "success");
      onTriggerRefreshStats();
    } catch (err: any) {
      onShowNotification(err.message || "Clearing failed", "error");
    }
  };

  // List of unique emotions for filters
  const emotionsList = ["Joy", "Sadness", "Anger", "Fear", "Surprise", "Neutral"];
  const modelsList = ["Naive Bayes", "Logistic Regression", "Linear SVM"];

  const getSentimentTagStyles = (sentiment: SentimentClass) => {
    if (sentiment === "positive") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (sentiment === "negative") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    } else {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Controls */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search text box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex w-full md:w-auto gap-2 justify-end">
            <a
              href="/api/export-csv"
              download
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
            
            {historyList.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Clear All History
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filters:
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sentiment:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Emotion Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Emotion:</span>
            <select
              value={emotionFilter}
              onChange={(e) => {
                setEmotionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Emotions</option>
              {emotionsList.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Model:</span>
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Models</option>
              {modelsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div className="glass-panel rounded-2xl overflow-hidden bg-white">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Retrieving dataset logs from disk...</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No predictions matching filters</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try modifying your keyword search queries or filters to explore past calculations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold font-display bg-slate-50/50">
                  <th className="py-4 px-6">Input Content Preview</th>
                  <th className="py-4 px-4">Predicted Sentiment</th>
                  <th className="py-4 px-4">Confidence</th>
                  <th className="py-4 px-4">Emotion Tag</th>
                  <th className="py-4 px-4">Classifier Engine</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-slate-100 font-sans"
              >
                {historyList.map((record) => (
                  <motion.tr
                    key={record.id}
                    variants={rowVariants}
                    onClick={() => setSelectedRecord(record)}
                    className="hover:bg-slate-50/70 cursor-pointer group transition-colors"
                  >
                    <td className="py-4 px-6 max-w-sm">
                      <p className="text-slate-800 font-medium truncate group-hover:text-indigo-600 transition-colors">
                        {record.text}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${getSentimentTagStyles(record.sentiment)}`}>
                        {record.sentiment}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-700">{(record.confidence * 100).toFixed(0)}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40">
                          <div
                            className={`h-full ${
                              record.sentiment === "positive"
                                ? "bg-emerald-500"
                                : record.sentiment === "negative"
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${record.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {record.emotion}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                        <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        {record.modelUsed}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 active:scale-90 transition-all cursor-pointer shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          className="p-1.5 rounded-lg bg-rose-5 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:scale-90 transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/20">
            <span className="text-xs text-slate-500">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalRecords} total items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deep Detail View Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative z-10 bg-white border border-slate-100"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">Prediction Audit Ledger</span>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                
                {/* Sentiment & Emotion Hero badges */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Inferred Sentiment</span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize ${getSentimentTagStyles(selectedRecord.sentiment)}`}>
                      {selectedRecord.sentiment} ({(selectedRecord.confidence * 100).toFixed(0)}% confidence)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Dominant Emotion</span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
                      <Smile className="w-4 h-4 text-indigo-500" /> {selectedRecord.emotion}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Classifier Engine</span>
                    <span className="bg-purple-50 border border-purple-100 text-purple-700 font-mono text-[11px] px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Cpu className="w-4 h-4 text-purple-500" /> {selectedRecord.modelUsed}
                    </span>
                  </div>
                </div>

                {/* Text Display */}
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2">Original Content</span>
                  <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 leading-relaxed font-sans select-all shadow-inner">
                    {selectedRecord.text}
                  </div>
                </div>

                {/* Sentence-wise Breakdown */}
                {selectedRecord.sentences && selectedRecord.sentences.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2">Sentence-Level Sentiment Segmentation</span>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selectedRecord.sentences.map((sent, idx) => (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded-xl text-[11px] border leading-relaxed flex justify-between items-center ${
                            sent.sentiment === "positive"
                              ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                              : sent.sentiment === "negative"
                              ? "bg-rose-50/50 border-rose-100 text-rose-800"
                              : "bg-blue-50/50 border-blue-100 text-blue-800"
                          }`}
                        >
                          <span className="font-medium max-w-md truncate">{sent.text}</span>
                          <span className="font-mono font-bold text-[10px] shrink-0 ml-4">
                            {sent.sentiment.toUpperCase()} ({(sent.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation */}
                {selectedRecord.aiExplanation && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2">Generative Explainability Logic</span>
                    <div className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed font-sans relative shadow-sm">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl" />
                      <p className="relative z-10">{selectedRecord.aiExplanation}</p>
                    </div>
                  </div>
                )}

                {/* Keywords Cloud */}
                {selectedRecord.keywords && selectedRecord.keywords.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2">Top Lexical Keywords Detected</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.keywords.map((kw, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm"
                        >
                          <span>{kw.word}</span>
                          <span className="text-slate-400 font-bold font-sans">({kw.score.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Calculated: {new Date(selectedRecord.timestamp).toLocaleString()}</span>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold font-sans px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
