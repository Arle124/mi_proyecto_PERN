FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build step if needed, but for "sharing" and "running anywhere" 
# we might want to just serve the dev server or a build.
# Let's go with a dev server for now as it's easier for them to see.
# Or better, a production build served with a simple server.

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
