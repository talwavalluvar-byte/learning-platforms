# DevBase2 - Developer Visual Learning Platform (Log2Base2 Clone)

DevBase2 is an interactive visual learning web application inspired by **Log2Base2**. It allows developers to learn computer science, C pointers, memory allocation, data structures, algorithms, and Python memory models visually side-by-side with offline videos and Google Drive videos.

## Features

- **Google Drive & Offline Video Integration**:
  - **Google Drive URL Streaming**: Paste share links (e.g. `https://drive.google.com/file/d/FILE_ID/view`) to stream videos directly from your Google Drive folder inside full-screen HD iframe players.
  - **Google Drive Local Sync / Desktop**: Drag & drop or select video files (`.mp4`, `.webm`, `.mkv`) directly from your Google Drive synced folder (`G:\My Drive\...`).
  - Saved video sources remain mapped per lesson in browser LocalStorage.

- **Log2Base2 Memory & DSA Visualizer**:
  - **Memory Diagram**: Interactive Stack & Heap memory diagrams showing variable names, hex addresses (`0x7ffe00`), pointer arrows (`*ptr`), and values.
  - **DSA Animations**: Animated sorting bar charts (Bubble Sort, Array Traversals) with step-by-step play/pause controls.
  - **Code Line Sync**: Code viewer highlights the active executing line synced to visual step animations or video timestamps.

- **Interactive Quizzes & Sandbox**:
  - Visual concept quizzes with instant answer feedback and detailed explanations.
  - Built-in Developer Code Sandbox with live console output.
  - Notes editor with timestamped study notes.

---

## How to Connect Your Google Drive Videos

1. Open any lesson in the **Lesson Visualizer**.
2. Click **Attach Video (GDrive / Offline)** or the **Offline Video** badge in the navbar.
3. **Option A (Google Drive Link)**: Copy your video link from Google Drive (`Share` -> `Copy link`) and paste it into the **Google Drive Shareable Link** field.
4. **Option B (Local / GDrive Synced File)**: Click **Browse Local File** and select the `.mp4` file directly from your Google Drive Desktop folder.

---

## Deploy Live to Vercel

### Option 1: Drag & Drop Folder (Fastest)
1. Go to your Vercel Dashboard ([vercel.com/new](https://vercel.com/new)).
2. Click **`folder`** in the middle of the screen.
3. Select this folder path:
   `c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\dev-learning-platform`
4. Click **Deploy**!

### Option 2: Push to GitHub & Import
1. Create a new GitHub repo on your account `talwavalluvar-byte` named `dev-learning-platform`.
2. Push your project code:
   ```bash
   cd "c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\dev-learning-platform"
   git init
   git add .
   git commit -m "Initial commit - Log2Base2 clone with GDrive support"
   git branch -M main
   git remote add origin https://github.com/talwavalluvar-byte/dev-learning-platform.git
   git push -u origin main
   ```
3. Refresh your Vercel dashboard and click **Import** next to `dev-learning-platform`.
