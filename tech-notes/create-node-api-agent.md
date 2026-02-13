# *** get image docker hub ***

# step 1: create this file with name create-node-api-agent into server 
# touch create-node-api-agent.build
# nano create-node-api-agent.build
# copy and paste this code:
# ************************

FROM node:22-bookworm-slim

# 1. Herramientas de sistema y JAVA (Indispensable para Sonar)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    curl git openssl unzip openjdk-17-jre && \
    rm -rf /var/lib/apt/lists/*

# 2. Sonar Scanner oficial (Aqu   es donde va lo que no entend  as)
RUN curl -sSLo /tmp/sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip && \
    unzip /tmp/sonar-scanner.zip -d /opt && \
    rm /tmp/sonar-scanner.zip && \
    chmod +x /opt/sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner && \
    ln -s /opt/sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner /usr/local/bin/sonar-scanner

# 3. Prisma global
RUN npm install -g prisma

WORKDIR /app


# ************************
# step 2: save
# step 3: now create own image node-api-agent:
# docker build -t node-api-agent:latest -f create-node-api-agent.build .

