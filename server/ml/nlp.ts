/**
 * NLP Preprocessing Engine
 * Custom implementation of text preprocessing, tokenization, stopword removal, and stemming/lemmatization
 */

// Comprehensive set of English stopwords
export const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't",
  "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he",
  "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
  "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
  "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
  "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while",
  "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
  "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

/**
 * A robust Porter-Stemmer-like stemmer implementation in TypeScript.
 * Reduces English words to their base form.
 */
export function stemWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length < 3) return w;

  // Step 1a
  if (w.endsWith("sses")) {
    w = w.slice(0, -2);
  } else if (w.endsWith("ies")) {
    w = w.slice(0, -3) + "i";
  } else if (w.endsWith("ss")) {
    // keep ss
  } else if (w.endsWith("s") && !w.endsWith("us") && !w.endsWith("is") && !w.endsWith("as")) {
    w = w.slice(0, -1);
  }

  // Step 1b
  let eel = false;
  if (w.endsWith("eed")) {
    const base = w.slice(0, -3);
    if (countSyllables(base) > 0) {
      w = base + "ee";
    }
  } else if (w.endsWith("ed")) {
    const base = w.slice(0, -2);
    if (containsVowel(base)) {
      w = base;
      eel = true;
    }
  } else if (w.endsWith("ing")) {
    const base = w.slice(0, -3);
    if (containsVowel(base)) {
      w = base;
      eel = true;
    }
  }

  if (eel) {
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) {
      w += "e";
    } else if (isDoubleConsonant(w) && !w.endsWith("l") && !w.endsWith("s") && !w.endsWith("z")) {
      w = w.slice(0, -1);
    } else if (countSyllables(w) === 1 && isCvc(w)) {
      w += "e";
    }
  }

  // Step 1c: y -> i if vowel in stem
  if (w.endsWith("y")) {
    const base = w.slice(0, -1);
    if (containsVowel(base)) {
      w = base + "i";
    }
  }

  // Step 2: Derivational suffixes mapping (simplified)
  const suffixes2: { [key: string]: string } = {
    "ational": "ate",
    "tional": "tion",
    "enci": "ence",
    "anci": "ance",
    "izer": "ize",
    "bli": "ble",
    "alli": "al",
    "entli": "ent",
    "eli": "e",
    "ousli": "ous",
    "ization": "ize",
    "ation": "ate",
    "ator": "ate",
    "alism": "al",
    "iveness": "ive",
    "fulness": "ful",
    "ousness": "ous",
    "aliti": "al",
    "iviti": "ive",
    "biliti": "ble"
  };

  for (const [suf, rep] of Object.entries(suffixes2)) {
    if (w.endsWith(suf)) {
      const base = w.slice(0, -suf.length);
      if (countSyllables(base) > 0) {
        w = base + rep;
        break;
      }
    }
  }

  // Step 3: Derivational suffixes (more simplified)
  const suffixes3: { [key: string]: string } = {
    "icate": "ic",
    "ative": "",
    "alize": "al",
    "iciti": "ic",
    "ical": "ic",
    "ful": "",
    "ness": ""
  };

  for (const [suf, rep] of Object.entries(suffixes3)) {
    if (w.endsWith(suf)) {
      const base = w.slice(0, -suf.length);
      if (countSyllables(base) > 0) {
        w = base + rep;
        break;
      }
    }
  }

  return w;
}

// Helper functions for stemmer
function containsVowel(word: string): boolean {
  return /[aeiouy]/.test(word);
}

function isConsonant(word: string, i: number): boolean {
  const char = word[i];
  if (/[aeiou]/.test(char)) return false;
  if (char === "y") {
    if (i === 0) return true;
    return !isConsonant(word, i - 1);
  }
  return true;
}

function countSyllables(word: string): number {
  let count = 0;
  let i = 0;
  const len = word.length;
  while (true) {
    if (i >= len) return count;
    if (!isConsonant(word, i)) break;
    i++;
  }
  i++;
  while (true) {
    while (true) {
      if (i >= len) return count;
      if (isConsonant(word, i)) break;
      i++;
    }
    i++;
    count++;
    while (true) {
      if (i >= len) return count;
      if (!isConsonant(word, i)) break;
      i++;
    }
    i++;
  }
}

function isDoubleConsonant(word: string): boolean {
  if (word.length < 2) return false;
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  if (last !== secondLast) return false;
  return isConsonant(word, word.length - 1);
}

function isCvc(word: string): boolean {
  if (word.length < 3) return false;
  const len = word.length;
  const c1 = isConsonant(word, len - 3);
  const v = !isConsonant(word, len - 2);
  const c2 = isConsonant(word, len - 1);
  if (c1 && v && c2) {
    const last = word[len - 1];
    return last !== "w" && last !== "x" && last !== "y";
  }
  return false;
}

/**
 * Text Preprocessing Pipeline
 * - Convert to lowercase
 * - Remove URLs, email addresses, and HTML tags
 * - Remove Emojis (and keep track of them for display/metadata)
 * - Remove special characters & punctuation
 * - Tokenize by space and remove extra spaces
 * - Stopword removal
 * - Stemming (lemmatization)
 */
export interface PreprocessedText {
  original: string;
  cleaned: string;
  tokens: string[];
  emojis: string[];
}

export function preprocessText(text: string): PreprocessedText {
  if (!text) {
    return { original: "", cleaned: "", tokens: [], emojis: [] };
  }

  // 1. Detect and extract emojis before stripping them
  // Regex for extracting emojis
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu;
  const emojis = text.match(emojiRegex) || [];

  // 2. Base cleaning
  let cleaned = text.toLowerCase();

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, "");

  // Remove Email addresses
  cleaned = cleaned.replace(/\S+@\S+\.\S+/g, "");

  // Remove Emojis
  cleaned = cleaned.replace(emojiRegex, "");

  // Remove punctuation & special characters (keep spaces and standard alphanumeric characters)
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, " ");

  // 3. Tokenize by splitting on whitespaces
  const rawTokens = cleaned.split(/\s+/).filter(token => token.length > 0);

  // 4. Remove stopwords & stem remaining tokens
  const tokens: string[] = [];
  for (const token of rawTokens) {
    if (!STOPWORDS.has(token) && token.length > 1) {
      tokens.push(stemWord(token));
    }
  }

  return {
    original: text,
    cleaned: rawTokens.join(" "),
    tokens,
    emojis
  };
}
