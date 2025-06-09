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
# Running as a non-root user is a security best practice.
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy dependency definition files.
COPY --chown=nextjs:nextjs package.json package-lock.json* ./

# Install dependencies.
RUN npm ci

# Copy the rest of the application code.
COPY --chown=nextjs:nextjs . .

# Set build-time argument for OpenAI API key
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Build the application
RUN npm run build

# Switch to the non-root user for running the application.
USER nextjs

# Expose the port the app runs on.
EXPOSE 3000

# Start the application.
CMD ["npm", "start"] 