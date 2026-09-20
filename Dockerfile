FROM node:24-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN npm run build

FROM node:24-slim
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "dist/src/server.js"]
