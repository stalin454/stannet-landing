FROM node:22-alpine
WORKDIR /app
COPY director.mjs /app/director.mjs
RUN mkdir -p /state && chown -R node:node /state /app
USER node
EXPOSE 8788
CMD ["node","/app/director.mjs"]
