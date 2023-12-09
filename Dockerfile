# Use uma imagem base do Node.js
FROM node:20.9-slim



# Crie o diretório de trabalho no contêiner
WORKDIR /usr/src/app

# Copie os arquivos necessários (package.json e package-lock.json) para o contêiner
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante dos arquivos para o contêiner
COPY . .

# Exponha a porta 3000 (ou a porta que você estiver usando)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "app.js"]