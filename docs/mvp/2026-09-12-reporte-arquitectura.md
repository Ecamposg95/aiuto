# Del sitio al producto — reporte de arquitectura

**Versión 3 · 14 de septiembre de 2026**

Versión navegable: https://claude.ai/code/artifact/f28c8293-debb-413c-99b2-fffb9f9efb4b

> **Qué cambió en la versión 3.** Quedó decidida la infraestructura: **Railway hospeda la beta**
> completa, incluidos desarrollo, depuración y primeros usuarios, y **el VPS de IONOS recibe
> producción** cuando la beta gradúe. El Cloud de Hostinger se queda solo con la landing. Con eso
> el motor de base de datos deja de estar en duda y pasa a ser **PostgreSQL**, y aparece un
> requisito nuevo que atraviesa todo el proyecto: **portabilidad desde el primer commit**.

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

> **La API separada depende del destino.** Son dos procesos Node corriendo todo el tiempo. En el
> Cloud de Hostinger, con 4 GB entre tres sitios, eso no es gusto sino capacidad, y ahí conviene
> una sola app Next.js. En IONOS o Railway la decisión vuelve a ser tuya. En los tres casos la
> lógica de negocio vive en `packages/`, no dentro del framework que sirve HTTP, así que extraer
> la API después es mover código, no reescribirlo.

## 7. Dónde vive el MVP

**Decidido.** Railway para la beta, IONOS para producción, Hostinger para la landing.

| | Hostinger Cloud Startup | VPS de IONOS | **Railway** |
| --- | --- | --- | --- |
| Rol | La landing, permanente | Producción, más adelante | **La beta** |
| Costo | $0, ya pagado | $0, ya pagado | **$15–25/mes según uso** |
| Motor de base | Solo MariaDB | PostgreSQL | **PostgreSQL** |
| Root y Docker | No | Sí | No aplica, es PaaS |

> **El principio que sostiene el reparto: la aplicación y su base viven siempre en la misma red.**
> Por eso el MVP se mueve completo de Railway a IONOS cuando toque, nunca a medias.

La ruta queda en dos etapas. Railway hospeda la beta completa: desarrollo, depuración y primeros
usuarios. Cuando la beta gradúe, el conjunto entero se muda al VPS de IONOS y la factura de
Railway se apaga. Hostinger nunca entra a la ecuación del producto.

Eso convierte una cosa en requisito de diseño desde el primer commit, no en tarea del final:
**portabilidad**. Si la beta se construye pegada a Railway, la mudanza deja de ser un despliegue
y se vuelve un proyecto.

### Portabilidad desde el primer commit

- **Docker desde el inicio.** Un `Dockerfile` por aplicación y un `docker-compose.yml` que levante el conjunto. Railway despliega desde Dockerfile igual de bien, y ese mismo compose es después el despliegue en IONOS.
- **La misma versión mayor de PostgreSQL en los tres lugares**, fijada explícitamente en la imagen.
- **Nada propietario en el código.** Si el código llama a algo que solo existe en Railway, la mudanza nace con deuda.
- **Ensayar la migración antes de necesitarla.** Un volcado restaurado en el IONOS, una vez, mientras no hay prisa.

> **Lo difícil de mudarse no es la aplicación.** Mover contenedores toma minutos. Lo difícil es
> mover una base que ya tiene usuarios dentro: exige ventana de mantenimiento, congelar escrituras
> y un plan de reversa. Por eso la portabilidad se decide ahora.

### Lo que hay que dejar armado el día uno en Railway

- **Región US West.** California es la más cercana a México de las cuatro que ofrece Railway. No hay región en Latinoamérica.
- **Respaldos programados.** No vienen por defecto. Con primeros usuarios dentro, uno diario es el mínimo defendible.
- **Recuperación a un punto en el tiempo, activada de inmediato.** Cuenta solo hacia adelante.
- **Tope de gasto, con cuidado.** El límite duro no degrada el servicio, lo apaga entero.
- **Red privada entre servicios.** Hablar con la base por URL pública se cobra como salida a internet.

**Falta definir qué dispara la mudanza:** una cifra de usuarios, un monto de factura o el fin de
la beta gratuita. Si no se escribe, se pospone hasta que duela.

## 8. Por qué PostgreSQL

*Resuelto: Railway e IONOS ofrecen los dos PostgreSQL. Esta sección queda como registro de por
qué importaba, y de qué te habrías llevado con MariaDB.*

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
| **PostgreSQL** | Elimina toda la categoría de problemas. Mejor soporte de Prisma. Disponible en Railway y IONOS | **Elegido** |
| MySQL 8 | Mismo proveedor de Prisma, sin el fallo crítico, con `relationJoins` | Aceptable |
| MariaDB | Fijar Prisma en 6.x, prohibir el tipo `Json`, asumir consultas extra | Con deuda |

