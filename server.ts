/**
 * Full-Stack Express Server for Sentiment Analysis Platform
 * Integrates custom NLP pipeline, file-based database, and Gemini AI explainability
 */

import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import { FileDatabase, PredictionRecord } from "./server/db";
import { SentimentPipeline } from "./server/ml/pipeline";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize file database & ML pipeline
const db = new FileDatabase();
const pipeline = new SentimentPipeline();

// Load or train model on startup
try {
  const savedModel = db.loadTrainedModel();
  if (savedModel) {
    pipeline.loadState(savedModel);
    console.log("Successfully loaded trained ML models from disk.");
  } else {
    console.log("No trained ML model found. Running pipeline training...");
    const state = pipeline.trainAndEvaluate();
    db.saveTrainedModel(state);
    console.log("ML pipeline initial training complete.");
  }
} catch (err) {
  console.error("Error initializing ML pipeline:", err);
}

// Initialize Gemini API if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("Gemini API Key missing. Server will run in offline mode using custom local NLP rules.");
}

// Parse request bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper function to split text into sentences
function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

// Fallback rule-based emotion detection and AI explanation when Gemini is offline
function fallbackEmotionAndExplanation(text: string, sentiment: string, keywords: { word: string; score: number }[]) {
  const lowercaseText = text.toLowerCase();
  let emotion = "Neutral";
  
  const joyKeywords = ["love", "great", "awesome", "excellent", "happy", "wonderful", "amazing", "best", "perfect", "enjoy"];
  const angerKeywords = ["hate", "angry", "frustrated", "terrible", "worst", "garbage", "waste", "useless", "annoying", "broken"];
  const sadnessKeywords = ["sad", "disappointed", "sorry", "cry", "unhappy", "regret", "depressed", "tear", "lonely"];
  const fearKeywords = ["scared", "scam", "afraid", "unsafe", "cheat", "danger", "worry", "concern", "suspicious"];
  const surpriseKeywords = ["surprise", "shock", "unexpected", "incredible", "unbelievable", "suddenly", "wow"];

  if (joyKeywords.some(w => lowercaseText.includes(w))) {
    emotion = "Joy";
  } else if (angerKeywords.some(w => lowercaseText.includes(w))) {
    emotion = "Anger";
  } else if (sadnessKeywords.some(w => lowercaseText.includes(w))) {
    emotion = "Sadness";
  } else if (fearKeywords.some(w => lowercaseText.includes(w))) {
    emotion = "Fear";
  } else if (surpriseKeywords.some(w => lowercaseText.includes(w))) {
    emotion = "Surprise";
  } else {
    emotion = sentiment === "positive" ? "Joy" : sentiment === "negative" ? "Sadness" : "Neutral";
  }

  // Create explanation
  const topWords = keywords.slice(0, 3).map(k => k.word).join(", ");
  let explanation = `Analysis conducted using local ML models. The text carries a predominantly ${sentiment} tone with a primary sentiment of ${sentiment}. `;
  if (topWords) {
    explanation += `This classification is strongly influenced by semantic key terms: [${topWords}]. `;
  }
  explanation += `The context suggests an emotional state of "${emotion}".`;

  return { emotion, explanation };
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", mode: ai ? "online (Gemini + Local ML)" : "offline (Local ML only)" });
});

/**
 * Main Text Sentiment Analysis Endpoint
 */
