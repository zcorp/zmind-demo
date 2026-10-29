#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="zmind-demo-check"

cd "$PROJECT_DIR"

echo "→ Build de l’image de vérification..."
docker build -f docker/Dockerfile -t "$IMAGE_NAME" .

echo "→ Tests et build TypeScript + Vite dans le conteneur..."
docker run --rm \
  -v "$PROJECT_DIR/src:/app/src:ro" \
  -v "$PROJECT_DIR/public:/app/public:ro" \
  -v "$PROJECT_DIR/index.html:/app/index.html:ro" \
  "$IMAGE_NAME" \
  sh -c 'npm test -- --run && DEMO_BASE_PATH=./ npm run build:demo && grep -q "./assets/" dist/index.html && test "$(cat dist/CNAME)" = "www.zmind.fr" && if grep -R -q -E "Structure du projet ZMIND|Vision ZMIND|Architecture logicielle ZMIND|Choix techniques ZMIND|Écosystème ZMIND|Architecture hexagonale · parcours guidé|Apprendre Angular · parcours guidé" dist; then echo "Erreur : un modèle interne est présent dans le build public." >&2; exit 1; fi && test -f dist/brand/zmind-horizontal.jpg && test -f dist/brand/zmind-horizontal-dark.png && test -f dist/brand/zmind-icon.jpg && test -f dist/brand/zmind-mark-dark.png && test -f dist/brand/zmind-splash.jpg && test -f dist/manifest.webmanifest'

echo "✓ Vérifications Docker terminées."
