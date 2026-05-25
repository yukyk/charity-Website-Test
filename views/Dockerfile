# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Vite build-time env vars (override via docker-compose args/env)
ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_RAZORPAY_KEY=your_key_here
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_KEY=$VITE_RAZORPAY_KEY

RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
