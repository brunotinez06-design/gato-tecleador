# Gato tecleador (overlay para jugar)

## Usar
1. Instalá Node.js (https://nodejs.org).
2. En esta carpeta: `npm install` y después `npm start`.

## Atajos (funcionan aunque estés dentro del juego)
- Ctrl+Shift+G  → modo mover (arrastrá el gato) / volver a bloquear
- Ctrl+Shift++  / Ctrl+Shift+-  → agrandar / achicar
- Ctrl+Shift+Q  → salir

## Notas
- El juego tiene que estar en modo "ventana sin bordes" (borderless); en pantalla completa exclusiva no se ven overlays.
- macOS: dar permiso en Ajustes > Privacidad > Accesibilidad y Monitoreo de entrada.
- Los clics atraviesan al gato, así que no molesta al jugar.
- La app solo anima las teclas; no guarda ni envía nada.
- Para generar un instalable/portable: `npm run dist`.
