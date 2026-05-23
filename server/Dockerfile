FROM node:22-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy prisma schema first to generate client early if possible
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

COPY . .

EXPOSE 3001

# Script to wait for DB and sync schema
CMD ["sh", "-c", "npx prisma db push && npm start"]
