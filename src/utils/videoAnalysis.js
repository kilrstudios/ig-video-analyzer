async function downloadVideo(url) {
  try {
    const timestamp = Date.now();
    const outputPath = path.join('/app/temp', `${timestamp}.mp4`);
    
    // Create temp directory if it doesn't exist
    await fs.promises.mkdir('/app/temp', { recursive: true });
    
    console.log('Downloading video from:', url);
    
    // Use cookies from environment variable
    const cookies = process.env.INSTAGRAM_COOKIES;
    const cookieArgs = cookies ? ['--cookies', cookies] : [];
    
    const command = [
      'yt-dlp',
      '-f',
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      ...cookieArgs,
      url,
      '-o',
      outputPath
    ];
    
    console.log('Executing command:', command.join(' '));
    
    const { stdout, stderr } = await execAsync(command.join(' '));
    
    if (stderr) {
      console.error('Download error:', stderr);
      throw new Error(`Failed to download video: ${stderr}`);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
} 