app.post("/api/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, bypassGemini } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "Text field is required and must not be empty." });
      return;
    }

    const trimmedText = text.trim();

    // 1. Run our high-performance custom local Machine Learning classifier
    const mlPrediction = pipeline.predict(trimmedText);

    let finalSentiment = mlPrediction.sentiment;
    let finalConfidence = mlPrediction.confidence;
    let finalExplanation = "";
    let finalEmotion = "Neutral";
    let finalKeywords = mlPrediction.keywordScores;
    let finalSentences: { text: string; sentiment: string; confidence: number }[] = [];

    // 2. Perform local sentence-level split and analysis for dashboard visualization
    const rawSentences = splitIntoSentences(trimmedText);
    if (rawSentences.length > 0) {
      finalSentences = rawSentences.map(sentence => {
        const p = pipeline.predict(sentence);
        return {
          text: sentence,
          sentiment: p.sentiment,
          confidence: p.confidence
        };
      });
    } else {
      finalSentences = [{
        text: trimmedText,
        sentiment: mlPrediction.sentiment,
        confidence: mlPrediction.confidence
      }];
    }

    // 3. Optional: Query Gemini API for deep generative explanation and rich metadata
    let geminiSuccess = false;
    if (ai && !bypassGemini) {
      try {
        const prompt = `
          Analyze this text and perform sentiment analysis, emotion classification, and keyword weights extraction.
          Text: "${trimmedText}"

          Return the analysis structured EXACTLY in JSON format following this schema:
          {
            "sentiment": "positive" | "neutral" | "negative",
            "explanation": "Provide a high-quality, professional academic-grade explanation of the sentiment, highlighting nuances, tone, word choice, and any implied meaning.",
            "emotion": "Joy" | "Anger" | "Sadness" | "Fear" | "Surprise" | "Neutral",
            "keywords": [{"word": "string", "score": number}],
            "sentences": [{"text": "string", "sentiment": "positive" | "neutral" | "negative", "confidence": number}]
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING },
                explanation: { type: Type.STRING },
                emotion: { type: Type.STRING },
                keywords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      score: { type: Type.NUMBER }
                    }
                  }
                },
                sentences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      sentiment: { type: Type.STRING },
                      confidence: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          }
        });

        const geminiResult = JSON.parse(response.text || "{}");
        
        if (geminiResult.sentiment) {
          finalSentiment = geminiResult.sentiment;
          finalExplanation = geminiResult.explanation;
          finalEmotion = geminiResult.emotion || "Neutral";
          
          if (geminiResult.keywords && geminiResult.keywords.length > 0) {
            finalKeywords = geminiResult.keywords;
          }
          if (geminiResult.sentences && geminiResult.sentences.length > 0) {
            finalSentences = geminiResult.sentences;
          }
          
          geminiSuccess = true;
        }
      } catch (e) {
        console.warn("Gemini sentiment analysis failed, falling back to local NLP models:", e);
      }
    }

    // Fallback if Gemini wasn't used or failed
    if (!geminiSuccess) {
      const fallback = fallbackEmotionAndExplanation(trimmedText, finalSentiment, finalKeywords);
      finalExplanation = fallback.explanation;
      finalEmotion = fallback.emotion;
    }

    // 4. Save analysis record to our persistent file database
    const newRecord = db.addPrediction({
      text: trimmedText,
      sentiment: finalSentiment,
      confidence: finalConfidence,
      probabilities: mlPrediction.probabilities,
      emotion: finalEmotion,
      keywords: finalKeywords,
      aiExplanation: finalExplanation,
      modelUsed: mlPrediction.modelUsed,
      sentences: finalSentences
    });

    res.json(newRecord);
  } catch (error: any) {
    console.error("API error during analysis:", error);
    res.status(500).json({ error: error?.message || "Internal server error." });
  }
});

/**
 * Get History list with optional searching and pagination
 */
app.get("/api/history", (req: Request, res: Response) => {
  try {
    const { search, sentiment, emotion, modelUsed, limit = "50", page = "1" } = req.query;
    let list = db.getHistory();

    // Filters
    if (search && typeof search === "string") {
      const query = search.toLowerCase();
      list = list.filter(r => r.text.toLowerCase().includes(query));
    }
    if (sentiment && typeof sentiment === "string" && sentiment !== "all") {
      list = list.filter(r => r.sentiment === sentiment);
    }
    if (emotion && typeof emotion === "string" && emotion !== "all") {
      list = list.filter(r => r.emotion === emotion);
    }
    if (modelUsed && typeof modelUsed === "string" && modelUsed !== "all") {
      list = list.filter(r => r.modelUsed === modelUsed);
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const paginatedList = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      history: paginatedList,
      pagination: {
        totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a specific record from history
 */
app.delete("/api/history/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deletePrediction(id);
  if (deleted) {
    res.json({ success: true, message: "Record deleted successfully." });
  } else {
    res.status(404).json({ error: "Record not found." });
  }
});

/**
 * Clear all records
 */
app.delete("/api/history", (req: Request, res: Response) => {
  db.clearHistory();
  res.json({ success: true, message: "All prediction history cleared successfully." });
});

/**
 * Statistics & Visualization Data Aggregations
 */
app.get("/api/stats", (req: Request, res: Response) => {
  try {
    const list = db.getHistory();
    const count = list.length;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let sumConfidence = 0;

    const emotionCounts: { [key: string]: number } = {};
    const modelUsage: { [key: string]: number } = {};
    const timelineData: { [date: string]: { positive: number; neutral: number; negative: number; count: number } } = {};
    const wordCounts: { [word: string]: number } = {};

    for (const record of list) {
      sentimentCounts[record.sentiment]++;
      sumConfidence += record.confidence;

      // Emotion count
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;

      // Model usage count
      modelUsage[record.modelUsed] = (modelUsage[record.modelUsed] || 0) + 1;

      // Timeline aggregation by date (YYYY-MM-DD)
      const dateStr = record.timestamp.split("T")[0];
      if (!timelineData[dateStr]) {
        timelineData[dateStr] = { positive: 0, neutral: 0, negative: 0, count: 0 };
      }
      timelineData[dateStr][record.sentiment]++;
      timelineData[dateStr].count++;

      // Word/Keyword aggregation
      if (record.keywords) {
        for (const kw of record.keywords) {
          const w = kw.word.toLowerCase();
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      }
    }

    const avgConfidence = count > 0 ? sumConfidence / count : 0;

    // Convert timeline to sorted array
    const sortedTimeline = Object.entries(timelineData)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // last 10 days of active data

    // Convert word counts to sorted list
    const sortedKeywords = Object.entries(wordCounts)
      .map(([word, freq]) => ({ word, value: freq }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // Get current trained ML models evaluation performances
    const modelPerformance = pipeline.saveState().performance || [];

    res.json({
      totalCount: count,
      sentimentCounts,
      averageConfidence: avgConfidence,
      emotions: emotionCounts,
      modelUsage,
      timeline: sortedTimeline,
      topKeywords: sortedKeywords,
      modelPerformance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get training dataset & details of current pipeline state
 */
app.get("/api/models", (req: Request, res: Response) => {
  try {
    const pipelineState = pipeline.saveState();
    res.json({
      activeBestModel: pipelineState.bestModelType,
      performance: pipelineState.performance,
      datasetSize: db.getDataset().length,
      vocabularySize: Object.keys(pipelineState.vectorizerState.vocabulary).length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trigger retraining of pipeline models manually
 */
app.post("/api/train", (req: Request, res: Response) => {
  try {
    const state = pipeline.trainAndEvaluate();
    db.saveTrainedModel(state);
    res.json({
      success: true,
      message: "ML pipeline retrained and optimal model selected successfully.",
      state: {
        activeBestModel: state.bestModelType,
        performance: state.performance,
        datasetSize: db.getDataset().length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add sample to training dataset and optionally retrain
 */
app.post("/api/dataset", (req: Request, res: Response) => {
  try {
    const { text, sentiment, retrain } = req.body;
    if (!text || !sentiment) {
      res.status(400).json({ error: "Fields 'text' and 'sentiment' are required." });
      return;
    }

    db.addDatasetSample({ text, sentiment });
    pipeline.addSample(text, sentiment);

    let retrainResult = null;
    if (retrain) {
      const state = pipeline.trainAndEvaluate();
      db.saveTrainedModel(state);
      retrainResult = state;
    }

    res.json({
      success: true,
      message: "Sample added to training dataset successfully.",
      retrained: !!retrain,
      modelState: retrainResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Batch analysis of multiple texts (CSV upload mock / array batch)
 */
app.post("/api/batch", async (req: Request, res: Response) => {
  try {
    const { items, bypassGemini } = req.body;
    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: "An array of text items is required." });
      return;
    }

    const results = [];
    // Limit to batch size of 20 to prevent timeouts
    const limitedItems = items.slice(0, 20);

    for (const text of limitedItems) {
      const mlPrediction = pipeline.predict(text);
      const fallback = fallbackEmotionAndExplanation(text, mlPrediction.sentiment, mlPrediction.keywordScores);
      
      const record = db.addPrediction({
        text,
        sentiment: mlPrediction.sentiment,
        confidence: mlPrediction.confidence,
        probabilities: mlPrediction.probabilities,
        emotion: fallback.emotion,
        keywords: mlPrediction.keywordScores,
        aiExplanation: fallback.explanation,
        modelUsed: mlPrediction.modelUsed,
        sentences: [{ text, sentiment: mlPrediction.sentiment, confidence: mlPrediction.confidence }]
      });
      results.push(record);
    }

    res.json({ success: true, processedCount: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Export history as CSV
 */
app.get("/api/export-csv", (req: Request, res: Response) => {
  try {
    const history = db.getHistory();
    let csv = "ID,Timestamp,Text,Sentiment,Confidence,Emotion,ModelUsed\n";
    
    for (const r of history) {
      // Escape text commas and double quotes
      const escapedText = `"${r.text.replace(/"/g, '""')}"`;
      csv += `${r.id},${r.timestamp},${escapedText},${r.sentiment},${r.confidence.toFixed(4)},${r.emotion},${r.modelUsed}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sentiment_history_export.csv");
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// VITE DEV SERVER & STATIC MIDDLEWARE SETUP
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
