import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { adLibraryUrl } = await request.json();
    
    if (!adLibraryUrl) {
      return NextResponse.json(
        { error: 'Facebook Ad Library URL is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Scraping video from: ${adLibraryUrl}`);

    // Import puppeteer dynamically
    const puppeteer = await import('puppeteer');
    
    let browser;
    try {
      browser = await puppeteer.default.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the ad library URL
      await page.goto(adLibraryUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a bit for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract the Library ID from the URL to find the specific ad
      const urlMatch = adLibraryUrl.match(/[?&]id=([0-9]+)/);
      const libraryId = urlMatch ? urlMatch[1] : null;
      
      console.log(`🎯 Looking for Library ID: ${libraryId}`);

      // Try to find video element by locating the specific ad card first
      let videoUrl = null;
      let posterUrl = null;
      
      try {
        // Wait for content to load
        await page.waitForSelector('video', { timeout: 15000 });
        
        // Find video using multiple strategies
        const videoData = await page.evaluate((targetLibraryId) => {
          console.log('🔍 Searching for video with Library ID:', targetLibraryId);
          
          // Strategy 1: Find by "This ad is from a URL link" text (more reliable)
          console.log('🎯 Strategy 1: Looking for "This ad is from a URL link" text...');
          const urlLinkText = "This ad is from a URL link";
          
          // Find all text nodes containing this phrase
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let textNode;
          while (textNode = walker.nextNode()) {
            if (textNode.textContent && textNode.textContent.includes(urlLinkText)) {
              console.log('✅ Found "This ad is from a URL link" text');
              
              // Get the parent element containing this text
              let container = textNode.parentElement;
              
              // Look for video in the same container or nearby siblings/children
              for (let i = 0; i < 8; i++) {
                if (!container) break;
                
                // Look for video in current container
                const video = container.querySelector('video[src]');
                if (video && video.src && (video.src.includes('.mp4') || video.src.includes('t42.1790'))) {
                  console.log(`✅ Found video via "URL link" text at level ${i}:`, video.src);
                  
                  // If we have a target Library ID, verify this video is in the right ad
                  if (targetLibraryId) {
                    const libraryIdText = `Library ID: ${targetLibraryId}`;
                    let checkContainer = video;
                    let foundLibraryId = false;
                    
                    // Check if we can find the Library ID in the same general area
                    for (let j = 0; j < 10; j++) {
                      if (!checkContainer.parentElement) break;
                      checkContainer = checkContainer.parentElement;
                      if (checkContainer.textContent && checkContainer.textContent.includes(libraryIdText)) {
                        foundLibraryId = true;
                        console.log('✅ Confirmed video is in same area as target Library ID');
                        break;
                      }
                    }
                    
                    if (foundLibraryId) {
                      return {
                        src: video.src,
                        poster: video.poster || video.getAttribute('poster'),
                        method: 'url-link-text-with-id-verification'
                      };
                    } else {
                      console.log('⚠️ Video found via URL link text but not in same area as target Library ID');
                      // Continue searching for other instances
                    }
                  } else {
                    // No specific Library ID to match, return first video found
                    return {
                      src: video.src,
                      poster: video.poster || video.getAttribute('poster'),
                      method: 'url-link-text-first-match'
                    };
                  }
                }
                
                // Move to parent container to expand search
                container = container.parentElement;
              }
            }
          }
          
          // Strategy 2: Find by Library ID text (fallback)
          if (targetLibraryId) {
            console.log('🎯 Strategy 2: Fallback to Library ID search...');
            const libraryIdText = `Library ID: ${targetLibraryId}`;
            
            const walker2 = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let textNode2;
            while (textNode2 = walker2.nextNode()) {
              if (textNode2.textContent && textNode2.textContent.includes(libraryIdText)) {
                console.log('✅ Found Library ID text node via fallback');
                
                let container = textNode2.parentElement;
                for (let i = 0; i < 15; i++) {
                  if (!container.parentElement) break;
                  container = container.parentElement;
                  
                  const hasLibraryId = container.textContent && container.textContent.includes(libraryIdText);
                  const video = container.querySelector('video[src]');
                  
                  if (hasLibraryId && video && video.src && (video.src.includes('.mp4') || video.src.includes('t42.1790'))) {
                    console.log(`✅ Found video via Library ID fallback at level ${i}:`, video.src);
                    return {
                      src: video.src,
                      poster: video.poster || video.getAttribute('poster'),
                      method: 'library-id-fallback'
                    };
                  }
                }
                break;
              }
            }
          }
          
          // Strategy 2: Look for any video with src attribute
          const videos = document.querySelectorAll('video[src]');
          console.log(`📹 Found ${videos.length} videos with src`);
          
          for (const video of videos) {
            if (video.src && video.src.includes('.mp4')) {
              console.log('✅ Found MP4 video:', video.src);
              return {
                src: video.src,
                poster: video.poster || video.getAttribute('poster'),
                method: 'direct-video-search'
              };
            }
          }
          
          // Strategy 3: Look for videos without src but with source children
          const videosWithSources = document.querySelectorAll('video');
          for (const video of videosWithSources) {
            const source = video.querySelector('source[src]');
            if (source && source.src) {
              console.log('✅ Found video via source element:', source.src);
              return {
                src: source.src,
                poster: video.poster || video.getAttribute('poster'),
                method: 'source-element'
              };
            }
          }
          
          return null;
        }, libraryId);

        if (videoData && videoData.src) {
          videoUrl = videoData.src;
          posterUrl = videoData.poster;
          console.log(`✅ Found video using ${videoData.method}: ${videoUrl}`);
        }
      } catch (videoError) {
        console.log('❌ Error finding video:', videoError.message);
        
        // Fallback: Try to find any media elements
        const mediaElements = await page.evaluate(() => {
          const media = [];
          
          // Look for any elements with video-like URLs
          document.querySelectorAll('[src]').forEach(el => {
            const src = el.src || el.getAttribute('src');
            if (src && (src.includes('.mp4') || src.includes('video') || src.includes('t42.1790'))) {
              media.push(src);
            }
          });
          
          // Also check data attributes that might contain video URLs
          document.querySelectorAll('[data-src], [data-video-src]').forEach(el => {
            const src = el.getAttribute('data-src') || el.getAttribute('data-video-src');
            if (src && (src.includes('.mp4') || src.includes('video'))) {
              media.push(src);
            }
          });
          
          return media;
        });

        if (mediaElements.length > 0) {
          videoUrl = mediaElements[0];
          console.log(`✅ Found video URL in media elements (fallback): ${videoUrl}`);
        }
      }

      await browser.close();

      if (!videoUrl) {
        return NextResponse.json(
          { error: 'No video found on this Facebook Ad Library page. The ad might not contain video content or the page structure may have changed.' },
          { status: 404 }
        );
      }

      // Validate that it's actually a video URL
      if (!videoUrl.includes('.mp4') && !videoUrl.includes('video') && !videoUrl.includes('.webm')) {
        return NextResponse.json(
          { error: 'Found media element but it doesn\'t appear to be a video file.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        videoUrl,
        posterUrl,
        originalAdUrl: adLibraryUrl,
        message: 'Video URL extracted successfully'
      });

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Facebook ad scraping error:', error);
    
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      return NextResponse.json(
        { error: 'Could not access Facebook. Please check your internet connection.' },
        { status: 500 }
      );
    }
    
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Page took too long to load. The ad might be private or no longer available.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to scrape video from Facebook ad',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
} 