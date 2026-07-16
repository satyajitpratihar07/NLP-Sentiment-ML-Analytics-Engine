/**
 * Sentiment Pipeline Manager
 * Orchestrates dataset management, model training, evaluation, saving, and loading
 */

import { preprocessText } from "./nlp";
import { TFIDFVectorizer } from "./tfidf";
import {
  MultinomialNaiveBayes,
  LogisticRegression,
  LinearSVM,
  SentimentClass,
  SENTIMENT_CLASSES
} from "./models";

export interface EvaluationMetrics {
  accuracy: number;
  precision: number; // Macro-average
  recall: number;    // Macro-average
  f1Score: number;   // Macro-average
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
  metrics: EvaluationMetrics;
  trainingTimeMs: number;
}

export interface PipelineState {
  bestModelType: "Naive Bayes" | "Logistic Regression" | "Linear SVM";
  vectorizerState: any;
  modelStates: {
    "Naive Bayes": any;
    "Logistic Regression": any;
    "Linear SVM": any;
  };
  performance: ModelPerformance[];
}

// Initial robust dataset of reviews and tweets for training
export interface DatasetSample {
  text: string;
  sentiment: SentimentClass;
}

export const INITIAL_DATASET: DatasetSample[] = [
  // POSITIVE
  { text: "This product is absolutely amazing! Exceeded all my expectations.", sentiment: "positive" },
  { text: "Great customer service, very helpful and polite staff.", sentiment: "positive" },
  { text: "I love the new design. It is sleek, elegant, and super easy to use.", sentiment: "positive" },
  { text: "Fantastic performance, highly recommend it to everyone!", sentiment: "positive" },
  { text: "Best purchase I've made this year. Absolutely brilliant.", sentiment: "positive" },
  { text: "Smooth UI and excellent response times. Perfect application.", sentiment: "positive" },
  { text: "Very happy with the build quality, feels premium and solid.", sentiment: "positive" },
  { text: "The delivery was incredibly fast and the packaging was excellent.", sentiment: "positive" },
  { text: "Wonderful experience! I will definitely buy this again.", sentiment: "positive" },
  { text: "Super useful feature, makes my daily work so much faster.", sentiment: "positive" },
  { text: "Highly intuitive and friendly interface, amazing experience.", sentiment: "positive" },
  { text: "Excellent battery life, lasted me two full days of heavy use.", sentiment: "positive" },
  { text: "The movie was a masterpiece! Great acting, music, and visuals.", sentiment: "positive" },
  { text: "Beautifully designed, comfortable to wear and sounds incredible.", sentiment: "positive" },
  { text: "Perfect fit! Sizing is accurate and the material is soft.", sentiment: "positive" },
  { text: "A truly outstanding service. Extremely professional and prompt.", sentiment: "positive" },
  { text: "I'm so impressed with how well this works. Highly recommend!", sentiment: "positive" },
  { text: "Outstanding quality. Well worth the price.", sentiment: "positive" },
  { text: "Absolutely gorgeous layout, navigation is effortless and clean.", sentiment: "positive" },
  { text: "Five stars! Simple, elegant, and highly effective tool.", sentiment: "positive" },
  { text: "This is a game changer. It saved me hours of manual labor.", sentiment: "positive" },
  { text: "So convenient and reliable. Never had any issues.", sentiment: "positive" },
  { text: "Delightful customer support, solved my issues in five minutes.", sentiment: "positive" },
  { text: "It is incredibly quiet and works like a charm. Very satisfied.", sentiment: "positive" },
  { text: "Extremely clean code, well-documented and easy to customize.", sentiment: "positive" },

  // NEUTRAL
  { text: "The package arrived today. It was left by the front door.", sentiment: "neutral" },
  { text: "The user manual explains how to configure the settings.", sentiment: "neutral" },
  { text: "I received the standard grey model as ordered.", sentiment: "neutral" },
  { text: "The meeting is scheduled for tomorrow morning at 10 AM.", sentiment: "neutral" },
  { text: "The app works as described, no more, no less.", sentiment: "neutral" },
  { text: "The device has two buttons and an indicator light.", sentiment: "neutral" },
  { text: "This is a factual report about the company's annual revenue.", sentiment: "neutral" },
  { text: "The dimensions are 10 inches by 5 inches.", sentiment: "neutral" },
  { text: "The server will undergo maintenance on Saturday midnight.", sentiment: "neutral" },
  { text: "Please submit your feedback using the online form.", sentiment: "neutral" },
  { text: "The update is available for download on the official website.", sentiment: "neutral" },
  { text: "We went to the local store to compare different models.", sentiment: "neutral" },
  { text: "It runs on standard AA batteries.", sentiment: "neutral" },
  { text: "There is an option to change the text size in settings.", sentiment: "neutral" },
  { text: "The conference will cover various topics in artificial intelligence.", sentiment: "neutral" },
  { text: "The store opens at 9 AM and closes at 8 PM.", sentiment: "neutral" },
  { text: "A new version was released last week with some minor patches.", sentiment: "neutral" },
  { text: "The package contains the device, a cable, and a charger.", sentiment: "neutral" },
  { text: "The temperature outside is around 25 degrees Celsius.", sentiment: "neutral" },
  { text: "They offer standard delivery as well as express shipping.", sentiment: "neutral" },
  { text: "The book has twelve chapters and about three hundred pages.", sentiment: "neutral" },
  { text: "This item is available in blue, red, and black color options.", sentiment: "neutral" },
  { text: "The customer service representative answered my questions.", sentiment: "neutral" },
  { text: "The device connects to the internet via Wi-Fi or cellular data.", sentiment: "neutral" },
  { text: "The results of the analysis will be shared in the next meeting.", sentiment: "neutral" },

  // NEGATIVE
  { text: "Horrible experience. The app constantly crashes and freezes.", sentiment: "negative" },
  { text: "The quality is very cheap, broke within two days of normal use.", sentiment: "negative" },
  { text: "Very disappointed. It looks nothing like the advertised picture.", sentiment: "negative" },
  { text: "Terrible customer service. Nobody replies to emails or calls.", sentiment: "negative" },
  { text: "A complete waste of money and time. Do not buy this product!", sentiment: "negative" },
  { text: "The battery dies in less than two hours. Extremely frustrating.", sentiment: "negative" },
  { text: "The interface is clunky, slow, and highly counterintuitive.", sentiment: "negative" },
  { text: "Awful product. It came damaged and the seller refused a refund.", sentiment: "negative" },
  { text: "I hate the new update. They removed all the useful features.", sentiment: "negative" },
  { text: "Extremely loud and gets hot very quickly. Unsafe to use.", sentiment: "negative" },
  { text: "Very poor build quality, plastic feels flimsy and cheap.", sentiment: "negative" },
  { text: "The delivery was delayed by two weeks and the package was torn.", sentiment: "negative" },
  { text: "It is impossible to configure, instructions are completely useless.", sentiment: "negative" },
  { text: "This is the worst customer experience I've ever had in my life.", sentiment: "negative" },
  { text: "The touch screen is unresponsive and laggy. Very annoying.", sentiment: "negative" },
  { text: "It simply does not work. Tried everything but it won't power on.", sentiment: "negative" },
  { text: "The food was cold, tasteless, and extremely overpriced.", sentiment: "negative" },
  { text: "This software is full of bugs and glitches. Extremely unstable.", sentiment: "negative" },
  { text: "I feel cheated. The product description is highly misleading.", sentiment: "negative" },
  { text: "Terrible design, uncomfortable to hold and weighs too much.", sentiment: "negative" },
  { text: "The color is completely faded, looks like a used product.", sentiment: "negative" },
  { text: "It is so slow that it's practically unusable. Very disappointed.", sentiment: "negative" },
  { text: "The connection keeps dropping every few minutes. Unreliable.", sentiment: "negative" },
  { text: "Extremely difficult to clean, takes forever to disassemble.", sentiment: "negative" },
  { text: "Very bad customer support. They were rude and unhelpful.", sentiment: "negative" }
];

