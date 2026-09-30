# Guía de QA

**Base:** https://aiuto-web-production.up.railway.app

Todo lo que hay aquí lo siembra `pnpm db:seed:qa` y lo retira `pnpm db:seed:qa --limpiar`.
**No son datos reales y no deben existir cuando abra la beta.**

## Cuentas

Todas con la misma contraseña: **`aiuto123`**

Se entra por `/entrar`. Cada rol cae donde le toca: el equipo en `/panel`, los candidatos en
`/mi`. Si alguien intenta entrar a la zona que no le corresponde, se le redirige.

### Equipo AIUTO

| Correo | Rol | Qué permite probar |
| --- | --- | --- |
| `admin@qa.aiuto.test` | Administración | Todo el panel: bandeja, vacantes, postulaciones, asesorías |
| `operador@qa.aiuto.test` | Operación | Lo mismo; hoy los dos roles ven igual, la distinción existe para cuando haya algo que separar |

### Candidatos

| Correo | Quién es | Qué permite probar |
| --- | --- | --- |
| `candidato@qa.aiuto.test` | Carla, desarrolladora backend, 6 años | **El caso completo**: tiene una postulación en entrevista y está en el roster preferencial |
| `egresado@qa.aiuto.test` | Efrén, pasante, 0 años | Sin roster, y con una postulación **rechazada**: cómo se ve la mala noticia desde el lado del candidato |
| `gerente@qa.aiuto.test` | Gina, directora de operaciones, 15 años | Nivel gerencial con roster y **sin postulaciones**: el estado vacío de `/mi` |

### No hay cuentas de empresa

A propósito: en la Fase 1 el empleador no se autoservicia. Las vacantes las captura el equipo
AIUTO desde el panel, y las empresas se dan de alta solas al capturar su primera vacante.

## Postulaciones sin cuenta

Se puede postular sin registrarse, y consultar el estado con una liga secreta. Estas cinco
cubren los cinco estados que ve un candidato, cada una en
`/postulacion/<token>`:

| Quién | Estado | Vacante |
| --- | --- | --- |
| Rosa Nueva | Recibida | Ingeniera de plataforma |
| Beto Revisión | En revisión | Ingeniera de plataforma |
| Carla Candidata | En entrevista | Ingeniera de plataforma |
| Dani Contratada | Contratada | Contador general |
| Eva Rechazada | No siguió | Contador general |
| Fer Sin Suerte | Vacante cubierta | Contador general |

Los tokens se sacan del panel o con una consulta a la base; cambian en cada siembra.

## Vacantes

**23 en total, 19 abiertas**, tres por cada una de las siete categorías, en ocho empresas.
Las cuatro restantes están en borrador, cubierta, cerrada o expirada: no salen en la bolsa
pública y su detalle devuelve 404.

Los sueldos van de **$42 por hora** (operador de producción) a **$180,000 mensuales**
(director de planeación), justamente para que la pantalla de sueldos tenga de dónde.

Casos de borde sembrados a propósito:

| Vacante | Qué cubre |
| --- | --- |
| Ingeniera de plataforma | IMSS mixto al 40 %, remoto, 4 entrevistas. **Vence en 6 días**: sale el aviso en rojo |
| Operador de producción por turno | **Sueldo por hora**, turnos rotativos |
| Auxiliar de almacén | Sueldo por hora **fijo** (mínimo = máximo) |
| Promotor de punto de venta | El sueldo más bajo del catálogo |
| Director de planeación estratégica | El más alto, con 5 entrevistas |
| Analista de nómina | **Borrador**: para probar el botón de publicar |
| Contador general | **Cubierta**: sus postulaciones se ven cerradas en cascada |
| Coordinador de marketing | **Expirada**: lo que deja la tarea de cierre automático |
| Supervisor de corte | **Cerrada** a mano |

## Sueldos y empresas

`/sueldos` calcula los rangos con las vacantes abiertas, no con encuestas. **Por debajo de
3 vacantes en una categoría no publica cifra**, y lo dice: preferimos no dar un número que
suene a dato sin serlo. Los sueldos por hora, semanales y quincenales se normalizan a
mensuales con la jornada máxima de ley.

`/empresa/<slug>` muestra las vacantes de una empresa y lo que paga. Con pocas vacantes
tampoco inventa una mediana.

## Solicitudes y asesorías

Cuatro solicitudes de contacto, una por cada estado (nueva, en proceso, atendida, cerrada);
la bandeja sólo muestra las dos primeras. Seis solicitudes de asesoría, una por cada estado
del embudo, con los tres precios.

## Atajos para probar sin capturar de más

Con `MODO_QA=1` en el entorno, el formulario de vacante muestra un botón
**«Llenar con datos de ejemplo»**: llena los catorce campos de una pasada y se puede publicar
de un clic. Está pensado para recorrer el flujo sin capturar a mano cada vez.

Lo que **no** se relaja, ni en QA, son las reglas de la vacante: sin sueldo, sin porcentaje de
seguro social o con un máximo menor que el mínimo, no se guarda. Son el producto, no un
trámite.

Las vacantes se pueden **editar** en cualquier estado desde el listado del panel. Editar no
reinicia el plazo: el reloj de los 60 días sigue corriendo desde que se publicó.

## Recorridos que vale la pena probar

1. **El que sostiene el producto.** Entra como `admin`, mueve una postulación de "recibida" a
   "en revisión", y entra como `candidato` para ver que el cambio se refleja. En los logs del
   servidor aparece el correo que se le habría mandado.
2. **Transparencia obligatoria.** En `/panel/vacantes/nueva`, intenta publicar con el sueldo
   máximo menor que el mínimo, o con un seguro social mixto al 100 %. No deja.
3. **No se pierde lo capturado.** En ese mismo formulario, provoca el error y comprueba que
   los otros trece campos siguen ahí.
4. **Postular sin cuenta y después registrarse** con el mismo correo: el historial aparece
   en `/mi`.
5. **Cierre en cascada.** Marca "Ingeniera de plataforma" como cubierta y mira cómo las
   postulaciones abiertas pasan a "vacante cubierta".

## Correo

Sin `EMAIL_API_KEY` configurada, **los correos no se envían: se escriben en la bitácora del
servidor**. Para verlos:

```
railway logs --service aiuto-web --lines 100 | grep -A20 "CORREO"
```

Así se puede revisar exactamente qué diría cada uno antes de que salga a alguien de verdad.
