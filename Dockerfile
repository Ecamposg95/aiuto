# Imagen de la aplicación AIUTO.
#
# Existe desde el primer commit a propósito: la beta vive en Railway y producción
# se mudará al VPS de IONOS. Si la aplicación se construyera pegada al panel de
# Railway, esa mudanza dejaría de ser un despliegue y se volvería un proyecto.
# Esta misma imagen corre en los dos lados.

ARG NODE_VERSION=22.13-alpine

# ----------------------------------------------------------------- dependencias
FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json      apps/web/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json   packages/db/

RUN pnpm install --frozen-lockfile

# ----------------------------------------------------------------- compilación
FROM node:${NODE_VERSION} AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules      ./apps/web/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/db/node_modules   ./packages/db/node_modules
COPY . .

# El cliente de Prisma se genera contra el esquema, antes de compilar.
RUN pnpm --filter @aiuto/db generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @aiuto/web build

# ----------------------------------------------------------------- ejecución
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# La salida standalone trae el servidor y sólo las dependencias que realmente usa.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# `standalone` NO copia los estáticos: sin esto la aplicación sirve HTML sin CSS.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# El esquema, para poder correr `migrate deploy` antes de servir.
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# La CLI de Prisma no viene en la salida standalone (es dependencia de desarrollo)
# y se instala aparte. Versión fijada: una CLI más nueva que el cliente puede
# aplicar migraciones que el cliente no sabe leer.
ARG PRISMA_VERSION=6.19.3
RUN npm install -g prisma@${PRISMA_VERSION} && npm cache clean --force

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
