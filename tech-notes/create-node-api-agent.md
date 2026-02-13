# *** create image :node-api-agent ***

# step 1: create this file with name Docker.build into server 
# touch Docker.build
# nano Docker.build
# copy and paste this code:
# ************************

FROM node:22-bookworm-slim

# Instalamos herramientas de sistema y limpiamos caché en una sola capa
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    openssl \
    unzip && \
    rm -rf /var/lib/apt/lists/*

# Instalamos herramientas globales de Node.js
RUN npm install -g prisma sonar-scanner

# Configuramos el directorio de trabajo
WORKDIR /app

# ************************
# step 2: save
# step 3: exec:
# docker build -t node-api-agent:latest -f create-node-api-agent.build .