export class SentimentPipeline {
  private vectorizer: TFIDFVectorizer;
  private naiveBayes: MultinomialNaiveBayes;
  private logisticRegression: LogisticRegression;
  private svm: LinearSVM;

  private bestModelType: "Naive Bayes" | "Logistic Regression" | "Linear SVM" = "Naive Bayes";
  private performance: ModelPerformance[] = [];
  private dataset: DatasetSample[] = [];

  constructor() {
    this.vectorizer = new TFIDFVectorizer();
    this.naiveBayes = new MultinomialNaiveBayes(1.0);
    this.logisticRegression = new LogisticRegression(0.2, 0.0001, 60);
    this.svm = new LinearSVM(0.1, 0.01, 70);
    this.dataset = [...INITIAL_DATASET];
  }

  /**
   * Get current dataset
   */
  public getDataset(): DatasetSample[] {
    return this.dataset;
  }

  /**
   * Add a custom sample to dataset
   */
  public addSample(text: string, sentiment: SentimentClass): void {
    this.dataset.push({ text, sentiment });
  }

  /**
   * Train models and evaluate their performance
   * Automatically selects the best model based on accuracy / F1 Score
   */
  public trainAndEvaluate(): PipelineState {
    const dataSize = this.dataset.length;
    if (dataSize < 10) {
      throw new Error("Dataset size too small. Add more samples first.");
    }

    // 1. Shuffle dataset
    const shuffled = [...this.dataset];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Preprocess text
    const processedDocs = shuffled.map(sample => {
      const prep = preprocessText(sample.text);
      return {
        tokens: prep.tokens,
        sentiment: sample.sentiment
      };
    });

    // 3. Train-Test Split (80% Train, 20% Test)
    const splitIndex = Math.floor(dataSize * 0.8);
    const trainDocs = processedDocs.slice(0, splitIndex);
    const testDocs = processedDocs.slice(splitIndex);

    // 4. Fit the TF-IDF Vectorizer on training set tokens
    const trainTokens = trainDocs.map(doc => doc.tokens);
    this.vectorizer.fit(trainTokens, 1);

    // 5. Transform Train and Test sets into vectors
    const X_train = this.vectorizer.transformBatch(trainTokens);
    const y_train = trainDocs.map(doc => doc.sentiment);

    const testTokens = testDocs.map(doc => doc.tokens);
    const X_test = this.vectorizer.transformBatch(testTokens);
    const y_test = testDocs.map(doc => doc.sentiment);

    this.performance = [];

    // --- Train Naive Bayes ---
    const t0_nb = Date.now();
    this.naiveBayes.train(X_train, y_train);
    const nb_time = Date.now() - t0_nb;
    const nb_metrics = this.evaluateModel(this.naiveBayes, X_test, y_test);
    this.performance.push({
      modelType: "Naive Bayes",
      metrics: nb_metrics,
      trainingTimeMs: nb_time
    });

    // --- Train Logistic Regression ---
    const t0_lr = Date.now();
    this.logisticRegression.train(X_train, y_train);
    const lr_time = Date.now() - t0_lr;
    const lr_metrics = this.evaluateModel(this.logisticRegression, X_test, y_test);
    this.performance.push({
      modelType: "Logistic Regression",
      metrics: lr_metrics,
      trainingTimeMs: lr_time
    });

    // --- Train SVM ---
    const t0_svm = Date.now();
    this.svm.train(X_train, y_train);
    const svm_time = Date.now() - t0_svm;
    const svm_metrics = this.evaluateModel(this.svm, X_test, y_test);
    this.performance.push({
      modelType: "Linear SVM",
      metrics: svm_metrics,
      trainingTimeMs: svm_time
    });

    // 6. Select the best performing model based on F1-Score
    let bestPerf = this.performance[0];
    for (const perf of this.performance) {
      if (perf.metrics.f1Score > bestPerf.metrics.f1Score) {
        bestPerf = perf;
      }
    }
    this.bestModelType = bestPerf.modelType;

    // Retrain the selected best model on the FULL dataset for optimal prediction accuracy!
    const fullTokens = processedDocs.map(doc => doc.tokens);
    this.vectorizer.fit(fullTokens, 1);
    const X_full = this.vectorizer.transformBatch(fullTokens);
    const y_full = processedDocs.map(doc => doc.sentiment);

    if (this.bestModelType === "Naive Bayes") {
      this.naiveBayes.train(X_full, y_full);
    } else if (this.bestModelType === "Logistic Regression") {
      this.logisticRegression.train(X_full, y_full);
    } else {
      this.svm.train(X_full, y_full);
    }

    return this.saveState();
  }

