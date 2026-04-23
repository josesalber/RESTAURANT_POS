# Dockerfile para Frontend - Producción (multi-stage build)

# Etapa 1: Construir la aplicación
FROM node:20-alpine AS builder
WORKDIR /app

# Cache busting: forzar rebuild cuando cambia el código
ARG CACHEBUST=1

COPY package*.json ./
RUN npm install
COPY . .

# Inyectar timestamp de build para verificación
ARG BUILD_DATE
ENV VITE_BUILD_DATE=${BUILD_DATE}

RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar archivos construidos desde la etapa de build
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Deshabilitar cache de nginx para index.html (SPA)
RUN echo 'sub_filter_once off;' > /etc/nginx/conf.d/no-cache.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]