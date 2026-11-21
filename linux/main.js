// JellyDrax für Linux (Electron) – Gegenstück zu src/JellyDrax/MainForm.cs.
// Lädt das Web-Interface direkt vom Jellyfin-Server und legt jellydrax.js/.css darüber.
// Electron nutzt dieselbe Chromium-Engine wie WebView2 unter Windows, daher sehen Design,
// Media Bar und Animationen identisch aus.
'use strict';

const { app, BrowserWindow, Menu, ipcMain, nativeTheme, net, screen, session, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ---------------------------------------------------------------- Startoptionen

const args = process.argv.slice(app.isPackaged ? 1 : 2);
const argValue = (name) => { const i = args.indexOf(name); return i >= 0 && i + 1 < args.length ? args[i + 1] : null; };
const startServer = argValue('--server');
const resetServer = args.includes('--reset');

app.setName('JellyDrax');
// "Nächste Folge" & Trailer dürfen ohne Klick starten (wie unter Windows)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Wayland nutzen, wo vorhanden (KDE Plasma, GNOME, COSMIC), sonst X11; Fensterrahmen unter GNOME/Wayland
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
const features = ['WaylandWindowDecorations'];
// Hardware-Videodekodierung per VA-API nur auf Wunsch (--enable-vaapi): je nach Treiber unterschiedlich stabil
if (args.includes('--enable-vaapi')) features.push('VaapiVideoDecoder', 'VaapiVideoDecodeLinuxGL', 'VaapiIgnoreDriverChecks');
app.commandLine.appendSwitch('enable-features', features.join(','));

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// ---------------------------------------------------------------- Einstellungen
// Gleiches Format wie unter Windows (settings.json), gespeichert in ~/.config/JellyDrax

const DATA_DIR = app.getPath('userData');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function loadSettings() {
  try {
    return Object.assign(defaultSettings(), JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
  } catch {
    return defaultSettings();
  }
}
function defaultSettings() {
  return { ServerUrl: null, RecentServers: [], TrustedCertificateHosts: [], WindowBounds: null, Maximized: false, Zoom: 1, Client: null };
}
let saveTimer = null;
function saveSettings(now) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error('[JellyDrax] Einstellungen nicht gespeichert:', e.message);
    }
  };
  if (now) write(); else saveTimer = setTimeout(write, 300);
}

const settings = loadSettings();
if (resetServer) { settings.ServerUrl = null; saveSettings(true); }

const isTrusted = (host) => settings.TrustedCertificateHosts.some((h) => h.toLowerCase() === String(host).toLowerCase());
function trust(host) { if (!isTrusted(host)) settings.TrustedCertificateHosts.push(host); }
function addRecent(url) {
  settings.RecentServers = [url, ...settings.RecentServers.filter((s) => s.toLowerCase() !== url.toLowerCase())].slice(0, 8);
}
const ignoreServerCss = () => !(settings.Client && settings.Client.ignoreServerCss === false);

// ---------------------------------------------------------------- Ressourcen

const ASSETS = path.join(__dirname, 'assets');
const readAsset = (name) => fs.readFileSync(path.join(ASSETS, name), 'utf8');
const PAGE_TEMPLATE = readAsset('app.html');
const CLIENT_JS = readAsset('jellydrax.js');
const CLIENT_CSS = readAsset('jellydrax.css');

// Entfernt das Branding-CSS des Servers aus /Branding/Configuration bzw. /Branding/Css
// (unter Windows erledigt das MainForm.cs über WebResourceRequested).
const BRANDING_FILTER = `(function () {
  var rx = /\\/Branding\\/(Configuration|Css)/i;
  function strip(url, text) {
    if (/\\/Branding\\/Css/i.test(url)) return '';
    try { var j = JSON.parse(text); if (j && typeof j === 'object') { j.CustomCss = ''; return JSON.stringify(j); } } catch (e) {}
    return text;
  }
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (rx.test(String(url))) {
      var xhr = this, u = String(url);
      ['responseText', 'response'].forEach(function (prop) {
        var d = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, prop);
        Object.defineProperty(xhr, prop, { configurable: true, get: function () {
          var v = d.get.call(xhr);
          return typeof v === 'string' ? strip(u, v) : (v && typeof v === 'object' && prop === 'response' ? JSON.parse(strip(u, JSON.stringify(v))) : v);
        } });
      });
    }
    return open.apply(this, arguments);
  };
  var f = window.fetch;
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    var p = f.apply(this, arguments);
    if (!rx.test(u)) return p;
    return p.then(function (r) {
      return r.clone().text().then(function (t) { return new Response(strip(u, t), { status: r.status, statusText: r.statusText, headers: r.headers }); });
    });
  };
})();`;

