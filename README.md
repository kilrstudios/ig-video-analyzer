# Instagram Video Analyzer

Transform your content strategy with AI-powered video analysis. Get detailed insights, scene breakdowns, and strategic recommendations from Instagram videos, uploaded files, or business ads.

https://ig-video-analyzer-production.up.railway.app/

## 🚀 Features

### 📱 Multi-Source Video Analysis
- **Instagram URLs**: Analyze public Instagram videos, reels, and posts
- **File Upload**: Upload your own videos (MP4, WebM, MOV, AVI up to 100MB)
- **Ad Library Integration**: Search and analyze business ads from Facebook's Ad Library

### 🎬 Advanced Video Analysis
- **Scene-by-Scene Breakdown**: Detailed analysis of each video segment
- **Hook Identification**: Automatic detection of engagement hooks and their impact
- **Strategic Insights**: AI-powered recommendations for content strategy
- **Audio Transcription**: Full transcript with timestamp segments
- **Visual Elements**: Lighting, composition, camera movement analysis

### 📊 Data Export & Management
- **Enhanced CSV Export**: Video-per-row format perfect for spreadsheet analysis
- **Comprehensive Data**: All analysis data in one organized format
- **Strategic Metrics**: Viral potential, success formulas, implementation frameworks
- **Performance Tracking**: Compare multiple videos side-by-side

## 🆕 New Features

### 📁 Video File Upload
Upload your own video files for analysis:
- **Supported Formats**: MP4, WebM, MOV, AVI, QuickTime
- **File Size Limit**: Up to 100MB per file
- **Duration Analysis**: Automatic credit calculation based on video length
- **Quality Processing**: High-quality frame extraction at 2fps

### 📊 Business Ad Analysis
Research competitor strategies with integrated ad library:
- **Facebook Ad Library Integration**: Search ads by keywords, industry, or brand
- **Video Ad Filtering**: Automatically identifies video-based advertisements
- **Performance Metrics**: View ad spend, reach, and demographic data
- **Competitive Analysis**: Analyze successful ad strategies in your industry

### 📈 Enhanced CSV Export
Perfect for data analysis and reporting:

#### Column Structure
```csv
Video_URL,Video_Source,Analysis_Date,Total_Duration,Primary_Hook,Video_Category,Category_Confidence,Category_Reasoning,Total_Scenes,Total_Hooks,Transcript_Full,Scene_Titles,Scene_Durations,Scene_Descriptions,Dominant_Shot_Types,Dominant_Lighting_Style,Dominant_Mood,Key_Locations,Main_Subjects,Hook_Timestamps,Hook_Types,Hook_Descriptions,High_Impact_Hooks,Why_It_Works,Success_Formula,Universal_Principles,Technical_Requirements,Viral_Potential,Content_Structure_Analysis,Narrative_Arc_Type,Key_Story_Beats,Creator_Intent,Target_Audience,Implementation_Framework
```

#### Data Format Benefits
- **One row per video**: Easy to compare multiple videos
- **Aggregated scene data**: All scene information in pipe-separated format
- **Strategic insights**: Ready-to-use success formulas and principles
- **Spreadsheet-ready**: Import directly into Excel, Google Sheets, or any CSV tool

## Enhanced Retry Logic & Error Handling

The system now includes robust retry mechanisms to handle AI model refusals and temporary failures:

### 🔄 Retry Features

**Refusal Detection**
- Automatically detects when AI models refuse to analyze content
- Patterns include: "I'm unable to", "I can't", "Unable to provide", etc.
- Applies to both frame analysis and scene generation

**Progressive Retry Strategies**
- **Multiple Attempts**: 3 retries for API calls, 2 additional for scene analysis
- **Exponential Backoff**: 1s, 2s, 4s delays to avoid overwhelming the API
- **Context-Aware**: Different retry strategies for different analysis types

**Scene Analysis Fallback Strategies**
1. **Detailed Analysis**: Full structured JSON with all visual elements
2. **Simplified Analysis**: Basic scene breakdown with core elements only
3. **Minimal Analysis**: Fallback structure when AI models refuse analysis

**Enhanced Error Logging**
- Comprehensive request/response tracking
- Refusal pattern detection and logging
- Better debugging information for failed analyses

## 🛠️ Setup & Configuration

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key

