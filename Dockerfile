FROM node:22-slim
WORKDIR /app
COPY package.json index.mjs ./
ENTRYPOINT ["node", "index.mjs"]
