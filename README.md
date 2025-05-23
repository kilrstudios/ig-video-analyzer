# 🎥 Video Analyzer (Web-Based with Next.js + Google Cloud)

This project is a browser-based video analysis tool that uses the [Google Cloud Video Intelligence API](https://cloud.google.com/video-intelligence) to detect labels, speech, and other insights from uploaded video files.

Built with **Next.js** (React + API Routes) and **Google Cloud**, it provides an interactive frontend for uploading videos and displays AI-generated metadata such as objects, speech, timestamps, and more.

---

## 🧱 Tech Stack

- **Frontend**: Next.js (React)
- **Backend**: Next.js API routes
- **Storage**: Google Cloud Storage (GCS)
- **AI Analysis**: Cloud Video Intelligence API
- **Language**: TypeScript

---

## 🚀 Features

- Upload video files from the browser
- Upload to Google Cloud Storage
- Analyze video using Google Cloud Video Intelligence
- Display:
  - Object and scene labels
  - Timestamps of detected segments
  - Optional: Speech transcription, text in video, explicit content

---

## 🛠 Setup Instructions

### Prerequisites

1. Node.js and npm installed
2. Google Cloud account with:
   - Cloud Storage bucket
   - Video Intelligence API enabled
   - Service account with necessary permissions

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/video-analyzer-web.git
cd video-analyzer-web
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with:
```
GOOGLE_CLOUD_PROJECT_ID=video-analyzer-app-123456
GOOGLE_CLOUD_STORAGE_BUCKET=video-analyzer-app-123456-videos
```

4. Place your Google Cloud service account key file in the project root as `service-account.json`

5. Start the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.
