# ---- Build stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=build /app/dist/video-downloader-front/browser /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for certbot
RUN mkdir -p /var/www/certhtml

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
