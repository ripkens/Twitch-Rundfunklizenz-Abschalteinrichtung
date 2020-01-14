# Twitch Rundfunklizenz Abschalteinrichtung

### Streaming Server der die Übertagung unterbricht sobald mehr als 499 Zuschauer den Stream schauen.

Das script startet einen RTMP Server und einen lokalen Stream mit einem Video (hier kann jedes MP4 file verwendet werden)

Wenn ein Stream mit dem konfigurierten Stream-Key and das Script übermittelt wird, wird dieser Stream nach 10 Sekunden automatisch an Twitch weitergeleitet.

Alle 10 Sekunden prüft das Script wieviele Zuschauer gerade den Kanal schauen.
Sollten es mehr als 499 Zuschauer sein, wird der Stream durch das Video ersetzt.
Der Stream wird wieder übertragen soabld die Zuschaueranzahl wieder unter 500 gefallen ist.

Verwendete freie Software:

https://github.com/illuspas/Node-Media-Server
https://johnvansickle.com/ffmpeg/


## Installation

- Installiere NodeJS
- Kopiere app.js in einen leeren Ordner

npm install node-media-server request fetch

## Konfiguration
Konfiguriere die Einstellungen in app.js

## Start
Starte den Server mit node app.js
