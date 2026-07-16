import { motion } from "motion/react";
import { BookOpen, Cpu, ShieldAlert, Award, FileText, Terminal } from "lucide-react";

export default function DocGuide() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-mono text-xs mb-2 font-semibold">
              <BookOpen className="w-4 h-4" /> Final-Year Academic Project Documentation
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-800">Project Report & Reference Manual</h1>
            <p className="text-slate-500 mt-2 text-sm max-w-2xl">
              This interactive reference contains the underlying mathematics, system architecture, natural language processing pipeline details, and viva voice presentation guidelines.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold w-fit shadow-sm">
            <Award className="w-4 h-4" /> Grade A+ Quality
          </div>
        </div>
      </motion.div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NLP Preprocessing Pipeline */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 space-y-4 bg-white">
          <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-5 h-5 text-indigo-600" /> NLP & Text Preprocessing
          </h2>
          <p className="text-slate-500 text-sm">
            Before mathematical classification, raw texts are transformed into normalized vector structures using our custom, from-scratch NLP parser:
          </p>
          <div className="space-y-3 font-sans text-xs">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 border border-indigo-100">1</span>
              <div>
                <h4 className="text-slate-700 font-semibold text-sm">Case Normalization & Cleaning</h4>
                <p className="text-slate-400 mt-0.5">Converts text to lowercase, strips web URLs, email links, and non-alphanumeric emojis.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 border border-indigo-100">2</span>
              <div>
                <h4 className="text-slate-700 font-semibold text-sm">Punctuation Strip & Tokenization</h4>
                <p className="text-slate-400 mt-0.5">Removes special characters and splits the continuous string on whitespace boundaries.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 border border-indigo-100">3</span>
              <div>
                <h4 className="text-slate-700 font-semibold text-sm">Stopword Filtering</h4>
                <p className="text-slate-400 mt-0.5">Excludes frequent non-informative grammatical terms (e.g., "the", "and", "is", "for") using an in-memory dictionary.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 border border-indigo-100">4</span>
              <div>
                <h4 className="text-slate-700 font-semibold text-sm">Porter Stemming Algorithm</h4>
                <p className="text-slate-400 mt-0.5">Custom algorithm that applies rules like suffix-stripping (e.g., "flies" → "fli", "running" → "run") to reduce terms to lexical roots.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TF-IDF Mathematics */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 space-y-4 bg-white">
          <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-emerald-600" /> Vectorization: TF-IDF & L2 Norm
          </h2>
          <p className="text-slate-500 text-sm">
            To make tokens understandable for ML, we construct a <strong>Term Frequency - Inverse Document Frequency</strong> vectorizer:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-200/60 shadow-inner">
            <div>
              <div className="text-emerald-700 font-semibold mb-1">1. Term Frequency (TF):</div>
              <div className="text-slate-700">TF(t, d) = count(t, d) / total_terms(d)</div>
            </div>
            <div>
              <div className="text-emerald-700 font-semibold mb-1">2. Inverse Document Frequency (IDF):</div>
              <div className="text-slate-700">IDF(t) = ln((1 + N) / (1 + DF(t))) + 1</div>
              <div className="text-slate-400 mt-0.5">// Smooth-IDF ensures zero division safety.</div>
            </div>
            <div>
              <div className="text-emerald-700 font-semibold mb-1">3. L2 Normalization (Cosine Standard):</div>
              <div className="text-slate-700">v_norm = v / sqrt(sum(v_i ^ 2))</div>
              <div className="text-slate-400 mt-0.5">// Standardizes length differences in text inputs.</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Model Mathematics */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 space-y-6 bg-white">
        <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-purple-600" /> Mathematical Models Formulations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-purple-700 font-semibold font-display text-sm">Multinomial Naive Bayes</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Based on Bayes' Theorem, it computes posterior probability assuming absolute conditional independence:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200/60 shadow-inner">
              P(C|x) ∝ P(C) * ∏ P(x_i|C)<br /><br />
              Log P(C|x) = Log P(C) + Σ x_i * Log( (count(x_i, C) + α) / (total_C + α*D) )
            </div>
            <p className="text-slate-400 text-[10px]">Utilizes Laplace smoothing (α = 1.0) to prevent zero-probability errors.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-purple-700 font-semibold font-display text-sm">Logistic Regression (OvR)</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              A linear model optimized using Gradient Descent with Cross-Entropy Loss and L2 Regularization (Ridge):
            </p>
            <div className="bg-slate-50 p-3 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200/60 shadow-inner">
              z = Dot(x, w) + b<br />
              σ(z) = 1 / (1 + e^-z)<br /><br />
              w = w - η * (Error * x + λ * w)
            </div>
            <p className="text-slate-400 text-[10px]">Trained via stochastic gradient steps with penalty coefficient λ = 0.0001.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-purple-700 font-semibold font-display text-sm">Linear SVM (SGD hinge)</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Finds the maximum margin hyperplane. Optimized using Stochastic Gradient Descent on Hinge Loss:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200/60 shadow-inner">
              Score = Dot(x, w) + b<br />
              Loss = Max(0, 1 - y * Score)<br /><br />
              If loss &gt; 0:<br />
              w = (1 - ηλ)w + η * y * x
            </div>
            <p className="text-slate-400 text-[10px]">Trained on binary classification partitions. Platt Softmax translates raw margin scores into class probabilities.</p>
          </div>
        </div>
      </motion.div>

      {/* REST API Reference */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 space-y-4 bg-white">
        <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Terminal className="w-5 h-5 text-blue-600" /> REST API Documentation
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold font-display bg-slate-50/50">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-2">Endpoint</th>
                <th className="py-2.5 px-2">Request Body / Params</th>
                <th className="py-2.5 px-3">Response Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
              <tr>
                <td className="py-3 px-3 font-bold text-emerald-600">POST</td>
                <td className="py-3 px-2">/api/analyze</td>
                <td className="py-3 px-2">{"{ \"text\": \"...\" }"}</td>
                <td className="py-3 px-3 text-slate-500">Perform sentiment prediction (returns classification + confidence + emoji + explanation).</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">GET</td>
                <td className="py-3 px-2">/api/history</td>
                <td className="py-3 px-2">search, sentiment, page, limit</td>
                <td className="py-3 px-3 text-slate-500">Retrieve paginated database search logs of past analyzes.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">GET</td>
                <td className="py-3 px-2">/api/stats</td>
                <td className="py-3 px-2">None</td>
                <td className="py-3 px-3 text-slate-500">Aggregate statistics for graphs (total metrics, timeline, emotions, keywords).</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">GET</td>
                <td className="py-3 px-2">/api/models</td>
                <td className="py-3 px-2">None</td>
                <td className="py-3 px-3 text-slate-500">Get active model status and trained evaluation comparisons (accuracy, precision, F1).</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-amber-600">POST</td>
                <td className="py-3 px-2">/api/train</td>
                <td className="py-3 px-2">None</td>
                <td className="py-3 px-3 text-slate-500">Trigger full dataset train-test split, evaluate all models, and switch to best.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-amber-600">POST</td>
                <td className="py-3 px-2">/api/dataset</td>
                <td className="py-3 px-2">{"{ \"text\": \"...\", \"sentiment\": \"positive\" }"}</td>
                <td className="py-3 px-3 text-slate-500">Inject a labeled training sample and trigger background model retraining.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* College Viva voice (Oral Examination) Guide */}
      <motion.div variants={itemVariants} className="glass-panel border-l-4 border-blue-600 rounded-2xl p-6 space-y-4 bg-white">
        <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" /> External Examiner Viva Handbook
        </h2>
        <p className="text-slate-500 text-sm">
          Prepare for your project presentation. Here are standard questions frequently asked by external computer science evaluators:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-1 shadow-sm">
            <h4 className="text-blue-700 font-semibold font-display">Q1. Why implement ML algorithms from scratch rather than importing Scikit-learn/Tensorflow?</h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> Doing so proves programmatic depth. It shows we understand the matrix math, gradient update equations, cost formulations (Hinge vs Cross-Entropy), and Laplace smoothing instead of calling black-box library wrappers.
            </p>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-1 shadow-sm">
            <h4 className="text-blue-700 font-semibold font-display">Q2. What is the benefit of using smooth TF-IDF and Cosine/L2 Normalization?</h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> Without smoothing, a word never seen in the corpus causes a division by zero. L2 Normalization projects vector lengths into standard bounds [0, 1], guaranteeing that longer text inputs don't disproportionately skew feature weights.
            </p>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-1 shadow-sm">
            <h4 className="text-blue-700 font-semibold font-display">Q3. Why is Naive Bayes fast, and where does SVM perform better?</h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> Naive Bayes makes predictions in O(V) time through simple count products (highly efficient). However, linear SVM calculates maximum-margin separators and handles correlated non-independent features far better since it does not assume absolute independence.
            </p>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-1 shadow-sm">
            <h4 className="text-blue-700 font-semibold font-display">Q4. How are sentiment probabilities calculated in a Linear SVM?</h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> An SVM outputs continuous margins (decision margins) rather than raw probabilities. We apply a calibrated <strong>Softmax activation</strong> or Sigmoid (Platt scaling representation) over the margin values to get standard multi-class probabilities summing to 1.0.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
