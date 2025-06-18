# Deployment Guide

## Facebook Ad Scraping Requirements

The Facebook ad scraping feature requires a Chrome browser to be available in the production environment. Here are platform-specific instructions:

### Vercel Deployment

For Vercel, Facebook ad scraping is currently **not supported** due to serverless function limitations. The app will automatically detect this and show an appropriate error message.

**Workaround**: Users should:
1. Download the Facebook ad video manually
2. Upload it directly using the file upload feature
3. Or use direct video URLs if available

### VPS/Dedicated Server Deployment

1. Install Chrome/Chromium:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y chromium-browser

   # CentOS/RHEL
   sudo yum install -y chromium

   # Or install Google Chrome
   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
   sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
   sudo apt-get update
   sudo apt-get install -y google-chrome-stable
   ```

2. Deploy your app normally - the Facebook ad scraping will work automatically.

### Docker Deployment

Add Chrome to your Dockerfile:

```dockerfile
FROM node:18-alpine

# Install Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chrome path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Your app setup...
COPY . .
RUN npm install
RUN npm run build

CMD ["npm", "start"]
```

### Railway/Render Deployment

These platforms may support Chrome with additional configuration. Check their documentation for browser support.

### Development vs Production

- **Local Development**: Works out of the box (Chrome installed via Puppeteer)
- **Production**: Requires platform-specific Chrome installation

## Error Handling

The app includes smart error detection:
- Automatically detects serverless environments
- Provides helpful error messages
- Suggests alternative workflows when scraping isn't available

## Alternative Solutions

If Facebook ad scraping is critical for your deployment:

1. **External Scraping Service**: Use a dedicated scraping API
2. **Separate Microservice**: Deploy scraping on a Chrome-capable server
3. **Manual Download**: Guide users to download and upload videos directly

## Testing Deployment

Test Facebook ad scraping after deployment:
1. Try analyzing a Facebook ad URL
2. Check server logs for Chrome-related errors
3. Verify error messages are user-friendly 