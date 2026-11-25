# Brechas: máster prompt contra lo construido

25 de noviembre de 2026 · contra la rama `salida-produccion`

El máster prompt (`2026-11-23-master-prompt.md`) cambia el producto. La spec de la Fase 1
dejó **fuera a propósito** las cuentas de empresa, el autoservicio del empleador y el pitch
en video. El máster prompt los vuelve obligatorios y pide lanzar las tres vertientes al
mismo tiempo. Donde los dos documentos se contradicen, manda el máster prompt.

## Lo que ya cumple

| Requisito (§) | Dónde está |
| --- | --- |
| Bolsa con buscador, detalle y "Aplicar" (§7.2) | `app/(publico)/bolsa/**`. Filtra por palabra, modalidad, sueldo mínimo y categoría |
| Ficha de vacante estructurada: puesto, empresa, ubicación, modalidad, sueldo, horario, prestaciones, descripción, conocimientos (§7.1) | `Vacante` en `schema.prisma`, con los campos obligatorios en la columna |
| Cuentas de candidato con perfil y seguimiento de postulaciones (§8, §8.4 en parte) | `app/mi/**` |
| Panel interno de vacantes, postulaciones y asesorías (§10 en parte) | `app/panel/**` |
| Cierre automático de vacantes vencidas (§13 del §18) | `api/tareas/cerrar-vencidas` + workflow diario |
| Siete categorías con color propio (§3, §5) | `sitio/categorias.json` → tabla `Category` |
| Seguridad: tope de intentos, recuperar contraseña, confirmar el correo, cabeceras (§15) | Rama `salida-produccion`, 25/nov |

## Lo que falta

### A. Cambios de modelo (todo lo demás depende de esto)

1. **Rol `EMPRESA`** y relación usuario ↔ empresa (`CompanyMember`). Hoy las empresas no
   tienen cuenta: las da de alta el equipo (`Company.verificada`).
2. **Licencia empresarial configurable** (`Licencia`): vacantes activas permitidas, vigencia
   de la licencia y estado. **Sin precios**: el §7.1 prohíbe fijar tarifas sin autorización.
3. **Vigencia de vacante: 30 días, ampliable a 60** (hoy son 60 fijos, en
   `DIAS_VIGENCIA_VACANTE`). Hace falta `ampliadaEn` y una regla de quién puede ampliar.
4. **Campos nuevos de la vacante**: resultados esperados (*Job to Be Done*), requisitos
   indispensables e instrucciones de postulación. Además, aclarar si el sueldo publicado es
   **neto**, como pide el §7.1 (hoy no se distingue bruto de neto).
5. **Perfil del candidato**: formación académica, trayectoria (lista de experiencias con
   3 a 5 logros), LinkedIn, evidencias (lista de ligas tipificadas) y **consentimiento**
   explícito para que las empresas consulten el CV, el pitch y las evidencias.
6. **Vacantes guardadas** (`VacanteGuardada`).
7. **Mensajería interna** (`Conversacion` y `Mensaje`, una conversación por postulación).
   El primer mensaje de la empresa cuenta como **contacto efectivo**, y eso es lo que
   apaga la alerta del §11.
8. **Notificaciones dentro de la plataforma** (`Notificacion`). El §19 exige que las de
   reclutamiento se queden en AIUTO; el correo queda solo como aviso de que hay algo nuevo.
9. **Alertas administrativas** (`Alerta`): tipo, vacante, empresa, fecha de la primera
   postulación, número de postulados, estado (abierta, atendida o descartada) y nota.

### B. Pantallas y flujos