  /**
   * Helper to evaluate a classifier on test vectors and labels
   */
  private evaluateModel(model: any, X_test: number[][], y_test: SentimentClass[]): EvaluationMetrics {
    const N = X_test.length;
    let correct = 0;

    // Confusion structures: Class -> TP, FP, FN
    const classStats: { [key in SentimentClass]: { tp: number; fp: number; fn: number } } = {
      positive: { tp: 0, fp: 0, fn: 0 },
      neutral: { tp: 0, fp: 0, fn: 0 },
      negative: { tp: 0, fp: 0, fn: 0 }
    };

    for (let i = 0; i < N; i++) {
      const pred = model.predict(X_test[i]) as SentimentClass;
      const actual = y_test[i];

      if (pred === actual) {
        correct++;
        classStats[actual].tp++;
      } else {
        classStats[pred].fp++;
        classStats[actual].fn++;
      }
    }

    const accuracy = N > 0 ? correct / N : 0;

    // Calculate precision, recall, f1-score for each class
    const classMetrics: any = {};
    let sumPrecision = 0;
    let sumRecall = 0;

    for (const cls of SENTIMENT_CLASSES) {
      const { tp, fp, fn } = classStats[cls];
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      classMetrics[cls] = { precision, recall, f1Score: f1 };
      sumPrecision += precision;
      sumRecall += recall;
    }

    const macroPrecision = sumPrecision / 3;
    const macroRecall = sumRecall / 3;
    const macroF1 = macroPrecision + macroRecall > 0
      ? (2 * macroPrecision * macroRecall) / (macroPrecision + macroRecall)
      : 0;

    return {
      accuracy,
      precision: macroPrecision,
      recall: macroRecall,
      f1Score: macroF1,
      classMetrics
    };
  }

