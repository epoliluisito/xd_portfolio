#!/bin/sh
# Kakaja dev server. ES modules can't load from file://, so serve the folder.
cd "$(dirname "$0")" || exit 1
echo "Kakaja → http://localhost:8080  (ctrl-C to stop)"
python3 -m http.server 8080
