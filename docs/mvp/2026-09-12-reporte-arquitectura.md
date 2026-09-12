# Del sitio al producto — reporte de arquitectura

**Borrador para discusión · 12 de septiembre de 2026**

Versión navegable: https://claude.ai/code/artifact/f28c8293-debb-413c-99b2-fffb9f9efb4b

| | |
| --- | --- |
| Proyecto | AIUTO · aiuto.com.mx |
| Estado hoy | Sitio estático, sin backend |
| Stack decidido | TypeScript de punta a punta |
| Equipo | Una persona |

---

## 1. Dónde estamos

El sitio está en línea desde el 8 de septiembre y está bien hecho: 9 pantallas, cero
dependencias, cero build, accesibilidad AA, SEO resuelto, redirecciones verificadas, 57 KB.

Y no hace nada. Todo lo que parece función es simulación:

- **El formulario de contacto valida, muestra el panel de éxito y no envía nada.** Los mensajes se pierden.
- **Las 7 vacantes de la bolsa son inventadas.**
- **Las métricas del home son de muestra** (`+4,000`, `+100`, `+500`), sin fuente.
- **WhatsApp y correo son ficticios**, y el correo de muestra usa otro dominio (`aiuto.mx` vs `aiuto.com.mx`).

**El activo que no hay que repetir.** El sistema de diseño ya existe y está documentado:
tokens en `docs/tokens.json`, un UI kit normativo, tipografía y rejilla especificadas, y las
7 categorías modeladas como datos en `categorias.json`. El producto debe heredarlo.

**El pasivo es el hosting.** El cPanel compartido actual no corre Node. La landing no tiene
por qué moverse con la aplicación.

## 2. El north star

AIUTO conecta necesidades empresariales con especialistas, en 7 categorías. Completo son
cuatro piezas: **directorio** (la oferta visible), **marketplace** (necesidad → match → caso),
**bolsa de trabajo** (vacante → candidato → contratación) y **back-office** (el equipo operando
todo lo anterior).

Hay una quinta pieza implícita: los datos que esas cuatro generan son lo que después justifica
licencias y suscripciones. La beta gratuita no es generosidad, es instrumentación.

## 3. El problema de alcance

Pediste las cuatro piezas y las cuatro clases de cuenta. Con los datos disponibles, no cierra:

| Variable | Valor hoy | Implicación |
| --- | --- | --- |
| Especialistas registrados | 0 | El marketplace devuelve resultados vacíos |
| Vacantes reales | 0 | La bolsa no tiene qué mostrar |
| Empresas cliente | 0 | No hay demanda que enrutar |
| Personas construyendo | 1 | Todo lo que se construye, se mantiene |
| Tipos de cuenta pedidos | 4 | Cuadruplica registro, permisos, perfil y pantallas |

> **Un marketplace no falla por software, falla por falta de oferta.** Automatiza lo que tu
> equipo ya hace a mano y le duele, no lo que imaginas que los usuarios querrán. Primero
> inventario, después automatización.

La propuesta no es recortar el north star: es ordenarlo.

## 4. Las cuatro fases

Cada fase llega a producción por sí sola y habilita la siguiente.

### Fase 1 — El sistema nervioso (el MVP)

Objetivo: que nada de lo que entra se pierda, y construir el primer inventario.

- Todos los formularios escriben a la base, con validación de servidor. El honeypot ya existe.
- Alta de especialistas: formulario público de postulación + carga manual desde el panel.
- Panel interno: bandeja única de solicitudes con estado, asignación, notas e historial.
- Vacantes gestionables desde el panel; la bolsa las lee de la API.
- Correo transaccional: acuse al remitente, aviso al equipo.
- Aviso de privacidad y consentimiento (LFPDPPP).
- **Autenticación solo para el equipo AIUTO.** Recorta más trabajo que ninguna otra decisión.

*Por qué primero:* resuelve el pendiente más urgente del repo, construye el inventario que las
demás fases necesitan, y es la única fase donde el software ahorra trabajo desde el día uno.

### Fase 2 — La oferta visible

Cuentas de especialista, directorio público filtrable por categoría, perfil público con contacto
mediado por AIUTO. Convierte el inventario de la fase 1 en algo que un visitante puede ver.

### Fase 3 — Bolsa de trabajo real

