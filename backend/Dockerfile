FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
