# Despliegue — aiuto.com.mx

**Estado: publicado y verificado el 8 de septiembre de 2026.**

Sitio estático: no requiere Node, PHP ni base de datos. Se sube tal cual a la
carpeta pública del hosting.

Verificación de la publicación:

| Comprobación | Resultado |
| --- | --- |
| `http://aiuto.com.mx/` | 301 → `https://aiuto.com.mx/` |
| `http://www.aiuto.com.mx/` | 301 → `https://www.aiuto.com.mx/` → 301 → `https://aiuto.com.mx/` |
| `https://www.aiuto.com.mx/` | 301 → `https://aiuto.com.mx/` |
| `https://aiuto.com.mx/` y `/contacto.html` | 200 |
| `https://aiuto.com.mx/ruta-inexistente` | 404 sirviendo `404.html` |
| `robots.txt`, `sitemap.xml`, `styles.css`, `assets/` | 200 |

Los redirectores hacen bien su trabajo, pero `http://www` da **dos saltos**
(`http://www` → `https://www` → `https://`). Es correcto y los buscadores lo
siguen sin problema; si algún día quieres un solo salto, hay que combinar ambas
condiciones en una sola `RewriteRule` del `.htaccess`. No es urgente.

## 1. Qué se sube

Todo el **contenido de `sitio/`** (los archivos, no la carpeta) a la raíz pública
del hosting — en cPanel es `public_html/`.

```
public_html/
├── index.html          ← debe quedar en la raíz, no dentro de una subcarpeta
├── nosotros.html · empresas.html · talento.html
├── categorias.html · categoria.html · bolsa.html · contacto.html
├── ui-kit.html         ← referencia interna (ya marcada noindex en robots.txt)
├── 404.html
├── styles.css · main.js · categorias.json · categorias.js
├── robots.txt · sitemap.xml
├── .htaccess           ← archivo oculto: verifica que se haya subido
└── assets/             aiuto-lockup.png · aiuto-isotipo.png
```

El paquete listo para subir se genera con:

```bash
cd sitio && zip -r ../aiuto-sitio.zip . -x '.DS_Store'
```

## 2. Subida por cPanel (recomendado)

1. cPanel → **Administrador de archivos** → entra a `public_html/`.
2. Si hay una página por defecto del proveedor (`index.html`, `default.html`,
   `cgi-bin` de muestra), bórrala o muévela.
3. **Cargar** → sube `aiuto-sitio.zip`.
4. Clic derecho sobre el zip → **Extraer** dentro de `public_html/`. Borra el zip.
5. Menú **Configuración** (arriba a la derecha) → marca **Mostrar archivos ocultos
   (dotfiles)** y confirma que `.htaccess` está presente. Si no, súbelo aparte.
6. Permisos esperados: `644` para archivos, `755` para carpetas (es lo que aplica
   por defecto al extraer).

### Alternativa por FTP

Cliente FTP (FileZilla) → conecta con los datos de cPanel → arrastra el contenido
de `sitio/` a `public_html/`. Activa **Servidor → Forzar mostrar archivos ocultos**
para que `.htaccess` se transfiera.

## 3. DNS del dominio

El dominio canónico del sitio es **`https://aiuto.com.mx`** (sin `www`). Así están
escritos los `canonical`, el `sitemap.xml` y las etiquetas Open Graph de las 9
páginas, y el `.htaccess` redirige `www` → raíz para evitar contenido duplicado.

En el panel del registrador donde administras el DNS de `aiuto.com.mx`:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| `A` | `@` | IP del servidor — en cPanel aparece como **Shared IPv4 Address** en la barra lateral derecha |
| `CNAME` | `www` | `aiuto.com.mx` |

Si el proveedor te dio *nameservers* propios (`ns1.tuproveedor.com`…), la
alternativa más simple es apuntar los nameservers del dominio a los del hosting y
dejar que él gestione los registros.

La propagación tarda de minutos a 24 h. Verifica con:

```bash
dig +short aiuto.com.mx        # debe devolver la IP del hosting
dig +short www.aiuto.com.mx
```

## 4. HTTPS

Con el DNS ya apuntando: cPanel → **SSL/TLS Status** → **Run AutoSSL** (Let's
Encrypt gratuito). Espera a que `aiuto.com.mx` y `www.aiuto.com.mx` queden en
verde. La redirección `http → https` ya está en el `.htaccess`, no actives además
la de cPanel: duplicarla puede causar un bucle de redirección.

Cuando HTTPS lleve unos días estable, puedes descomentar la línea de
`Strict-Transport-Security` al final del `.htaccess`.

## 5. Verificación posterior

```bash
curl -sI http://aiuto.com.mx        | head -3   # 301 → https
curl -sI http://www.aiuto.com.mx    | head -3   # 301 → https://aiuto.com.mx
curl -sI https://aiuto.com.mx/      | head -3   # 200
curl -sI https://aiuto.com.mx/xyz   | head -3   # 404 (sirve 404.html)
curl -s  https://aiuto.com.mx/robots.txt
```

En el navegador, revisa: menú móvil, filtros de la Bolsa de Trabajo, las 7
categorías (`categoria.html?cat=estrategia` … `?cat=comex`) y el envío del
formulario de contacto.

## 6. Actualizaciones posteriores

Edita en `sitio/`, sube solo los archivos cambiados y recarga con caché limpia
(`Ctrl+Shift+R`). `styles.css` y `main.js` tienen caché de 24 h en el `.htaccess`:
si un cambio urgente no aparece, renómbralos con versión (`styles.css?v=2` en el
`<link>`) o baja el `ExpiresByType` correspondiente.

## 7. Lo que sigue estando pendiente

El sitio se publicó con contenido de muestra: WhatsApp y correo ficticios,
enlaces del footer en `#`, vacantes inventadas, fotografía sin sustituir y el
formulario de contacto sin backend (los mensajes se pierden).

El inventario completo —qué falta, dónde vive cada cosa, qué medidas necesitan
las fotos y en qué orden conviene atacarlo— está en
[`CONTENIDO.md`](CONTENIDO.md). Para ver el estado en cualquier momento:

```bash
python3 tools/aplicar-datos.py --estado
```
