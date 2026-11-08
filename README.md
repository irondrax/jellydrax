# Jellyfin Desktop (WebView2)

Schlanker Jellyfin-Client für **Windows 11** (und Windows 10). Die App ist ein natives Fenster mit
Microsoft Edge **WebView2** und lädt das Web-Interface **direkt vom eigenen Jellyfin-Server**
(`<server>/web/`). Dadurch funktioniert alles, was der Server ausliefert, genau wie im Browser:

- **Alle Plugins mit Web-Anteil** – z. B. JavaScript Injector, Intro Skipper, Custom Tabs,
  Jellyfin Enhanced, Media Bar, SSO-Login (Weiterleitungen zum Identity-Provider bleiben im Fenster).
- **Server-CSS / Themes** – das unter *Dashboard → Allgemein → Branding* hinterlegte Custom CSS
  (inkl. `@import` von Themes wie ElegantFin, Ultrachromic …) wird vom Web-Client selbst geladen.
- **Unabhängig von der Server-Version** – da der Server sein eigenes Web-Interface liefert,
  passt der Client automatisch zu jeder Jellyfin-10.x-Version (getestet wird das Web-UI beim Server).

## Funktionen

| | |
|---|---|
| Verbindungsdialog | Adresse mit/ohne Port, `http`/`https`, Unterpfad hinter Reverse Proxy; prüft `/System/Info/Public` |
| Anmeldung bleibt erhalten | eigenes WebView2-Profil unter `%LOCALAPPDATA%\JellyfinDesktop` |
| Vollbild | Video-Vollbild = echtes Fenster-Vollbild; **F11** / **Alt+Enter**, **Esc** beendet |
| Autoplay | „Nächste Folge“ startet ohne Klick |
| Externe Links | IMDb/TMDB/Trailer öffnen im Standardbrowser |
| Selbstsignierte Zertifikate | pro Host bestätigbar |
| Offline-Seite | automatische Wiederholung alle 15 s (z. B. während Server-Neustart) |
| Fenster | Position/Größe/Zoom werden gespeichert, dunkle Titelleiste |

**Tastenkürzel:** F5 neu laden · Strg+F5 ohne Cache · Strg+Umschalt+S Server wechseln ·
F11 Vollbild · F12 Entwicklertools · Strg+Mausrad / Strg+0 Zoom.
Weitere Befehle (u. a. *Cache leeren*) im **Rechtsklick-Menü der Titelleiste**.

## Installation

**Installer:** `JellyfinDesktop-Setup-1.0.0.exe` ausführen. Installiert pro Benutzer (keine Adminrechte)
nach `%LOCALAPPDATA%\Programs\Jellyfin Desktop`, legt einen **Startmenü-Eintrag** an (optional auch
eine Desktop-Verknüpfung) und erscheint unter *Einstellungen → Apps → Installierte Apps* zum Deinstallieren.
Beim Deinstallieren wird gefragt, ob Anmeldung/Einstellungen ebenfalls gelöscht werden sollen.
Stille Installation: `JellyfinDesktop-Setup-1.0.0.exe /S`.

**Ohne Installation:** `JellyfinDesktop.exe` direkt ausführen – kein .NET nötig (self-contained).
Die WebView2 Runtime ist in Windows 11 vorinstalliert.

```
JellyfinDesktop.exe --server https://jellyfin.example.de   # direkt verbinden
JellyfinDesktop.exe --reset                                # gespeicherten Server vergessen
```

**Portabler Modus:** eine leere Datei `portable.txt` neben die EXE legen → alle Daten landen in `.\data`.

## Codecs

Die Wiedergabe nutzt die Codecs von Microsoft Edge. H.264/AAC/VP9/AV1 laufen direkt;
**HEVC/H.265** wird direkt abgespielt, wenn die GPU es kann und die *HEVC-Videoerweiterungen*
aus dem Microsoft Store installiert sind. Alles andere transkodiert der Server automatisch –
der Jellyfin-Web-Client erkennt die Fähigkeiten selbst.

## Selbst bauen

```
dotnet publish src/JellyfinDesktop -c Release -o dist
```

Benötigt das .NET 8 SDK (unter Windows oder per `EnableWindowsTargeting` auch unter Linux/macOS).
Ergebnis: `dist/JellyfinDesktop.exe` (Windows x64, eine Datei).
Installer danach mit [NSIS](https://nsis.sourceforge.io): `makensis -DVERSION=1.0.0 installer/JellyfinDesktop.nsi`
→ `dist/JellyfinDesktop-Setup-1.0.0.exe`. Der GitHub-Workflow in
`.github/workflows/build.yml` baut die EXE ebenfalls.
