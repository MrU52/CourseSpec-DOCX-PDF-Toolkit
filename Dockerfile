# Base image with Node and system tools
FROM node:18-slim

# Install LibreOffice
RUN apt-get update && apt-get install -y \
  libreoffice \
  fonts-dejavu \
  && rm -rf /var/lib/apt/lists/*

# Set app directory
WORKDIR /app

# Copy files
COPY . .

# Install Node dependencies
RUN npm install

# Start your app
CMD ["node", "server.js"]