MariaDB entró a la lista porque es lo que da el hosting compartido, no porque alguien la
eligiera. Al salir la beta de Hostinger, la restricción desapareció y con ella todo lo anterior.

> **La regla que queda de aquí:** la misma versión mayor de PostgreSQL en local, en Railway y en
> IONOS, fijada explícitamente en la imagen. Un cambio de versión mayor en medio de una mudanza
> convierte un volcado y una restauración en una tarde de depuración.

## 9. Entornos y entrega

- **Dos entornos, no tres: local y beta.** Local con Docker Compose, beta en Railway. Producción
  aparece cuando exista, en IONOS. Un staging hoy sería ceremonia sin lector.
- **GitHub Actions en cada PR:** typecheck, lint, pruebas y comparación del esquema contra la
  base para detectar desviaciones antes de que lleguen a la beta.
- **Railway despliega solo** al recibir el push a `main`, así que GitHub Actions nunca necesita
  credenciales. Conviene activar la espera por las pruebas.
- **Regla dura de migraciones:** `migrate dev` solo en local, `migrate deploy` como paso previo
  al despliegue. Nunca al revés, y no cambia al mudarse a IONOS.
- **El despliegue se define en Docker**, no en el panel de Railway. Lo que viva solo en ese panel
  hay que reconstruirlo a mano el día de la mudanza.

## 10. Riesgos

| Riesgo | Por qué importa | Mitigación |
| --- | --- | --- |
| Cuatro tipos de cuenta desde el inicio | Cuadruplica auth y pantallas para una base vacía | La fase 1 autentica solo al equipo |
| Marketplace sin oferta | Resultados vacíos; la primera impresión mata la beta | Directorio antes que matching |
| Mudanza de Railway a IONOS | Mover contenedores es fácil; mover una base con usuarios dentro no | Docker desde el primer commit y un ensayo de la migración antes de necesitarla |
| El tope de gasto duro de Railway | No degrada el servicio, lo apaga entero, con usuarios encima | Aviso suave bajo y límite duro con holgura real |
| Respaldos que no existen | Railway no programa ninguno por defecto | Respaldo diario y recuperación a un punto en el tiempo, el día uno |
| App y base en proveedores distintos | Cada consulta cruza el internet público | Aplicación y base siempre en la misma red |
| MVP encima de producción ajena en IONOS | Un pico del MVP puede tumbar lo que ya corre ahí | Contenedores con límites de memoria y CPU, en su propia red |
| Datos personales sin aviso | LFPDPPP lo exige desde el primer registro | Publicar el aviso antes de abrir el formulario |
| Rehacer la landing en Next.js | 9 pantallas afinadas y SEO resuelto, en riesgo sin necesidad | La landing se queda; la app en subdominio |
| Un solo dev administrando servidores | Tú eres el administrador, en tres infraestructuras | Todo el MVP en una sola, con respaldos programados desde el día uno |
| Beta gratuita sin definición de éxito | Sin métricas no sabrás qué cobrar | Definir tres números antes de escribir código |

## 11. Preguntas abiertas

Las dos primeras bloquean el inicio; las demás se responden mientras se construye la fase 1.

> **Ya resueltas.** Dónde vive el MVP: Railway para la beta, IONOS para producción, Hostinger
> solo para la landing. Qué motor de base: PostgreSQL, en los tres entornos. Qué hay contratado
> en Hostinger: un Cloud Startup con tres sitios encima.

1. **¿Qué dispara la mudanza de Railway a IONOS?** Una cifra de usuarios, un monto de factura, o el fin de la beta gratuita. Escribirlo ahora evita que se posponga hasta que duela.
2. **¿Qué corre hoy en el IONOS y cuánto margen deja?** No bloquea la beta, pero sí la mudanza: `nproc; free -h; df -h /; docker --version`.
3. **¿Qué hace hoy el equipo AIUTO a mano que le duela?** El panel se diseña desde ahí. Sin esto, la fase 1 es una suposición bien formateada.
4. **¿Cuántas personas usarían el panel interno?** Determina si los permisos son un campo de rol o un sistema completo.
5. **¿Quién redacta el aviso de privacidad?** Responsable, datos, finalidad, transferencias y derechos ARCO. No conviene improvisarlo.
6. **¿Los CV se suben como archivo?** Si sí, entran almacenamiento de objetos, límites, antivirus y retención.
7. **¿Qué proveedor de correo transaccional y desde qué dominio?** Y hay que zanjar `aiuto.mx` vs `aiuto.com.mx`.
8. **¿Qué significa que la beta salió bien?** Tres números, definidos antes de la primera línea de código.

## 12. Siguiente paso

Confirma si el corte de la fase 1 es correcto. Con eso: especificación técnica y plan de
implementación tarea por tarea. Si el corte no convence, lo reordenamos antes de escribir una
línea de código.
