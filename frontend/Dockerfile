# Stage 1: Build source code
FROM node:20-alpine AS builder
WORKDIR /app

# Copy files package.json & lockfile
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy all frontend source files
COPY . .
# Build the Next.js application
RUN npm run build

# Stage 2: Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy the built output and public assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose Next.js port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
