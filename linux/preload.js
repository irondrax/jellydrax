// Brücke zwischen Seite und JellyDrax-App (entspricht window.chrome.webview unter Windows).
// Läuft isoliert (contextIsolation); die Seite sieht nur window.jdxHost.
'use strict';

const { contextBridge, ipcRenderer, webFrame } = require('electron');

const listeners = new Set();
ipcRenderer.on('jdx-msg', (_e, data) => {
  for (const fn of listeners) {
    try { fn({ data }); } catch (err) { console.error(err); }
  }
});

contextBridge.exposeInMainWorld('jdxHost', {
  postMessage: (msg) => ipcRenderer.send('jdx-post', msg),
  addEventListener: (type, fn) => { if (type === 'message' && typeof fn === 'function') listeners.add(fn); },
  removeEventListener: (type, fn) => { listeners.delete(fn); },
});

// JellyDrax-Design so früh wie möglich in die Seite einfügen (vor Jellyfins eigenen Skripten),
// wie AddScriptToExecuteOnDocumentCreated unter Windows. Ausführung im Hauptkontext der Seite,
// ohne eval() – funktioniert daher auch mit einer Content-Security-Policy des Servers.
const code = ipcRenderer.sendSync('jdx-bootstrap');
if (code) {
  try {
    // eslint-disable-next-line no-new-func
    contextBridge.executeInMainWorld({ func: new Function(code) });
  } catch (err) {
    webFrame.executeJavaScript(code).catch((e) => console.error('[JellyDrax]', e));
  }
}