| Módulo (§18) | Estado | Qué falta |
| --- | --- | --- |
| 1. Diseño y navegación | Parcial | Menú Inicio · Nosotros · Soluciones (desplegable de 7) · Bolsa · Empleabilidad · Contacto. Logo oficial en la app (hoy dice "AIUTO" en texto). El sistema visual pasa de radio 0 a **tarjetas con bordes suaves** (§3) |
| 2. Inicio e institucionales | En la landing estática | Inicio como distribuidor de las 3 vertientes con el mismo peso (§4). Nosotros |
| 3. Siete categorías | En la landing, con otros nombres y otro contenido | Renombrar: Estrategia y Dirección, Ventas y Crecimiento, Recursos Humanos, Procesos y Operaciones, Tecnología e IA, Finanzas e Impuestos, Comercio Exterior y Logística. Cada página lleva problemas, 8 soluciones, beneficios, un glosario de términos técnicos, contacto y WhatsApp |
| 4. Empleabilidad | `/asesoria` con precios por nivel | Página de las 12 áreas y las 2 sesiones remotas. **Los precios visibles (2,500, 3,500 y 5,000) chocan con el §7.1** si no están autorizados |
| 5. Bolsa y buscador | Hecho | Filtros por empresa y ubicación. Tarjeta con 5 habilidades como máximo |
| 6. Registro y autenticación | Hecho para candidatos | Registro o alta de empresa y su aprobación por el administrador |
| 7. Panel del candidato | Parcial | Formación, trayectoria, evidencias, pitch con guía de 1 a 2 min, recomendaciones de CV (§8.2), vacantes guardadas, mensajes |
| 8. Panel de empresa | **No existe** | Vacantes según licencia, postulaciones, perfiles, CV, pitch, mensajes, avance del proceso, cerrar vacante. Cada empresa ve solo lo suyo |
| 9. Panel maestro | Parcial (panel del equipo) | Empresas, licencias, usuarios y permisos, alertas, indicadores del §16 |
| 10. Alertas por inactividad | **No existe** | Tarea diaria: 3 días hábiles desde la primera postulación sin contacto efectivo |
| 11. Comunicación empresa–candidato | **No existe** | Ver A.7 |
| 12. WhatsApp contextual | **No existe** | Botón flotante solo en Inicio, Soluciones y Empleabilidad, con mensaje distinto en cada una. **Falta el número de Damián** |
| 13. Vigencia y licencias | Parcial (60 días fijos) | Ver A.2 y A.3 |
| 14. Seguridad y móvil | Parcial | Lo que sigue del plan de salida: limpieza de QA, aviso de privacidad, respaldos y monitoreo |

## Decisiones que no son de código

| # | Decisión | Por qué importa |
| --- | --- | --- |
| 1 | **Número de WhatsApp de Damián** | El §13 prohíbe inventarlo. Sin él, el botón no se puede publicar |
| 2 | **Una sola aplicación o landing aparte.** El máster prompt describe una sola plataforma; hoy la landing es HTML estático en Hostinger y la app vive en Railway | Unificar exige mover `aiuto.com.mx` a Railway (DNS) y retirar `sitio/` |
| 3 | **Precios de la asesoría de empleabilidad** | Hay tres precios publicados. El §7.1 pide no fijar condiciones económicas sin autorización |
| 4 | **Archivos: CV y video.** Hoy son ligas externas (`cvUrl`, `ligaVideo`) | Subir archivos exige almacenamiento (por ejemplo, Cloudflare R2 o S3), y eso es costo y una decisión. Las ligas a YouTube, Vimeo o Drive funcionan sin costo |
| 5 | **Alta de empresas.** ¿Se registran solas y el administrador las aprueba, o solo el administrador las da de alta? | Define si hay un formulario público de alta de empresa |
| 6 | **Días hábiles** | Propuesta: lunes a viernes, menos los días de descanso obligatorio del art. 74 de la LFT |

### Resueltas el 25 de noviembre

- **2 → Una sola aplicación.** El sitio público pasa a la app de Next; `aiuto.com.mx` se
  moverá a Railway y `sitio/` se retira cuando la app lo cubra.
- **3 → Sin precios.** La página de empleabilidad explica el servicio y lleva a WhatsApp.
- **4 → Ligas por ahora.** El CV y el video siguen siendo ligas externas.
- **5 → Registro con aprobación.** La empresa se registra, queda pendiente y el
  administrador la aprueba y le asigna una licencia.

Siguen abiertas la **1** (número de WhatsApp) y la **6** (se toma la propuesta mientras
nadie diga otra cosa).

