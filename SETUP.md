# Instagram Video Analyzer - Setup Guide

## 🚀 Quick Start

### 1. **Demo Mode (No API Required)**
The app now includes a demo mode that works without OpenAI API configuration. Perfect for:
- Testing the UI interface
- Understanding the analysis structure  
- Development and debugging

Simply run the app and try analyzing any Instagram URL - you'll get sample data instantly!

### 2. **Full Analysis Mode (OpenAI API Required)**

#### Step 1: Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API keys section
4. Generate a new API key
5. **Important**: Add credits to your account (analysis requires API usage)

#### Step 2: Configure Environment
1. Copy `.env.local.example` to `.env.local`
2. Add your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

#### Step 3: Test Configuration
1. Restart the development server
2. Try analyzing a short Instagram video
3. Monitor your OpenAI usage dashboard

## 💰 **Credit System**

- **Rate**: 1 credit per 15 seconds of video
- **Estimation**: Duration is estimated before analysis
- **Approval**: User must approve costs before processing
- **Example**: 30-second video = 2 credits

## 🛠️ **Troubleshooting**

### Common Issues:

**"You exceeded your current quota"**
- Add credits to your OpenAI account
- Check your billing settings
- Verify your API key is active

**"Failed to estimate video duration"**
- Check if yt-dlp is installed: `pip install yt-dlp`
- Verify the Instagram URL is public and valid
- Try a different video URL

**Analysis fails during processing**
- Check your internet connection
- Verify OpenAI API key has sufficient credits
- Try with a shorter video first

## 📝 **Features**

✅ **Demo Mode**: Instant sample analysis  
✅ **Cost Estimation**: Pre-analysis cost calculation  
✅ **Progress Tracking**: Real-time analysis progress  
✅ **Strategic Overview**: Professional content strategy insights  
✅ **Scene Analysis**: Detailed scene-by-scene breakdown  
✅ **Credit System**: Transparent usage-based pricing  
✅ **PDF Export**: Download comprehensive analysis reports  

## 🔧 **Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in demo mode (no API key needed)
# Visit http://localhost:3000

# For full analysis, configure .env.local with OpenAI API key
```

## 📞 **Support**

If you encounter issues:
1. Check this setup guide
2. Verify your OpenAI account has credits
3. Test with demo mode first
4. Check console logs for detailed error messages

---

**Note**: The system automatically falls back to demo mode if no OpenAI API key is configured, making it safe to test and develop without API costs. 