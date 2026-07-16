/**
 * Custom TF-IDF Vectorizer
 * Fits on a text corpus of tokenized documents and transforms them into TF-IDF vectors
 */

export interface TFIDFState {
  vocabulary: { [key: string]: number };
  idf: { [key: string]: number };
}

export class TFIDFVectorizer {
  public vocabulary: { [key: string]: number } = {};
  public idf: { [key: string]: number } = {};
  private vocabSize = 0;

  constructor() {}

  /**
   * Fit the vectorizer on a corpus of tokenized documents
   * @param corpus Array of token lists
   * @param minDf Minimum document frequency to include a term
   */
  public fit(corpus: string[][], minDf = 1): void {
    const N = corpus.length;
    if (N === 0) return;

    // 1. Calculate Document Frequency (DF) for each term
    const df: { [key: string]: number } = {};
    for (const doc of corpus) {
      const uniqueTermsInDoc = new Set(doc);
      for (const term of uniqueTermsInDoc) {
        df[term] = (df[term] || 0) + 1;
      }
    }

    // 2. Filter terms by minDf and build vocabulary and calculate IDF
    this.vocabulary = {};
    this.idf = {};
    let index = 0;

    for (const [term, freq] of Object.entries(df)) {
      if (freq >= minDf) {
        this.vocabulary[term] = index;
        index++;

        // Smooth IDF formula: idf = ln((1 + N) / (1 + DF(t))) + 1
        this.idf[term] = Math.log((1 + N) / (1 + freq)) + 1;
      }
    }

    this.vocabSize = index;
  }

  /**
   * Transform a tokenized document into a TF-IDF vector
   * @param doc List of preprocessed tokens
   */
  public transform(doc: string[]): number[] {
    const vector = new Array<number>(this.vocabSize).fill(0);
    if (doc.length === 0) return vector;

    // Count term frequencies in the document
    const termCounts: { [key: string]: number } = {};
    for (const term of doc) {
      termCounts[term] = (termCounts[term] || 0) + 1;
    }

    // Compute TF-IDF for terms in vocabulary
    for (const [term, count] of Object.entries(termCounts)) {
      if (term in this.vocabulary) {
        const vocabIndex = this.vocabulary[term];
        const tf = count / doc.length; // Term Frequency (relative frequency)
        const idfVal = this.idf[term];
        vector[vocabIndex] = tf * idfVal;
      }
    }

    // Apply L2 Normalization to the vector
    let sumSquares = 0;
    for (let i = 0; i < this.vocabSize; i++) {
      sumSquares += vector[i] * vector[i];
    }

    if (sumSquares > 0) {
      const norm = Math.sqrt(sumSquares);
      for (let i = 0; i < this.vocabSize; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  /**
   * Transform a batch of tokenized documents
   */
  public transformBatch(corpus: string[][]): number[][] {
    return corpus.map(doc => this.transform(doc));
  }

  /**
   * Export the current state of the vectorizer (for serialization)
   */
  public save(): TFIDFState {
    return {
      vocabulary: this.vocabulary,
      idf: this.idf
    };
  }

  /**
   * Import vectorizer state
   */
  public load(state: TFIDFState): void {
    this.vocabulary = state.vocabulary;
    this.idf = state.idf;
    this.vocabSize = Object.keys(state.vocabulary).length;
  }

  /**
   * Get the feature names in index order
   */
  public getFeatureNames(): string[] {
    const names = new Array<string>(this.vocabSize);
    for (const [term, index] of Object.entries(this.vocabulary)) {
      names[index] = term;
    }
    return names;
  }
}