Cuentas de talento (perfil, CV, postulación, estatus), panel de empresa. El equipo AIUTO sigue
en medio como moderador.

### Fase 4 — Marketplace y matching

Brief estructurado → clasificación → propuesta de 2-3 especialistas → caso con bitácora. Es la
fase que justifica cobrar. Necesita oferta (F2), demanda (F3) y confianza acumulada.

> **Lo que sí se adelanta:** el modelo de datos de las cuatro fases se diseña completo desde el
> inicio. Lo que se difiere son las pantallas y la autenticación, no el esquema. Migrar datos
> duele; migrar pantallas no.

## 5. Modelo de datos de la fase 1

| Entidad | Qué guarda | Nota |
| --- | --- | --- |
| `Category` | Las 7, con slug y color | Semilla fija; los slugs ya existen |
| `Solicitud` | Tipo, categoría, contacto, mensaje, origen, estado, responsable | Destino único de todos los formularios |
| `Specialist` | Perfil, categorías, disponibilidad, verificación | Sin cuenta hasta la fase 2 |
| `Vacante` | Puesto, empresa, categoría, ubicación, rango, estado | Estados ya definidos: `new`/`open`/`applied`/`closed` |
| `User` | Equipo AIUTO, con rol | Único tipo autenticado en la fase 1 |
| `AuditLog` | Quién cambió qué y cuándo | Barato ahora, imposible de reconstruir después |

## 6. Arquitectura

- **Monorepo con pnpm workspaces:** `apps/web` (Next.js App Router + Tailwind), `apps/api`
  (NestJS), `packages/db` (Prisma), `packages/shared` (esquemas Zod y tipos compartidos). El
  contrato de API deja de ser documentación y pasa a ser código.
- **NestJS usando Fastify como adaptador.** Módulos, DI y guards dan forma predecible, y eso
  pesa más cuando quien extiende el código en seis meses eres tú solo.
- **Tailwind alimentado por `docs/tokens.json`.** El UI kit sigue siendo la referencia normativa.
- **La landing se queda donde está.** `aiuto.com.mx` sigue estático con su SEO intacto; la app
  vive en `app.aiuto.com.mx`. Cero riesgo para lo publicado.

> **Advertencia registrada.** Con una sola persona, una API separada cuesta más de lo que rinde
> en la fase 1; los route handlers de Next.js harían lo mismo con menos código. La decisión de
> API separada es defendible si prevés app móvil o clientes externos, pero se paga por adelantado.

## 7. Hosting en Hostinger

El VPS cuesta **menos** que el plan Cloud al renovar y hace bastante más.

| | A · Cloud Startup | **B · VPS KVM 2 + Dokploy** | C · VPS KVM 2 sin PaaS |
| --- | --- | --- | --- |
| Precio al renovar | $25.99/mes | **$14.99/mes** | $14.99/mes |
| Recursos | 4 vCPU · 4 GB · 100 GB | 2 vCPU · 8 GB · 100 GB · 8 TB | igual que B |
| Node persistente | Sí, oficial | Sí | Sí |
| Docker / root | No | Sí | Sí |
| Motor de base | Solo MariaDB | El que elijas | El que elijas |
| `prisma migrate dev` | No corre ahí | Sí | Sí |
| TLS y rollback | Gestionado | Dokploy (un clic) | Lo escribes tú |

**Recomendación: opción B.** 42 % más barata que Cloud al renovar, te deja elegir base de datos,
y Dokploy entrega buena parte de la comodidad de Railway sin factura variable.

Dos advertencias: **no hay centro de datos en México** (Phoenix ≈ 45 ms a CDMX, São Paulo ≈ 156 ms,
elige Phoenix), y **los snapshots no son respaldos** (uno a la vez, expiran a las 24 h). Los
respaldos diarios cuestan 6 USD/mes extra y son parte del costo real.

*Pendiente de verificar:* Hostinger no publica la versión de MariaDB de sus planes Cloud.
Consúltala con `SELECT VERSION()` antes de fijar nada.

## 8. La decisión MariaDB

**Prisma 7 falla contra MariaDB 10.11+.** El motor nuevo emite un casting JSON propio de MySQL 8
que el analizador de MariaDB rechaza, rompiendo introspección y consultas. Reporte abierto desde
enero de 2026, severidad crítica, sin confirmar por Prisma. Es una regresión: las versiones 5 y 6
funcionan.

