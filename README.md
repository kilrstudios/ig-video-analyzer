# Instagram Video Analyzer

A web application that analyzes Instagram videos using Google Cloud's Video Intelligence API. The application can detect objects, activities, and other content within Instagram videos.

## Features

- Instagram video download support via yt-dlp
- Video analysis using Google Cloud Video Intelligence API
- Detection of:
  - Objects and items
  - Activities
  - Facial expressions
  - Scene changes
  - And more...

## Prerequisites

- Node.js 18+ and npm
- Python (for yt-dlp)
- yt-dlp (`brew install yt-dlp` on macOS)
- Google Cloud account with:
  - Video Intelligence API enabled
  - Storage API enabled
  - Service account with appropriate permissions
  - Service account key file

## Setup

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd google-video-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install yt-dlp**
   - macOS:
     ```bash
     brew install yt-dlp
     ```
   - Linux:
     ```bash
     sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
     sudo chmod a+rx /usr/local/bin/yt-dlp
     ```
   - Windows:
     ```bash
     # Using scoop
     scoop install yt-dlp
     # Or using chocolatey
     choco install yt-dlp
     ```

4. **Set up Google Cloud**
   - Create a new project in Google Cloud Console
   - Enable Video Intelligence API and Storage API
   - Create a service account and download the key file
   - Place the service account key file in the project root as `service-account.json`

5. **Environment Variables**
   Create a `.env.local` file:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
   ```

## Development

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Deployment Options

### 1. Server Deployment (Recommended)

Deploy to a server with yt-dlp installed:
1. Install yt-dlp on the server
2. Deploy the Next.js application
3. Set up environment variables
4. Ensure Python is available

### 2. Docker Deployment

Use Docker to package the application with all dependencies:
1. Build the Docker image
2. Deploy to any container platform
3. All dependencies included

### 3. Browser-Only Version

For simpler deployment without yt-dlp:
1. Modify the code to use Instagram's oEmbed or Graph API
2. Remove yt-dlp dependency
3. Deploy to any static hosting

## Usage

1. Open the application in your browser
2. Paste an Instagram video/reel URL
3. Click "Analyze"
4. View the analysis results

## API Reference

### POST /api/analyze
Analyzes a video from a given URL, detecting labels and shot changes.

Request body:
```json
{
  "url": "https://www.instagram.com/p/..."
}
```

Response:
```json
{
  "labels": [
    {
      "description": "string",
      "confidence": number,
      "segments": [
        {
          "startTime": "string",
          "endTime": "string"
        }
      ]
    }
  ],
  "shots": [
    {
      "startTime": "string",
      "endTime": "string",
      "confidence": number,
      "frameRate": number,
      "shotType": "string"  // e.g., "FADE", "CUT", "DISSOLVE"
    }
  ]
}
```

The response includes:
- `labels`: Objects, activities, and concepts detected in the video
- `shots`: Scene changes and transitions in the video
  - `startTime`: When the shot begins
  - `endTime`: When the shot ends
  - `confidence`: Confidence score of the detection
  - `frameRate`: Frame rate at the time of the shot
  - `shotType`: Type of transition between shots

## Technical Details

- Built with Next.js 14
- Uses Tailwind CSS for styling
- Server-side video processing
- Google Cloud APIs for analysis
- yt-dlp for reliable video downloading

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
