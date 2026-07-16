export type SentimentClass = "positive" | "neutral" | "negative";

export interface PredictionRecord {
  id: string;
  text: string;
  sentiment: SentimentClass;
  confidence: number;
  probabilities: { positive: number; neutral: number; negative: number };
  emotion: string;
  keywords: { word: string; score: number }[];
  aiExplanation?: string;
  modelUsed: string;
  timestamp: string;
  sentences?: { text: string; sentiment: SentimentClass; confidence: number }[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  classMetrics: {
    [key in SentimentClass]: {
      precision: number;
      recall: number;
      f1Score: number;
    }
  };
}

export interface ModelPerformance {
  modelType: "Naive Bayes" | "Logistic Regression" | "Linear SVM";
  metrics: ModelMetrics;
  trainingTimeMs: number;
}

export interface ModelInfo {
  activeBestModel: string;
  performance: ModelPerformance[];
  datasetSize: number;
  vocabularySize: number;
}

export interface DashboardStats {
  totalCount: number;
  sentimentCounts: { positive: number; neutral: number; negative: number };
  averageConfidence: number;
  emotions: { [key: string]: number };
  modelUsage: { [key: string]: number };
  timeline: { date: string; positive: number; neutral: number; negative: number; count: number }[];
  topKeywords: { word: string; value: number }[];
  modelPerformance: ModelPerformance[];
}
