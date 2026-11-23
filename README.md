# JellyDrax

Jellyfin-Client für **Windows 11** (und Windows 10) und **Linux** (CachyOS/Arch, Pop!_OS/Ubuntu, Fedora u. a.) mit **eigenem Design**, **Themes** und einer
**Media Bar** auf der Startseite. Die App ist ein natives Fenster mit Microsoft Edge **WebView2** und lädt
das Web-Interface **direkt vom eigenen Jellyfin-Server** (`<server>/web/`). Darüber legt JellyDrax sein
eigenes Erscheinungsbild – unabhängig vom Branding-CSS des Servers.

Unter Linux läuft JellyDrax in Electron – dieselbe Chromium-Engine wie WebView2 unter Windows, daher
identisches Aussehen. Beide Versionen teilen sich `jellydrax.js`, `jellydrax.css` und die Verbindungsseite.

Entwickelt für **Jellyfin 12.4** (funktioniert auch mit 10.10/10.11).

## Was JellyDrax ändert – und was nicht

| | |
|---|---|
| **Design** | eigene Farben, Schrift, Eckenradius, Kopfleiste mit Glas-Effekt, Hintergrund ohne Medienbilder |
| **Server-CSS** | wird standardmäßig ignoriert (z. B. ElegantFin) – abschaltbar unter *Erweitert* |
| **Media Bar** | eigene Media Bar auf der Startseite (7 Stile, 8 Übergänge, Trailer im Hintergrund) |
| **Player** | Optik im Theme-Design, wahlweise kompakt, Medien-Buttons mittig (abschaltbar); abgespielt wird weiterhin mit dem Jellyfin-Player, Player-Plugins (z. B. Intro Skipper) funktionieren wie gewohnt |
| **Plugins** | JavaScript-Plugins des Servers laufen weiterhin; eine Media Bar eines Server-Plugins wird auf Wunsch ausgeblendet |

## JellyDrax-Einstellungen

Öffnen über das **Paletten-Symbol** in der Kopfleiste (neben der Suche), mit **Strg + ,** oder über das
Rechtsklick-Menü der Titelleiste. Alle Änderungen sind sofort sichtbar und werden in der App gespeichert.

- **Design** – 13 fertige Themes: Liquid Glass, Glass Noir, Glass Obsidian, **Cyberpunk 2077** (Gelb auf
  Schwarz, abgeschrägte Ecken, Scanlines, Glitch-Hover), Glass, JellyDrax, Midnight, AMOLED, Kino, Dracula,
  Ozean, Sonnenuntergang, Jellyfin Klassik; dazu **eigene Farben**, Hintergrund-Stil, **Struktur** (Körnung,
  Film-Körnung, Punktraster, Linien, Leinen, Scanlines, Raster, Vignette – Stärke per Regler), Eckenradius,
  Schriftart, Glas-Optik und die **Navigation als Pillen-Leiste** (Startseite, Favoriten, Bibliotheken).
  Die Windows-Titelleiste übernimmt die Theme-Farbe.
- **Media Bar**
  - 7 Stile: *Kino* (volle Breite, bis unter die Kopfleiste), *Karte* (Text unten links, Pillen-Pfeile unten
    rechts), *Bannern* (Banner mit angeschnittenen Nachbarn, Anzeige darunter), *Geteilt*, *Spotlight*
    (Text rechts), *Diagonal*, *Minimal* (deckend)
  - 8 Übergänge: Überblenden, Schieben, Hochschieben, Zoom, Unschärfe, Wischen, Diagonal wischen, Öffnen von
    der Mitte – jeweils kombinierbar mit der **Kamerafahrt (Ken Burns)**, die sich separat ein- und
    ausschalten lässt
  - Übergangsdauer per Regler (0,3–3 s), Text-Animationen, Indikator (Fortschrittsbalken, Punkte, Vorschaubilder, Zähler), Höhe, Anzeigedauer
  - Inhalt: zufällig, neu hinzugefügt, neueste Veröffentlichungen, am besten bewertet, ungesehen, Favoriten;
    Filme/Serien/Musikalben/Sammlungen; Anzahl
  - Logo statt Titel, Bewertung/Jahr/Laufzeit/FSK/Genres, Beschreibung
  - Buttons *Abspielen/Fortsetzen* (Serien: nächste Folge), *Mehr Infos*, *Favorit*
  - Trailer im Hintergrund (lokal oder zusätzlich YouTube), optional mit Ton
