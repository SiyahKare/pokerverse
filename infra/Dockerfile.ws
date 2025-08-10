FROM node:20-alpine AS deps
WORKDIR /app
COPY pokerverse-miniapp/apps/server/package*.json ./
# Subpakette lock bulunmadığı için ci yerine install kullan
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY pokerverse-miniapp/apps/server ./
EXPOSE 3011
CMD ["node", "server.js"]


