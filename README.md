# Netflix Household Bypass

Extensión para Chrome y Edge enfocada en automatizar la interacción con el flujo de verificación de Netflix Household.

## Qué incluye
- Toggle visual con persistencia del estado.
- `background.js` para inyección y sincronización.
- `content.js` como capa de apoyo sobre la interfaz.
- `rules.json` para reglas DNR compatibles con Edge y Chrome.
- Iconos y assets listos para empaquetado.

## Instalación local
1. Abre `chrome://extensions` o `edge://extensions`.
2. Activa `Modo de desarrollador`.
3. Haz clic en `Cargar descomprimida`.
4. Selecciona la carpeta del proyecto.

## Estructura
- `manifest.json` - permisos y configuración principal.
- `background.js` - lógica de fondo y sincronización.
- `content.js` - automatización sobre la página.
- `popup.html` / `popup.js` - interfaz del popup.
- `rules.json` - reglas de bloqueo de red.
- `icons/` - iconos de la extensión.

## Notas
- `_metadata/` es generado localmente y no debe subirse.
- El proyecto está pensado para mantenerse simple y fácil de revisar.
