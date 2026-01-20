# ========================================
# Dockerfile para stalkea-clone
# VPS Ubuntu - Otimizado para produção
# ========================================

FROM node:18-slim

# Instalar dependências do sistema necessárias para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro (para cache de dependências)
COPY package.json ./

# Instalar dependências do Node.js
RUN npm install --production

# Copiar todos os arquivos do projeto
COPY . .

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor a porta
EXPOSE 3000

# Health check para verificar se a aplicação está rodando
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Iniciar a aplicação
CMD ["node", "server.js"]
