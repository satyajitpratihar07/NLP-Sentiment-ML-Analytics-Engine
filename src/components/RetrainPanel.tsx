import React, { useState } from "react";
import { motion } from "motion/react";
import { Cpu, RefreshCw, Plus, Database, ChevronRight, BarChart2 } from "lucide-react";
import { ModelInfo } from "../types.ts";

interface RetrainPanelProps {
  modelInfo: ModelInfo | null;
  onRefreshModelInfo: () => void;
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
}

export default function RetrainPanel({ modelInfo, onRefreshModelInfo, onShowNotification }: RetrainPanelProps) {
  const [inputText, setInputText] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "neutral" | "negative">("positive");
  const [isTraining, setIsTraining] = useState(false);
  const [isAddingSample, setIsAddingSample] = useState(false);

  const handleAddSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      onShowNotification("Please enter sample text", "error");
      return;
    }

    setIsAddingSample(true);
    try {
      const response = await fetch("/api/dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          sentiment: selectedSentiment,
          retrain: true // Automatically retrain pipeline
        })
      });

      if (!response.ok) throw new Error("Failed to add training sample.");

      await response.json();
      onShowNotification("Sample added to corpus & models retrained!", "success");
      setInputText("");
      onRefreshModelInfo();
    } catch (err: any) {
      onShowNotification(err.message || "Failed to add sample", "error");
    } finally {
      setIsAddingSample(false);
    }
  };

  const handleRetrainAll = async () => {
    setIsTraining(true);
    try {
      const response = await fetch("/api/train", {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to train models.");

      const result = await response.json();
      onShowNotification(`Models trained! Optimal model selected: ${result.state.activeBestModel}`, "success");
      onRefreshModelInfo();
    } catch (err: any) {
      onShowNotification(err.message || "Failed to retrain", "error");
    } finally {
      setIsTraining(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Retrain Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Model State Card */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between lg:col-span-1 bg-white"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -z-10" />
          
          <div>
            <div className="flex items-center gap-2 text-purple-600 font-mono text-xs mb-2 font-semibold">
              <Cpu className="w-4 h-4" /> Active Model Status
            </div>
            <h2 className="text-xl font-bold font-display text-slate-800">Algorithm Dashboard</h2>
            <p className="text-slate-500 text-xs mt-1">
              Details on the vocabulary dimensions and dataset currently held in persistent storage.
            </p>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                  <Database className="w-4 h-4 text-emerald-600" /> Corpus Size
                </span>
                <span className="text-slate-800 font-mono font-bold text-sm">
                  {modelInfo ? modelInfo.datasetSize : "..."} samples
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                  <Cpu className="w-4 h-4 text-blue-600" /> TF-IDF Vocab
                </span>
                <span className="text-slate-800 font-mono font-bold text-sm">
                  {modelInfo ? modelInfo.vocabularySize : "..."} tokens
                </span>
              </div>

              <div className="flex justify-between items-center bg-purple-50 px-4 py-3 rounded-xl border border-purple-100">
                <span className="text-purple-700 text-xs font-semibold">
                  Best Selected Algorithm
                </span>
                <span className="text-purple-700 font-display font-bold text-sm">
                  {modelInfo ? modelInfo.activeBestModel : "..."}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRetrainAll}
            disabled={isTraining}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/10"
          >
            <RefreshCw className={`w-4 h-4 ${isTraining ? "animate-spin" : ""}`} />
            {isTraining ? "Recalculating Models..." : "Force Retrain All Models"}
          </button>
        </motion.div>

        {/* Right: Add Labeled Sample Form */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4 bg-white"
        >
          <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs font-semibold">
            <Plus className="w-4 h-4" /> Corpus Augmentation
          </div>
          <h2 className="text-xl font-bold font-display text-slate-800">Add Labeled Training Sample</h2>
          <p className="text-slate-500 text-xs">
            Directly expand the machine learning model dataset. Entering a new review and submitting will instantly append the text to the persistent corpus database and trigger an 80/20 train-test split, retraining all models on the fly!
          </p>

          <form onSubmit={handleAddSample} className="space-y-4 pt-2">
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-2">Sample Review or Comment Text</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter custom sentiment review here (e.g., 'The performance was mediocre and could be much better.')"
                rows={4}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-2">Ground Truth Sentiment Label</label>
                <div className="flex gap-2">
                  {(["positive", "neutral", "negative"] as const).map((sent) => (
                    <button
                      key={sent}
                      type="button"
                      onClick={() => setSelectedSentiment(sent)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        selectedSentiment === sent
                          ? sent === "positive"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-sm"
                            : sent === "negative"
                            ? "bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-sm"
                            : "bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      {sent}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingSample || !inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all self-end cursor-pointer active:scale-95 disabled:scale-100 w-full sm:w-auto shadow-md shadow-indigo-600/10"
              >
                {isAddingSample ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Injecting & Retraining...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Sample & Retrain
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Model Performance Comparison List */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl p-6 bg-white"
      >
        <div className="flex items-center gap-2 text-emerald-600 font-mono text-xs mb-2 font-semibold">
          <BarChart2 className="w-4 h-4" /> Model Comparison Matrix
        </div>
        <h2 className="text-xl font-bold font-display text-slate-800 mb-4">Algorithm Benchmark (80-20 Train-Test Split Evaluation)</h2>
        
        {modelInfo && modelInfo.performance && modelInfo.performance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modelInfo.performance.map((perf) => {
              const isActive = modelInfo.activeBestModel === perf.modelType;
              return (
                <div
                  key={perf.modelType}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-purple-50/40 border-purple-200 shadow-md"
                      : "bg-slate-50/50 border-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold font-display text-slate-800">{perf.modelType}</h3>
                    {isActive && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-sm">
                        Active Best
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Test Accuracy</span>
                      <span className="font-mono text-slate-700 font-semibold">{(perf.metrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Macro Precision</span>
                      <span className="font-mono text-slate-700 font-semibold">{(perf.metrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Macro Recall</span>
                      <span className="font-mono text-slate-700 font-semibold">{(perf.metrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 mt-2 font-bold">
                      <span className="text-slate-600">Macro F1-Score</span>
                      <span className={`font-mono ${isActive ? "text-purple-700 font-extrabold" : "text-slate-700"}`}>
                        {(perf.metrics.f1Score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Training Time</span>
                      <span>{perf.trainingTimeMs} ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            Retrain models to generate benchmark matrix.
          </div>
        )}
      </motion.div>
    </div>
  );
}
