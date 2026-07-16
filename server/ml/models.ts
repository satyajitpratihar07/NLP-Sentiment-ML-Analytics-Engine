/**
 * Machine Learning Classification Models implemented from scratch in TypeScript
 * - Multinomial Naive Bayes
 * - Logistic Regression (One-vs-Rest with SGD & L2 regularization)
 * - Linear SVM (One-vs-Rest with SGD & Hinge Loss)
 */

export type SentimentClass = "positive" | "negative" | "neutral";
export const SENTIMENT_CLASSES: SentimentClass[] = ["positive", "neutral", "negative"];

/**
 * Base Interface for ML Classifiers
 */
export interface Classifier {
  train(X: number[][], y: SentimentClass[]): void;
  predict(x: number[]): SentimentClass;
  predictProba(x: number[]): { [key in SentimentClass]: number };
  getWeights(): any;
  setWeights(weights: any): void;
}

/**
 * Helper function: dot product of two arrays
 */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Helper function: Softmax activation
 */
function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sumExps = exps.reduce((sum, e) => sum + e, 0);
  return exps.map(e => (sumExps > 0 ? e / sumExps : 0));
}

/**
 * Helper function: Sigmoid function
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

// ============================================================================
// 1. Multinomial Naive Bayes Classifier
// ============================================================================
export interface NaiveBayesWeights {
  classPriors: { [key in SentimentClass]: number };
  featureLogProbabilities: { [key in SentimentClass]: number[] };
}

export class MultinomialNaiveBayes implements Classifier {
  private classPriors: { [key in SentimentClass]: number } = { positive: 0, neutral: 0, negative: 0 };
  private featureLogProbabilities: { [key in SentimentClass]: number[] } = { positive: [], neutral: [], negative: [] };
  private alpha = 1.0; // Laplace smoothing parameter
  private vocabSize = 0;

  constructor(alpha = 1.0) {
    this.alpha = alpha;
  }

  public train(X: number[][], y: SentimentClass[]): void {
    const nSamples = X.length;
    if (nSamples === 0) return;
    this.vocabSize = X[0].length;

    // 1. Calculate class priors
    const classCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const label of y) {
      classCounts[label]++;
    }

    for (const cls of SENTIMENT_CLASSES) {
      this.classPriors[cls] = classCounts[cls] / nSamples;
    }

    // 2. Sum features per class and calculate feature probabilities
    const featureSums: { [key in SentimentClass]: number[] } = {
      positive: new Array<number>(this.vocabSize).fill(0),
      neutral: new Array<number>(this.vocabSize).fill(0),
      negative: new Array<number>(this.vocabSize).fill(0)
    };

    const totalFeaturesPerClass = { positive: 0, neutral: 0, negative: 0 };

    for (let i = 0; i < nSamples; i++) {
      const cls = y[i];
      const vector = X[i];
      for (let j = 0; j < this.vocabSize; j++) {
        featureSums[cls][j] += vector[j];
        totalFeaturesPerClass[cls] += vector[j];
      }
    }

    // 3. Compute log probabilities with smoothing
    for (const cls of SENTIMENT_CLASSES) {
      this.featureLogProbabilities[cls] = new Array<number>(this.vocabSize);
      const denominator = totalFeaturesPerClass[cls] + this.alpha * this.vocabSize;

      for (let j = 0; j < this.vocabSize; j++) {
        const numerator = featureSums[cls][j] + this.alpha;
        this.featureLogProbabilities[cls][j] = Math.log(numerator / denominator);
      }
    }
  }

  public predictProba(x: number[]): { [key in SentimentClass]: number } {
    const scores = SENTIMENT_CLASSES.map(cls => {
      // Prior log probability
      let score = Math.log(this.classPriors[cls] || 1e-10);

      // Add feature log probabilities
      for (let j = 0; j < this.vocabSize; j++) {
        if (x[j] > 0) {
          score += x[j] * this.featureLogProbabilities[cls][j];
        }
      }
      return score;
    });

    // Softmax to convert log-scores to valid probabilities
    const probabilities = softmax(scores);

    return {
      positive: probabilities[0],
      neutral: probabilities[1],
      negative: probabilities[2]
    };
  }

  public predict(x: number[]): SentimentClass {
    const proba = this.predictProba(x);
    let bestClass: SentimentClass = "neutral";
    let bestProb = -1;

    for (const cls of SENTIMENT_CLASSES) {
      if (proba[cls] > bestProb) {
        bestProb = proba[cls];
        bestClass = cls;
      }
    }

    return bestClass;
  }

  public getWeights(): NaiveBayesWeights {
    return {
      classPriors: this.classPriors,
      featureLogProbabilities: this.featureLogProbabilities
    };
  }

  public setWeights(weights: NaiveBayesWeights): void {
    this.classPriors = weights.classPriors;
    this.featureLogProbabilities = weights.featureLogProbabilities;
    if (weights.featureLogProbabilities.positive) {
      this.vocabSize = weights.featureLogProbabilities.positive.length;
    }
  }
}

// ============================================================================
// 2. Logistic Regression Classifier (One-vs-Rest)
// ============================================================================
export interface LogisticRegressionWeights {
  models: {
    [key in SentimentClass]: {
      weights: number[];
      bias: number;
    }
  };
}

export class LogisticRegression implements Classifier {
  private models: {
    [key in SentimentClass]?: {
      weights: number[];
      bias: number;
    }
  } = {};

  private learningRate = 0.1;
  private l2Penalty = 0.0001;
  private epochs = 50;

  constructor(learningRate = 0.1, l2Penalty = 0.0001, epochs = 50) {
    this.learningRate = learningRate;
    this.l2Penalty = l2Penalty;
    this.epochs = epochs;
  }

  public train(X: number[][], y: SentimentClass[]): void {
    const nSamples = X.length;
    if (nSamples === 0) return;
    const nFeatures = X[0].length;

    this.models = {};

    // Train a binary Logistic Regression for each class vs Rest
    for (const targetClass of SENTIMENT_CLASSES) {
      // 1. Initialize weights and bias
      const w = new Array<number>(nFeatures).fill(0);
      let b = 0;

      // Create binary labels: 1 if targetClass, 0 otherwise
      const binaryY = y.map(cls => (cls === targetClass ? 1 : 0));

      // 2. Gradient descent
      for (let epoch = 0; epoch < this.epochs; epoch++) {
        // Shuffle samples
        const indices = Array.from({ length: nSamples }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Online/Stochastic gradient descent updates
        for (const idx of indices) {
          const vector = X[idx];
          const target = binaryY[idx];

          const score = dotProduct(vector, w) + b;
          const prediction = sigmoid(score);
          const error = prediction - target;

          // Compute gradients with L2 Regularization
          for (let j = 0; j < nFeatures; j++) {
            const gradW = error * vector[j] + this.l2Penalty * w[j];
            w[j] -= this.learningRate * gradW;
          }
          const gradB = error;
          b -= this.learningRate * gradB;
        }
      }

      this.models[targetClass] = { weights: w, bias: b };
    }
  }

  public predictProba(x: number[]): { [key in SentimentClass]: number } {
    const rawScores = SENTIMENT_CLASSES.map(cls => {
      const model = this.models[cls];
      if (!model) return 0;
      return dotProduct(x, model.weights) + model.bias;
    });

    // Softmax over the raw classification scores to get balanced multi-class probabilities
    const probabilities = softmax(rawScores);

    return {
      positive: probabilities[0],
      neutral: probabilities[1],
      negative: probabilities[2]
    };
  }

  public predict(x: number[]): SentimentClass {
    const proba = this.predictProba(x);
    let bestClass: SentimentClass = "neutral";
    let bestProb = -1;

    for (const cls of SENTIMENT_CLASSES) {
      if (proba[cls] > bestProb) {
        bestProb = proba[cls];
        bestClass = cls;
      }
    }

    return bestClass;
  }

  public getWeights(): LogisticRegressionWeights {
    return {
      models: this.models as any
    };
  }

  public setWeights(weights: LogisticRegressionWeights): void {
    this.models = weights.models;
  }
}

// ============================================================================
// 3. Linear Support Vector Machine Classifier (One-vs-Rest via SGD with Hinge Loss)
// ============================================================================
export interface SVMWeights {
  models: {
    [key in SentimentClass]: {
      weights: number[];
      bias: number;
    }
  };
}

export class LinearSVM implements Classifier {
  private models: {
    [key in SentimentClass]?: {
      weights: number[];
      bias: number;
    }
  } = {};

  private learningRate = 0.05;
  private l2Penalty = 0.01; // Regularization parameter (C in SVM)
  private epochs = 60;

  constructor(learningRate = 0.05, l2Penalty = 0.01, epochs = 60) {
    this.learningRate = learningRate;
    this.l2Penalty = l2Penalty;
    this.epochs = epochs;
  }

  public train(X: number[][], y: SentimentClass[]): void {
    const nSamples = X.length;
    if (nSamples === 0) return;
    const nFeatures = X[0].length;

    this.models = {};

    // Train a binary Support Vector Machine for each class vs Rest
    for (const targetClass of SENTIMENT_CLASSES) {
      // 1. Initialize weights and bias
      const w = new Array<number>(nFeatures).fill(0);
      let b = 0;

      // Create binary labels: +1 if targetClass, -1 otherwise (standard for SVM)
      const binaryY = y.map(cls => (cls === targetClass ? 1 : -1));

      // 2. Training via Stochastic Gradient Descent for Hinge Loss
      for (let epoch = 0; epoch < this.epochs; epoch++) {
        // Decrease learning rate gradually (simulating decaying learning rate)
        const currentLr = this.learningRate / (1 + epoch * 0.02);

        // Shuffle samples
        const indices = Array.from({ length: nSamples }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        for (const idx of indices) {
          const vector = X[idx];
          const target = binaryY[idx];

          const margin = target * (dotProduct(vector, w) + b);

          if (margin < 1) {
            // Misclassified or within the margin -> update weights & bias
            for (let j = 0; j < nFeatures; j++) {
              w[j] = (1 - currentLr * this.l2Penalty) * w[j] + currentLr * target * vector[j];
            }
            b += currentLr * target;
          } else {
            // Correctly classified and outside the margin -> regularize weights only
            for (let j = 0; j < nFeatures; j++) {
              w[j] = (1 - currentLr * this.l2Penalty) * w[j];
            }
          }
        }
      }

      this.models[targetClass] = { weights: w, bias: b };
    }
  }

  public predictProba(x: number[]): { [key in SentimentClass]: number } {
    // SVM outputs are margins (distance to decision boundary)
    const margins = SENTIMENT_CLASSES.map(cls => {
      const model = this.models[cls];
      if (!model) return 0;
      return dotProduct(x, model.weights) + model.bias;
    });

    // Use softmax over the margin values to get calibrated class probabilities (Platt-scaling approximation)
    const probabilities = softmax(margins);

    return {
      positive: probabilities[0],
      neutral: probabilities[1],
      negative: probabilities[2]
    };
  }

  public predict(x: number[]): SentimentClass {
    // Predict the class with the highest decision margin
    let bestClass: SentimentClass = "neutral";
    let bestMargin = -Infinity;

    for (const cls of SENTIMENT_CLASSES) {
      const model = this.models[cls];
      if (!model) continue;
      const margin = dotProduct(x, model.weights) + model.bias;
      if (margin > bestMargin) {
        bestMargin = margin;
        bestClass = cls;
      }
    }

    return bestClass;
  }

  public getWeights(): SVMWeights {
    return {
      models: this.models as any
    };
  }

  public setWeights(weights: SVMWeights): void {
    this.models = weights.models;
  }
}
