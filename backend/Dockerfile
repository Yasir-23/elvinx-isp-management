# Use a light version of Node.js
FROM node:18-alpine

# Install OpenSSL 1.1 (Required by Prisma engine)
RUN apk add --no-cache openssl

# Set the working directory inside the container
WORKDIR /app

# Copy the package files first to install libraries
COPY package*.json ./

# Install the dependencies your project needs
RUN npm install

# Copy the Prisma folder and generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of your backend code
COPY . .

# Tell Docker that the app runs on port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]