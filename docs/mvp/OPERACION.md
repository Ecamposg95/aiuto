# Manual de operación — AIUTO

27 de noviembre de 2026 · tarea 15 del plan de salida (`2026-10-08-plan-salida-produccion.md`)

Lo que hay que saber para tener AIUTO en pie: dónde vive cada cosa, cómo se despliega, cómo se
respalda y se regresa, y qué hacer cuando algo se pone rojo. Los comandos son los reales; donde
falta un dato o una medición, lo dice.

## 1. Dónde vive cada cosa

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Aplicación (`apps/web`) | Railway · workspace **Atlas Tech** · proyecto **AIUTO** · servicio `aiuto-web` | Se despliega sola con cada push a `main`. Dockerfile del monorepo; el entrypoint corre `prisma migrate deploy` antes de arrancar |
| Base de datos | Railway · mismo proyecto · servicio `Postgres` (PostgreSQL 18) | Tiene proxy TCP público (ver §8) |
| Configuración de Railway | `.railway/railway.ts` | Railway **no** lo lee al desplegar: se aplica con `railway config plan` / `railway config apply` |
| Código y CI | GitHub `Ecamposg95/aiuto` (público) | `ci.yml`: typecheck, pruebas y build en cada push |
| Tareas diarias | GitHub Actions `cerrar-vencidas.yml`, 09:00 UTC | Cierra vacantes vencidas y revisa la alerta de 3 días hábiles |
| Monitoreo | GitHub Actions `vigilar.yml`, cada 10 minutos | Falla si `/api/salud` no responde con la base arriba |
| Dominio `aiuto.com.mx` | DNS y correo en Hostinger | Hoy apunta a la landing estática vieja; se moverá a Railway (§9) |
| Correo de la app | Resend (pendiente, tarea 12) | Sin llave, los correos se escriben en la bitácora del servidor |

URL de la app: `https://aiuto-web-production.up.railway.app` (variable `APP_URL` en GitHub y en Railway).

## 2. Variables y secretos

Se capturan **directo** en Railway (y en GitHub cuando aplica). Nunca en el repo ni en el chat.

| Variable | Para qué | Qué rompe rotarla |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a Postgres | La pone Railway; no se toca |
| `AUTH_SECRET` | Firma las sesiones | Cierra todas las sesiones abiertas (todos vuelven a entrar) |
| `TAREAS_SECRET` | Autoriza `/api/tareas/*` y es el pase de las suites de QA contra el limitador | Va en Railway **y** en GitHub (`gh secret set TAREAS_SECRET`). Si solo cambia en uno, la tarea diaria falla |
| `APP_URL` | Base de las ligas en los correos | Ligas rotas en los correos. También es variable de GitHub (la usan las tareas y el monitoreo) |
| `EMAIL_FROM`, `EQUIPO_EMAIL` | Remitente y buzón del equipo | — |
| `EMAIL_API_KEY` | Llave de Resend | Sin ella no sale ningún correo. **Al crearla, agrégala a `.railway/railway.ts` con `preserve()`** o el siguiente `config apply` la borra |
| `WHATSAPP_NUMERO` | Botón de WhatsApp (solo dígitos, con lada: `521…`) | Vacía = no hay botón. Ya está declarada en `railway.ts`: **créala antes del siguiente `config apply`** |
| `MODO_QA` | Habilita el relleno de ejemplo en los formularios de vacante | **Debe quitarse en producción** antes de abrir (H6) |

Regla de `railway.ts`: cada variable que viva en Railway tiene que estar declarada ahí con
`preserve()`. Una variable que exista en Railway y no esté en el archivo, el `apply` la elimina.

## 3. Despliegue

1. Rama, cambios, `pnpm -r typecheck`, `pnpm --filter @aiuto/core test` y las suites que toquen.
2. Merge a `main` → CI → Railway construye y despliega.
3. Comprobar:

```bash
gh run list --workflow ci.yml --limit 1                      # success en ese commit
railway deployment list                                       # el último, SUCCESS
railway logs --deployment <id> | grep -E "migra|Ready"        # "All migrations have been successfully applied"
curl -s https://aiuto-web-production.up.railway.app/api/salud # {"estado":"ok","base":"ok"}
```

`railway up` no es el camino: producción se despliega solo con push a `main`.

## 4. Respaldos

**Estado al 27 de noviembre: sin respaldos.** PITR apagado y sin horarios
(`railway postgres pitr status` → `"enabled": false`; `schedule list` → `[]`). Es lo primero
de la tarea 11:

```bash
railway postgres pitr schedule set --daily --weekly --service Postgres
railway postgres pitr enable --service Postgres
railway postgres pitr status --service Postgres --json        # → "enabled": true
```

Respaldo manual (obligatorio antes de cualquier operación destructiva sobre datos reales, en la
misma sesión):

```bash
railway postgres pitr backup create --service Postgres --name <motivo-fecha>
railway postgres pitr backup list --service Postgres --json
railway postgres pitr backup lock <id> --service Postgres     # el de antes de la salida se bloquea
```

Restaurar **sin tocar producción** (a un servicio nuevo, se compara y luego se decide):

```bash
railway postgres pitr restore --service Postgres --at <UTC> --new-service-name postgres-ensayo
```

Tiempo de restauración: **por medir** en el ensayo de la tarea 15. Borrar `postgres-ensayo` al
terminar: cobra mientras exista.

## 5. Dar marcha atrás

- **Código:** en el panel de Railway, *Redeploy* del despliegue anterior de `aiuto-web`. Después
  `git revert` del commit para que el siguiente push no lo vuelva a subir.