No es aislado. La matriz de funciones de Prisma no menciona MariaDB ni una vez, y su tabla de
tipos afirma que `Json` se mapea a `JSON` sin decir que en MariaDB es un alias de `LONGTEXT`:

- Diffs falsos permanentes en columnas `Json` al comparar esquemas.
- El mismo `$queryRaw` devuelve objeto en MySQL y cadena en MariaDB (confirmado por Prisma).
- Sin `relationJoins`: MariaDB no soporta subconsultas correlacionadas, así que toda consulta con
  relaciones será varias consultas más ensamblado en la aplicación.
- `migrate deploy` con error vacío, sin diagnóstico (reporte abierto).

| Camino | Qué implica | Veredicto |
| --- | --- | --- |
| **PostgreSQL** | Elimina toda la categoría de problemas. Mejor soporte de Prisma. Exige VPS | Recomendado |
| MySQL 8 | Mismo proveedor de Prisma, sin el fallo crítico, con `relationJoins` | Aceptable |
| MariaDB | Fijar Prisma en 6.x, prohibir el tipo `Json`, asumir consultas extra | Con deuda |

MariaDB probablemente entró a la lista porque es lo que da el hosting compartido. Al moverte a
un VPS esa restricción desaparece.

## 9. Entornos y entrega

- **GitHub Actions en cada PR:** typecheck, lint, pruebas y comparación del esquema contra la
  base para detectar desviaciones antes de producción.
- **Despliegue por Dokploy** escuchando el push a `main`. GitHub Actions nunca necesita
  credenciales del servidor.
- **Dos entornos: local y producción.** Local con Docker Compose y la misma versión de motor que
  producción. Staging llega cuando haya alguien más además de ti.
- **Regla dura de migraciones:** `migrate dev` solo en local, `migrate deploy` al arrancar el
  contenedor. Nunca al revés.

## 10. Riesgos

| Riesgo | Por qué importa | Mitigación |
| --- | --- | --- |
| Cuatro tipos de cuenta desde el inicio | Cuadruplica auth y pantallas para una base vacía | La fase 1 autentica solo al equipo |
| Marketplace sin oferta | Resultados vacíos; la primera impresión mata la beta | Directorio antes que matching |
| Prisma 7 sobre MariaDB | Fallo crítico abierto, sin fecha de arreglo | PostgreSQL, o fijar Prisma 6.x |
| Datos personales sin aviso | LFPDPPP lo exige desde el primer registro | Publicar el aviso antes de abrir el formulario |
| Rehacer la landing en Next.js | 9 pantallas afinadas y SEO resuelto, en riesgo sin necesidad | La landing se queda; la app en subdominio |
| Un solo dev con un VPS | Tú eres también el administrador del servidor | Dokploy + respaldos diarios de pago |
| Beta gratuita sin definición de éxito | Sin métricas no sabrás qué cobrar | Definir tres números antes de escribir código |

## 11. Preguntas abiertas

Las dos primeras bloquean el inicio; las demás se responden mientras se construye la fase 1.

1. **¿Postgres, MySQL o MariaDB?** La decisión más cara de revertir, y la única que condiciona el plan de hosting.
2. **¿Ya contrataste algo en Hostinger, y qué exactamente?** Si ya hay un Cloud pagado, hay que trabajar dentro de sus límites.
3. **¿Qué hace hoy el equipo AIUTO a mano que le duela?** El panel se diseña desde ahí. Sin esto, la fase 1 es una suposición bien formateada.
4. **¿Cuántas personas usarían el panel interno?** Determina si los permisos son un campo de rol o un sistema completo.
5. **¿Quién redacta el aviso de privacidad?** Responsable, datos, finalidad, transferencias y derechos ARCO. No conviene improvisarlo.
6. **¿Los CV se suben como archivo?** Si sí, entran almacenamiento de objetos, límites, antivirus y retención.
7. **¿Qué proveedor de correo transaccional y desde qué dominio?** Y hay que zanjar `aiuto.mx` vs `aiuto.com.mx`.
8. **¿Qué significa que la beta salió bien?** Tres números, definidos antes de la primera línea de código.

## 12. Siguiente paso

Si el corte de la fase 1 es correcto, el siguiente entregable es la especificación técnica y el
plan de implementación tarea por tarea. Si no, reordenamos antes de escribir código.
