import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart3, PieChart, TrendingUp, Cpu, Award, RefreshCw, AlertCircle, Sparkles, Smile, MessageSquare
} from "lucide-react";
import { DashboardStats } from "../types.ts";

interface StatsDashboardProps {
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
  refreshStatsTrigger: number;
}

export default function StatsDashboard({ onShowNotification, refreshStatsTrigger }: StatsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load statistics.");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      onShowNotification(err.message || "Failed to load stats", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshStatsTrigger]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Recalculating database analytics aggregations...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center space-y-2 text-slate-500 text-xs">
        <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        Failed to aggregate statistics. Try analyzing some texts first!
      </div>
    );
  }

  // Sentiment ratio calculations
  const totalSent = stats.sentimentCounts.positive + stats.sentimentCounts.neutral + stats.sentimentCounts.negative || 1;
  const posPct = (stats.sentimentCounts.positive / totalSent) * 100;
  const neuPct = (stats.sentimentCounts.neutral / totalSent) * 100;
  const negPct = (stats.sentimentCounts.negative / totalSent) * 100;

  // Render variables for customized interactive SVG Donut Chart
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference;

  // Segment offsets for Donut
  const posOffset = circumference - (posPct / 100) * circumference;
  const neuOffset = circumference - (neuPct / 100) * circumference;
  const negOffset = circumference - (negPct / 100) * circumference;

  // Custom SVG Line Chart coordinates for Sentiment Trend over time
  // Group days or timeline points
  const drawTrendLine = () => {
    if (!stats.timeline || stats.timeline.length < 2) return "";
    const paddingX = 40;
    const paddingY = 30;
    const width = 500;
    const height = 150;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const maxCount = Math.max(...stats.timeline.map(t => t.count)) || 1;

    return stats.timeline.map((t, idx) => {
      const x = paddingX + (idx / (stats.timeline.length - 1)) * chartWidth;
      const y = height - paddingY - (t.count / maxCount) * chartHeight;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  // Extract emotions list
  const sortedEmotions = Object.entries(stats.emotions || {})
    .map(([emotion, value]) => ({ emotion, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const maxEmotionValue = Math.max(...sortedEmotions.map(e => e.value)) || 1;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 4 Cards: Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Predictions */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 flex items-center justify-between bg-white">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block mb-1">Total Analysed Logs</span>
            <span className="text-slate-900 font-display font-bold text-2xl">{stats.totalCount}</span>
            <span className="text-slate-400 text-[10px] block mt-1">Queries parsed in database</span>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 2: Average Confidence */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 flex items-center justify-between bg-white">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block mb-1">Avg Confidence Score</span>
            <span className="text-slate-900 font-display font-bold text-2xl">{(stats.averageConfidence * 100).toFixed(0)}%</span>
            <span className="text-slate-400 text-[10px] block mt-1">Classification threshold</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 3: Active Best Model */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 flex items-center justify-between bg-white">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block mb-1">Optimized Algorithm</span>
            <span className="text-slate-900 font-display font-bold text-base truncate max-w-[150px] block mt-1">
              {stats.modelPerformance?.[0] ? stats.modelPerformance[0].modelType : "Naive Bayes"}
            </span>
            <span className="text-purple-600 text-[10px] block mt-1 font-semibold">Active model selected</span>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 4: F1-Score Benchmark */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 flex items-center justify-between bg-white">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block mb-1">Optimal Model F1 Score</span>
            <span className="text-slate-900 font-display font-bold text-2xl">
              {stats.modelPerformance?.[0] ? `${(stats.modelPerformance[0].metrics.f1Score * 100).toFixed(0)}%` : "N/A"}
            </span>
            <span className="text-slate-400 text-[10px] block mt-1">Accuracy index score</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl shadow-sm">
            <Award className="w-5 h-5" />
          </div>
        </motion.div>

      </div>

      {/* Grid: Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sentiment Distribution Donut Chart */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs mb-2 font-semibold">
              <PieChart className="w-4 h-4" /> Ratio Analysis
            </div>
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4">Sentiment Composition</h2>
          </div>

          <div className="flex justify-center items-center py-6 relative">
            <svg width="150" height="150" className="-rotate-90">
              {/* Positive Segment */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="rgba(16, 185, 129, 0.1)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={posOffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />

              {/* Negative Segment Inside Ring or Offset */}
              <circle
                cx="75"
                cy="75"
                r={radius - 14}
                fill="transparent"
                stroke="rgba(244, 63, 94, 0.1)"
                strokeWidth={strokeWidth - 2}
              />
              <circle
                cx="75"
                cy="75"
                r={radius - 14}
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth={strokeWidth - 2}
                strokeDasharray={circumference}
                strokeDashoffset={negOffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />

              {/* Neutral Segment */}
              <circle
                cx="75"
                cy="75"
                r={radius - 26}
                fill="transparent"
                stroke="rgba(59, 130, 246, 0.1)"
                strokeWidth={strokeWidth - 4}
              />
              <circle
                cx="75"
                cy="75"
                r={radius - 26}
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth={strokeWidth - 4}
                strokeDasharray={circumference}
                strokeDashoffset={neuOffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>

            {/* Inner Details */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">POS %</span>
              <span className="text-slate-800 font-bold font-display text-lg">{posPct.toFixed(0)}%</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 text-xs font-mono">
            <div className="flex justify-between items-center text-emerald-700 font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive</span>
              <span>{stats.sentimentCounts.positive} items ({posPct.toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between items-center text-blue-700 font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Neutral</span>
              <span>{stats.sentimentCounts.neutral} items ({neuPct.toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between items-center text-rose-700 font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Negative</span>
              <span>{stats.sentimentCounts.negative} items ({negPct.toFixed(0)}%)</span>
            </div>
          </div>
        </motion.div>

        {/* Emotion Distribution Horizontal Bar Chart */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs mb-2 font-semibold">
              <Smile className="w-4 h-4" /> Semantic Tone
            </div>
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4">Emotional Tone Analysis</h2>
          </div>

          <div className="space-y-4 py-2">
            {sortedEmotions.length > 0 ? (
              sortedEmotions.slice(0, 5).map((e) => {
                const emotionPct = (e.value / maxEmotionValue) * 100;
                return (
                  <div key={e.emotion} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium flex items-center gap-1.5 font-display">
                        {e.emotion}
                      </span>
                      <span className="font-mono text-slate-400 font-semibold">{e.value} logs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          e.emotion === "Joy"
                            ? "bg-emerald-500"
                            : e.emotion === "Anger"
                            ? "bg-rose-500"
                            : e.emotion === "Sadness"
                            ? "bg-amber-500"
                            : e.emotion === "Fear"
                            ? "bg-purple-500"
                            : e.emotion === "Surprise"
                            ? "bg-indigo-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${emotionPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-mono">No emotional metadata recorded yet.</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 mt-4 text-center">
            Extracted using AI classification algorithms
          </div>
        </motion.div>

        {/* Sentiment Timeline Line Graph (Custom SVG) */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs mb-2 font-semibold">
              <TrendingUp className="w-4 h-4" /> Temporal Flow
            </div>
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4">Temporal Trend Volume</h2>
          </div>

          {stats.timeline && stats.timeline.length > 1 ? (
            <div className="py-4 flex justify-center items-center">
              <svg width="250" height="120" viewBox="0 0 500 150" className="overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="30" x2="460" y2="30" stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
                <line x1="40" y1="90" x2="460" y2="90" stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="460" y2="120" stroke="rgba(0,0,0,0.08)" />

                {/* Trend Line Path */}
                <path
                  d={drawTrendLine()}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />

                {/* Fill Gradient Area under line */}
                {(() => {
                  const pathLine = drawTrendLine();
                  if (!pathLine) return null;
                  const closePath = `${pathLine} L 460 120 L 40 120 Z`;
                  return <path d={closePath} fill="url(#chartGrad)" />;
                })()}

                {/* Interactive circles/data points */}
                {stats.timeline.map((t, idx) => {
                  const paddingX = 40;
                  const paddingY = 30;
                  const width = 500;
                  const height = 150;
                  const chartWidth = width - paddingX * 2;
                  const chartHeight = height - paddingY * 2;
                  const maxCount = Math.max(...stats.timeline.map(ti => ti.count)) || 1;
                  const cx = paddingX + (idx / (stats.timeline.length - 1)) * chartWidth;
                  const cy = height - paddingY - (t.count / maxCount) * chartHeight;

                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                      <circle cx={cx} cy={cy} r="10" fill="#6366f1" fillOpacity="0.2" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs font-mono">Insufficient temporal range in database.</div>
          )}

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-4 mt-4">
            <span>{stats.timeline?.[0]?.date || "Past"}</span>
            <span>Queries per Calendar Date</span>
            <span>{stats.timeline?.[stats.timeline.length - 1]?.date || "Present"}</span>
          </div>
        </motion.div>

      </div>

      {/* Grid: Keywords bar chart + Model metrics table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Keywords horizontal bars */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-2xl p-6 flex flex-col justify-between lg:col-span-1 bg-white"
        >
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs mb-2 font-semibold">
              <BarChart3 className="w-4 h-4" /> Feature Weights
            </div>
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4">Influential Corpus Terms</h2>
          </div>

          <div className="space-y-3.5 py-2">
            {stats.topKeywords && stats.topKeywords.length > 0 ? (
              stats.topKeywords.slice(0, 5).map((kw) => {
                const maxVal = Math.max(...stats.topKeywords.map(k => k.value)) || 1;
                const kwPct = (kw.value / maxVal) * 100;
                return (
                  <div key={kw.word} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-mono font-bold font-display text-indigo-600">#{kw.word}</span>
                      <span className="font-mono text-slate-400">{kw.value} weights</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${kwPct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-mono">No terms extracted from records yet.</div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 mt-4 text-center">
            Vocabulary features dynamically calculated by TF-IDF
          </div>
        </motion.div>

        {/* Model Metrics Benchmarks */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between bg-white"
        >
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs mb-2 font-semibold">
              <Cpu className="w-4 h-4" /> Performance Benchmarks
            </div>
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4">Algorithm Competency Comparison</h2>
          </div>

          {stats.modelPerformance && stats.modelPerformance.length > 0 ? (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold font-display">
                    <th className="py-2.5">ML Classification Model</th>
                    <th className="py-2.5">Test Accuracy</th>
                    <th className="py-2.5">Macro Precision</th>
                    <th className="py-2.5">Macro Recall</th>
                    <th className="py-2.5">Macro F1-Score</th>
                    <th className="py-2.5 text-right">Compile Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                  {stats.modelPerformance.map((perf, index) => {
                    const isBest = index === 0; // Already sorted by F1 on backend
                    return (
                      <tr key={perf.modelType} className={isBest ? "text-purple-700 font-bold bg-purple-50/50" : ""}>
                        <td className="py-3 flex items-center gap-2 pl-2">
                          {perf.modelType}
                          {isBest && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="py-3">{(perf.metrics.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3">{(perf.metrics.precision * 100).toFixed(1)}%</td>
                        <td className="py-3">{(perf.metrics.recall * 100).toFixed(1)}%</td>
                        <td className="py-3">{(perf.metrics.f1Score * 100).toFixed(1)}%</td>
                        <td className="py-3 text-right pr-2 text-slate-400">{perf.trainingTimeMs} ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-mono">No model metrics available yet.</div>
          )}

          <div className="text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 mt-4 leading-relaxed">
            Note: Evaluations are automatically recalculated based on a cross-validated 80/20 train-test random partitioning on each retrain step.
          </div>
        </motion.div>

      </div>

    </div>
  );
}
