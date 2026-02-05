FROM node:22-bookworm-slim

# Instalamos OpenSSL porque Prisma lo necesita para conectar con Postgres
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos solo lo necesario para instalar dependencias
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
# Generamos el cliente dentro de la imagen
RUN npx prisma generate

# Copiamos el resto del código
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]