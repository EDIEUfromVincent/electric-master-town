#!/bin/bash
# 전기 마스터 타운 — src/ 조각을 한 파일로 묶는다.
#  ../전기마스터타운.html : 내려받아 바로 여는 완전한 HTML (오프라인 실행)
#  dist/artifact.html     : 게시용 (문서 뼈대 없이 내용만)
set -e
cd "$(dirname "$0")"
mkdir -p dist
JS_FILES="src/data.js src/engine.js src/gl3d.js src/world3d.js src/ui.js src/story.js src/lab.js src/crane3d.js src/rpg.js src/town_ev.js src/street.js src/mg_core.js src/mg_magnet.js src/mg_safety.js src/mg_ai.js src/mg3d.js src/mg3_magnet.js src/mg3_safety.js src/mg3_ai.js src/editor.js src/act.js src/account.js src/main.js"
{
  echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  cat src/head.html
  echo '</head><body>'
  cat src/body.html
  echo '<script>'
  cat $JS_FILES
  echo '</script></body></html>'
} > "../전기마스터타운.html"
{
  cat src/head.html
  cat src/body.html
  echo '<script>'
  cat $JS_FILES
  echo '</script>'
} > dist/artifact.html
cp "../전기마스터타운.html" ../index.html
echo "built: ../전기마스터타운.html ($(wc -c < ../전기마스터타운.html) bytes), dist/artifact.html"