# Optional - For Ad Library Features
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
```

### Facebook Ad Library Setup (Optional)
To enable ad library features:

1. **Create Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app with "Business" type
   - Add "Ad Library API" to your app

2. **Get Access Token**:
   - Generate an App Access Token
   - Submit for Ad Library API access (if needed)
   - Add token to environment variables

3. **API Permissions**:
   - The Ad Library API has different access levels
   - Basic access: Public political/issue ads
   - Advanced access: All ads (requires approval)

### File Upload Configuration
The system automatically creates necessary directories:
- `temp/uploads/` - Temporary file storage
- `temp/frames/` - Frame extraction workspace

## 📊 Usage Examples

### Analyzing Multiple Videos for Strategy
1. **Upload/Analyze Videos**: Process multiple videos using different input methods
2. **Export as CSV**: Click "Copy CSV" to get all data in spreadsheet format
3. **Compare Performance**: Use spreadsheet tools to identify patterns
4. **Strategic Planning**: Apply successful elements to your content strategy

### Competitive Ad Research
1. **Search Competitors**: Use Ad Library to find competitor video ads
2. **Analyze Top Performers**: Select ads with high spend/reach for analysis
3. **Extract Strategies**: Identify hooks, messaging, and visual patterns
4. **Adapt for Your Brand**: Apply insights to your advertising strategy

### Content Optimization Workflow
1. **Baseline Analysis**: Analyze your current best-performing content
2. **Identify Patterns**: Use CSV export to find common success elements
3. **Test Variations**: Create new content with identified winning elements
4. **Measure Impact**: Compare new content performance against baseline

## 🔧 Technical Implementation

### Video Processing Pipeline
1. **Input Validation**: File type, size, and format verification
2. **Frame Extraction**: High-quality frames at 2fps using FFmpeg
3. **Audio Processing**: Transcription-ready audio extraction
4. **AI Analysis**: Multi-step analysis with retry logic
5. **Data Compilation**: Structured JSON output with strategic insights

### CSV Generation Logic
- **Hierarchical to Tabular**: Converts nested analysis data to flat CSV structure
- **Data Aggregation**: Combines scene data with pipe separators for spreadsheet compatibility
- **Strategic Metrics**: Includes actionable insights and implementation frameworks
- **Export Optimization**: Proper CSV escaping and formatting for universal compatibility

## 🚀 API Endpoints

### Core Analysis
- `POST /api/analyze` - Instagram URL analysis
- `POST /api/analyze-upload` - File upload analysis
- `GET /api/progress` - Real-time analysis progress

### Ad Library Integration
- `GET /api/ads` - Search business ads by keywords
- `POST /api/ads` - Analyze specific ad content

### Data Management
- Enhanced CSV export through client-side generation
- Real-time progress tracking with WebSocket support
- Credit-based usage tracking and management

## 💡 Best Practices

### For Content Creators
- **Upload consistently**: Analyze your top-performing content to identify patterns
- **Use CSV export**: Track performance metrics across multiple videos
- **Focus on hooks**: Pay attention to high-impact hook identification

### For Marketers
- **Competitive research**: Use Ad Library to study successful campaigns in your industry
- **A/B testing**: Analyze different ad variations to optimize performance
- **Strategic planning**: Use success formulas to guide content creation

### For Agencies
- **Client reporting**: CSV export perfect for comprehensive client reports
- **Batch analysis**: Process multiple client videos efficiently
- **Strategic recommendations**: Use AI insights to provide data-driven advice

## 🔒 Privacy & Security

- **Temporary Processing**: Uploaded files are automatically deleted after analysis
- **No Permanent Storage**: Video content is not stored long-term
- **Secure API Access**: All external API calls use secure authentication
- **Data Encryption**: All data in transit is encrypted using HTTPS

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Testing requirements
- Feature request process
- Bug reporting guidelines

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
  - [Local Development](#local-development-setup)
  - [Supabase Setup](#supabase-setup)
  - [PDF Export Feature](#pdf-export-feature)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Credit System](#credit-system)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Version History](#version-history)
- [Enhanced Retry Logic & Error Handling](#enhanced-retry-logic-error-handling)

## Features

- Download and analyze Instagram videos
- Extract frames and analyze visual content
- Transcribe audio and analyze speech
- Identify music and analyze audio characteristics
- Provide detailed analysis of video composition and editing techniques
- Generate comprehensive video analysis reports
- User authentication and credit system
- PDF export functionality

## Prerequisites

- Node.js 20.x or later
- Python 3.x
- FFmpeg
- Railway account (for deployment)
- OpenAI API key
- Instagram account (for authentication)

## Setup Guide

### Local Development Setup

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
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
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

### Supabase Setup

#### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `ig-video-analyzer`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

#### 2. Database Schema Setup
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the content from `supabase/schema.sql`
3. Run the query to create all tables, functions, and policies

#### 3. Enable Authentication
1. Go to **Authentication > Settings**
2. Enable Email authentication
3. Configure email templates (optional)

#### 4. Create Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `video-files`
3. Set to **Private**

### PDF Export Feature

The application includes comprehensive PDF report generation:

#### PDF Contents Include:
- **Page 1: Overview**
  - Header with video URL and generation date
  - Strategic Overview
  - Video Category with confidence score
  - Primary Hook analysis
  - Transcript

- **Page 2: Scene Analysis**
  - Scene-by-scene breakdown
  - Scene titles, durations, and descriptions
  - Key insights for each scene

- **Page 3: Contextual Analysis**
  - Creator Intent analysis
  - Humor mechanics (if applicable)
  - Message delivery strategy
  - Attention hooks list
  - Memorability factors

## Deployment

### Deployment to Railway

1. Push your code to GitHub

2. Create a new project in Railway and connect it to your GitHub repository

3. Add the following environment variables in Railway:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `INSTAGRAM_COOKIES`: Contents of your instagram_cookies.txt file

4. Railway will automatically deploy your application

## Architecture

- Frontend: Next.js with React
- Backend: Next.js API routes
- Video Processing: FFmpeg and yt-dlp
- AI Analysis: OpenAI GPT-4 Vision and Whisper
- Deployment: Railway
- Storage: Temporary local storage for processing
- Authentication & Database: Supabase

## Credit System

- **Rate**: 1 credit per 15 seconds of video
- **Estimation**: Duration is estimated before analysis
- **Approval**: User must approve costs before processing
- **Example**: 30-second video = 2 credits
- **Free Credits**: New users receive 10 free credits on signup

### Credit Management
- Credits can be purchased through the dashboard
- Full transaction history available
- Automatic credit deduction after analysis
- Credit balance visible in user dashboard

## Troubleshooting

### Common Issues:

**"You exceeded your current quota"**
- Add credits to your OpenAI account
- Check your billing settings
- Verify your API key is active

**"Failed to estimate video duration"**
- Check if yt-dlp is installed: `pip install yt-dlp`
- Verify the Instagram URL is public and valid
- Try a different video URL

**"User profile not created"**
- Check if `create_user_profile` trigger is active
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

**"Insufficient credits" error**
- Verify user has enough credits in database
- Check if `deduct_credits` function is working
- Ensure credit calculation is correct

## Security

- Row Level Security (RLS) enabled for all Supabase tables
- Secure credit transaction system
- Private storage bucket with owner-only access
- Environment variables for sensitive data
- Non-root user in production
- Security headers for API protection

## Version History

### Major Update: Removal of Free AI Analysis
Successfully removed all free AI analysis functionality and local AI models:

#### Removed Components
- Local AI models (Ollama, LLaVA, Llama)
- Free analysis endpoints and components
- Local AI setup guides
- ~19.6 GB of model data freed

#### Current Features
- Premium AI Analysis using OpenAI GPT-4 Vision
- User Authentication with Supabase
- Credit System
- PDF Export functionality
- User Dashboard

The application is now streamlined to focus exclusively on premium OpenAI-powered analysis with user authentication and credit management.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Enhanced Retry Logic & Error Handling

The system now includes robust retry mechanisms to handle AI model refusals and temporary failures:

### 🔄 Retry Features

**Refusal Detection**
- Automatically detects when AI models refuse to analyze content
- Patterns include: "I'm unable to", "I can't", "Unable to provide", etc.
- Applies to both frame analysis and scene generation

**Progressive Retry Strategies**
- **Multiple Attempts**: 3 retries for API calls, 2 additional for scene analysis
- **Exponential Backoff**: 1s, 2s, 4s delays to avoid overwhelming the API
- **Context-Aware**: Different retry strategies for different analysis types

**Scene Analysis Fallback Strategies**
1. **Detailed Analysis**: Full structured JSON with all visual elements
2. **Simplified Analysis**: Basic scene breakdown with core elements only
3. **Minimal Analysis**: Fallback structure when AI models refuse analysis

**Enhanced Error Logging**
- Comprehensive request/response tracking
- Refusal pattern detection and logging
- Better debugging information for failed analyses

### 🛡️ Error Recovery

**Frame Analysis**
- Detects refusal responses in batch processing
- Creates meaningful fallbacks for refused frames
- Tracks success rates and provides detailed logging

**Scene Generation** 
- Multiple prompt strategies if initial analysis fails
- Progressive simplification of analysis requirements
- Preserves audio data even when visual analysis fails

**Rate Limiting**
- Handles 429 rate limit errors with exponential backoff
- Retries temporary network and server errors
- Provides detailed logging for debugging

### 📊 Monitoring

All retry attempts are logged with:
- Context information (batch number, scene number, etc.)
- Success/failure rates
- Specific error types and retry strategies used
- Timing information for performance monitoring