function buildBootstrap() {
  return (ignoreServerCss() ? BRANDING_FILTER + '\n' : '') +
    'window.__JDX_VERSION__=' + JSON.stringify(app.getVersion()) + ';' +
    'window.__JDX_CSS__=' + JSON.stringify(CLIENT_CSS) + ';' +
    'window.__JDX_SETTINGS__=' + JSON.stringify(settings.Client || null) + ';\n' + CLIENT_JS;
}

// ---------------------------------------------------------------- Serverprüfung

function candidates(input) {
  input = String(input || '').trim();
  if (!input) return [];
  const hasScheme = input.includes('://');
  const raw = hasScheme ? input : 'http://' + input;
  let uri;
  try { uri = new URL(raw); } catch { return []; }
  if (uri.protocol !== 'http:' && uri.protocol !== 'https:') return [];
  const p = uri.pathname.replace(/\/web(\/.*)?$/i, '').replace(/\/+$/, '');
  const authority = raw.slice(raw.indexOf('://') + 3).split(/[/?#]/)[0];
  const hasPort = /:\d+$/.test(authority);
  const host = uri.hostname.includes(':') && !uri.hostname.startsWith('[') ? `[${uri.hostname}]` : uri.hostname;
  const port = hasPort ? ':' + (uri.port || (uri.protocol === 'https:' ? 443 : 80)) : '';
  const scheme = uri.protocol.slice(0, -1);
  const list = [];
  if (hasScheme) {
    list.push(`${scheme}://${host}${port}${p}`);
    if (!hasPort && scheme === 'http') list.push(`http://${host}:8096${p}`);
  } else if (hasPort) {
    list.push(`http://${host}${port}${p}`, `https://${host}${port}${p}`);
  } else {
    list.push(`http://${host}:8096${p}`, `https://${host}${p}`, `http://${host}${p}`);
  }
  return [...new Set(list)];
}

function getJson(url, insecure, timeoutMs) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { rejectUnauthorized: !insecure, timeout: timeoutMs, headers: { Accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(new Error('Antwort zu groß')); });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(Object.assign(new Error(`HTTP ${res.statusCode}`), { status: res.statusCode }));
        try { resolve(JSON.parse(body)); } catch { reject(Object.assign(new Error('Keine JSON-Antwort'), { json: true })); }
      });
    });
    req.on('timeout', () => req.destroy(Object.assign(new Error('Zeitüberschreitung'), { timeout: true })));
    req.on('error', reject);
  });
}

async function probeServer(input, insecure) {
  const list = candidates(input);
  if (!list.length) return { error: 'Ungültige Adresse. Beispiel: 192.168.1.10:8096 oder https://jellyfin.example.de' };
  let last = null;
  for (const base of list) {
    try {
      const info = await getJson(base + '/System/Info/Public', insecure, 6000);
      if (!info || !info.Version) { last = `${base} antwortet, ist aber kein Jellyfin-Server.`; continue; }
      return { info: { baseUrl: base, name: info.ServerName || 'Jellyfin', version: info.Version } };
    } catch (e) {
      if (/certificate|self.signed|CERT_|unable to verify/i.test(String(e.code || '') + e.message)) {
        last = `Das TLS-Zertifikat von ${base} ist nicht vertrauenswürdig. Bei einem selbstsignierten Zertifikat die Option "Zertifikat akzeptieren" aktivieren.`;
      } else if (e.timeout) last = `Zeitüberschreitung bei ${base}.`;
      else if (e.json) last = `${base} antwortet, ist aber kein Jellyfin-Server.`;
      else if (e.status) last = `${base} antwortet mit HTTP ${e.status}.`;
      else last = `Keine Verbindung zu ${base}: ${e.message}`;
    }
  }
  return { error: last };
}

