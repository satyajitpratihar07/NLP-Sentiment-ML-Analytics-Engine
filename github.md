# 🚀 How to Upload a Project to GitHub Using Terminal

A complete step-by-step guide to push your local project to a GitHub repository.

---

## 📋 Prerequisites

- Git installed on your system → [Download Git](https://git-scm.com/downloads)
- A GitHub account → [github.com](https://github.com)
- A GitHub repository already created (e.g., `satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine`)

---

## ✅ Step-by-Step Process

### Step 1 — Open Terminal / Command Prompt

Open your terminal (or PowerShell on Windows) and navigate to your project folder:

```bash
cd path/to/your/project
```

**Example:**
```bash
cd C:\Users\satya\Downloads\sentiment-analysis-ml-platform
```

---

### Step 2 — Initialize a Git Repository

If the project doesn't have git initialized yet:

```bash
git init
```

This creates a hidden `.git` folder that tracks your project.

---

### Step 3 — Check the Status of Your Files

See which files are untracked or modified:

```bash
git status
```

---

### Step 4 — Add All Files to Staging

Stage all files for the first commit:

```bash
git add .
```

> **Note:** The `.` means "add everything". To add a specific file, use `git add filename.ext`

---

### Step 5 — Create Your First Commit

Commit the staged files with a descriptive message:

```bash
git commit -m "Initial commit - NLP Sentiment ML Analytics Engine"
```

---

### Step 6 — Rename the Branch to `main` (Recommended)

GitHub uses `main` as the default branch:

```bash
git branch -M main
```

---

### Step 7 — Link Your Local Repo to GitHub

Add the remote GitHub repository URL:

```bash
git remote add origin https://github.com/satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine.git
```

To verify the remote was added:

```bash
git remote -v
```

---

### Step 8 — Push to GitHub

Push your code to the `main` branch on GitHub:

```bash
git push -u origin main
```

> The `-u` flag sets the upstream so future pushes can just be `git push`

---

### Step 9 — Authenticate (if prompted)

If prompted for credentials:
- **Username:** your GitHub username
- **Password:** use a **Personal Access Token (PAT)** — not your GitHub password

#### How to create a PAT:
1. Go to GitHub → **Settings** → **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token**
4. Select scopes: ✅ `repo`
5. Copy the token and use it as your password

---

## 🔄 How to Push Future Changes

After making changes to your project, repeat these steps:

```bash
git add .
git commit -m "Your commit message describing changes"
git push
```

---

## 🌿 Useful Git Commands

| Command | Description |
|---|---|
| `git status` | Check modified/untracked files |
| `git log --oneline` | View commit history |
| `git diff` | See what changed |
| `git pull` | Fetch latest changes from GitHub |
| `git branch` | List all branches |
| `git checkout -b feature-branch` | Create and switch to new branch |
| `git remote -v` | View remote URLs |
| `git reset HEAD~1` | Undo last commit (keeps changes) |

---

## ❓ Common Issues & Fixes

### ❌ "remote origin already exists"
```bash
git remote set-url origin https://github.com/satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine.git
```

### ❌ "failed to push — rejected"
```bash
git pull --rebase origin main
git push
```

### ❌ "src refspec main does not match any"
```bash
git branch -M main
git push -u origin main
```

---

## 🔗 Repository

**GitHub:** [satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine](https://github.com/satyajitpratihar07/NLP-Sentiment-ML-Analytics-Engine)
