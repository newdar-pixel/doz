FROM node:22-alpine
WORKDIR /app
COPY services/server/package.json ./package.json
RUN npm install --omit=dev
COPY services/server ./
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server.js"]
