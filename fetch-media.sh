#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Завантажує згенеровані (higgsfield) фото до img/ai/ і переводить index.html
# на локальні шляхи замість CDN-посилань.
#
# Запуск (з кореня проєкту):   bash fetch-media.sh
#
# Навіщо: у hero, parallax-блоці та галереї зараз стоять прямі CDN-посилання.
# Вони працюють, але залежать від зовнішнього хосту. Цей скрипт робить сайт
# самодостатнім — після нього всі зображення лежать у репозиторії.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p img/ai

BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3GujPJNKIida1BxMVJksR2fpoVO"

declare -A MEDIA=(
  ["hero-patient.webp"]="hf_20260729_174116_62f48aee-0a8d-4ecb-a258-b540c72b5480_min.webp"
  ["clinic-interior.webp"]="hf_20260729_174119_2f225bd8-06df-4860-91f0-4704a15f43d5_min.webp"
  ["doctor-portrait.webp"]="hf_20260729_174121_1c0669ac-fafb-4f35-84d5-29144e40b2ec_min.webp"
  ["smile-closeup.webp"]="hf_20260729_174124_190d6050-b5b8-4c01-a339-a48103b954ef_min.webp"
)

echo "→ Завантаження зображень до img/ai/"
for local in "${!MEDIA[@]}"; do
  remote="${MEDIA[$local]}"
  if [ -s "img/ai/$local" ]; then
    echo "  ✓ img/ai/$local (вже є)"
    continue
  fi
  echo "  ↓ $local"
  curl -fsSL -o "img/ai/$local" "$BASE/$remote"
done

echo "→ Заміна CDN-посилань на локальні шляхи в index.html"
for local in "${!MEDIA[@]}"; do
  remote="${MEDIA[$local]}"
  # екрануємо слеші для sed
  sed -i.bak "s|$BASE/$remote|img/ai/$local|g" index.html
done
rm -f index.html.bak

echo
echo "Готово. Перевірте: grep -c cloudfront index.html  →  має бути 0"
