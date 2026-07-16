import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, Send, Brain, Smile, AlertCircle, ChevronRight, BarChart2, CheckCircle,
  Hash, Clock, Upload, List, Play, HelpCircle, FileText
} from "lucide-react";
import { PredictionRecord, SentimentClass } from "../types.ts";

interface SentimentAnalyzerProps {
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
  onTriggerRefreshStats: () => void;
}

export default function SentimentAnalyzer({ onShowNotification, onTriggerRefreshStats }: SentimentAnalyzerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<PredictionRecord | null>(null);

  // Real-time analysis states
  const [realtimeMode, setRealtimeMode] = useState(true);
  const [realtimePrediction, setRealtimePrediction] = useState<{ sentiment: SentimentClass; confidence: number } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Batch analysis state
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState<PredictionRecord[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Sentence highlighting hover state
  const [hoveredSentenceIdx, setHoveredSentenceIdx] = useState<number | null>(null);

  // Debounced real-time analysis (calls local ML pipeline, bypassing Gemini for instantaneous feedback)
  const runRealtimePrediction = async (val: string) => {
    if (!val.trim()) {
      setRealtimePrediction(null);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: val.trim(),
          bypassGemini: true // Bypasses Gemini for low latency & safety
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRealtimePrediction({
          sentiment: data.sentiment,
          confidence: data.confidence
        });
      }
    } catch (e) {
      // Quiet fail in real-time
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!realtimeMode || batchMode) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length > 3) {
      setIsTyping(true);
      debounceTimer.current = setTimeout(() => {
        runRealtimePrediction(text);
      }, 400);
    } else {
      setRealtimePrediction(null);
      setIsTyping(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [text, realtimeMode, batchMode]);

  const handleDetailedAnalysis = async () => {
    if (!text.trim()) {
      onShowNotification("Please enter some text to analyze.", "error");
      return;
    }

    setLoading(true);
    setActiveResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          bypassGemini: false // Run full AI Gemini explainability pipeline
        })
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please check your network or API settings.");
      }

      const result = await response.json();
      setActiveResult(result);
      onShowNotification("Semantic analysis completed successfully!", "success");
      onTriggerRefreshStats(); // Update dashboard charts
    } catch (err: any) {
      onShowNotification(err.message || "Failed to analyze text", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAnalyze = async () => {
    if (!batchInput.trim()) {
      onShowNotification("Please enter reviews (one per line) for batch analysis.", "error");
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);

    const items = batchInput
      .split("\n")
      .map(item => item.trim())
      .filter(item => item.length > 2);

    if (items.length === 0) {
      onShowNotification("No valid text lines found.", "error");
      setBatchLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });

      if (!response.ok) throw new Error("Batch analysis failed.");
      const data = await response.json();
      setBatchResults(data.results);
      onShowNotification(`Processed ${data.processedCount} reviews in batch!`, "success");
      onTriggerRefreshStats();
    } catch (err: any) {
      onShowNotification(err.message || "Batch analysis failed", "error");
    } finally {
      setBatchLoading(false);
    }
  };

  const loadSampleText = (sampleType: "pos" | "neu" | "neg") => {
    const samples = {
      pos: "Absolutely perfect! The design is extremely elegant, battery lasts for two days easily, and the customer support team resolved my questions in minutes. Highly recommended to everyone!",
      neu: "I received the standard grey model as ordered today. The setup was relatively simple, instructions are located in the user manual, and the device has standard indicators.",
      neg: "Terrible product and awful experience. The software is extremely unstable, it keeps crashing every few minutes, and gets dangerously hot during normal tasks. Complete waste of money!"
    };
    setText(samples[sampleType]);
  };

  const getSentimentColor = (sentiment: SentimentClass) => {
    if (sentiment === "positive") return "text-emerald-700 border-emerald-100 bg-emerald-50";
    if (sentiment === "negative") return "text-rose-700 border-rose-100 bg-rose-50";
    return "text-indigo-700 border-indigo-100 bg-indigo-50";
  };

  const getSentimentTextClass = (sentiment: SentimentClass) => {
    if (sentiment === "positive") return "text-emerald-600";
    if (sentiment === "negative") return "text-rose-600";
    return "text-indigo-600";
  };

  const getSentimentBgClass = (sentiment: SentimentClass) => {
    if (sentiment === "positive") return "bg-emerald-600";
    if (sentiment === "negative") return "bg-rose-600";
    return "bg-indigo-600";
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Mode selectors */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setBatchMode(false); setActiveResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
            !batchMode
              ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm"
              : "text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Brain className="w-4 h-4" /> Single Text Analyzer
        </button>
        <button
          onClick={() => { setBatchMode(true); setActiveResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
            batchMode
              ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm"
              : "text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <List className="w-4 h-4" /> Batch / CSV Analyzer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: Inputs */}
        <div className="space-y-6">
          
          <AnimatePresence mode="wait">
            {!batchMode ? (
              // Single Mode
              <motion.div
                key="single"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-panel rounded-2xl p-6 space-y-4 bg-white"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs font-semibold">
                    <Brain className="w-4 h-4" /> Cognitive Parser
                  </div>
                  
                  {/* Load Predefined Samples */}
                  <div className="flex gap-1.5 text-[10px] items-center">
                    <span className="text-slate-400 mr-1">Load Sample:</span>
                    <button onClick={() => loadSampleText("pos")} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded cursor-pointer transition-colors">Positive</button>
                    <button onClick={() => loadSampleText("neu")} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded cursor-pointer transition-colors">Neutral</button>
                    <button onClick={() => loadSampleText("neg")} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded cursor-pointer transition-colors">Negative</button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste reviews, comments, tweets, or paragraphs here for real-time analysis..."
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl px-5 py-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                  
                  {/* Real-time micro overlay indicator */}
                  {realtimeMode && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      {isTyping ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                          <span>ML running...</span>
                        </>
                      ) : realtimePrediction ? (
                        <div className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded border capitalize ${getSentimentColor(realtimePrediction.sentiment)}`}>
                          <span>{realtimePrediction.sentiment}</span>
                          <span>({(realtimePrediction.confidence * 100).toFixed(0)}%)</span>
                        </div>
                      ) : (
                        <span>Typing feedback live</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Real-time Toggle & Manual submit */}
                <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 select-none font-medium">
                    <input
                      type="checkbox"
                      checked={realtimeMode}
                      onChange={(e) => setRealtimeMode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                    />
                    <span>Real-time typing feedback</span>
                  </label>

                  <button
                    onClick={handleDetailedAnalysis}
                    disabled={loading || !text.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:scale-100 shadow-md shadow-indigo-100"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Querying Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Detailed Analysis
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              // Batch Mode
              <motion.div
                key="batch"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-panel rounded-2xl p-6 space-y-4 bg-white"
              >
                <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs font-semibold">
                  <List className="w-4 h-4" /> Batch Corpus Analysis
                </div>
                <h2 className="text-xl font-bold font-display text-slate-800">Paste Multiple Reviews</h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Analyze many reviews or sentences simultaneously. Paste your reviews below, <strong>with exactly one review per line</strong>. Clicking analyze will process them sequentially through the active ML pipeline!
                </p>

                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="Review 1: The product is fantastic!&#10;Review 2: This shipping took forever, terrible support.&#10;Review 3: Standard delivery Grey color model."
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl px-5 py-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none leading-relaxed"
                />

                <button
                  onClick={handleBatchAnalyze}
                  disabled={batchLoading || !batchInput.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:scale-100 shadow-md shadow-indigo-100"
                >
                  {batchLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Batch processing models...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Process Batch Reviews
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Pipeline diagram explaining mathematical split */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="text-slate-700 font-bold font-display text-xs flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-600 animate-pulse" /> Sentiment Analysis ML Pipeline
            </h4>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-mono text-slate-500">
              <div className="bg-white border border-slate-200/60 py-2 px-1 rounded-lg shadow-sm">
                <span className="text-indigo-600 block font-bold mb-0.5">NLP</span>
                Stopwords, Stem
              </div>
              <div className="bg-white border border-slate-200/60 py-2 px-1 rounded-lg shadow-sm">
                <span className="text-indigo-600 block font-bold mb-0.5">TF-IDF</span>
                Vectors (L2)
              </div>
              <div className="bg-white border border-slate-200/60 py-2 px-1 rounded-lg shadow-sm">
                <span className="text-indigo-600 block font-bold mb-0.5">OvR ML</span>
                Bayes/LogReg/SVM
              </div>
              <div className="bg-white border border-slate-200/60 py-2 px-1 rounded-lg shadow-sm">
                <span className="text-indigo-600 block font-bold mb-0.5">Gemini</span>
                Explanation
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results Display */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {batchMode ? (
              // Batch results list
              <motion.div
                key="batch-res"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-6 space-y-4 bg-white"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold font-display text-slate-800">Batch Analysis Log Results</h3>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {batchResults.length} parsed items
                  </span>
                </div>

                {batchResults.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-mono">
                    Run batch analysis to inspect list predictions here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {batchResults.map((res, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-200 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700 text-xs truncate font-medium">{res.text}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Engine: {res.modelUsed}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getSentimentColor(res.sentiment)}`}>
                            {res.sentiment}
                          </span>
                          <span className="text-slate-700 font-mono font-bold text-xs">{(res.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : loading ? (
              // Skeleton / loading state for active detailed analysis
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl p-6 space-y-6 bg-white"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 animate-pulse">
                  <div className="w-24 h-4 bg-slate-100 rounded" />
                  <div className="w-16 h-3 bg-slate-100 rounded" />
                </div>

                <div className="space-y-4 py-4 animate-pulse">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100" />
                    <div className="space-y-2 flex-1">
                      <div className="w-1/3 h-5 bg-slate-100 rounded" />
                      <div className="w-1/4 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>

                  <div className="w-full h-24 bg-slate-50 rounded-2xl" />

                  <div className="space-y-2">
                    <div className="w-full h-3 bg-slate-100 rounded" />
                    <div className="w-5/6 h-3 bg-slate-100 rounded" />
                    <div className="w-2/3 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              </motion.div>
            ) : activeResult ? (
              // Real detailed prediction active results
              <motion.div
                key="active-result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-6 space-y-6 bg-white"
              >
                {/* Header metadata */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">ANALYSIS RECORD LEDGER</span>
                  <span className="text-[10px] font-mono text-indigo-600 flex items-center gap-1 font-semibold">
                    <Brain className="w-3.5 h-3.5" /> Core ML + Gemini
                  </span>
                </div>

                {/* Score Hero section */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shrink-0 font-bold border ${getSentimentColor(activeResult.sentiment)}`}>
                    {activeResult.sentiment === "positive" ? "🌸" : activeResult.sentiment === "negative" ? "💔" : "⚖️"}
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase font-mono text-slate-400 font-bold leading-none">Inferred Sentiment</h3>
                    <h2 className={`text-xl font-extrabold font-display capitalize tracking-tight mt-1 flex items-center gap-1.5 ${getSentimentTextClass(activeResult.sentiment)}`}>
                      {activeResult.sentiment}
                      <span className="text-slate-500 text-xs font-mono font-medium">({(activeResult.confidence * 100).toFixed(0)}% confidence)</span>
                    </h2>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Classified using active best model: {activeResult.modelUsed}</span>
                  </div>
                </div>

                {/* Probability bar splits */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Probability Distribution</span>
                  <div className="space-y-2 font-mono text-[11px]">
                    {/* Positive bar */}
                    <div className="flex items-center justify-between gap-4 text-emerald-700">
                      <span className="w-14 font-semibold">Positive</span>
                      <div className="flex-1 bg-slate-200/50 h-2 rounded-full overflow-hidden border border-slate-100">
                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${activeResult.probabilities.positive * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold">{(activeResult.probabilities.positive * 100).toFixed(0)}%</span>
                    </div>

                    {/* Neutral bar */}
                    <div className="flex items-center justify-between gap-4 text-blue-700">
                      <span className="w-14 font-semibold">Neutral</span>
                      <div className="flex-1 bg-slate-200/50 h-2 rounded-full overflow-hidden border border-slate-100">
                        <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${activeResult.probabilities.neutral * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold">{(activeResult.probabilities.neutral * 100).toFixed(0)}%</span>
                    </div>

                    {/* Negative bar */}
                    <div className="flex items-center justify-between gap-4 text-rose-700">
                      <span className="w-14 font-semibold">Negative</span>
                      <div className="flex-1 bg-slate-200/50 h-2 rounded-full overflow-hidden border border-slate-100">
                        <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${activeResult.probabilities.negative * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold">{(activeResult.probabilities.negative * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Sentence Highlight Map */}
                {activeResult.sentences && activeResult.sentences.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Sentence Sentiment Breakdown</span>
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-wrap gap-1.5 max-h-36 overflow-y-auto font-sans leading-relaxed text-xs">
                      {activeResult.sentences.map((sent, idx) => (
                        <span
                          key={idx}
                          onMouseEnter={() => setHoveredSentenceIdx(idx)}
                          onMouseLeave={() => setHoveredSentenceIdx(null)}
                          className={`px-1.5 py-0.5 rounded transition-all relative group cursor-help border ${
                            sent.sentiment === "positive"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100"
                              : sent.sentiment === "negative"
                              ? "bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100"
                              : "bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100"
                          } ${hoveredSentenceIdx === idx ? "underline font-medium" : ""}`}
                        >
                          {sent.text}.
                          {/* Tooltip */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 border border-slate-950 px-2 py-1 rounded text-[10px] text-white font-mono whitespace-nowrap z-30 shadow-md">
                            {sent.sentiment.toUpperCase()} ({(sent.confidence * 100).toFixed(0)}%)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation Paragraph */}
                {activeResult.aiExplanation && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Generative Explainability Logic</span>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed font-sans relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                      <p className="relative z-10 leading-relaxed">{activeResult.aiExplanation}</p>
                    </div>
                  </div>
                )}

                {/* Detected Keywords and Emojis */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Keywords */}
                  {activeResult.keywords && activeResult.keywords.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Lexical Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.keywords.slice(0, 6).map((kw, i) => (
                          <div
                            key={i}
                            className="bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-mono px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"
                          >
                            <span>#{kw.word}</span>
                            <span className="text-slate-400 text-[9px]">({kw.score.toFixed(1)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotional Tone Metadata */}
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Dominant Emotion</span>
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-xl text-xs font-semibold text-purple-700 w-fit shadow-sm">
                      <Smile className="w-4 h-4" /> {activeResult.emotion}
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              // Initial welcome card
              <motion.div
                key="welcome-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 py-20 bg-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
                <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-md">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-800">Neural Analysis Hub</h3>
                  <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Enter comments or reviews in the left editor panel. Clicking "AI Detailed Analysis" will parse semantic nuances and provide math outputs alongside explanations.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
