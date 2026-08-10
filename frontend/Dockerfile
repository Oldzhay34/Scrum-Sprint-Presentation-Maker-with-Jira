# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# --- run stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx'in resmi entrypoint script'i /etc/nginx/templates/*.template dosyalarini
# baslangicta envsubst ile isleyip conf.d/'ye yazar - Railway private network
# hostname'i (BACKEND_INTERNAL_URL) build-time'da bilinmedigi icin bu gerekli.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
