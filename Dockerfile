##### DEPENDENCIES

FROM --platform=linux/amd64 node:16-alpine3.17 AS deps
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# Install Prisma Client - remove if not using Prisma

COPY prisma ./

# Install dependencies based on the preferred package manager

COPY package.json package-lock.json ./

RUN npm ci;

##### BUILDER

FROM --platform=linux/amd64 node:16-alpine3.17 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV SKIP_ENV_VALIDATION true

RUN npm run build;

##### RUNNER

FROM --platform=linux/amd64 node:16-alpine3.17 AS runner
WORKDIR /app

ENV DATABASE_URL file:./db.sqlite
ENV NODE_ENV production

COPY --chown=nextjs:nodjs ./prisma ./prisma

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN npx prisma db push
RUN chown -R nextjs:node /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV development
ENV NEXTAUTH_URL 'http://localhost:3000/api/auth'
ENV NEXTAUTH_SECRET 'cloudy-skies'

# CMD ["node", "dist/server/server.js"]
CMD ["tail", "-f", "/dev/null"]