FROM node:20-alpine

WORKDIR /mobile

COPY package.json ./

RUN npm install 

COPY . . 

EXPOSE 8081  

CMD ["npm", "start"]
