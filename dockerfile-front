FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .

RUN npm install

# Copy app source
COPY . .

# Build the app
RUN npx prisma generate
RUN npm run build

CMD ["node", "build/index.js"]
