// Kopiert die gemeinsamen Dateien (Design, Media Bar, Verbindungsseite) aus dem Windows-Projekt,
// damit Windows und Linux immer exakt denselben Stand nutzen.
'use strict';
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'src', 'JellyDrax', 'Assets');
const dst = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['jellydrax.js', 'jellydrax.css', 'app.html']) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
  console.log('kopiert:', f);
}