// ---------------------------------------------------------------- Fenster

let win = null;
let onLocalPage = false;

const serverOrigin = () => { try { return new URL(settings.ServerUrl).origin; } catch { return null; } };
const isServerUrl = (url) => { try { return !!settings.ServerUrl && new URL(url).origin === serverOrigin(); } catch { return false; } };

function restoreBounds() {
  const b = settings.WindowBounds;
  if (Array.isArray(b) && b.length === 4 && b[2] >= 640 && b[3] >= 400) {
    const rect = { x: b[0], y: b[1], width: b[2], height: b[3] };
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return rect.x < a.x + a.width && rect.x + rect.width > a.x && rect.y < a.y + a.height && rect.y + rect.height > a.y;
    });
    if (visible) return rect;
    return { width: rect.width, height: rect.height };
  }
  return { width: 1280, height: 800 };
}

function createWindow() {
  nativeTheme.themeSource = 'dark';
  win = new BrowserWindow({
    ...restoreBounds(),
    minWidth: 640,
    minHeight: 400,
    title: 'JellyDrax',
    backgroundColor: '#0d0b14',
    icon: path.join(__dirname, 'build', 'icons', '512x512.png'),
    autoHideMenuBar: true, // Menü mit der Alt-Taste einblenden
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (settings.Maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  const wc = win.webContents;
  wc.setZoomFactor(Math.min(5, Math.max(0.25, Number(settings.Zoom) || 1)));

  wc.on('did-start-navigation', (e) => {
    if (e.isMainFrame && !e.isSameDocument) onLocalPage = e.url.startsWith('data:');
  });
  wc.on('page-title-updated', (e, title) => {
    e.preventDefault();
    const t = (title || '').trim();
    win.setTitle(onLocalPage || !t || t === 'Jellyfin' ? 'JellyDrax' : `${t} – JellyDrax`);
  });
  wc.on('did-fail-load', (_e, code, description, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* ABORTED */ || onLocalPage) return;
    const cert = code <= -200 && code > -300;
    let certHost = null;
    if (cert) { try { certHost = new URL(url).hostname; } catch { /* ignorieren */ } }
    // einen Takt später: Chromium zeigt direkt nach dem Fehler seine eigene Fehlerseite an,
    // die sonst unsere Seite wieder verdrängen würde
    setTimeout(() => showPage({ mode: 'error', server: settings.ServerUrl, message: describeError(code), status: description, certHost }), 0);
  });
  wc.setWindowOpenHandler(({ url }) => {
    if (isServerUrl(url)) return { action: 'allow' };
    if (/^(https?|mailto):/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('zoom-changed', () => { settings.Zoom = wc.getZoomFactor(); saveSettings(); });
  wc.on('before-input-event', onKey);

  win.on('close', () => {
    const fullscreen = win.isFullScreen();
    if (!fullscreen) {
      settings.Maximized = win.isMaximized();
      const b = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
      settings.WindowBounds = [b.x, b.y, b.width, b.height];
    }
    settings.Zoom = wc.getZoomFactor();
    saveSettings(true);
  });

  buildMenu();

  if (startServer) showConnectPage(startServer, true);
  else if (settings.ServerUrl) goToServer();
  else showConnectPage();
}

function describeError(code) {
  if (code === -105 || code === -137) return 'Der Servername konnte nicht aufgelöst werden (DNS).';
  if (code === -102 || code === -109 || code === -104) return 'Der Server ist nicht erreichbar. Läuft Jellyfin und ist der Rechner im Netzwerk?';
  if (code === -118 || code === -7) return 'Zeitüberschreitung beim Verbinden mit dem Server.';
  if (code === -101 || code === -100 || code === -106 || code === -21) return 'Die Verbindung wurde unterbrochen.';
  if (code <= -200 && code > -300) return 'Das TLS-Zertifikat des Servers ist ungültig oder selbstsigniert.';
  return 'Die Seite konnte nicht geladen werden.';
}

// loadURL lehnt ab, wenn ein Ladevorgang abgebrochen wird oder fehlschlägt – das behandelt did-fail-load
function load(url) { win.loadURL(url).catch(() => {}); }

function goToServer() {
  if (!settings.ServerUrl) return showConnectPage();
  load(settings.ServerUrl.replace(/\/+$/, '') + '/web/');
}

function showPage(state) {
  // JSON wird für <script> maskiert (wie System.Text.Json unter Windows)
  const json = JSON.stringify(state).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const html = PAGE_TEMPLATE.replace('/*__STATE__*/', 'window.__STATE__ = ' + json + ';');
  onLocalPage = true;
  load('data:text/html;charset=utf-8;base64,' + Buffer.from(html, 'utf8').toString('base64'));
}

function showConnectPage(prefill, autoConnect, error) {
  showPage({
    mode: 'connect',
    server: prefill || settings.ServerUrl || '',
    recent: settings.RecentServers,
    autoConnect: !!autoConnect,
    error: error || null,
    canGoBack: !!settings.ServerUrl,
  });
}

function send(msg) { if (win && !win.isDestroyed()) win.webContents.send('jdx-msg', msg); }

function toggleClientSettings() {
  if (!onLocalPage) win.webContents.executeJavaScript('window.JellyDrax && window.JellyDrax.toggleSettings()').catch(() => {});
}

async function hardReload(clearCache) {
  if (clearCache) await session.defaultSession.clearStorageData({ storages: ['cachestorage', 'serviceworkers'] }).catch(() => {});
  if (clearCache) await session.defaultSession.clearCache();
  if (onLocalPage) goToServer(); else win.webContents.reloadIgnoringCache();
}

function toggleFullscreen() { win.setFullScreen(!win.isFullScreen()); }

function onKey(event, input) {
  if (input.type !== 'keyDown') return;
  const ctrl = input.control || input.meta;
  const key = input.key;
  const handled = () => event.preventDefault();
  if (key === 'F11' || (input.alt && key === 'Enter')) { handled(); toggleFullscreen(); }
  else if (key === 'F5' && ctrl) { handled(); hardReload(false); }
  else if (key === 'F5') { handled(); if (onLocalPage) goToServer(); else win.webContents.reload(); }
  else if (ctrl && input.shift && (key === 'S' || key === 's')) { handled(); showConnectPage(); }
  else if (ctrl && !input.shift && key === ',') { handled(); toggleClientSettings(); }
  else if (key === 'F12' || (ctrl && input.shift && (key === 'I' || key === 'i'))) { handled(); win.webContents.toggleDevTools(); }
  else if (key === 'Escape' && win.isFullScreen()) {
    // Esc beendet das Fenster-Vollbild (Video-Vollbild beendet Chromium selbst)
    win.webContents.executeJavaScript('!!document.fullscreenElement || !!document.getElementById("jdx-settings")').then((busy) => {
      if (!busy && win.isFullScreen()) win.setFullScreen(false);
    }).catch(() => {});
  }
}

function showAbout() {
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'Über JellyDrax',
    message: `JellyDrax ${app.getVersion()}`,
    detail: `Electron ${process.versions.electron} · Chromium ${process.versions.chrome}\n` +
      `Server: ${settings.ServerUrl || '–'}\nDaten: ${DATA_DIR}\n\n` +
      'Strg+, Design & Media Bar · F11 Vollbild · F5 Neu laden · Strg+F5 ohne Cache\n' +
      'Strg+Umschalt+S Server wechseln · F12 Entwicklertools · Strg+Mausrad Zoom\n' +
      'Alt blendet das Menü ein.',
  });
}

function buildMenu() {
  // Kürzel werden in onKey behandelt; im Menü nur angezeigt (registerAccelerator: false)
  const item = (label, accelerator, click) => ({ label, accelerator, registerAccelerator: false, click });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'JellyDrax',
      submenu: [
        item('Design && Media Bar …', 'Ctrl+,', toggleClientSettings),
        item('Server wechseln …', 'Ctrl+Shift+S', () => showConnectPage()),
        { type: 'separator' },
        item('Neu laden', 'F5', () => (onLocalPage ? goToServer() : win.webContents.reload())),
        item('Cache leeren und neu laden', null, () => hardReload(true)),
        { type: 'separator' },
        item('Vollbild', 'F11', toggleFullscreen),
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { role: 'resetZoom', label: 'Originalgröße' },
        { type: 'separator' },
        item('Entwicklertools', 'F12', () => win.webContents.toggleDevTools()),
        item('Über JellyDrax', null, showAbout),
        { type: 'separator' },
        { role: 'quit', label: 'Beenden' },
      ],
    },
  ]));
}

