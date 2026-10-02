#!/usr/bin/env bash
# Ningún color ni tamaño fuera de los tokens y ningún outline-none en app/ y componentes/
# (guía visual A2 y A3). Los tokens generados (componentes/tokens/) son la única excepción.
set -u
patron='#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\(|hsla?\(|oklch\(|-\[[0-9.]+(px|rem|em)\]|-\[#|outline-none'
if grep -rnE "$patron" app componentes --include='*.ts' --include='*.tsx' --include='*.css' --exclude-dir=tokens; then
  echo "Hay colores, tamaños fijos u outline-none fuera de los tokens (líneas de arriba)." >&2
  exit 1
fi
echo "Estilos: solo tokens."
