# Stage 1: Build React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (High Performance)
FROM nginx:alpine
# Copy built files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx config (we will create this next)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]