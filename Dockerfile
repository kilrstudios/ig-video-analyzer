# Base image: Use an official Node.js image. We'll use a specific version for reproducibility.
# The 'bookworm' version is based on Debian 12, which is stable and secure.
FROM node:20-bookworm-slim

# Install Python and FFmpeg, which are necessary for video processing with yt-dlp.
# We also install 'procps' which helps with process management and debugging.
# Using --no-install-recommends keeps the image size smaller.
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg procps && \
    # Clean up apt cache to reduce image size.
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp using pip.
# The --break-system-packages flag is required on newer Debian-based images
# to confirm that we want to install this package system-wide.
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Set the working directory inside the container.
WORKDIR /app

# Add a non-root user for security purposes.
# Running as a non-root user is a critical security best practice.
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy dependency definition files first to leverage Docker's build cache.
COPY --chown=nextjs:nextjs package.json package-lock.json* ./

# Install Node.js dependencies using 'npm ci' which is faster and more reliable for builds.
RUN npm ci

# Copy the rest of the application source code into the container.
# This includes the public folder, the src folder, next.config.js, etc.
COPY --chown=nextjs:nextjs . .

# Set a build-time argument for the OpenAI API key. This is NOT for the final image.
# It's a placeholder in case the build process ever needs it.
ARG OPENAI_API_KEY

# Build the Next.js application.
RUN npm run build

# Switch to the non-root user for running the application.
USER nextjs

# Expose the port the app will run on.
EXPOSE 3000

# Set the PORT environment variable. Next.js will bind to this port.
ENV PORT 3000

# The command to start the application.
# 'npm start' will execute 'next start' as defined in package.json.
CMD ["npm", "start"] 