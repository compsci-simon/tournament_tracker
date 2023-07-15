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

ENV SKIP_ENV_VALIDATION 1

RUN npm run build;

##### RUNNER

FROM --platform=linux/amd64 node:16-alpine3.17 AS runner
WORKDIR /app

ENV NODE_ENV production
ENV DATABASE_URL file:./db.sqlite
ENV PORT 3000
ENV NEXTAUTH_URL 'http://localhost:3000/api/auth'
ENV NEXTAUTH_SECRET 'cloudy-skies'

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs ./prisma ./prisma
# RUN npx prisma db push

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# RUN chown nextjs:nodejs ./prisma/db.sqlite
USER nextjs
EXPOSE 3000
EXPOSE 80

CMD ["node", "server.js"]