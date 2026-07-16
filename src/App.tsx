import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, BarChart2, History, RefreshCw, BookOpen, User, Github, Award, CheckCircle,
  X, AlertCircle, Info, Menu
} from "lucide-react";

import SentimentAnalyzer from "./components/SentimentAnalyzer.tsx";
import StatsDashboard from "./components/StatsDashboard.tsx";
import HistoryTable from "./components/HistoryTable.tsx";
import RetrainPanel from "./components/RetrainPanel.tsx";
import DocGuide from "./components/DocGuide.tsx";
import { ModelInfo } from "./types.ts";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"analyzer" | "dashboard" | "history" | "retrain" | "docs">("analyzer");
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load algorithm details and corpus statistics
  const fetchModelInfo = async () => {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (err) {
      console.error("Failed to load model details:", err);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, [refreshStatsTrigger]);

  const triggerRefreshStats = () => {
    setRefreshStatsTrigger(prev => prev + 1);
  };

  // Toast Notification handler
  const showNotification = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const tabs = [
    { id: "analyzer" as const, label: "Text Analyzer", icon: Brain },
    { id: "dashboard" as const, label: "Analytics Hub", icon: BarChart2 },
    { id: "history" as const, label: "Prediction Logs", icon: History },
    { id: "retrain" as const, label: "Model Retraining", icon: RefreshCw },
    { id: "docs" as const, label: "Project Report", icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden">
      
      {/* Absolute ambient lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Academic Header Info bar */}
        <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-md shadow-indigo-100 shrink-0">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                  CSE Department Final Year Project
                </span>
                <span className="text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded uppercase">
                  VIVA Demonstration Ready
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold font-display tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
                NLP Sentiment & ML Analytics Engine
              </h1>
            </div>
          </div>

          {/* Academic metadata block */}
          <div className="flex flex-wrap gap-4 items-center bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-[11px] text-slate-600 shadow-sm font-medium">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Satyajit Pratihar</span>
            </div>
            <div className="hidden sm:block text-slate-200">|</div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Project Grade: A+</span>
            </div>
          </div>
        </header>

        {/* Dashboard Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Sidebar Navigation Tabs */}
          <nav className="w-full lg:w-64 shrink-0 glass-panel rounded-2xl p-4 space-y-1 relative bg-white">
            <div className="hidden lg:block">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-4 px-2">Navigation Panel</span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all relative cursor-pointer ${
                      isActive
                        ? "text-indigo-700 bg-indigo-50 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute left-0 w-1 h-1/2 bg-indigo-600 rounded-r"
                      />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Navigation bar */}
            <div className="lg:hidden bg-white">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Select Section</span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-white shadow-sm cursor-pointer hover:bg-slate-50"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>

              {mobileMenuOpen && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all relative cursor-pointer ${
                          isActive
                            ? "text-indigo-700 bg-indigo-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Content view area */}
          <main className="flex-1 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "analyzer" && (
                  <SentimentAnalyzer
                    onShowNotification={showNotification}
                    onTriggerRefreshStats={triggerRefreshStats}
                  />
                )}
                {activeTab === "dashboard" && (
                  <StatsDashboard
                    onShowNotification={showNotification}
                    refreshStatsTrigger={refreshStatsTrigger}
                  />
                )}
                {activeTab === "history" && (
                  <HistoryTable
                    onShowNotification={showNotification}
                    refreshStatsTrigger={refreshStatsTrigger}
                    onTriggerRefreshStats={triggerRefreshStats}
                  />
                )}
                {activeTab === "retrain" && (
                  <RetrainPanel
                    modelInfo={modelInfo}
                    onRefreshModelInfo={fetchModelInfo}
                    onShowNotification={showNotification}
                  />
                )}
                {activeTab === "docs" && <DocGuide />}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

        {/* Footer Academic Credits */}
        <footer className="mt-16 border-t border-slate-200 pt-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">© 2026 Sentiment Analysis & Machine Learning Platform</p>
            <p className="mt-1">CSE Senior Design Project - Natural Language Processing Specialization</p>
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400">Built using Express + React (Vite) + Custom Math Modules</span>
          </div>
        </footer>

      </div>

      {/* Floating Toast notification overlay */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl border pointer-events-auto flex items-start gap-3 shadow-lg ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-100 shadow-emerald-100/40"
                  : toast.type === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-100 shadow-rose-100/40"
                  : "bg-indigo-50 text-indigo-800 border-indigo-100 shadow-indigo-100/40"
              }`}
            >
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />}
              
              <div className="flex-1">
                <p className="text-xs font-semibold leading-relaxed font-sans">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
