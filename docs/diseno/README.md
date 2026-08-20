# Paquete de diseño AIUTO

Material de diseño original del sitio institucional (9 pantallas, es-MX). Base visual: sistema *Modernist* + paleta del isotipo AIUTO. La implementación viva está en [`/sitio`](../../sitio); la especificación, en [`../HANDOFF.md`](../HANDOFF.md).

## Contenido

| Archivo | Qué es | Para quién |
| --- | --- | --- |
| `aiuto-prototipo.html` | Mockup completo en un solo archivo, funciona offline sin dependencias. Doble clic y navegar. | Cliente / revisión |
| `AIUTO Website.dc.html` | Mockup navegable **editable** de las 9 pantallas. Incluye la vista Móvil 390 (enlace en el pie). | Diseño |
| `support.js` | Runtime del mockup editable. No editar. | — |
| `assets/` | Logos originales AIUTO (PNG con transparencia): lockup e isotipo. | Todos |
| `uploads/` | Archivos fuente subidos por el cliente (logo). | Referencia |
| `_ds/` | Tokens del sistema *Modernist* del que parte el diseño. | Diseño |

## Referencias normativas

- **UI Kit**: [`/sitio/ui-kit.html`](../../sitio/ui-kit.html) — foundations y componentes en todos sus estados. Si algo no está ahí, no está en el sistema.
- **Especificación**: [`../HANDOFF.md`](../HANDOFF.md) — tokens, escala tipográfica, rejilla, interacción, notas por pantalla y pendientes.
- **Tokens máquina**: [`../tokens.json`](../tokens.json) — para Tailwind, Figma Tokens o variables CSS.

Este paquete es la **referencia congelada** del diseño aprobado: los refinamientos posteriores viven únicamente en `/sitio`.