  /**
   * Run sentiment analysis prediction on input text
   */
  public predict(text: string): {
    sentiment: SentimentClass;
    confidence: number;
    probabilities: { [key in SentimentClass]: number };
    preprocessed: {
      cleaned: string;
      tokens: string[];
      emojis: string[];
    };
    keywordScores: { word: string; score: number }[];
    modelUsed: string;
  } {
    const prep = preprocessText(text);
    const vector = this.vectorizer.transform(prep.tokens);

    let activeModel: any;
    if (this.bestModelType === "Naive Bayes") {
      activeModel = this.naiveBayes;
    } else if (this.bestModelType === "Logistic Regression") {
      activeModel = this.logisticRegression;
    } else {
      activeModel = this.svm;
    }

    const probabilities = activeModel.predictProba(vector);
    const sentiment = activeModel.predict(vector) as SentimentClass;
    const confidence = probabilities[sentiment];

    // Compute keyword scores (terms in doc matching vocabulary multiplied by weight / tf-idf)
    const keywordScores: { word: string; score: number }[] = [];
    const uniqueTokens = Array.from(new Set(prep.tokens));

    // Get feature weights/scores to find the most influential words in the document
    for (const token of uniqueTokens) {
      if (token in this.vectorizer.vocabulary) {
        const vocabIndex = this.vectorizer.vocabulary[token];
        const tfidfVal = vector[vocabIndex];

        // Highlight key semantics
        let importance = tfidfVal;

        // If logistic regression or SVM, we can multiply by model coefficient for the predicted class
        if (this.bestModelType === "Logistic Regression" || this.bestModelType === "Linear SVM") {
          const weights = activeModel.getWeights().models[sentiment]?.weights;
          if (weights) {
            importance = tfidfVal * Math.abs(weights[vocabIndex]);
          }
        } else {
          // Naive Bayes probability difference
          const logProb = activeModel.getWeights().featureLogProbabilities[sentiment]?.[vocabIndex];
          if (logProb) {
            importance = tfidfVal * Math.exp(logProb);
          }
        }

        if (importance > 0) {
          keywordScores.push({ word: token, score: importance });
        }
      }
    }

    // Sort keywords by semantic score descending
    keywordScores.sort((a, b) => b.score - a.score);

    return {
      sentiment,
      confidence,
      probabilities,
      preprocessed: {
        cleaned: prep.cleaned,
        tokens: prep.tokens,
        emojis: prep.emojis
      },
      keywordScores: keywordScores.slice(0, 8),
      modelUsed: this.bestModelType
    };
  }

  /**
   * Export the current state of the pipeline
   */
  public saveState(): PipelineState {
    return {
      bestModelType: this.bestModelType,
      vectorizerState: this.vectorizer.save(),
      modelStates: {
        "Naive Bayes": this.naiveBayes.getWeights(),
        "Logistic Regression": this.logisticRegression.getWeights(),
        "Linear SVM": this.svm.getWeights()
      },
      performance: this.performance
    };
  }

  /**
   * Load state from an exported state object
   */
  public loadState(state: PipelineState): void {
    this.bestModelType = state.bestModelType;
    this.vectorizer.load(state.vectorizerState);
    this.naiveBayes.setWeights(state.modelStates["Naive Bayes"]);
    this.logisticRegression.setWeights(state.modelStates["Logistic Regression"]);
    this.svm.setWeights(state.modelStates["Linear SVM"]);
    this.performance = state.performance;
  }
}
