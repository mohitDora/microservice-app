FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and tsconfig.json first to leverage Docker cache
COPY package.json ./
COPY tsconfig.json ./

# Copy Prisma schema and migrations to ensure they are available for generate
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client based on the schema (required before build)
RUN npx prisma generate

# Copy the rest of the application source code
COPY src ./src/

# Build the TypeScript project
RUN npm run build

# Expose the port the Node.js application listens on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]