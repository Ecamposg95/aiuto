#!/bin/sh
# Aplica las migraciones pendientes y después sirve.
#
# `migrate deploy` es la única forma de migrar fuera de local: nunca `migrate dev`,
# que puede reescribir el historial. Si una migración falla, el contenedor no
# arranca — preferible a servir contra un esquema que no corresponde.
set -e

echo "==> Aplicando migraciones"
prisma migrate deploy --schema=packages/db/prisma/schema.prisma

echo "==> Iniciando la aplicación"
exec "$@"
