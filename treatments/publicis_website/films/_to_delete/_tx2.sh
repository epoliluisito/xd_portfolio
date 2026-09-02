#!/bin/bash
cd "$(dirname "$0")"
enc(){ ffmpeg -y -v error -i "$1" -c:v libx264 -preset veryfast -crf 24 -maxrate 3200k -bufsize 6400k -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -c:a aac -b:a 96k -ac 2 "$2" && echo "DONE $2"; }
enc "Get_Unnoticed_Route_01.mp4" "get-unnoticed-r1-web.mp4"
enc "Get_Unnoticed_Route_02.mp4.mp4" "get-unnoticed-r2-web.mp4"
enc "Twilio_UK.mp4" "twilio-uk-web.mp4"
enc "TWILIO_FR.mp4" "twilio-fr-web.mp4"
echo ALLDONE
