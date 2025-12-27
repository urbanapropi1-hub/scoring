# Usamos una imagen oficial de Puppeteer que ya trae Chrome y Linux configurado
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Cambiamos al usuario root para instalar lo que falte
USER root

# Directorio de la app
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las librerías
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Render
EXPOSE 3000

# Comando para arrancar la app
CMD ["node", "server.js"]