- **Bewertungen** – IMDb, Rotten Tomatoes, Metacritic (und Community ★) in der Media Bar und auf
  Film-/Serienseiten; jede Quelle schaltbar, Größe per Regler. IMDb/Metacritic über einen kostenlosen
  OMDb-Schlüssel (omdbapi.com), Ergebnisse werden 14 Tage zwischengespeichert.
- **Player** – Videoplayer im Theme-Design mit **kompakter Steuerleiste** (weniger Bildschirmfläche) und
  **mittig angeordneten Medien-Buttons** (Endzeit links, übrige Buttons rechts; bei zu wenig Platz automatisch
  wie bisher). Das Fenster des Plugins „In-Player Episode Preview“ erscheint als **Panel am rechten Rand**
  über der Steuerleiste im Design des Themes. Die Steuerung blendet sich nach 2 Sekunden aus (einstellbar:
  2, 3 oder 5 s). Nur Optik: Player-Plugins funktionieren unverändert.
- **Updates** (Windows) – Suche nach neuen Versionen und Update mit einem Klick (Installer im Hintergrund bzw.
  Austausch der EXE, SHA-256-geprüft), automatische Prüfung beim Start.
- **Animationen** – Hover über Poster/Medienfelder: *Elegant* (wie ElegantFin: feiner Rahmen wird weiß,
  leichter Zoom, Lichtstreifen über das Bild), Anheben, Bild-Zoom, Lichtreflex, **Glitch** (kurzer RGB-Versatz wie in Cyberpunk 2077), keine – mit Live-Vorschau. Seitenwechsel-Animation und
  Geschwindigkeit aller Animationen, Schalter „Animationen reduzieren“ (unabhängig von der Windows-Einstellung).
- **Startseite** – Genre-Rubriken (Action, Komödie, Science-Fiction …; gleiche Genres in verschiedenen
  Schreibweisen/Sprachen werden zusammengefasst), Scrollleiste ausblenden, Hintergrundbilder aus der Mediathek (Standard: aus), Banner auf Film-/Serienseiten
  (Farbverlauf oder Bild), Rubriken-Reihe zentrieren,
  Titel der ersten Rubrik („Meine Medien“) ausblenden, Plugin-Media-Bar ausblenden (inkl. des Platzes, den das Plugin auf der Startseite reserviert, und seiner Trailer).
- **Erweitert** – Server-CSS ignorieren, eigenes CSS, Einstellungen exportieren/importieren/zurücksetzen.

## Installation

**Installer:** `JellyDrax-Setup-2.10.0.exe` ausführen. Installiert pro Benutzer (keine Adminrechte) nach
`%LOCALAPPDATA%\Programs\JellyDrax`, legt einen **Startmenü-Eintrag** an (optional Desktop-Verknüpfung) und
erscheint unter *Einstellungen → Apps → Installierte Apps*. Eine vorhandene Installation von
„Jellyfin Desktop“ wird ersetzt – Server, Anmeldung und Fensterposition werden übernommen.
Stille Installation: `JellyDrax-Setup-2.10.0.exe /S`.

**Ohne Installation:** `JellyDrax.exe` direkt ausführen (kein .NET nötig).

```
JellyDrax.exe --server https://jellyfin.example.de   # direkt verbinden
JellyDrax.exe --reset                                # gespeicherten Server vergessen
```

**Portabler Modus:** leere Datei `portable.txt` neben die EXE legen → alle Daten landen in `.\data`.

## Updates (Windows)

