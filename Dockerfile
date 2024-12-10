# Use the official Node.js 16 image as the base image
FROM node:20-alpine AS build

WORKDIR /app

# RUN apt-get update && apt-get install -y openssl libssl-dev

# Set Prisma CLI version
ENV PRISMA_CLI_VERSION=3.0.0

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Generate Prisma client files
RUN npx prisma generate

# Build the application
RUN yarn build

# Start the application
CMD ["yarn", "start:prod"]
