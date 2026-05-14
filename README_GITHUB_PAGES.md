# Reporte aRMG - Paquete para GitHub Pages

Este paquete está preparado para publicar el sistema **Reporte de Fallas RMG 3.1** en **GitHub Pages**.

## Archivos principales

- `index.html`: pantalla principal de captura.
- `historial.html`: pantalla de historial.
- `app.js`: lógica de captura.
- `historial.js`: lógica del historial.
- `api.js`: conexión con Google Apps Script.
- `config.js`: configuración general y URL del Apps Script.
- `styles.css`: estilos visuales.
- `assets/`: imagen del encabezado.
- `.nojekyll`: evita procesamiento con Jekyll y publica los archivos estáticos directamente.
- `verificar.html`: página de prueba para confirmar que el deploy está funcionando.

## Rutas disponibles después de publicar

- `/`
- `/index.html`
- `/historial.html`
- `/historial/`
- `/captura/`
- `/verificar.html`

## Publicación desde GitHub web

1. Entra a https://github.com e inicia sesión.
2. Crea un repositorio nuevo, por ejemplo: `reportearmg`.
3. Entra al repositorio.
4. Presiona **Add file > Upload files**.
5. Sube todos los archivos y carpetas de este paquete, no el ZIP cerrado.
6. Presiona **Commit changes**.
7. Ve a **Settings > Pages**.
8. En **Build and deployment**, selecciona:
   - **Source**: Deploy from a branch
   - **Branch**: main
   - **Folder**: / root
9. Presiona **Save**.
10. Espera de 1 a 3 minutos y abre la URL de GitHub Pages.

La URL normalmente queda con este formato:

```text
https://TU_USUARIO.github.io/reportearmg/
```

## Pruebas recomendadas

Después de publicar, prueba:

```text
https://TU_USUARIO.github.io/reportearmg/
https://TU_USUARIO.github.io/reportearmg/historial.html
https://TU_USUARIO.github.io/reportearmg/verificar.html
```

## Importante

- Si el botón **Historial** no abre, prueba primero `/historial.html` directamente.
- Si el sitio tarda en actualizar, espera unos minutos o presiona `Ctrl + F5`.
- No guardes claves privadas dentro de JavaScript público.
- La URL del Apps Script visible en `config.js` puede ser vista por cualquier persona que abra las herramientas del navegador.
