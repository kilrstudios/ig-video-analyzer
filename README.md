# Instagram Video Analyzer

A Next.js application that analyzes Instagram videos using AI to provide insights about video content, editing techniques, and music.

https://ig-video-analyzer-production.up.railway.app/

## Features

- Download and analyze Instagram videos
- Extract frames and analyze visual content
- Transcribe audio and analyze speech
- Identify music and analyze audio characteristics
- Provide detailed analysis of video composition and editing techniques
- Generate comprehensive video analysis reports

## Prerequisites

- Node.js 20.x or later
- Python 3.x
- FFmpeg
- Google Cloud account (for deployment)
- OpenAI API key
- Instagram account (for authentication)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ig-video-analyzer.git
cd ig-video-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
INSTAGRAM_COOKIES=path_to_your_instagram_cookies_file
```

4. Get your Instagram cookies:
   - Log into Instagram in your browser
   - Open Developer Tools (F12)
   - Go to Application/Storage tab
   - Find Cookies in the left sidebar
   - Select instagram.com
   - Export the following cookies:
     - sessionid
     - csrftoken
     - ds_user_id

5. Create a cookies file (e.g., `instagram_cookies.txt`) with the following format:
```
instagram.com	TRUE	/	TRUE	1735689600	sessionid	your_session_id
instagram.com	TRUE	/	TRUE	1735689600	csrftoken	your_csrf_token
instagram.com	TRUE	/	TRUE	1735689600	ds_user_id	your_user_id
```

6. Run the development server:
```bash
npm run dev
```

## Deployment to Google Cloud Run

1. Build and push the Docker image:
```bash
gcloud builds submit --tag us-west1-docker.pkg.dev/video-analyzer-app-123456/ig-video-analyzer-repo/ig-video-analyzer
```

2. Create a secret for Instagram cookies:
```bash
gcloud secrets create instagram-cookies --data-file=instagram_cookies.txt
```

3. Grant access to the secret:
```bash
gcloud secrets add-iam-policy-binding instagram-cookies --member="serviceAccount:614111484782-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

4. Deploy to Cloud Run:
```bash
gcloud run deploy ig-video-analyzer \
  --image us-west1-docker.pkg.dev/video-analyzer-app-123456/ig-video-analyzer-repo/ig-video-analyzer \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your_openai_api_key \
  --set-secrets=INSTAGRAM_COOKIES=instagram-cookies:latest
```

## Usage

1. Open the application in your browser
2. Paste an Instagram video URL
3. Click "Analyze"
4. Wait for the analysis to complete
5. View the detailed analysis report

## Architecture

- Frontend: Next.js with React
- Backend: Next.js API routes
- Video Processing: FFmpeg and yt-dlp
- AI Analysis: OpenAI GPT-4 Vision and Whisper
- Deployment: Google Cloud Run
- Storage: Temporary local storage for processing

## Security Notes

- The application uses temporary storage for video processing
- All files are deleted after analysis
- Instagram cookies are stored securely in Google Cloud Secret Manager
- The application runs as a non-root user in production

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
