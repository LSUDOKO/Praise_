FROM node:20-alpine
WORKDIR /app
COPY relayer/package*.json ./
RUN npm install --production
COPY relayer/ .
EXPOSE 3000
CMD ["node", "index.js"]
