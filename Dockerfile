# Stage 1: Build React Frontend
FROM node:20-alpine AS build-fe
WORKDIR /app

# Copy root package files & install dependencies
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# Copy all source files and build frontend assets
COPY . .
RUN npm run build

# Stage 2: Production Backend Server + Static Frontend Serving
FROM node:20-alpine
WORKDIR /app/server

# Install production dependencies for server
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY server/ ./

# Copy built frontend assets from stage 1
COPY --from=build-fe /app/dist /app/dist

# Expose backend port
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Start Express server
CMD ["node", "src/index.js"]
