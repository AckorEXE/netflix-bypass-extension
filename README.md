# Netflix Household Bypass

Extensión de Chrome/Edge para ayudar a automatizar la interacción con el flujo de verificación de Netflix Household.

## Archivos principales
- `manifest.json` - permisos y configuración de la extensión.
- `background.js` - reglas de inyección y sincronización del estado.
- `content.js` - capa DOM para detectar y cerrar intersticiales.
- `popup.html` / `popup.js` - interfaz del popup y toggle de estado.
- `rules.json` - reglas DNR para bloquear solicitudes relacionadas.

## Instalación local
1. Abre `chrome://extensions` o `edge://extensions`.
2. Activa `Modo de desarrollador`.
3. Usa `Cargar descomprimida`.
4. Selecciona la carpeta del proyecto.

## Notas
- La carpeta `_metadata/` se genera localmente y no debe subirse al repositorio.
- Los iconos se incluyen en `icons/`.

## Estado
Proyecto en desarrollo.
