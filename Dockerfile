FROM node:23-alpine

WORKDIR /app

COPY . .

RUN npm install --production

RUN yarn install

EXPOSE 1935 1936 8010 8443 1080

CMD ["yarn", "run", "watch"]