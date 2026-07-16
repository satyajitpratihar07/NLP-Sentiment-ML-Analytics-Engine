<h1 align="center">🧠 NLP Sentiment ML Analytics Engine</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini_AI-Integrated-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
</p>

<p align="center">
  A full-stack, production-ready <strong>NLP Sentiment Analysis Platform</strong> built with a custom ML pipeline, TF-IDF vectorization, real-time analytics dashboards, and optional <strong>Google Gemini AI</strong> integration for deep generative explanations.
</p>

---

## 📸 Overview

> Analyze text sentiment instantly — powered by a custom-trained machine learning pipeline running fully offline, with optional Gemini AI enhancement for academic-grade explanations.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Custom ML Pipeline** | Multi-model training with TF-IDF vectorization — runs 100% locally |
| 📊 **Real-time Analytics** | Interactive dashboards with emotion distribution, timeline charts, keyword clouds |
| 🔮 **Gemini AI Integration** | Optional Google Gemini API for deep generative sentiment explanations |
| 📝 **Sentence-level Analysis** | Breaks text into sentences and scores each independently |
| 🏷️ **Emotion Classification** | Detects 6 emotions: Joy, Anger, Sadness, Fear, Surprise, Neutral |
| 📦 **Batch Processing** | Analyze up to 20 texts simultaneously |
| 📁 **Prediction History** | Persistent file-based database with search, filters, and pagination |
| 📤 **CSV Export** | Export all prediction history as downloadable CSV |
| 🔄 **Live Retraining** | Add new training samples and retrain the model via UI |
| 🌐 **Offline Mode** | Works completely offline using local NLP rules when no API key is set |

---

## 🏗️ Tech Stack

### Frontend
- **React 19** — Modern UI with hooks
- **TypeScript** — Type-safe codebase
- **Vite** — Lightning fast build tool
- **Tailwind CSS v4** — Utility-first styling
- **Lucide React** — Beautiful icons
- **Motion** — Smooth animations

### Backend
- **Node.js + Express** — REST API server
- **Custom NLP Pipeline** — TF-IDF vectorization + multi-model ML classifier
- **Google Gemini AI** (`@google/genai`) — Generative AI explanations
- **File-based Database** — Zero-dependency persistent storage
- **tsx** — TypeScript execution for Node.js

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- *(Optional)* Google Gemini API Key → [Get one free](https://aistudio.google.com/app/apikey)

---

### 1. Clone the Repository

```bash
git clone https://github.com/satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine.git
cd NLP-Sentiment-ML-Analytics-Engine
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Copy the example `.env` file and edit it:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key *(optional)*:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Note:** If you skip this step, the app runs in **offline mode** using the local ML pipeline — fully functional without an API key.

---

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and visit: **http://localhost:3000**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check & mode status |
| `POST` | `/api/analyze` | Analyze a single text for sentiment |
| `POST` | `/api/batch` | Batch analyze up to 20 texts |
| `GET` | `/api/history` | Get prediction history (with filters & pagination) |
| `DELETE` | `/api/history/:id` | Delete a specific prediction record |
| `DELETE` | `/api/history` | Clear all prediction history |
| `GET` | `/api/stats` | Get aggregated analytics & visualization data |
| `GET` | `/api/models` | Get current ML model performance metrics |
| `POST` | `/api/train` | Manually trigger ML pipeline retraining |
| `POST` | `/api/dataset` | Add a sample to the training dataset |
| `GET` | `/api/export-csv` | Export prediction history as CSV file |

---

### Example API Usage

**Analyze Text:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is absolutely amazing and I love it!"}'
```

**Response:**
```json
{
  "id": "abc123",
  "text": "This product is absolutely amazing and I love it!",
  "sentiment": "positive",
  "confidence": 0.94,
  "emotion": "Joy",
  "keywords": [{"word": "amazing", "score": 0.87}, {"word": "love", "score": 0.82}],
  "aiExplanation": "The text expresses strong positive sentiment...",
  "modelUsed": "NaiveBayes",
  "timestamp": "2025-07-16T10:00:00.000Z"
}
```

---

## 🧠 ML Pipeline Architecture

```
Raw Text Input
     │
     ▼
┌─────────────────────────────┐
│   Text Preprocessing        │  → Tokenize, lowercase, remove stopwords
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│   TF-IDF Vectorization      │  → Build vocabulary, compute term weights
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│   Multi-Model Training      │  → Naive Bayes, Logistic Regression, etc.
│   + Auto Model Selection    │  → Best model selected by accuracy
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│   Sentiment Prediction      │  → positive / neutral / negative
│   + Confidence Score        │
│   + Keyword Scores          │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│   (Optional) Gemini AI      │  → Deep generative explanation
│   Explanation Layer         │  → Emotion enrichment
└─────────────────────────────┘
```

---

## 📂 Project Structure

```
NLP-Sentiment-ML-Analytics-Engine/
├── server.ts                   # Main Express server & API routes
├── server/
│   ├── db.ts                   # File-based persistent database
│   └── ml/
│       ├── pipeline.ts         # ML training & prediction pipeline
│       ├── models.ts           # ML model implementations
│       ├── nlp.ts              # NLP preprocessing utilities
│       └── tfidf.ts            # TF-IDF vectorizer
├── src/
│   ├── App.tsx                 # Root React component
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles
│   ├── types.ts                # TypeScript type definitions
│   └── components/
│       ├── SentimentAnalyzer.tsx   # Main analysis UI
│       ├── StatsDashboard.tsx      # Analytics & charts
│       ├── HistoryTable.tsx        # Prediction history viewer
│       ├── RetrainPanel.tsx        # Model retraining UI
│       └── DocGuide.tsx            # Documentation guide
├── data/
│   ├── trained_model.json      # Persisted ML model state
│   ├── predictions_history.json # Prediction records database
│   └── custom_dataset.json     # Custom training samples
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── github.md                   # GitHub upload guide
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (frontend + backend) |
| `npm run start` | Run production build |
| `npm run lint` | TypeScript type checking |

---

## 🔒 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ❌ Optional | Google Gemini API key for AI explanations |

> Without a Gemini API key, the platform uses the **local ML pipeline** for all predictions. All core features remain fully functional.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Satyajit Pratihar**  
GitHub: [@satyajitpratihar07](https://github.com/satyajitpratihar07)

---

<p align="center">⭐ Star this repo if you found it helpful!</p>
