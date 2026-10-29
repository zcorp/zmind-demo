FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de configuration d'abord
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./

# Installer exactement les dépendances verrouillées
RUN npm ci

# Source montée en volume au runtime (pas copiée dans l'image)
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
