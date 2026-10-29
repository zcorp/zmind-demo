#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="zmind-demo-dev"
CONTAINER_NAME="zmind-demo"
PORT=5173
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# ── Nettoyage initial ────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "→ Arrêt et suppression du conteneur..."
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
  echo "✓ Nettoyage terminé."
}

# Nettoyage au Ctrl+C ou à la fin du script
trap cleanup EXIT INT TERM

# ── Suppression d'un éventuel conteneur résiduel ────────────────────────────
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "→ Conteneur résiduel détecté, suppression..."
  docker rm -f "$CONTAINER_NAME"
fi

# ── Build de l'image ─────────────────────────────────────────────────────────
echo "→ Build de l'image Docker..."
docker build -f docker/Dockerfile -t "$IMAGE_NAME" .

# ── Démarrage du conteneur ───────────────────────────────────────────────────
echo "→ Démarrage du serveur de développement sur http://localhost:${PORT}"
echo " (Ctrl+C pour arrêter et nettoyer)"
echo ""
docker run \
  --name "$CONTAINER_NAME" \
  --rm \
  -p "${PORT}:${PORT}" \
  -v "$(pwd)/src:/app/src" \
  -v "$(pwd)/public:/app/public" \
  -v "$(pwd)/tests:/app/tests" \
  -v "$(pwd)/vite.config.ts:/app/vite.config.ts" \
  -v "$(pwd)/tsconfig.json:/app/tsconfig.json" \
  -v "$(pwd)/tsconfig.node.json:/app/tsconfig.node.json" \
  -v "$(pwd)/package.json:/app/package.json" \
  "$IMAGE_NAME"
