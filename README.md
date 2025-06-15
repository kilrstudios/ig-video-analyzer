# Instagram Video Analyzer

A Next.js application that analyzes Instagram videos using AI to provide insights about video content, editing techniques, and music.

https://ig-video-analyzer-production.up.railway.app/

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
OPENAI_API_KEY=your_openai_api_key_here

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
