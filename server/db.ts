/**
 * Persistent File-Based Database for AI Sentiment Analysis Platform
 * Manages prediction history, custom datasets, and saved trained models
 */

import fs from "fs";
import path from "path";
import { DatasetSample, INITIAL_DATASET } from "./ml/pipeline";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "predictions_history.json");
const MODEL_FILE = path.join(DATA_DIR, "trained_model.json");
const DATASET_FILE = path.join(DATA_DIR, "custom_dataset.json");

export interface PredictionRecord {
  id: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  probabilities: { positive: number; neutral: number; negative: number };
  emotion: string;
  keywords: { word: string; score: number }[];
  aiExplanation?: string;
  modelUsed: string;
  timestamp: string;
  sentences?: { text: string; sentiment: string; confidence: number }[];
}

export class FileDatabase {
  private history: PredictionRecord[] = [];
  private dataset: DatasetSample[] = [];

  constructor() {
    this.initDirs();
    this.loadHistory();
    this.loadDataset();
  }

  private initDirs(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // --- PREDICTION HISTORY METHODS ---

  private loadHistory(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        this.history = JSON.parse(data);
      } else {
        // Seed with highly realistic records to make the dashboard charts rich immediately
        this.history = this.generateSeedHistory();
        this.saveHistory();
      }
    } catch (error) {
      console.error("Failed to load history database:", error);
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.history, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save history database:", error);
    }
  }

  public getHistory(): PredictionRecord[] {
    return this.history;
  }

  public addPrediction(record: Omit<PredictionRecord, "id" | "timestamp">): PredictionRecord {
    const newRecord: PredictionRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString()
    };
    this.history.unshift(newRecord); // Add to the top
    this.saveHistory();
    return newRecord;
  }

  public deletePrediction(id: string): boolean {
    const index = this.history.findIndex(r => r.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
      this.saveHistory();
      return true;
    }
    return false;
  }

  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  // --- DATASET METHODS ---

  private loadDataset(): void {
    try {
      if (fs.existsSync(DATASET_FILE)) {
        const data = fs.readFileSync(DATASET_FILE, "utf-8");
        this.dataset = JSON.parse(data);
      } else {
        this.dataset = [...INITIAL_DATASET];
        this.saveDataset();
      }
    } catch (error) {
      console.error("Failed to load dataset:", error);
      this.dataset = [...INITIAL_DATASET];
    }
  }

  private saveDataset(): void {
    try {
      fs.writeFileSync(DATASET_FILE, JSON.stringify(this.dataset, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save custom dataset:", error);
    }
  }

  public getDataset(): DatasetSample[] {
    return this.dataset;
  }

  public addDatasetSample(sample: DatasetSample): void {
    this.dataset.push(sample);
    this.saveDataset();
  }

  public resetDataset(): void {
    this.dataset = [...INITIAL_DATASET];
    this.saveDataset();
  }

  // --- TRAINED MODEL PERSISTENCE ---

  public saveTrainedModel(state: any): void {
    try {
      fs.writeFileSync(MODEL_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save trained model parameters:", error);
    }
  }

  public loadTrainedModel(): any | null {
    try {
      if (fs.existsSync(MODEL_FILE)) {
        const data = fs.readFileSync(MODEL_FILE, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load trained model parameters:", error);
    }
    return null;
  }

  // --- SEED SEEDING ---

  private generateSeedHistory(): PredictionRecord[] {
    const sentences = [
      { text: "I absolutely love this new update! It runs super fast and the user interface is amazingly clean.", sentiment: "positive" as const, emotion: "Joy", confidence: 0.96 },
      { text: "The camera quality is decent, but the battery drains relatively quickly during normal tasks.", sentiment: "neutral" as const, emotion: "Neutral", confidence: 0.58 },
      { text: "Terrible product. It crashed twice in the first ten minutes. Completely unusable!", sentiment: "negative" as const, emotion: "Anger", confidence: 0.98 },
      { text: "We need to discuss the upcoming roadmap in the scheduled team standup tomorrow.", sentiment: "neutral" as const, emotion: "Neutral", confidence: 0.89 },
      { text: "The customer service was wonderfully friendly and solved my issue in under a minute.", sentiment: "positive" as const, emotion: "Joy", confidence: 0.94 },
      { text: "Disappointed with the shipping delays. The box came damaged and torn at the corners.", sentiment: "negative" as const, emotion: "Sadness", confidence: 0.88 },
      { text: "The system is functioning exactly within the normal parameters.", sentiment: "neutral" as const, emotion: "Neutral", confidence: 0.91 },
      { text: "This is a masterpiece. The cinematography, music, and performance were all superb.", sentiment: "positive" as const, emotion: "Surprise", confidence: 0.97 },
      { text: "I felt so scammed by the promotional advertisements. It does not work as advertised.", sentiment: "negative" as const, emotion: "Fear", confidence: 0.92 },
      { text: "Is there any charge for additional storage options?", sentiment: "neutral" as const, emotion: "Neutral", confidence: 0.74 }
    ];

    const models = ["Logistic Regression", "Naive Bayes", "Linear SVM"];

    return sentences.map((item, idx) => {
      const pPos = item.sentiment === "positive" ? item.confidence : (1 - item.confidence) / 2;
      const pNeg = item.sentiment === "negative" ? item.confidence : (1 - item.confidence) / 2;
      const pNeu = item.sentiment === "neutral" ? item.confidence : (1 - item.confidence) / 2;

      // Adjust timestamp backwards in time to simulate history over multiple days
      const d = new Date();
      d.setDate(d.getDate() - idx);

      return {
        id: `seed-${idx}`,
        text: item.text,
        sentiment: item.sentiment,
        confidence: item.confidence,
        probabilities: { positive: pPos, neutral: pNeu, negative: pNeg },
        emotion: item.emotion,
        keywords: [
          { word: "product", score: 0.25 },
          { word: "quality", score: 0.18 }
        ],
        aiExplanation: `Based on terms like "${item.text.split(" ")[2]}", the sentence expresses a strong ${item.sentiment} sentiment. The tone aligns with ${item.emotion}.`,
        modelUsed: models[idx % models.length],
        timestamp: d.toISOString(),
        sentences: [{ text: item.text, sentiment: item.sentiment, confidence: item.confidence }]
      };
    });
  }
}
