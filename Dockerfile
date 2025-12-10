FROM node:20-alpine

WORKDIR /app

# Copy package
COPY package*.json ./

# Cài hết (bao gồm cả @nestjs/cli để có lệnh nest build)
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code
COPY . .

# BƯỚC QUAN TRỌNG NHẤT: CHẠY nest build ĐỂ TẠO RA dist/main.js
RUN npm run build

# Chạy production
EXPOSE 3000
CMD ["node", "dist/main.js"]