## Orden propuesto

Las tres vertientes salen juntas (§1), pero se construyen en este orden por dependencias:

1. **Modelo**: migración con todo el bloque A. Es una sola migración para no migrar dos veces.
2. **Empresa**: rol, alta y aprobación, licencia, panel de empresa con aislamiento probado
   por suite (una empresa intenta leer los datos de otra y recibe 404).
3. **Mensajería y contacto efectivo**, y en seguida la **alerta de 3 días hábiles** con
   pruebas unitarias del cálculo de días hábiles.
4. **Candidato**: perfil ampliado, consentimiento, vacantes guardadas, guía de CV y de pitch.
5. **Panel maestro**: empresas, licencias, alertas, usuarios e indicadores del §16 (solo
   datos reales; si no hay datos, se dice "sin datos").
6. **Sitio público**: inicio distribuidor, 7 categorías, empleabilidad, WhatsApp contextual,
   nuevo sistema visual y logo.
7. **Cierre**: lo que queda del plan de salida (limpieza de QA, aviso, correo, respaldos y
   monitoreo) y la revisión en móvil de cada flujo.

## Avance del 25 de noviembre (rama `salida-produccion`)

Hecho y probado (typecheck, 119 pruebas de `core` y 11 suites de `tools/qa` en verde contra local):

- **Modelo**: migración `20261125200950_empresas_mensajes_alertas`. Es aditiva, renombra las 7
  categorías y quita el NOT NULL de `precioMostrado`.
- **Empresa**: registro público `/empresas/registro` → PENDIENTE → el administrador la aprueba y le
  asigna una licencia en `/panel/empresas` → panel `/reclutamiento` (vacantes, postulaciones,
  ficha del candidato, mensajes y avisos). El aislamiento entre empresas está probado: lo ajeno da 404.
- **Mensajería** por postulación. El primer mensaje de la empresa, o "ya la contacté por otra
  vía", registra el contacto efectivo. Los avisos se quedan en la plataforma y el correo solo
  invita a entrar.
- **Alerta de 3 días hábiles**: `core/habiles.ts` (LFT art. 74, UTC-6) y `core/alertas.ts`. La
  tarea `/api/tareas/alertas` es un paso nuevo del workflow diario. Las alertas se ven en
  `/panel/alertas` y se cierran solas cuando hay contacto o cuando la vacante se cierra.
- **Vacante**: resultados esperados (obligatorio), requisitos indispensables, instrucciones e
  indicador de sueldo neto. La vigencia es de 30 días, ampliable una vez a 60 desde el panel del
  equipo. La bolsa filtra también por empresa y ubicación, y la tarjeta muestra 5 habilidades.
- **Candidato**: LinkedIn, liga al CV, pitch, consentimiento, trayectoria con logros, formación,
  evidencias, guías de CV y de pitch, vacantes guardadas, mensajes y avisos.
- **Panel maestro**: alertas, empresas y licencias, usuarios (solo lectura), indicadores del §16 y
  avisos.
- **Sitio público dentro de la app**: inicio distribuidor, Nosotros, `/soluciones` y sus 7
  páginas (fuente: `core/soluciones.ts`), `/empleabilidad` sin precios (`/asesoria` redirige ahí),
  menú desplegable, logo, tarjetas con bordes suaves y WhatsApp solo donde lo permite el §13.

Pendiente:

- **Número de WhatsApp** (decisión 1): ponerlo en la variable `WHATSAPP_NUMERO` de Railway
  **antes** del siguiente `railway config apply`, porque `.railway/railway.ts` ya la declara.
- **Mover `aiuto.com.mx`** de Hostinger a Railway y retirar `sitio/`. `docs/diseno` conserva el
  logo sin rotar.
- **Gestión de usuarios**: hoy es solo una lista; cambiar roles o desactivar cuentas sigue siendo a mano.
- Lo que queda del plan de salida: tareas 7 a 16 (limpieza de QA, aviso de privacidad, correo,
  respaldos y monitoreo).