*Einstellungen → Updates* (oder Rechtsklick auf die Titelleiste → „Nach Updates suchen …“) prüft das
neueste [Release](https://github.com/irondrax/jellydrax/releases) und installiert es nach Bestätigung.
Solange das Repository privat ist, braucht JellyDrax dafür einen GitHub-Token mit Lesezugriff
(„Fine-grained token“, Berechtigung *Contents: Read-only* für dieses Repository); er wird mit dem
Windows-Datenschutz (DPAPI) verschlüsselt gespeichert. Bei einem öffentlichen Repository ist kein Token nötig.

## Fenster (Windows)

Die Titelleiste ist standardmäßig ausgeblendet. Minimieren, Maximieren und Schließen sitzen rechts in der
Kopfleiste (im Player oben rechts). Verschieben über die freie Fläche der Kopfleiste, Doppelklick
maximiert, Rechtsklick öffnet das Fenstermenü (auch Alt+Leertaste). Schatten, abgerundete Ecken,
Größenänderung und Andocken bleiben erhalten. Zurück zur klassischen Titelleiste:
*Einstellungen → Erweitert → Titelleiste ausblenden* oder Fenstermenü → „Titelleiste ein-/ausblenden“.

## Tastenkürzel

Strg+, Design & Media Bar · F11 / Alt+Enter Vollbild · F5 neu laden · Strg+F5 ohne Cache ·
Strg+Umschalt+S Server wechseln · F12 Entwicklertools · Strg+Mausrad / Strg+0 Zoom

## Linux

Pakete für x86_64 liegen bei jedem [Release](https://github.com/irondrax/jellydrax/releases):

| Distribution | Datei | Installation |
|---|---|---|
| CachyOS / Arch | `JellyDrax-<version>-x64.pacman` | `sudo pacman -U JellyDrax-<version>-x64.pacman` |
| Pop!_OS / Ubuntu | `JellyDrax-<version>-amd64.deb` | `sudo apt install ./JellyDrax-<version>-amd64.deb` |
| Fedora | `JellyDrax-<version>-x86_64.rpm` | `sudo dnf install ./JellyDrax-<version>-x86_64.rpm` |
| alle | `JellyDrax-<version>-x86_64.AppImage` | `chmod +x` und starten |

- Danach im App-Menü unter **JellyDrax** (KDE Plasma, GNOME, COSMIC). Start im Terminal: `jellydrax`.
- **Pop!_OS/Ubuntu:** das `.deb` verwenden – es installiert das AppArmor-Profil, ohne das Electron-Apps
  ab Ubuntu 24.04 nicht starten (beim AppImage fehlt es).
- **Fedora + AppImage:** benötigt `sudo dnf install fuse-libs`.
- Menü mit **Alt** einblenden. Tastenkürzel wie unter Windows.
- Daten: `~/.config/JellyDrax`. Wayland wird automatisch genutzt, sonst X11. Medientasten/MPRIS funktionieren.
- Optionen: `jellydrax --server <url>`, `jellydrax --reset`, `jellydrax --enable-vaapi`
  (Hardware-Videodekodierung über VA-API, je nach Treiber).
- Unterschiede zu Windows: Die Fensterleiste gehört unter Linux der Desktop-Umgebung und übernimmt daher
  nicht die Theme-Farbe (sie ist dunkel); kein portabler Modus.

### Selbst bauen (Linux)

```
cd linux
npm ci
npm run dist        # AppImage, deb, rpm, pacman in linux/dist
npm start           # direkt starten (Entwicklung)
```

Für rpm/pacman werden `rpmbuild` und `bsdtar` benötigt (Ubuntu: `sudo apt install rpm libarchive-tools`).

## Codecs

Die Wiedergabe nutzt die Codecs von Microsoft Edge. H.264/AAC/VP9/AV1 laufen direkt;
**HEVC/H.265** direkt, wenn die GPU es kann und die *HEVC-Videoerweiterungen* installiert sind.
Alles andere transkodiert der Server automatisch.

Unter Linux (Electron/Chromium) laufen H.264/AAC/VP9/AV1/Opus direkt; HEVC/H.265 transkodiert der
Server, sofern nicht `--enable-vaapi` und ein passender VA-API-Treiber die Hardware-Dekodierung übernehmen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/JellyDrax/MainForm.cs` | Fenster, WebView2, Vollbild, Tastenkürzel, Einbindung des Designs, Filter für Server-CSS |
| `src/JellyDrax/Assets/jellydrax.js` | Themes, Media Bar, Einstellungsfenster (läuft im Web-Interface) |
| `src/JellyDrax/Assets/jellydrax.css` | Design, Hover-Effekte, Media-Bar-Stile und -Übergänge |
| `src/JellyDrax/Assets/app.html` | Verbindungs- und Fehlerseite |
| `installer/JellyDrax.nsi` | Installer (NSIS) |
| `linux/main.js` | Linux-App (Electron): Fenster, Tastenkürzel, Einbindung des Designs, Filter für Server-CSS |
| `linux/preload.js` | Brücke zwischen Seite und App (entspricht WebView2-Nachrichten unter Windows) |
| `linux/package.json` | Paketdefinition für AppImage, deb, rpm, pacman |

## Selbst bauen

```
dotnet publish src/JellyDrax -c Release -o dist
makensis -DVERSION=2.10.0 installer/JellyDrax.nsi
```

Benötigt das .NET 8 SDK und für den Installer [NSIS](https://nsis.sourceforge.io).
Der GitHub-Workflow in `.github/workflows/build.yml` baut Windows- und Linux-Pakete und legt bei
einer neuen Versionsnummer automatisch ein Release an. Es bleiben immer nur die **neuesten 3 Releases**
online; ältere werden samt Tag automatisch gelöscht. Damit alle Pakete im Release landen, müssen
`<Version>` in `src/JellyDrax/JellyDrax.csproj` und `version` in `linux/package.json` übereinstimmen.