// ---------------------------------------------------------------- Nachrichten der Seiten

ipcMain.on('jdx-bootstrap', (e) => {
  // Design nur in Webseiten (http/https), nie in der lokalen Verbindungsseite
  const url = e.senderFrame ? e.senderFrame.url : '';
  e.returnValue = /^https?:/i.test(url) ? buildBootstrap() : '';
});

ipcMain.on('jdx-post', async (e, msg) => {
  if (!win || e.sender !== win.webContents || !e.senderFrame || e.senderFrame !== win.webContents.mainFrame) return;
  if (!msg || typeof msg !== 'object') return;
  const url = e.senderFrame.url;

  // JellyDrax-Nachrichten aus dem Web-Interface des eigenen Servers
  if (!url.startsWith('data:')) {
    if (!isServerUrl(url)) return;
    if (msg.jdx === 'save' && msg.settings && typeof msg.settings === 'object') { settings.Client = msg.settings; saveSettings(); }
    else if (msg.jdx === 'chrome' && /^#[0-9a-f]{6}$/i.test(msg.caption || '')) win.setBackgroundColor(msg.caption);
    else if (msg.jdx === 'fetch') proxyFetch(msg.id, msg.url);
    return;
  }

  // Verbindungs-/Fehlerseite
  switch (msg.type) {
    case 'connect': {
      const insecure = !!msg.insecure;
      const res = await probeServer(msg.url, insecure);
      if (!onLocalPage) return;
      if (!res.info) return send({ type: 'connectResult', ok: false, error: res.error });
      if (insecure) trust(new URL(res.info.baseUrl).hostname);
      settings.ServerUrl = res.info.baseUrl;
      addRecent(res.info.baseUrl);
      saveSettings(true);
      send({ type: 'connectResult', ok: true, name: res.info.name, version: res.info.version, url: res.info.baseUrl });
      setTimeout(goToServer, 400);
      break;
    }
    case 'retry': goToServer(); break;
    case 'changeServer': showConnectPage(); break;
    case 'trustCert':
      if (msg.host) { trust(String(msg.host)); saveSettings(true); }
      goToServer();
      break;
    case 'removeRecent':
      settings.RecentServers = settings.RecentServers.filter((r) => r.toLowerCase() !== String(msg.url).toLowerCase());
      saveSettings();
      break;
  }
});

// Bewertungen über die OMDb-API – aus Sicherheitsgründen ausschließlich https://www.omdbapi.com
async function proxyFetch(id, url) {
  if (!id) return;
  let u;
  try { u = new URL(url); } catch { u = null; }
  if (!u || u.protocol !== 'https:' || !/^(www\.)?omdbapi\.com$/i.test(u.hostname)) {
    return send({ jdx: 'fetchResult', id, ok: false, error: 'Adresse nicht erlaubt' });
  }
  try {
    const r = await net.fetch(u.toString(), { signal: AbortSignal.timeout(15000) });
    const body = await r.text();
    send({ jdx: 'fetchResult', id, ok: r.ok || r.status === 401, status: r.status, body });
  } catch (e) {
    send({ jdx: 'fetchResult', id, ok: false, error: e.message });
  }
}

// selbstsignierte Zertifikate nur für bestätigte Hosts
app.on('certificate-error', (event, _wc, url, _error, _cert, callback) => {
  let host = null;
  try { host = new URL(url).hostname; } catch { /* ignorieren */ }
  if (host && isTrusted(host)) { event.preventDefault(); callback(true); } else callback(false);
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// für Tests
module.exports = { candidates };