- **Migraciones:** solo van hacia adelante. Regresar el código con una migración ya aplicada solo
  es seguro si la migración fue **aditiva** (columnas o tablas nuevas, nulas o con valor por
  defecto). Por eso toda migración se escribe aditiva; si una no puede serlo, se despliega en dos
  pasos y se anota aquí.
- **Datos:** restauración según §4.

## 6. Si `vigilar` se pone rojo

1. `curl -s https://aiuto-web-production.up.railway.app/api/salud`.
   - `"Application not found"` con `x-railway-fallback: true`: **no hay ningún despliegue
     corriendo**. Ver si el workspace rebasó su tope de gasto (§7). Así fue el apagón del 26 de
     noviembre de 2026.
   - `"base":"error"`: la app está arriba y Postgres no. Revisar el servicio `Postgres`.
2. `railway deployment list` y `railway logs --lines 200`: ¿hubo un despliegue reciente? ¿Falló
   una migración? ¿Se reinicia por memoria?
3. Si el último despliegue es el culpable: *Redeploy* del anterior (§5).

## 7. Gasto en Railway

El tope duro del workspace **apaga todos los servicios** de todos los proyectos de Atlas Tech al
rebasarse, y no se prenden solos al subirlo o al empezar el periodo nuevo: hay que hacer
*Redeploy* de `aiuto-web` y revisar que `Postgres` también esté arriba (si no, *Redeploy* de
Postgres primero).

```bash
railway usage                                                                   # gasto del periodo
railway usage limit status --workspace "Atlas Tech" --target workspace --json
railway usage limit set --workspace "Atlas Tech" --target workspace --soft <aviso> --hard <límite> --json
```

El 26 de noviembre el tope era de 30 USD y se rebasó (30.60 USD del periodo 28/oct–28/nov). Hoy
es de 35 USD sin aviso suave. Recomendación: un aviso suave por debajo del gasto normal y el tope
duro a más del doble, para que el aviso llegue antes que el apagón.

## 8. Cuentas

- **Alta del equipo:** `DATABASE_URL=<prod> pnpm crear-staff <correo> "<Nombre>" admin|operador`.
  La contraseña se imprime una vez; se entrega por un canal privado.
- **Empresas:** se registran en `/empresas/registro`; el administrador las aprueba y les asigna
  licencia en `/panel/empresas`.
- **Cambiar rol o desactivar:** `/panel/usuarios` (solo administración). El rol solo cambia dentro
  del equipo. Desactivar corta la sesión abierta en la siguiente petición y no borra nada; queda
  en la bitácora. Nadie puede desactivarse ni cambiarse el rol a sí mismo.
- **Borrar a alguien de verdad:** es una petición ARCO (§9).

## 9. Peticiones ARCO

Plazo: **20 días hábiles** desde que llega la petición al correo del aviso de privacidad.

```bash
DATABASE_URL=<prod> pnpm arco <correo>                                   # Acceso: qué hay. No cambia nada
DATABASE_URL=<prod> pnpm arco <correo> --borrar --confirmo <correo>       # Cancelación: borra todo
```

Borra postulaciones (con sus mensajes), solicitudes, asesorías, ligas pendientes y la cuenta con
su perfil completo. No borra los mensajes que la persona escribió como reclutadora de una empresa
ni la bitácora: quedan sin autor. Antes de borrar en producción, respaldo manual (§4).

**Rectificación:** la persona corrige su perfil en `/mi/perfil`; lo demás se corrige a mano en la base.

## 10. Datos de prueba

```bash
DATABASE_URL=<prod> pnpm db:seed:qa --revisar    # tiene que decir "Limpio" antes de abrir
DATABASE_URL=<prod> pnpm db:seed:qa --limpiar    # con respaldo previo
BASE=https://aiuto-web-production.up.railway.app node tools/qa/salida.mjs   # puerta de salida
```

## 11. Mover `aiuto.com.mx` a la app

El sitio público ya vive en la app. Falta que el dominio apunte a Railway:

1. Railway → `aiuto-web` → Settings → Networking → *Custom domain*: `aiuto.com.mx` y
   `www.aiuto.com.mx`. Railway da un CNAME (y un TXT de verificación).
2. En Hostinger → DNS: el registro de `www` como CNAME al destino de Railway. Para el dominio raíz,
   Hostinger no permite CNAME en el apex: usar *CNAME flattening*/ALIAS si lo ofrece o mover el
   DNS a un proveedor que lo tenga (Cloudflare). **No tocar los MX ni el SPF**: el correo sigue
   en Hostinger.
3. Cuando verifique: `APP_URL=https://aiuto.com.mx` en Railway **y** en la variable de GitHub,
   en el mismo momento.
4. `DOMINIO=https://aiuto.com.mx BASE=https://aiuto.com.mx node tools/qa/salida.mjs`.
5. Retirar `sitio/` del repo cuando el dominio ya sirva la app.

## 12. Límites conocidos

- **Limitador en memoria** (`lib/limite.ts`): una sola réplica de `aiuto-web`. Con dos, cada una
  cuenta por su lado.
- **Sesiones:** son JWT de 8 horas, pero el rol y el estado de la cuenta se releen de la base en
  cada petición, así que desactivar o cambiar el rol surte efecto de inmediato. Cambiar la
  contraseña **no** cierra las otras sesiones abiertas (para eso, desactivar y reactivar).
- **Proxy público de Postgres:** necesario para correr `crear-staff`, `arco` y la limpieza desde
  fuera. La contraseña es la larga que generó Railway; no se comparte.
- **CV y video** son ligas externas: AIUTO no aloja archivos.
- **Sin CSP** todavía (necesita nonces en Next).
