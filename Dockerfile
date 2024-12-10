# Use the official Node.js 20 Alpine image as the base image
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Install build dependencies for Prisma and OpenSSL
RUN apk add --no-cache \
    openssl \
    libssl1.1 \
    bash

# Set Prisma CLI version
ENV PRISMA_CLI_VERSION=3.0.0

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Ensure OpenSSL compatibility for Prisma
ENV LD_LIBRARY_PATH=/usr/lib

# Generate Prisma client files
RUN npx prisma generate

# Build the application
RUN yarn build

# Use a lightweight production image
FROM node:20-alpine AS production

# Set the working directory inside the container
WORKDIR /app

# Copy the built application and dependencies from the build stage
COPY --from=build /app .

# Expose the application port (if applicable, e.g., 3000)
EXPOSE 3000

# Start the application
CMD ["yarn", "start:prod"]
