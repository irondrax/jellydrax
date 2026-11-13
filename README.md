# JellyDrax

Jellyfin-Client für **Windows 11** (und Windows 10) mit **eigenem Design**, **Themes** und einer
**Media Bar** auf der Startseite. Die App ist ein natives Fenster mit Microsoft Edge **WebView2** und lädt
das Web-Interface **direkt vom eigenen Jellyfin-Server** (`<server>/web/`). Darüber legt JellyDrax sein
eigenes Erscheinungsbild – unabhängig vom Branding-CSS des Servers.

Entwickelt für **Jellyfin 12.4** (funktioniert auch mit 10.10/10.11).

## Was JellyDrax ändert – und was nicht

| | |
|---|---|
| **Design** | eigene Farben, Schrift, Eckenradius, Kopfleiste mit Glas-Effekt, Hintergrund ohne Medienbilder |
| **Server-CSS** | wird standardmäßig ignoriert (z. B. ElegantFin) – abschaltbar unter *Erweitert* |
| **Media Bar** | eigene Media Bar auf der Startseite (6 Stile, 8 Übergänge, Trailer im Hintergrund) |
| **Player** | **unverändert** – abgespielt wird immer mit dem Jellyfin-Player, Player-Plugins (z. B. Intro Skipper) funktionieren wie gewohnt |
| **Plugins** | JavaScript-Plugins des Servers laufen weiterhin; eine Media Bar eines Server-Plugins wird auf Wunsch ausgeblendet |

## JellyDrax-Einstellungen

Öffnen über das **Paletten-Symbol** in der Kopfleiste, mit **Strg + ,** oder über das Rechtsklick-Menü der
Titelleiste. Alle Änderungen sind sofort sichtbar und werden in der App gespeichert.

- **Design** – 13 fertige Themes (JellyDrax, Midnight, AMOLED, Kino, Nord, Dracula, Ozean, Smaragd,
  Sonnenuntergang, Rosé, Royal Gold, Graphit, Jellyfin Klassik), dazu **eigene Farben** für Akzent,
  zweiten Akzent, Hintergrund, Flächen, Bedienelemente und Text. Hintergrund-Stil (Farbschein, Verlauf, einfarbig),
  Eckenradius, Schriftart, Glas-Effekt.
- **Media Bar**
  - Stile: *Kino* (volle Breite, bis unter die Kopfleiste), *Zentriert*, *Karte* (Glas-Infofeld),
    *Geteilt* (Text links, Bild rechts), *Poster*, *Kompakt*
  - Übergänge: Überblenden, Ken Burns, Schieben, Zoom, Unschärfe, Wischen, Kreis-Enthüllung, 3D-Würfel
  - Text-Animationen, Indikator (Fortschrittsbalken, Punkte, Vorschaubilder, Zähler), Höhe, Anzeigedauer
  - Inhalt: zufällig, neu hinzugefügt, neueste Veröffentlichungen, am besten bewertet, ungesehen, Favoriten;
    Filme/Serien/Musikalben/Sammlungen; Anzahl
  - Logo statt Titel, Bewertung/Jahr/Laufzeit/FSK/Genres, Beschreibung
  - Buttons *Abspielen/Fortsetzen* (Serien: nächste Folge), *Mehr Infos*, *Favorit*
  - Trailer im Hintergrund (lokal oder zusätzlich YouTube), optional mit Ton
- **Animationen** – Hover über Poster/Medienfelder: *Elegant* (wie ElegantFin), Anheben, Bild-Zoom,
  Leuchten, 3D-Kippen, Lichtreflex, keine – mit Live-Vorschau. Seitenwechsel-Animation und
  Geschwindigkeit aller Animationen.
- **Startseite** – Hintergrundbilder aus der Mediathek (Standard: aus), Rubriken-Reihe zentrieren,
  Titel der ersten Rubrik („Meine Medien“) ausblenden, Plugin-Media-Bar ausblenden.
- **Erweitert** – Server-CSS ignorieren, eigenes CSS, Einstellungen exportieren/importieren/zurücksetzen.

## Installation

**Installer:** `JellyDrax-Setup-2.0.0.exe` ausführen. Installiert pro Benutzer (keine Adminrechte) nach
`%LOCALAPPDATA%\Programs\JellyDrax`, legt einen **Startmenü-Eintrag** an (optional Desktop-Verknüpfung) und
erscheint unter *Einstellungen → Apps → Installierte Apps*. Eine vorhandene Installation von
„Jellyfin Desktop“ wird ersetzt – Server, Anmeldung und Fensterposition werden übernommen.
Stille Installation: `JellyDrax-Setup-2.0.0.exe /S`.

**Ohne Installation:** `JellyDrax.exe` direkt ausführen (kein .NET nötig).

```
JellyDrax.exe --server https://jellyfin.example.de   # direkt verbinden
JellyDrax.exe --reset                                # gespeicherten Server vergessen
```

**Portabler Modus:** leere Datei `portable.txt` neben die EXE legen → alle Daten landen in `.\data`.

## Tastenkürzel

Strg+, Design & Media Bar · F11 / Alt+Enter Vollbild · F5 neu laden · Strg+F5 ohne Cache ·
Strg+Umschalt+S Server wechseln · F12 Entwicklertools · Strg+Mausrad / Strg+0 Zoom

## Codecs

Die Wiedergabe nutzt die Codecs von Microsoft Edge. H.264/AAC/VP9/AV1 laufen direkt;
**HEVC/H.265** direkt, wenn die GPU es kann und die *HEVC-Videoerweiterungen* installiert sind.
Alles andere transkodiert der Server automatisch.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/JellyDrax/MainForm.cs` | Fenster, WebView2, Vollbild, Tastenkürzel, Einbindung des Designs, Filter für Server-CSS |
| `src/JellyDrax/Assets/jellydrax.js` | Themes, Media Bar, Einstellungsfenster (läuft im Web-Interface) |
| `src/JellyDrax/Assets/jellydrax.css` | Design, Hover-Effekte, Media-Bar-Stile und -Übergänge |
| `src/JellyDrax/Assets/app.html` | Verbindungs- und Fehlerseite |
| `installer/JellyDrax.nsi` | Installer (NSIS) |

## Selbst bauen

```
dotnet publish src/JellyDrax -c Release -o dist
makensis -DVERSION=2.0.0 installer/JellyDrax.nsi
```

Benötigt das .NET 8 SDK und für den Installer [NSIS](https://nsis.sourceforge.io).
Der GitHub-Workflow in `.github/workflows/build.yml` baut beides.
