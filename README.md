# Netflix Household Bypass

Esta herramienta está diseñada para simplificar la experiencia de streaming, evitando interrupciones innecesarias en el proceso de verificación de hogar. Con un sistema de gestión activo, ofrece.

## 📦 ¿Qué incluye?
- Toggle visual con persistencia del estado.
- `background.js` para inyección y sincronización.
- `content.js` como capa de apoyo sobre la interfaz.
- `rules.json` para reglas DNR compatibles con Edge y Chrome.
- Iconos y assets listos para empaquetado.

## 💻 Instalación local
1. Descarga el repositorio y descomprime la carpeta
2. Abre `chrome://extensions` o `edge://extensions`.
3. Activa `Modo de desarrollador`.
4. Haz clic en `Cargar descomprimida`.
5. Selecciona la carpeta del proyecto.

## 📂 Estructura
- `manifest.json` - permisos y configuración principal.
- `background.js` - lógica de fondo y sincronización.
- `content.js` - automatización sobre la página.
- `popup.html` / `popup.js` - interfaz del popup.
- `rules.json` - reglas de bloqueo de red.
- `icons/` - iconos de la extensión.

## 📝 Notas
- El proyecto está pensado para mantenerse simple y fácil de revisar.
---
Desarrollado con ❤️ por **AckorEXE**
