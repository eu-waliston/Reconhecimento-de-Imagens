# Imagem base do Node.js com suporte a TensorFlow
FROM node:20

# Instala dependências para TensorFlow
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# Cria pasta de uploads
RUN mkdir -p uploads

# Expõe a porta do app
EXPOSE 3000

# Comando para iniciar o microserviço
CMD ["npm", "start"]
