/* =====================================================================
   JellyDrax – Client-Erweiterung für das Jellyfin-Web-Interface
   Wird von der Desktop-App beim Laden jeder Seite eingefügt.
   - eigenes Farbschema (Themes + eigene Farben)
   - eigene Media Bar auf der Startseite
   - Hover-/Seiten-Animationen
   - Einstellungsfenster (Zahnrad/Palette in der Kopfleiste, Strg+,)
   Der Video-Player wird nicht verändert; abgespielt wird immer über den
   normalen Jellyfin-Player, damit Server-Plugins greifen.
   ===================================================================== */
(function () {
  'use strict';
  if (window.top !== window || window.JellyDrax) return;
  if (!/^https?:$/.test(location.protocol)) return;

  var VERSION = window.__JDX_VERSION__ || 'dev';
  var CSS = window.__JDX_CSS__ || '';
  var STORAGE_KEY = 'jellydrax-settings';

  // ------------------------------------------------------------- Themes

  var THEMES = {
    liquid: { name: 'Liquid Glass', glass: true, liquid: true, bg: '#060912', surface: '#121a30', surface2: '#1d2745', text: '#ffffff', muted: '#bcc5df', accent: '#5ac8fa', accent2: '#bf5af2' },
    liquidsunset: { name: 'Liquid Sunset', glass: true, liquid: true, bg: '#0d0710', surface: '#1f1222', surface2: '#2d1a31', text: '#fff8f5', muted: '#d6b9c2', accent: '#ff9f0a', accent2: '#ff375f' },
    glass: { name: 'Glass', glass: true, bg: '#0a0f1f', surface: '#151b33', surface2: '#212a4a', text: '#f4f6ff', muted: '#aeb6d4', accent: '#7aa2ff', accent2: '#c77dff' },
    glassaurora: { name: 'Glass Aurora', glass: true, bg: '#05141a', surface: '#0e2430', surface2: '#173543', text: '#effbfa', muted: '#9cc3c6', accent: '#2fe6c8', accent2: '#ff6fd8' },
    jellydrax: { name: 'JellyDrax', bg: '#0d0b14', surface: '#17141f', surface2: '#231e2f', text: '#f2eefa', muted: '#a9a1b8', accent: '#9b5cff', accent2: '#00c2ff' },
    midnight: { name: 'Midnight', bg: '#090d18', surface: '#111827', surface2: '#1b2438', text: '#e8ecf7', muted: '#98a2bd', accent: '#4f8cff', accent2: '#8b5cf6' },
    amoled: { name: 'AMOLED', bg: '#000000', surface: '#0b0b0b', surface2: '#171717', text: '#ffffff', muted: '#9a9a9a', accent: '#f2f2f2', accent2: '#9e9e9e' },
    cinema: { name: 'Kino', bg: '#0b0b0b', surface: '#161616', surface2: '#232323', text: '#f5f5f5', muted: '#a3a3a3', accent: '#e50914', accent2: '#ff5a36' },
    nord: { name: 'Nord', bg: '#2e3440', surface: '#3b4252', surface2: '#434c5e', text: '#eceff4', muted: '#aeb6c6', accent: '#88c0d0', accent2: '#81a1c1' },
    dracula: { name: 'Dracula', bg: '#1e1f29', surface: '#282a36', surface2: '#343746', text: '#f8f8f2', muted: '#a4a8c6', accent: '#bd93f9', accent2: '#ff79c6' },
    ocean: { name: 'Ozean', bg: '#04131c', surface: '#0a2230', surface2: '#10313f', text: '#e3f4fb', muted: '#8fb3c2', accent: '#00b4d8', accent2: '#48e5c2' },
    emerald: { name: 'Smaragd', bg: '#07130f', surface: '#0f211a', surface2: '#163027', text: '#e7f6ef', muted: '#93b8a8', accent: '#2ecc71', accent2: '#1abc9c' },
    sunset: { name: 'Sonnenuntergang', bg: '#140c0c', surface: '#221413', surface2: '#311c1a', text: '#fbeee8', muted: '#c4a39a', accent: '#ff7a45', accent2: '#ff3d77' },
    rose: { name: 'Rosé', bg: '#140b10', surface: '#21121a', surface2: '#2e1925', text: '#fbe9f1', muted: '#c39fb1', accent: '#ff6fa5', accent2: '#c86bff' },
    royal: { name: 'Royal Gold', bg: '#0e0d0a', surface: '#1a1813', surface2: '#27241b', text: '#f6f1e3', muted: '#b5ab90', accent: '#d4af37', accent2: '#f0d78c' },
    graphite: { name: 'Graphit', bg: '#161718', surface: '#202123', surface2: '#2b2d30', text: '#ececec', muted: '#a2a4a8', accent: '#a9b8cc', accent2: '#d9e2ef' },
    jellyfin: { name: 'Jellyfin Klassik', bg: '#101010', surface: '#202020', surface2: '#2c2c2c', text: '#ffffff', muted: '#b3b3b3', accent: '#00a4dc', accent2: '#aa5cc3' }
  };

  var COLOR_KEYS = [
    ['accent', 'Akzentfarbe'],
    ['accent2', 'Zweite Akzentfarbe'],
    ['bg', 'Hintergrund'],
    ['surface', 'Flächen'],
    ['surface2', 'Bedienelemente'],
    ['text', 'Text'],
    ['muted', 'Text (gedämpft)']
  ];

  var FONTS = {
    segoe: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    bahnschrift: 'Bahnschrift, "Segoe UI", system-ui, sans-serif',
    noto: '"Noto Sans", "Segoe UI", sans-serif',
    serif: 'Georgia, "Times New Roman", serif'
  };

  var DEFAULTS = {
    theme: 'jellydrax',
    colors: {},
    glass: false,
    liquid: false,
    refraction: true,
    detailBanner: 'color',
    bgStyle: 'glow',
    radius: 12,
    font: 'segoe',
    glassHeader: true,
    hover: 'elegant',
    speed: 1,
    pageAnim: 'rise',
    backdrops: false,
    ignoreServerCss: true,
    hidePluginBar: true,
    hideFirstTitle: true,
    centerLibraries: true,
    customCss: '#indexPage .section3 .cardText { display: none; }\n',
    mediaBar: {
      enabled: true,
      style: 'cinema',
      height: 'large',
      animation: 'kenburns',
      text: 'rise',
      indicator: 'bars',
      interval: 9,
      source: 'random',
      types: ['Movie', 'Series'],
      count: 12,
      showLogo: true,
      showOverview: true,
      showMeta: true,
      trailers: 'off',
      trailerSound: false,
      pauseOnHover: true,
      transition: 1.2
    },
    reduceMotion: false,
    ratings: {
      imdb: true,
      rt: true,
      mc: true,
      community: false,
      inMediaBar: true,
      onDetails: true,
      hideJellyfinRatings: true,
      size: 1,
      style: 'badges',
      omdbKey: ''
    }
  };

  // ---------------------------------------------------------- Helfer

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, over) {
    var out = clone(base);
    if (!over || typeof over !== 'object') return out;
    Object.keys(over).forEach(function (k) {
      var v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = merge(out[k], v);
      } else if (v !== undefined) {
        out[k] = v;
      }
    });
    return out;
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function icon(name) { return el('span', { class: 'material-icons ' + name, 'aria-hidden': 'true' }); }

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join(''); }
  function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
  function luminance(c) {
    var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ch(c) { return c.map(Math.round).join(' '); }      // MUI: "r g b"
  function cm(c) { return c.map(Math.round).join(', '); }     // eigene: "r, g, b"

  // ------------------------------------------------------ Einstellungen

  function loadSettings() {
    var stored = null;
    if (window.__JDX_SETTINGS__) stored = window.__JDX_SETTINGS__;
    else {
      try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { stored = null; }
    }
    return merge(DEFAULTS, stored);
  }

  var S = loadSettings();
  var saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* ignorieren */ }
      try {
        if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage({ jdx: 'save', settings: S });
      } catch (e) { /* ignorieren */ }
    }, 250);
  }

  function palette() {
    var base = THEMES[S.theme] || THEMES.jellydrax;
    var p = {};
    Object.keys(base).forEach(function (k) { p[k] = base[k]; });
    Object.keys(S.colors || {}).forEach(function (k) { if (S.colors[k]) p[k] = S.colors[k]; });
    return p;
  }

  // ------------------------------------------------------ Styles anwenden

  var styleBase, styleVars, styleCustom;

  function ensureStyles() {
    var head = document.head || document.documentElement;
    if (!styleBase) {
      styleBase = el('style', { id: 'jdx-style-base' }, [CSS]);
      styleVars = el('style', { id: 'jdx-style-vars' });
      styleCustom = el('style', { id: 'jdx-style-custom' });
    }
    // Immer am Ende des <head> (in dieser Reihenfolge), damit sie nach Jellyfins Theme-CSS greifen.
    // Nur neu einhängen, wenn etwas dahinter eingefügt wurde – jedes Umhängen löst eine
    // Neuberechnung aller Styles der Seite aus.
    if (head.lastElementChild === styleCustom &&
        styleCustom.previousElementSibling === styleVars &&
        styleVars.previousElementSibling === styleBase) return;
    head.appendChild(styleBase);
    head.appendChild(styleVars);
    head.appendChild(styleCustom);
  }

  function buildVars() {
    var p = palette();
    var bg = hexToRgb(p.bg), surface = hexToRgb(p.surface), surface2 = hexToRgb(p.surface2);
    var text = hexToRgb(p.text), muted = hexToRgb(p.muted);
    var accent = hexToRgb(p.accent), accent2 = hexToRgb(p.accent2);
    var white = [255, 255, 255], black = [0, 0, 0];
    var onAccent = luminance(mix(accent, accent2, 0.5)) > 0.45 ? [17, 17, 17] : white;
    var accentDark = mix(accent, black, 0.3), accentLight = mix(accent, white, 0.25);
    var bgImage = 'none';
    if (S.bgStyle === 'glow') {
      bgImage = 'radial-gradient(1100px 620px at 12% -8%, rgba(' + cm(accent) + ', 0.16), transparent 62%), ' +
        'radial-gradient(900px 600px at 100% 0%, rgba(' + cm(accent2) + ', 0.10), transparent 60%)';
    } else if (S.bgStyle === 'gradient') {
      bgImage = 'linear-gradient(180deg, ' + rgbToHex(mix(bg, accent, 0.1)) + ' 0%, ' + p.bg + ' 55%)';
    }

    var v = {
      '--jdx-bg': p.bg, '--jdx-bg-rgb': cm(bg),
      '--jdx-surface': p.surface, '--jdx-surface-rgb': cm(surface),
      '--jdx-surface2': p.surface2,
      '--jdx-text': p.text, '--jdx-text-rgb': cm(text),
      '--jdx-muted': p.muted,
      '--jdx-accent': p.accent, '--jdx-accent-rgb': cm(accent),
      '--jdx-accent2': p.accent2, '--jdx-accent2-rgb': cm(accent2),
      '--jdx-on-accent': rgbToHex(onAccent),
      '--jdx-radius': S.radius + 'px',
      '--jdx-font': FONTS[S.font] || FONTS.segoe,
      '--jdx-speed': String(S.speed || 1),
      '--jdx-bg-image': bgImage,

      // Jellyfin/MUI-Palette (Jellyfin 10.11+/12.x nutzt diese Variablen)
      '--jf-palette-primary-main': p.accent, '--jf-palette-primary-mainChannel': ch(accent),
      '--jf-palette-primary-dark': rgbToHex(accentDark), '--jf-palette-primary-darkChannel': ch(accentDark),
      '--jf-palette-primary-light': rgbToHex(accentLight), '--jf-palette-primary-lightChannel': ch(accentLight),
      '--jf-palette-primary-contrastText': rgbToHex(onAccent), '--jf-palette-primary-contrastTextChannel': ch(onAccent),
      '--jf-palette-secondary-main': p.accent, '--jf-palette-secondary-mainChannel': ch(accent),
      '--jf-palette-secondary-dark': rgbToHex(accentDark), '--jf-palette-secondary-light': rgbToHex(accentLight),
      '--jf-palette-secondary-contrastText': rgbToHex(onAccent),
      '--jf-palette-background-default': p.bg, '--jf-palette-background-defaultChannel': ch(bg),
      '--jf-palette-background-paper': p.surface, '--jf-palette-background-paperChannel': ch(surface),
      '--jf-palette-background-defaultImage': 'none',
      '--jf-palette-text-primary': p.text, '--jf-palette-text-primaryChannel': ch(text),
      '--jf-palette-text-secondary': p.muted, '--jf-palette-text-secondaryChannel': ch(muted),
      '--jf-palette-divider': 'rgba(' + cm(text) + ', 0.12)', '--jf-palette-dividerChannel': ch(text),
      '--jf-palette-action-hover': 'rgba(' + cm(text) + ', 0.08)',
      '--jf-palette-action-focus': 'rgba(' + cm(text) + ', 0.12)',
      '--jf-palette-action-selected': 'rgba(' + cm(accent) + ', 0.2)',
      '--jf-palette-AppBar-defaultBg': p.surface,
      '--jf-palette-AppBar-transparentBg': 'rgba(' + cm(bg) + ', 0.4)',
      '--jf-palette-AppBar-gradient': 'none',
      '--jf-palette-FilledInput-bg': p.surface2,
      '--jf-palette-FilledInput-hoverBg': rgbToHex(mix(surface2, text, 0.06)),
      '--jf-palette-FilledInput-borderColor': 'rgba(' + cm(text) + ', 0.1)',
      '--jf-palette-SnackbarContent-bg': p.surface2,
      '--jf-palette-SnackbarContent-color': p.text,
      '--jf-palette-Button-inheritContainedBg': p.surface2,
      '--jf-palette-Button-inheritContainedHoverBg': rgbToHex(mix(surface2, text, 0.1)),
      '--jf-card-borderRadius': S.radius + 'px'
    };
    var body = Object.keys(v).map(function (k) { return '  ' + k + ': ' + v[k] + ' !important;'; }).join('\n');
    return 'html.jdx, html.jdx[data-theme] {\n' + body + '\n}\n' +
      '#jdx-settings, .jdx-mb {\n' + body + '\n}\n';
  }

  function applyClasses() {
    var r = document.documentElement;
    r.classList.add('jdx');
    r.classList.toggle('jdx-nobackdrop', !S.backdrops);
    r.classList.toggle('jdx-glass', !!S.glassHeader);
    r.classList.toggle('jdx-glassmode', !!(S.glass || S.liquid));
    r.classList.toggle('jdx-liquid', !!S.liquid);
    r.classList.toggle('jdx-refraction', !!(S.liquid && S.refraction));
    if (S.liquid) ensureLiquidFilter();
    r.setAttribute('data-jdx-banner', S.detailBanner || 'color');
    r.classList.toggle('jdx-reduce-motion', !!S.reduceMotion);
    r.classList.toggle('jdx-own-ratings', !!(S.ratings.onDetails && S.ratings.hideJellyfinRatings));
    r.style.setProperty('--jdx-rating-scale', String(S.ratings.size || 1));
    r.setAttribute('data-jdx-rating-style', S.ratings.style || 'badges');
    r.classList.toggle('jdx-hide-plugin-bar', !!S.hidePluginBar);
    r.classList.toggle('jdx-hide-first-title', !!S.hideFirstTitle);
    r.classList.toggle('jdx-center-libs', !!S.centerLibraries);
    r.setAttribute('data-jdx-hover', S.hover);
    r.setAttribute('data-jdx-page', S.pageAnim);
  }

  function applyAll() {
    ensureStyles();
    styleVars.textContent = buildVars();
    styleCustom.textContent = S.customCss || '';
    applyClasses();
    if (MB.el) applyMediaBarAttrs();
    sendWindowColors();
  }

  // SVG-Filter für die Lichtbrechung (backdrop-filter: url(#jdx-liquid-filter), nur Chromium/WebView2)
  function ensureLiquidFilter() {
    if (!document.body || document.getElementById('jdx-liquid-svg')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var wrap = document.createElement('div');
    wrap.innerHTML = '<svg xmlns="' + ns + '" id="jdx-liquid-svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true">' +
      '<filter id="jdx-liquid-filter" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="11" result="noise"/>' +
      '<feGaussianBlur in="noise" stdDeviation="2.5" result="soft"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="soft" scale="34" xChannelSelector="R" yChannelSelector="G" result="bent"/>' +
      '<feGaussianBlur in="bent" stdDeviation="6"/>' +
      '</filter></svg>';
    document.body.appendChild(wrap.firstChild);
  }

  // Titelleiste des Windows-Fensters an das Theme anpassen (Windows 11)
  var lastWindowColors = '';
  function sendWindowColors() {
    var p = palette();
    var msg = { jdx: 'chrome', caption: (S.glass || S.liquid) ? p.bg : p.surface, text: p.text };
    var key = JSON.stringify(msg);
    if (key === lastWindowColors) return;
    lastWindowColors = key;
    try { if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage(msg); } catch (e) { /* ignorieren */ }
  }

  // Media Bar eines Server-Plugins: ausgeblendet, aber deren Trailer laufen sonst unsichtbar weiter
  function silencePluginBar() {
    if (!S.hidePluginBar) return;
    var c = document.getElementById('slides-container');
    if (!c) return;
    c.querySelectorAll('video').forEach(function (v) { v.muted = true; if (!v.paused) v.pause(); });
    c.querySelectorAll('iframe').forEach(function (f) {
      try {
        f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
        f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      } catch (e) { /* ignorieren */ }
    });
  }

  // ======================================================== Bewertungen
  // IMDb / Rotten Tomatoes / Metacritic über die OMDb-API (eigener, kostenloser Schlüssel nötig).
  // Ohne Schlüssel: Kritiker-Wertung (Rotten Tomatoes) und Community-Wertung aus Jellyfin.

  var fetchSeq = 0, fetchWaiters = {};
  if (window.chrome && window.chrome.webview) {
    window.chrome.webview.addEventListener('message', function (ev) {
      var m = ev.data;
      if (!m || m.jdx !== 'fetchResult' || !fetchWaiters[m.id]) return;
      var w = fetchWaiters[m.id]; delete fetchWaiters[m.id];
      m.ok ? w.resolve(m.body) : w.reject(new Error(m.error || ('HTTP ' + m.status)));
    });
  }

  // Abruf über die Desktop-App (kein CORS-Problem), sonst direkt
  function hostFetchJson(url) {
    if (window.chrome && window.chrome.webview) {
      return new Promise(function (resolve, reject) {
        var id = 'f' + (++fetchSeq);
        fetchWaiters[id] = { resolve: resolve, reject: reject };
        window.chrome.webview.postMessage({ jdx: 'fetch', id: id, url: url });
        setTimeout(function () { if (fetchWaiters[id]) { delete fetchWaiters[id]; reject(new Error('Zeitüberschreitung')); } }, 15000);
      }).then(function (body) { return JSON.parse(body); });
    }
    return fetch(url).then(function (r) { return r.json(); });
  }

  var omdbMem = {}, omdbPending = {};
  function omdbUrl(imdb, key) { return 'https://www.omdbapi.com/?i=' + encodeURIComponent(imdb) + '&apikey=' + encodeURIComponent(key); }

  function getOmdb(imdb) {
    var key = (S.ratings.omdbKey || '').trim();
    if (!key || !imdb) return Promise.resolve(null);
    if (omdbMem[imdb] !== undefined) return Promise.resolve(omdbMem[imdb]);
    try {
      var c = JSON.parse(localStorage.getItem('jdx-omdb-' + imdb) || 'null');
      if (c && Date.now() - c.t < (c.d ? 14 : 1) * 864e5) { omdbMem[imdb] = c.d; return Promise.resolve(c.d); }
    } catch (e) { /* ignorieren */ }
    if (omdbPending[imdb]) return omdbPending[imdb];
    omdbPending[imdb] = hostFetchJson(omdbUrl(imdb, key)).then(function (d) {
      var data = d && d.Response === 'True' ? d : null;
      omdbMem[imdb] = data;
      try { localStorage.setItem('jdx-omdb-' + imdb, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* ignorieren */ }
      return data;
    }).catch(function () { return null; }).then(function (d) { delete omdbPending[imdb]; return d; });
    return omdbPending[imdb];
  }

  function ratingList(item, omdb) {
    var r = S.ratings, out = [];
    var find = function (src) {
      var x = omdb && (omdb.Ratings || []).filter(function (q) { return q.Source === src; })[0];
      return x && x.Value;
    };
    if (r.imdb && omdb && omdb.imdbRating && omdb.imdbRating !== 'N/A') out.push({ k: 'imdb', v: omdb.imdbRating });
    if (r.rt) {
      var rt = find('Rotten Tomatoes');
      var rtv = rt ? parseInt(rt, 10) : item.CriticRating;
      if (rtv || rtv === 0) out.push({ k: 'rt', v: rtv + '%', fresh: rtv >= 60 });
    }
    if (r.mc) {
      var mc = omdb && omdb.Metascore && omdb.Metascore !== 'N/A' ? parseInt(omdb.Metascore, 10) : null;
      if (mc || mc === 0) out.push({ k: 'mc', v: String(mc), level: mc >= 61 ? 'good' : mc >= 40 ? 'mixed' : 'bad' });
    }
    // Community-Bewertung: wenn gewünscht – oder als Ersatz für IMDb, solange kein OMDb-Schlüssel eingetragen ist
    var noKey = !(S.ratings.omdbKey || '').trim();
    if ((r.community || (r.imdb && noKey)) && item.CommunityRating) out.push({ k: 'star', v: item.CommunityRating.toFixed(1) });
    return out;
  }

  var TOMATO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fa320a" d="M12 6.5c4.7 0 8.5 3.1 8.5 7.2S16.7 21 12 21s-8.5-3.2-8.5-7.3S7.3 6.5 12 6.5z"/><path fill="#00912d" d="M12.4 7.3c.9-1.8 2.7-2.6 4.7-2.2-1 .9-2.2 1.4-3.5 1.6 1.4.1 2.6.6 3.4 1.5-1.6.1-3-.2-4.3-.9-.6 1.2-1.5 2-2.8 2.3.4-.9.8-1.6 1.4-2.2-1.2 0-2.3-.3-3.3-.9 1.4-.6 2.9-.5 4.4.8z"/></svg>';
  var SPLAT_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#0ac855" d="M12 3.5c1.4 1.6 1.9 3 1.6 4.4 1.3-1.4 3-2 5-1.6-1.2 1.2-1.6 2.5-1.3 3.8 1.5-.2 2.9.3 4.2 1.5-1.6.5-2.6 1.4-3 2.7 1.1.9 1.6 2.1 1.5 3.6-1.5-.8-2.9-.9-4.2-.3-.1 1.5-.8 2.6-2 3.4-.5-1.4-1.4-2.3-2.8-2.6-1 1.1-2.3 1.6-3.9 1.5.6-1.3.6-2.6 0-3.8-1.5.2-2.8-.2-3.9-1.3 1.4-.6 2.3-1.5 2.6-2.8-1.2-.8-1.8-2-1.8-3.5 1.5.5 2.9.4 4.1-.4-.2-1.6.4-3 1.9-4.6z"/></svg>';

  function renderRatings(box, list) {
    box.textContent = '';
    list.forEach(function (r) {
      var b;
      if (r.k === 'imdb') b = el('span', { class: 'jdx-rating jdx-r-imdb', title: 'IMDb' }, [el('b', { text: 'IMDb' }), r.v]);
      else if (r.k === 'rt') {
        b = el('span', { class: 'jdx-rating jdx-r-rt' + (r.fresh ? '' : ' is-rotten'), title: 'Rotten Tomatoes' });
        var ic = el('i'); ic.innerHTML = r.fresh ? TOMATO_SVG : SPLAT_SVG; b.appendChild(ic); b.appendChild(document.createTextNode(r.v));
      } else if (r.k === 'mc') b = el('span', { class: 'jdx-rating jdx-r-mc', title: 'Metacritic' }, [el('b', { class: 'is-' + r.level, text: r.v }), 'Metacritic']);
      else b = el('span', { class: 'jdx-rating jdx-r-star', title: 'Community-Bewertung' }, ['★ ' + r.v]);
      box.appendChild(b);
    });
    box.classList.toggle('jdx-hidden', !list.length);
  }

  function imdbOf(item) { var p = item.ProviderIds || {}; return p.Imdb || p.IMDB || p.imdb || null; }

  function fillRatings(box, item) {
    renderRatings(box, ratingList(item, null));
    var imdb = imdbOf(item);
    if (!imdb || !(S.ratings.imdb || S.ratings.rt || S.ratings.mc)) return;
    getOmdb(imdb).then(function (d) { if (d && box.isConnected) renderRatings(box, ratingList(item, d)); });
  }

  // Bewertungen auf Film- und Serienseiten
  var detailItemCache = {}, noRatingIds = {};
  function ensureDetailRatings() {
    if (!S.ratings.onDetails) { document.querySelectorAll('.jdx-detail-ratings').forEach(function (n) { n.remove(); }); return; }
    var page = Array.prototype.filter.call(document.querySelectorAll('.itemDetailPage'), function (p) { return !p.classList.contains('hide') && p.getClientRects().length; })[0];
    if (!page) return;
    var m = /[?&]id=([0-9a-f]{32})/i.exec(location.href);
    if (!m) return;
    var id = m[1].toLowerCase();
    if (noRatingIds[id]) return;
    var host = page.querySelector('.itemMiscInfo-primary') || page.querySelector('.itemMiscInfo');
    if (!host || !host.parentNode) return;
    var box = page.querySelector('.jdx-detail-ratings');
    if (box && box.getAttribute('data-id') === id && box.previousElementSibling === host) return;
    if (box) box.remove();
    box = el('div', { class: 'jdx-detail-ratings jdx-ratings', 'data-id': id });
    host.parentNode.insertBefore(box, host.nextSibling);
    var a = api(), uid = userId();
    if (!a || !uid) return;
    var load = detailItemCache[id] ? Promise.resolve(detailItemCache[id]) : a.getItem(uid, id).then(function (it) { detailItemCache[id] = it; return it; });
    load.then(function (item) {
      if (!item || ['Movie', 'Series', 'Episode', 'Season'].indexOf(item.Type) < 0) { noRatingIds[id] = true; box.remove(); return; }
      fillRatings(box, item);
    }).catch(function () { box.remove(); });
  }

  function testOmdbKey(out) {
    var key = (S.ratings.omdbKey || '').trim();
    if (!key) { out.textContent = 'Bitte zuerst einen Schlüssel eintragen.'; return; }
    out.textContent = 'Prüfe …';
    hostFetchJson(omdbUrl('tt0084726', key)).then(function (d) {
      out.textContent = d && d.Response === 'True' ? '✓ Schlüssel funktioniert (Test: ' + d.Title + ', IMDb ' + d.imdbRating + ')' : '✗ ' + ((d && d.Error) || 'Ungültige Antwort');
      if (d && d.Response === 'True') { omdbMem = {}; refreshMediaBar(true); }
    }).catch(function (e) { out.textContent = '✗ ' + e.message; });
  }

  // ======================================================== Media Bar

  var MB = { inView: true, el: null, items: [], idx: 0, key: '', loadedAt: 0, timer: null, timerEnd: 0, remaining: 0, paused: false, hovering: false, visible: false, loading: false, trailerTimer: null, muted: true };

  function api() { return window.ApiClient; }
  function userId() { try { return api() && api().getCurrentUserId(); } catch (e) { return null; } }

  function homeTab() {
    var page = document.querySelector('#indexPage:not(.hide)');
    return page ? page.querySelector('#homeTab') : null;
  }

  function imageUrl(item, type, opts) {
    var a = api();
    var tag = type === 'Backdrop' ? (item.BackdropImageTags || [])[0] : (item.ImageTags || {})[type];
    if (!tag) return null;
    var o = { type: type, tag: tag, quality: 90 };
    Object.keys(opts || {}).forEach(function (k) { o[k] = opts[k]; });
    if (type === 'Backdrop') o.index = 0;
    return a.getScaledImageUrl(item.Id, o);
  }

  function itemsQuery() {
    var m = S.mediaBar;
    var q = {
      IncludeItemTypes: (m.types && m.types.length ? m.types : ['Movie', 'Series']).join(','),
      Recursive: true,
      Limit: Math.max(m.count * 2, 20),
      ImageTypes: 'Backdrop',
      Fields: 'Overview,Genres,CommunityRating,CriticRating,OfficialRating,ProductionYear,RunTimeTicks,RemoteTrailers,LocalTrailerCount,Taglines,ChildCount',
      EnableImageTypes: 'Backdrop,Logo,Primary',
      ImageTypeLimit: 1,
      EnableUserData: true,
      IsMissing: false
    };
    switch (m.source) {
      case 'latest': q.SortBy = 'DateCreated'; q.SortOrder = 'Descending'; break;
      case 'toprated': q.SortBy = 'CommunityRating,Random'; q.SortOrder = 'Descending'; q.MinCommunityRating = 7; break;
      case 'favorites': q.SortBy = 'Random'; q.Filters = 'IsFavorite'; break;
      case 'unwatched': q.SortBy = 'Random'; q.Filters = 'IsUnplayed'; break;
      case 'released': q.SortBy = 'PremiereDate'; q.SortOrder = 'Descending'; break;
      default: q.SortBy = 'Random';
    }
    return q;
  }

  function loadItems() {
    var a = api(), uid = userId();
    if (!a || !uid) return Promise.resolve([]);
    return a.getItems(uid, itemsQuery()).then(function (r) {
      var items = (r && r.Items || []).filter(function (i) { return i.BackdropImageTags && i.BackdropImageTags.length; });
      return items.slice(0, S.mediaBar.count);
    });
  }

  function applyMediaBarAttrs() {
    var m = S.mediaBar, e = MB.el;
    e.setAttribute('data-style', m.style);
    e.setAttribute('data-anim', m.animation);
    e.setAttribute('data-text', m.text);
    e.setAttribute('data-ind', m.indicator);
    e.setAttribute('data-height', m.height);
    e.style.setProperty('--jdx-mb-interval', m.interval + 's');
    e.style.setProperty('--jdx-mb-dur', (m.transition || 1.2) + 's');
    updatePull();
  }

  // Diese Stile reichen bis unter die (dann transparente) Kopfleiste
  var PULL_STYLES = ['cinema', 'spotlight', 'minimal'];
  function updatePull() {
    if (!MB.el) return;
    MB.el.style.marginTop = '';
    if (PULL_STYLES.indexOf(S.mediaBar.style) < 0 || !MB.visible) return;
    var top = MB.el.getBoundingClientRect().top + window.scrollY;
    if (top > 0 && top < 400) MB.el.style.marginTop = (-top) + 'px';
  }

  function formatRuntime(ticks) {
    if (!ticks) return null;
    var min = Math.round(ticks / 600000000);
    var h = Math.floor(min / 60), m = min % 60;
    return h ? h + ' Std. ' + (m ? m + ' Min.' : '') : m + ' Min.';
  }

  function buildSlide(item, i) {
    var m = S.mediaBar;
    var logo = m.showLogo ? imageUrl(item, 'Logo', { maxWidth: 800 }) : null;
    var title = logo
      ? el('div', null, [el('img', { class: 'jdx-title-logo', src: logo, alt: item.Name, draggable: 'false' })])
      : el('h2', { class: 'jdx-title-text', text: item.Name });

    var meta = null;
    if (m.showMeta) {
      var bits = [];
      if (S.ratings.inMediaBar) {
        var rbox = el('span', { class: 'jdx-ratings' });
        fillRatings(rbox, item);
        bits.push(rbox);
      }
      if (item.ProductionYear) bits.push(el('span', { text: String(item.ProductionYear) }));
      if (item.Type === 'Series' && item.ChildCount) bits.push(el('span', { text: item.ChildCount + (item.ChildCount === 1 ? ' Staffel' : ' Staffeln') }));
      else if (item.RunTimeTicks) bits.push(el('span', { text: formatRuntime(item.RunTimeTicks) }));
      if (item.OfficialRating) bits.push(el('span', { class: 'jdx-badge', text: item.OfficialRating }));
      if (item.Genres && item.Genres.length) bits.push(el('span', { class: 'jdx-genres', text: item.Genres.slice(0, 3).join(' · ') }));
      meta = el('div', { class: 'jdx-meta' }, bits);
    }

    var tagline = item.Taglines && item.Taglines[0] && m.showOverview ? el('p', { class: 'jdx-tagline', text: item.Taglines[0] }) : null;
    var overview = m.showOverview && item.Overview ? el('p', { class: 'jdx-overview', text: item.Overview }) : null;

    var resume = item.UserData && item.UserData.PlaybackPositionTicks > 0;
    var fav = item.UserData && item.UserData.IsFavorite;
    var favBtn = el('button', { class: 'jdx-btn jdx-btn-icon' + (fav ? ' is-fav' : ''), type: 'button', title: 'Favorit' }, [icon(fav ? 'favorite' : 'favorite_border')]);
    favBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFavorite(item, favBtn); });

    var actions = el('div', { class: 'jdx-actions' }, [
      el('button', { class: 'jdx-btn jdx-btn-primary', type: 'button', onclick: function (e) { e.stopPropagation(); playItem(item); } },
        [icon('play_arrow'), resume ? 'Fortsetzen' : 'Abspielen']),
      el('button', { class: 'jdx-btn', type: 'button', onclick: function (e) { e.stopPropagation(); showDetails(item); } },
        [icon('info_outline'), 'Mehr Infos']),
      favBtn
    ]);

    var num = el('div', { class: 'jdx-num' }, [el('b', { text: ('0' + (i + 1)).slice(-2) }), ' / ' + ('0' + MB.items.length).slice(-2)]);
    var body = el('div', { class: 'jdx-slide-body' }, [num, title, tagline, meta, overview, actions]);
    var backdrop = imageUrl(item, 'Backdrop', { maxWidth: 1920 });
    var poster = imageUrl(item, 'Primary', { maxHeight: 900 });

    return el('article', { class: 'jdx-slide', 'data-i': i, 'aria-roledescription': 'slide', 'aria-label': item.Name }, [
      el('div', { class: 'jdx-slide-media' }, [
        el('div', { class: 'jdx-slide-img', 'data-src': backdrop }),
        el('div', { class: 'jdx-slide-video' })
      ]),
      el('div', { class: 'jdx-slide-shade' }),
      el('div', { class: 'jdx-slide-poster', 'data-src': poster || backdrop }),
      el('div', { class: 'jdx-slide-frame', 'data-src': backdrop }),
      body
    ]);
  }

  function lazyImages(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-src]').forEach(function (n) {
      var src = n.getAttribute('data-src');
      if (src && src !== 'null') n.style.backgroundImage = 'url("' + src + '")';
      n.removeAttribute('data-src');
    });
  }

  function buildIndicators() {
    var ind = MB.el.querySelector('.jdx-mb-ind');
    ind.textContent = '';
    var mode = S.mediaBar.indicator;
    if (mode === 'counter') {
      ind.appendChild(el('div', { class: 'jdx-ind-counter' }, [el('b'), el('span')]));
      ind.appendChild(el('div', { class: 'jdx-ind-line' }, [el('i')]));
      return;
    }
    MB.items.forEach(function (item, i) {
      var b;
      if (mode === 'bars') b = el('button', { class: 'jdx-ind-bar', type: 'button', 'aria-label': item.Name }, [el('i')]);
      else if (mode === 'thumbs') b = el('button', { class: 'jdx-ind-thumb', type: 'button', title: item.Name, style: { backgroundImage: 'url("' + imageUrl(item, 'Backdrop', { maxWidth: 320 }) + '")' } });
      else b = el('button', { class: 'jdx-ind-dot', type: 'button', 'aria-label': item.Name });
      b.addEventListener('click', function (e) { e.stopPropagation(); go(i, i < MB.idx ? -1 : 1); });
      ind.appendChild(b);
    });
  }

  function updateIndicators() {
    var ind = MB.el.querySelector('.jdx-mb-ind');
    if (S.mediaBar.indicator === 'counter') {
      var c = ind.querySelector('.jdx-ind-counter');
      if (c) {
        c.querySelector('b').textContent = ('0' + (MB.idx + 1)).slice(-2);
        c.querySelector('span').textContent = ' / ' + ('0' + MB.items.length).slice(-2);
      }
      var line = ind.querySelector('.jdx-ind-line');
      if (line) { line.textContent = ''; line.appendChild(el('i')); }
      return;
    }
    Array.prototype.forEach.call(ind.children, function (b, i) {
      b.classList.toggle('is-active', i === MB.idx);
      if (i === MB.idx && S.mediaBar.indicator === 'thumbs') {
        ind.scrollTo({ left: b.offsetLeft - ind.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
      }
      b.classList.toggle('is-done', i < MB.idx);
      if (i === MB.idx && S.mediaBar.indicator === 'bars') {
        var bar = b.querySelector('i'); var n = el('i'); b.replaceChild(n, bar);
      }
    });
  }

  function createMediaBar(tab) {
    MB.el = el('section', { id: 'jdx-mediabar', class: 'jdx-mb', tabindex: '0', 'aria-roledescription': 'carousel', 'aria-label': 'Media Bar' }, [
      el('div', { class: 'jdx-mb-stage' }),
      el('button', { class: 'jdx-mb-nav jdx-mb-prev', type: 'button', 'aria-label': 'Zurück', text: '‹' }),
      el('button', { class: 'jdx-mb-nav jdx-mb-next', type: 'button', 'aria-label': 'Weiter', text: '›' }),
      el('button', { class: 'jdx-mb-mute', type: 'button', title: 'Ton an/aus' }, [icon('volume_off')]),
      el('div', { class: 'jdx-mb-ind' })
    ]);
    MB.el.querySelector('.jdx-mb-prev').addEventListener('click', function (e) { e.stopPropagation(); prev(); });
    MB.el.querySelector('.jdx-mb-next').addEventListener('click', function (e) { e.stopPropagation(); next(); });
    MB.el.querySelector('.jdx-mb-mute').addEventListener('click', function (e) { e.stopPropagation(); toggleMute(); });
    MB.el.addEventListener('mouseenter', function () { MB.hovering = true; syncPause(); });
    MB.el.addEventListener('mouseleave', function () { MB.hovering = false; syncPause(); });
    MB.el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
    });
    MB.el.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      var side = e.target.closest('.jdx-slide');
      if (side && side.getAttribute('data-pos') && side.getAttribute('data-pos') !== '0') {
        go(parseInt(side.getAttribute('data-i'), 10), parseInt(side.getAttribute('data-pos'), 10));
        return;
      }
      var item = MB.items[MB.idx];
      if (item) showDetails(item);
    });
    // Wischen per Touch/Maus
    var startX = null;
    MB.el.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    MB.el.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
    });
    tab.insertBefore(MB.el, tab.firstChild);
    // außerhalb des sichtbaren Bereichs (weit nach unten gescrollt) pausieren: kein Timer, keine Trailer
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        MB.inView = entries[entries.length - 1].isIntersecting;
        syncPause();
      }, { threshold: 0.15 }).observe(MB.el);
    }
    applyMediaBarAttrs();
  }

  function renderSlides() {
    var stage = MB.el.querySelector('.jdx-mb-stage');
    stage.textContent = '';
    stopTrailer();
    if (!MB.items.length) {
      stage.appendChild(el('div', { class: 'jdx-mb-empty', text: MB.loading ? '' : 'Keine passenden Titel mit Hintergrundbild gefunden.' }));
      MB.el.querySelector('.jdx-mb-ind').textContent = '';
      return;
    }
    MB.items.forEach(function (item, i) { stage.appendChild(buildSlide(item, i)); });
    MB.idx = 0;
    buildIndicators();
    activate(0, 1, true);
  }

  function slides() { return MB.el ? MB.el.querySelectorAll('.jdx-slide') : []; }

  function activate(i, dir, first) {
    var all = slides();
    if (!all.length) return;
    var prevSlide = MB.el.querySelector('.jdx-slide.is-active');
    MB.el.classList.toggle('dir-prev', dir < 0);
    all.forEach(function (s) { s.classList.remove('is-leaving'); });
    if (prevSlide && !first) {
      prevSlide.classList.remove('is-active');
      prevSlide.classList.add('is-leaving');
      prevSlide.classList.remove('has-video');
      clearTimeout(prevSlide._leaveTimer);
      prevSlide._leaveTimer = setTimeout(function () { prevSlide.classList.remove('is-leaving'); }, (S.mediaBar.transition || 1.2) * 1600 + 150);
    }
    var cur = all[i];
    var n = all.length;
    lazyImages(cur);
    lazyImages(all[(i + 1) % n]);
    lazyImages(all[(i - 1 + n) % n]);
    // Position relativ zum aktiven Titel (für den Karussell-Stil)
    all.forEach(function (s, j) {
      var d = ((j - i) % n + n) % n;
      if (d > n / 2) d -= n;
      s.setAttribute('data-pos', String(Math.max(-2, Math.min(2, d))));
    });
    // Animation neu starten
    cur.classList.remove('is-active');
    void cur.offsetWidth;
    cur.classList.add('is-active');
    MB.idx = i;
    updateIndicators();
    stopTrailer();
    MB.el.classList.remove('has-video');
    schedule(S.mediaBar.interval * 1000);
    maybeStartTrailer(MB.items[i], cur);
  }

  function go(i, dir) {
    if (!MB.items.length) return;
    var n = MB.items.length;
    i = ((i % n) + n) % n;
    if (i === MB.idx) return;
    activate(i, dir || 1, false);
  }
  function next() { go(MB.idx + 1, 1); }
  function prev() { go(MB.idx - 1, -1); }

  function schedule(ms) {
    clearTimeout(MB.timer);
    MB.remaining = ms;
    MB.timerEnd = Date.now() + ms;
    if (!MB.paused && MB.items.length > 1) MB.timer = setTimeout(next, ms);
  }

  function syncPause() {
    var shouldPause = !MB.visible || !MB.inView || document.hidden || (S.mediaBar.pauseOnHover && MB.hovering) || !!document.getElementById('jdx-settings');
    if (shouldPause === MB.paused) return;
    MB.paused = shouldPause;
    if (!MB.el) return;
    MB.el.classList.toggle('is-paused', shouldPause);
    var v = MB.el.querySelector('.jdx-slide.is-active video');
    if (shouldPause) {
      clearTimeout(MB.timer);
      MB.remaining = Math.max(500, MB.timerEnd - Date.now());
      if (v) v.pause();
      if (!MB.visible || !MB.inView) stopTrailer();
    } else {
      MB.timerEnd = Date.now() + MB.remaining;
      if (MB.items.length > 1) MB.timer = setTimeout(next, MB.remaining);
      if (v) v.play().catch(function () {});
    }
  }

  // ------------------------------------------------------------ Trailer

  function youtubeId(url) {
    var m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url || '');
    return m ? m[1] : null;
  }

  function stopTrailer() {
    clearTimeout(MB.trailerTimer);
    if (!MB.el) return;
    MB.el.querySelectorAll('.jdx-slide-video').forEach(function (c) { c.textContent = ''; });
    MB.el.querySelectorAll('.jdx-slide.has-video').forEach(function (s) { s.classList.remove('has-video'); });
    MB.el.classList.remove('has-video');
  }

  function trailerShown(slide, maxSeconds) {
    if (!slide.classList.contains('is-active')) return;
    slide.classList.add('has-video');
    MB.el.classList.add('has-video');
    schedule(Math.max(S.mediaBar.interval, maxSeconds) * 1000);
  }

  function maybeStartTrailer(item, slide) {
    var mode = S.mediaBar.trailers;
    if (mode === 'off' || !item || S.mediaBar.style === 'poster') return;
    MB.muted = !S.mediaBar.trailerSound;
    updateMuteIcon();
    MB.trailerTimer = setTimeout(function () {
      if (MB.paused || !slide.classList.contains('is-active')) return;
      var box = slide.querySelector('.jdx-slide-video');
      var a = api(), uid = userId();
      var tryYoutube = function () {
        if (mode !== 'all') return;
        var yt = null;
        (item.RemoteTrailers || []).some(function (t) { yt = youtubeId(t.Url); return !!yt; });
        if (!yt) return;
        var f = el('iframe', {
          src: 'https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&mute=' + (MB.muted ? 1 : 0) + '&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&enablejsapi=1&start=5',
          allow: 'autoplay; encrypted-media', tabindex: '-1', title: 'Trailer'
        });
        f.addEventListener('load', function () { setTimeout(function () { trailerShown(slide, 45); }, 1800); });
        box.appendChild(f);
      };
      if (item.LocalTrailerCount > 0 && a && uid) {
        a.getLocalTrailers(uid, item.Id).then(function (t) {
          if (!t || !t.length || !slide.classList.contains('is-active')) return tryYoutube();
          var v = el('video', { muted: true, playsinline: true, preload: 'auto' });
          v.muted = MB.muted;
          v.src = a.getUrl('Videos/' + t[0].Id + '/stream', { Static: true, api_key: a.accessToken() });
          v.addEventListener('playing', function () { trailerShown(slide, Math.min(v.duration || 60, 90)); }, { once: true });
          v.addEventListener('ended', function () { if (slide.classList.contains('is-active')) next(); });
          v.addEventListener('error', function () { v.remove(); tryYoutube(); });
          box.appendChild(v);
          v.play().catch(function () { v.muted = true; MB.muted = true; updateMuteIcon(); v.play().catch(function () {}); });
        }).catch(tryYoutube);
      } else {
        tryYoutube();
      }
    }, 1800);
  }

  function updateMuteIcon() {
    if (!MB.el) return;
    var b = MB.el.querySelector('.jdx-mb-mute');
    b.textContent = '';
    b.appendChild(icon(MB.muted ? 'volume_off' : 'volume_up'));
  }

  function toggleMute() {
    MB.muted = !MB.muted;
    updateMuteIcon();
    var slide = MB.el.querySelector('.jdx-slide.is-active');
    if (!slide) return;
    var v = slide.querySelector('video');
    if (v) v.muted = MB.muted;
    var f = slide.querySelector('iframe');
    if (f && f.contentWindow) {
      f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: MB.muted ? 'mute' : 'unMute', args: [] }), '*');
    }
  }

  // ------------------------------------------------- Aktionen der Media Bar

  function showDetails(item) {
    try {
      if (window.Emby && window.Emby.Page && window.Emby.Page.showItem) {
        window.Emby.Page.showItem(item.Id, item.ServerId);
        return;
      }
    } catch (e) { /* Fallback unten */ }
    location.hash = '#/details?id=' + encodeURIComponent(item.Id) + '&serverId=' + encodeURIComponent(item.ServerId || '');
  }

  // Abspielen über den regulären Jellyfin-Player: Play-Befehl an die eigene
  // Sitzung -> Web-Client startet die Wiedergabe wie gewohnt (inkl. Plugins).
  function playItem(item) {
    var a = api(), uid = userId();
    if (!a || !uid) return showDetails(item);
    stopTrailer();
    var target = Promise.resolve({ id: item.Id, ticks: item.UserData && item.UserData.PlaybackPositionTicks || 0 });
    if (item.Type === 'Series') {
      target = a.getNextUpEpisodes({ SeriesId: item.Id, UserId: uid, Limit: 1, EnableTotalRecordCount: false })
        .then(function (r) {
          var ep = r && r.Items && r.Items[0];
          return ep ? { id: ep.Id, ticks: ep.UserData && ep.UserData.PlaybackPositionTicks || 0 } : { id: item.Id, ticks: 0 };
        })
        .catch(function () { return { id: item.Id, ticks: 0 }; });
    }
    target.then(function (t) {
      var deviceId = a.deviceId();
      return a.getSessions({ deviceId: deviceId }).then(function (sessions) {
        var own = (sessions || []).filter(function (s) { return s.DeviceId === deviceId; })[0];
        if (!own) throw new Error('Keine eigene Sitzung gefunden');
        var cmd = { PlayCommand: 'PlayNow', ItemIds: t.id };
        if (t.ticks) cmd.StartPositionTicks = t.ticks;
        return a.sendPlayCommand(own.Id, cmd);
      });
    }).catch(function (e) {
      console.warn('[JellyDrax] Direktes Abspielen nicht möglich, öffne Detailseite', e);
      showDetails(item);
    });
  }

  function toggleFavorite(item, btn) {
    var a = api(), uid = userId();
    if (!a || !uid) return;
    var fav = !(item.UserData && item.UserData.IsFavorite);
    a.updateFavoriteStatus(uid, item.Id, fav).then(function (ud) {
      item.UserData = ud || item.UserData || {};
      item.UserData.IsFavorite = fav;
      btn.classList.toggle('is-fav', fav);
      btn.textContent = '';
      btn.appendChild(icon(fav ? 'favorite' : 'favorite_border'));
    }).catch(function () {});
  }

  // ------------------------------------------------- Lebenszyklus der Bar

  function mediaBarKey() {
    var m = S.mediaBar;
    return [userId(), m.source, (m.types || []).join(','), m.count].join('|');
  }

  function removeMediaBar() {
    if (MB.el) { stopTrailer(); clearTimeout(MB.timer); MB.el.remove(); }
    MB.inView = true;
    MB.el = null; MB.items = []; MB.key = '';
    document.documentElement.classList.remove('jdx-hero-top');
  }

  function refreshMediaBar(force) {
    var m = S.mediaBar;
    var tab = homeTab();
    MB.visible = !!(tab && tab.offsetParent !== null && MB.el && MB.el.offsetParent !== null);
    if (!m.enabled || !userId()) { if (MB.el) removeMediaBar(); return; }
    if (!tab) { syncPause(); updateHeroHeader(); return; }

    if (!MB.el || !tab.contains(MB.el)) {
      if (MB.el) MB.el.remove();
      createMediaBar(tab);
      MB.key = '';
      MB.visible = tab.offsetParent !== null;
    } else if (tab.firstElementChild !== MB.el) {
      tab.insertBefore(MB.el, tab.firstChild);
    }

    var key = mediaBarKey();
    var stale = Date.now() - MB.loadedAt > 20 * 60 * 1000 && !MB.visible;
    if ((force || key !== MB.key || stale) && !MB.loading) {
      MB.key = key;
      MB.loading = true;
      loadItems().then(function (items) {
        MB.items = items;
        MB.loadedAt = Date.now();
      }).catch(function (e) {
        console.warn('[JellyDrax] Media Bar konnte nicht geladen werden', e);
        MB.items = [];
      }).then(function () {
        MB.loading = false;
        if (MB.el) renderSlides();
        updatePull();
      });
    }
    syncPause();
    updateHeroHeader();
  }

  function updateHeroHeader() {
    var on = !!(MB.el && MB.visible && S.mediaBar.enabled && PULL_STYLES.indexOf(S.mediaBar.style) >= 0 && window.scrollY < 60);
    document.documentElement.classList.toggle('jdx-hero-top', on);
  }

  // =================================================== Einstellungsfenster

  var TABS = [
    { id: 'design', label: 'Design', icon: 'palette' },
    { id: 'mediabar', label: 'Media Bar', icon: 'view_carousel' },
    { id: 'ratings', label: 'Bewertungen', icon: 'star' },
    { id: 'anim', label: 'Animationen', icon: 'animation' },
    { id: 'home', label: 'Startseite', icon: 'home' },
    { id: 'advanced', label: 'Erweitert', icon: 'tune' }
  ];

  var MB_STYLES = [
    ['cinema', 'Kino', 'Volle Breite, Text links, reicht bis unter die Kopfleiste'],
    ['center', 'Zentriert', 'Logo und Text mittig mit Vignette'],
    ['card', 'Karte', 'Abgerundete Karte mit Glas-Infofeld'],
    ['split', 'Geteilt', 'Text auf Farbfläche links, Bild rechts'],
    ['poster', 'Poster', 'Poster vor unscharfem Hintergrund'],
    ['compact', 'Kompakt', 'Flaches Banner ohne Beschreibung'],
    ['spotlight', 'Spotlight', 'Volle Breite, Text rechts'],
    ['carousel', 'Karussell', 'Aktiver Titel mittig, Nachbarn seitlich sichtbar'],
    ['stage', 'Bühne', 'Bild ungeschnitten im Rahmen vor unscharfem Hintergrund'],
    ['diagonal', 'Diagonal', 'Farbfläche mit schrägem Bildanschnitt'],
    ['magazine', 'Magazin', 'Große Nummer, Text links, Bild als Karte rechts'],
    ['minimal', 'Minimal', 'Nur Bild, Titel und Buttons – mittig unten']
  ];

  var MB_ANIMS = [
    ['fade', 'Überblenden'], ['kenburns', 'Ken Burns (Kamerafahrt)'], ['slide', 'Schieben'], ['zoom', 'Zoom'],
    ['blur', 'Unschärfe'], ['wipe', 'Wischen'], ['circle', 'Kreis-Enthüllung'], ['cube', '3D-Würfel']
  ];
  var TEXT_ANIMS = [['rise', 'Von unten einblenden'], ['fade', 'Einblenden'], ['slide', 'Von links hereingleiten'], ['scale', 'Heranzoomen'], ['blur', 'Aus Unschärfe'], ['none', 'Keine']];
  var INDICATORS = [['bars', 'Fortschrittsbalken'], ['dots', 'Punkte'], ['thumbs', 'Vorschaubilder'], ['counter', 'Zähler'], ['none', 'Keine']];
  var HEIGHTS = [['small', 'Klein'], ['medium', 'Mittel'], ['large', 'Groß'], ['full', 'Fast Vollbild']];
  var SOURCES = [['random', 'Zufällig'], ['latest', 'Neu hinzugefügt'], ['released', 'Neueste Veröffentlichungen'], ['toprated', 'Am besten bewertet'], ['unwatched', 'Noch nicht gesehen'], ['favorites', 'Favoriten']];
  var TRAILERS = [['off', 'Aus'], ['local', 'Nur lokale Trailer'], ['all', 'Lokale + YouTube-Trailer']];
  var HOVERS = [
    ['elegant', 'Elegant', 'Leicht vergrößern mit hellem Rahmen (wie ElegantFin)'],
    ['lift', 'Anheben', 'Karte schwebt nach oben'],
    ['zoom', 'Bild-Zoom', 'Bild zoomt im Rahmen'],
    ['glow', 'Leuchten', 'Rahmen und Schein in Akzentfarbe'],
    ['tilt', '3D-Kippen', 'Karte kippt räumlich nach hinten'],
    ['shine', 'Lichtreflex', 'Glanzstreifen läuft über das Bild'],
    ['none', 'Keine', 'Keine Hover-Animation']
  ];
  var PAGE_ANIMS = [['rise', 'Von unten einblenden'], ['fade', 'Einblenden'], ['scale', 'Heranzoomen'], ['slide', 'Seitlich hereingleiten'], ['none', 'Keine']];
  var BG_STYLES = [['glow', 'Sanfter Farbschein'], ['gradient', 'Farbverlauf'], ['solid', 'Einfarbig']];
  var FONT_OPTS = [['segoe', 'Segoe UI (Windows)'], ['bahnschrift', 'Bahnschrift'], ['noto', 'Noto Sans (Jellyfin)'], ['serif', 'Georgia (Serifen)']];

  var activeTab = 'design';
  var needsReload = false;

  function getPath(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, S); }
  function setPath(path, value) {
    var parts = path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function changed(path) {
    save();
    applyAll();
    if (path.indexOf('ratings.') === 0) {
      if (MB.el && path !== 'ratings.size' && path !== 'ratings.style') renderSlides();
      document.querySelectorAll('.jdx-detail-ratings').forEach(function (n) { n.remove(); });
      ensureDetailRatings();
    }
    if (path.indexOf('mediaBar.') === 0) {
      var p = path.slice(9);
      if (['source', 'types', 'count'].indexOf(p) >= 0) refreshMediaBar(true);
      else if (MB.el && ['showLogo', 'showOverview', 'showMeta', 'indicator', 'trailers', 'style'].indexOf(p) >= 0) renderSlides();
      else if (MB.el && p === 'interval') schedule(S.mediaBar.interval * 1000);
      else if (p === 'enabled') refreshMediaBar(true);
    }
  }

  function row(label, hint, control) {
    return el('div', { class: 'jdx-row' }, [el('label', null, [label, hint ? el('small', { text: hint }) : null]), control]);
  }

  function selectCtl(path, options) {
    var s = el('select');
    options.forEach(function (o) { s.appendChild(el('option', { value: o[0], text: o[1] })); });
    s.value = getPath(path);
    s.addEventListener('change', function () { setPath(path, s.value); changed(path); });
    return s;
  }

  function toggleCtl(path, onChange) {
    var input = el('input', { type: 'checkbox' });
    input.checked = !!getPath(path);
    input.addEventListener('change', function () { setPath(path, input.checked); changed(path); if (onChange) onChange(); });
    return el('span', { class: 'jdx-switch' }, [input, el('span')]);
  }

  function rangeCtl(path, min, max, step, fmt) {
    var input = el('input', { type: 'range', min: min, max: max, step: step });
    input.value = getPath(path);
    var out = el('output', { text: fmt(getPath(path)) });
    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      setPath(path, v);
      out.textContent = fmt(v);
      changed(path);
    });
    return el('div', { class: 'jdx-range' }, [input, out]);
  }

  function tiles(path, options, sketch) {
    var wrap = el('div', { class: 'jdx-tiles' });
    options.forEach(function (o) {
      var t = el('button', { class: 'jdx-tile' + (getPath(path) === o[0] ? ' is-active' : ''), type: 'button' }, [
        sketch ? sketch(o[0]) : null, el('strong', { text: o[1] }), o[2] ? el('small', { text: o[2] }) : null
      ]);
      t.addEventListener('click', function () {
        setPath(path, o[0]);
        wrap.querySelectorAll('.jdx-tile').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        changed(path);
      });
      wrap.appendChild(t);
    });
    return wrap;
  }

  // kleine schematische Vorschau der Media-Bar-Stile
  function styleSketch(style) {
    var s = el('div', { class: 'jdx-sketch' });
    function bar(css, cls) { var i = el('i', cls ? { class: cls } : null); Object.assign(i.style, css); s.appendChild(i); }
    if (style === 'cinema') {
      s.style.background = 'linear-gradient(90deg, #0d0b14 0%, rgba(13,11,20,.4) 55%, transparent), linear-gradient(135deg,#4b3a7a,#1f5a7a)';
      bar({ left: '8%', top: '40%', width: '38%', height: '9px' }); bar({ left: '8%', top: '58%', width: '30%', height: '5px', opacity: '.6' });
      bar({ left: '8%', top: '72%', width: '16%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'center') {
      s.style.background = 'radial-gradient(ellipse at 50% 60%, transparent, #0d0b14 85%), linear-gradient(135deg,#4b3a7a,#1f5a7a)';
      bar({ left: '30%', top: '36%', width: '40%', height: '9px' }); bar({ left: '25%', top: '54%', width: '50%', height: '5px', opacity: '.6' });
      bar({ left: '42%', top: '70%', width: '16%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'card') {
      s.style.background = '#0d0b14';
      bar({ left: '5%', top: '8%', width: '90%', height: '84%', background: 'linear-gradient(135deg,#4b3a7a,#1f5a7a)', borderRadius: '8px' });
      bar({ left: '10%', top: '44%', width: '42%', height: '40%', background: 'rgba(255,255,255,.18)', borderRadius: '6px' });
      bar({ left: '14%', top: '54%', width: '28%', height: '6px' }); bar({ left: '14%', top: '70%', width: '12%', height: '7px', borderRadius: '5px' }, 's-btn');
    } else if (style === 'split') {
      s.style.background = '#17141f';
      bar({ left: '40%', top: '0', width: '60%', height: '100%', background: 'linear-gradient(90deg,transparent,#4b3a7a 35%,#1f5a7a)', borderRadius: '0' });
      bar({ left: '8%', top: '36%', width: '28%', height: '9px' }); bar({ left: '8%', top: '54%', width: '24%', height: '5px', opacity: '.6' });
      bar({ left: '8%', top: '70%', width: '14%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'poster') {
      s.style.background = 'linear-gradient(135deg,#2c2440,#16303f)';
      bar({ left: '8%', top: '12%', width: '20%', height: '76%', background: 'linear-gradient(160deg,#7a5ab0,#2c6a8a)', borderRadius: '4px' });
      bar({ left: '36%', top: '36%', width: '36%', height: '9px' }); bar({ left: '36%', top: '54%', width: '44%', height: '5px', opacity: '.6' });
      bar({ left: '36%', top: '70%', width: '14%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'spotlight') {
      s.style.background = 'linear-gradient(270deg, #0d0b14 0%, rgba(13,11,20,.4) 55%, transparent), linear-gradient(135deg,#4b3a7a,#1f5a7a)';
      bar({ right: '8%', top: '40%', width: '38%', height: '9px' }); bar({ right: '8%', top: '58%', width: '30%', height: '5px', opacity: '.6' });
      bar({ right: '8%', top: '72%', width: '16%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'carousel') {
      s.style.background = '#0d0b14';
      bar({ left: '-6%', top: '18%', width: '24%', height: '64%', background: 'linear-gradient(135deg,#3a2f5c,#1f3f5a)', borderRadius: '6px', opacity: '.6' });
      bar({ right: '-6%', top: '18%', width: '24%', height: '64%', background: 'linear-gradient(135deg,#3a2f5c,#1f3f5a)', borderRadius: '6px', opacity: '.6' });
      bar({ left: '22%', top: '8%', width: '56%', height: '84%', background: 'linear-gradient(135deg,#5b46a0,#1f6a9a)', borderRadius: '7px' });
      bar({ left: '27%', top: '62%', width: '24%', height: '6px' }); bar({ left: '27%', top: '75%', width: '12%', height: '6px', borderRadius: '5px' }, 's-btn');
    } else if (style === 'stage') {
      s.style.background = 'linear-gradient(135deg,#2c2440,#16303f)';
      bar({ right: '6%', top: '14%', width: '50%', height: '72%', background: 'linear-gradient(135deg,#6a52b0,#2a7aa8)', borderRadius: '6px' });
      bar({ left: '7%', top: '38%', width: '30%', height: '8px' }); bar({ left: '7%', top: '54%', width: '26%', height: '5px', opacity: '.6' });
      bar({ left: '7%', top: '70%', width: '14%', height: '7px', borderRadius: '5px' }, 's-btn');
    } else if (style === 'diagonal') {
      s.style.background = '#17141f';
      bar({ left: '36%', top: '0', width: '64%', height: '100%', background: 'linear-gradient(135deg,#4b3a7a,#1f5a7a)', borderRadius: '0', clipPath: 'polygon(22% 0,100% 0,100% 100%,0 100%)' });
      bar({ left: '7%', top: '36%', width: '26%', height: '9px' }); bar({ left: '7%', top: '54%', width: '22%', height: '5px', opacity: '.6' });
      bar({ left: '7%', top: '70%', width: '13%', height: '8px', borderRadius: '6px' }, 's-btn');
    } else if (style === 'magazine') {
      s.style.background = '#17141f';
      bar({ left: '44%', top: '10%', width: '52%', height: '80%', background: 'linear-gradient(135deg,#4b3a7a,#1f5a7a)', borderRadius: '6px' });
      bar({ left: '7%', top: '18%', width: '14%', height: '14px', background: 'var(--jdx-accent)' });
      bar({ left: '7%', top: '46%', width: '30%', height: '8px' }); bar({ left: '7%', top: '62%', width: '26%', height: '5px', opacity: '.6' });
      bar({ left: '7%', top: '76%', width: '13%', height: '7px', borderRadius: '5px' }, 's-btn');
    } else if (style === 'minimal') {
      s.style.background = 'linear-gradient(0deg, #0d0b14 0%, transparent 60%), linear-gradient(135deg,#4b3a7a,#1f5a7a)';
      bar({ left: '35%', top: '58%', width: '30%', height: '8px' }); bar({ left: '42%', top: '74%', width: '16%', height: '7px', borderRadius: '5px' }, 's-btn');
    } else {
      s.style.background = '#0d0b14';
      bar({ left: '5%', top: '28%', width: '90%', height: '44%', background: 'linear-gradient(90deg,#1a1626,#4b3a7a 60%,#1f5a7a)', borderRadius: '6px' });
      bar({ left: '10%', top: '42%', width: '26%', height: '7px' }); bar({ left: '10%', top: '56%', width: '12%', height: '6px', borderRadius: '5px' }, 's-btn');
    }
    return s;
  }

  function themeGrid() {
    var grid = el('div', { class: 'jdx-themes' });
    Object.keys(THEMES).forEach(function (id) {
      var t = THEMES[id];
      var prevBg = t.liquid
        ? 'radial-gradient(circle at 20% 30%, ' + t.accent + 'cc, transparent 50%), radial-gradient(circle at 80% 20%, ' + t.accent2 + 'bb, transparent 50%), radial-gradient(circle at 60% 90%, ' + t.accent + '88, transparent 55%), ' + t.bg
        : t.glass
        ? 'radial-gradient(circle at 15% 20%, ' + t.accent + '99, transparent 55%), radial-gradient(circle at 85% 30%, ' + t.accent2 + '88, transparent 55%), ' + t.bg
        : t.bg;
      var prev = el('div', { class: 'jdx-theme-prev', style: { background: prevBg } }, [
        el('b', { style: { background: t.text } }), el('em', { style: { background: t.muted } }),
        el('u', { style: { background: 'linear-gradient(135deg,' + t.accent + ',' + t.accent2 + ')' } })
      ]);
      var b = el('button', { class: 'jdx-theme' + (S.theme === id ? ' is-active' : ''), type: 'button', title: t.name }, [
        prev, el('div', { class: 'jdx-theme-name', style: { background: t.surface, color: t.text } }, [t.name])
      ]);
      b.addEventListener('click', function () {
        S.theme = id;
        S.colors = {};
        S.glass = !!t.glass;
        S.liquid = !!t.liquid;
        changed('theme');
        renderTab();
      });
      grid.appendChild(b);
    });
    return grid;
  }

  function colorGrid() {
    var grid = el('div', { class: 'jdx-colors' });
    var p = palette();
    COLOR_KEYS.forEach(function (c) {
      var key = c[0];
      var input = el('input', { type: 'color', value: p[key] });
      var code = el('small', { text: p[key] + (S.colors[key] ? ' · eigen' : '') });
      var reset = el('button', { type: 'button', title: 'Auf Theme-Farbe zurücksetzen', text: '↺' });
      input.addEventListener('input', function () {
        S.colors[key] = input.value;
        code.textContent = input.value + ' · eigen';
        changed('colors');
      });
      reset.addEventListener('click', function () {
        delete S.colors[key];
        changed('colors');
        renderTab();
      });
      grid.appendChild(el('div', { class: 'jdx-color' }, [input, el('div', null, [el('strong', { text: c[1] }), code]), reset]));
    });
    return grid;
  }

  function hoverPreview() {
    var wrap = el('div', { class: 'jdx-preview-cards' });
    var p = palette();
    [['#4b3a7a', '#1f5a7a'], [p.accent, p.accent2], ['#7a3a4b', '#7a6a1f'], ['#1f7a5a', '#1f3a7a']].forEach(function (g) {
      wrap.appendChild(el('div', { class: 'card' }, [el('div', { class: 'cardBox' }, [el('div', { class: 'cardScalable' }, [
        el('div', { class: 'cardImageContainer', style: { background: 'linear-gradient(160deg,' + g[0] + ',' + g[1] + ')' } })
      ])])]));
    });
    return wrap;
  }

  function renderTab() {
    var root = document.getElementById('jdx-settings');
    if (!root) return;
    root.querySelectorAll('nav button[data-tab]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === activeTab); });
    var tab = TABS.filter(function (t) { return t.id === activeTab; })[0];
    root.querySelector('header h2').textContent = tab.label;
    var c = root.querySelector('.jdx-content');
    var scroll = c.scrollTop;
    c.textContent = '';
    var add = function (n) { c.appendChild(n); };
    var px = function (v) { return v + ' px'; };
    var sec = function (v) { return v + ' s'; };

    if (activeTab === 'design') {
      add(el('h3', { text: 'Theme' })); add(themeGrid());
      add(el('h3', { text: 'Eigene Farben' }));
      add(el('div', { class: 'jdx-row' }, [el('label', null, ['Farben anpassen', el('small', { text: 'Überschreibt einzelne Farben des gewählten Themes. ↺ setzt eine Farbe zurück.' })]),
        el('button', { class: 'jdx-b', type: 'button', text: 'Alle zurücksetzen', onclick: function () { S.colors = {}; changed('colors'); renderTab(); } })]));
      add(colorGrid());
      add(el('h3', { text: 'Darstellung' }));
      add(row('Hintergrund', 'Keine Bilder aus der Mediathek – nur Farbe', selectCtl('bgStyle', BG_STYLES)));
      add(row('Eckenradius', 'Karten, Schaltflächen und Dialoge', rangeCtl('radius', 0, 24, 1, px)));
      add(row('Schriftart', null, selectCtl('font', FONT_OPTS)));
      add(row('Glas-Optik', 'Kopfleiste, Menüs, Dialoge, Rubriken und Karten halbtransparent mit Unschärfe – bei den Glass-Themes automatisch an', toggleCtl('glass')));
      add(row('Liquid Glass', 'Schwebende Glas-Kopfleiste, Lichtkanten, Pillen-Buttons und bewegter Hintergrund – bei den Liquid-Themes automatisch an', toggleCtl('liquid')));
      add(row('Lichtbrechung', 'Liquid Glass verzerrt den Hintergrund wie echtes Glas (benötigt etwas mehr Grafikleistung)', toggleCtl('refraction')));
      add(row('Glas-Effekt für die Kopfleiste', 'Nur die Kopfleiste halbtransparent', toggleCtl('glassHeader')));
    } else if (activeTab === 'mediabar') {
      add(row('Media Bar anzeigen', 'Große Vorschau oben auf der Startseite', toggleCtl('mediaBar.enabled')));
      add(el('h3', { text: 'Stil' })); add(tiles('mediaBar.style', MB_STYLES, styleSketch));
      add(row('Höhe', 'Gilt nicht für „Kompakt“', selectCtl('mediaBar.height', HEIGHTS)));
      add(row('Indikator', null, selectCtl('mediaBar.indicator', INDICATORS)));
      add(el('h3', { text: 'Animation' }));
      add(row('Übergang', 'Wie die Bilder wechseln', selectCtl('mediaBar.animation', MB_ANIMS)));
      add(row('Übergangsdauer', 'Wie lange ein Wechsel dauert (größer = langsamer)', rangeCtl('mediaBar.transition', 0.3, 3, 0.1, function (v) { return v.toFixed(1) + ' s'; })));
      add(row('Text-Animation', 'Wie Titel, Infos und Buttons erscheinen', selectCtl('mediaBar.text', TEXT_ANIMS)));
      add(row('Anzeigedauer', 'Pro Titel', rangeCtl('mediaBar.interval', 4, 20, 1, sec)));
      add(row('Beim Überfahren mit der Maus anhalten', null, toggleCtl('mediaBar.pauseOnHover')));
      add(el('h3', { text: 'Inhalt' }));
      add(row('Auswahl', null, selectCtl('mediaBar.source', SOURCES)));
      var types = el('div', { class: 'jdx-checks' });
      [['Movie', 'Filme'], ['Series', 'Serien'], ['MusicAlbum', 'Musikalben'], ['BoxSet', 'Sammlungen']].forEach(function (t) {
        var cb = el('input', { type: 'checkbox' });
        cb.checked = S.mediaBar.types.indexOf(t[0]) >= 0;
        cb.addEventListener('change', function () {
          var list = S.mediaBar.types.filter(function (x) { return x !== t[0]; });
          if (cb.checked) list.push(t[0]);
          if (!list.length) { cb.checked = true; return; }
          S.mediaBar.types = list;
          changed('mediaBar.types');
        });
        types.appendChild(el('label', null, [cb, t[1]]));
      });
      add(row('Medientypen', null, types));
      add(row('Anzahl Titel', null, rangeCtl('mediaBar.count', 3, 20, 1, String)));
      add(row('Logo statt Titeltext', 'Falls ein Logo vorhanden ist', toggleCtl('mediaBar.showLogo')));
      add(row('Beschreibung', null, toggleCtl('mediaBar.showOverview')));
      add(row('Infos (Bewertung, Jahr, Laufzeit, Genres)', null, toggleCtl('mediaBar.showMeta')));
      add(el('h3', { text: 'Trailer' }));
      add(row('Trailer im Hintergrund', 'Startet kurz nach dem Wechsel, ersetzt das Bild', selectCtl('mediaBar.trailers', TRAILERS)));
      add(row('Trailer mit Ton starten', null, toggleCtl('mediaBar.trailerSound')));
      add(el('div', { class: 'jdx-buttons' }, [el('button', { class: 'jdx-b', type: 'button', text: 'Neue Titel laden', onclick: function () { refreshMediaBar(true); } })]));
    } else if (activeTab === 'ratings') {
      add(el('h3', { text: 'Quellen' }));
      add(row('IMDb', 'Benötigt einen OMDb-Schlüssel (unten) – ohne Schlüssel wird ersatzweise die Community-Bewertung (★) gezeigt', toggleCtl('ratings.imdb')));
      add(row('Rotten Tomatoes', 'Ohne Schlüssel: Kritiker-Wertung aus Jellyfin', toggleCtl('ratings.rt')));
      add(row('Metacritic', 'Benötigt einen OMDb-Schlüssel', toggleCtl('ratings.mc')));
      add(row('Community-Bewertung (★)', 'Bewertung aus den Jellyfin-Metadaten (meist TMDB)', toggleCtl('ratings.community')));
      add(el('h3', { text: 'Anzeige' }));
      add(row('In der Media Bar', null, toggleCtl('ratings.inMediaBar')));
      add(row('Auf Film- und Serienseiten', 'Unter der Infozeile (Jahr, Laufzeit …)', toggleCtl('ratings.onDetails')));
      add(row('Jellyfins eigene Sterne/Tomaten dort ausblenden', 'Vermeidet doppelte Angaben', toggleCtl('ratings.hideJellyfinRatings')));
      add(row('Größe', null, rangeCtl('ratings.size', 0.7, 1.8, 0.05, function (v) { return Math.round(v * 100) + ' %'; })));
      add(row('Darstellung', null, selectCtl('ratings.style', [['badges', 'Farbige Plaketten'], ['plain', 'Schlicht (nur Symbol und Wert)']])));
      add(el('h3', { text: 'OMDb-Schlüssel' }));
      var keyInput = el('input', { type: 'text', spellcheck: 'false', placeholder: 'z. B. a1b2c3d4', value: S.ratings.omdbKey || '' });
      keyInput.addEventListener('change', function () { S.ratings.omdbKey = keyInput.value.trim(); omdbMem = {}; changed('ratings.omdbKey'); });
      var keyOut = el('small', { class: 'jdx-keyout' });
      add(el('div', { class: 'jdx-row' }, [el('label', null, ['API-Schlüssel', el('small', { text: 'Kostenlos unter omdbapi.com → „API Key“ (1.000 Abfragen/Tag). Ergebnisse werden 14 Tage zwischengespeichert.' }), keyOut]),
        el('div', { class: 'jdx-range' }, [keyInput, el('button', { class: 'jdx-b', type: 'button', text: 'Testen', onclick: function () { S.ratings.omdbKey = keyInput.value.trim(); save(); testOmdbKey(keyOut); } })])]));
    } else if (activeTab === 'anim') {
      add(el('h3', { text: 'Hover über Poster und Medienfelder' }));
      add(tiles('hover', HOVERS));
      add(el('div', { class: 'jdx-row' }, [el('label', null, ['Vorschau', el('small', { text: 'Mit der Maus über die Karten fahren' })]), hoverPreview()]));
      add(el('h3', { text: 'Allgemein' }));
      add(row('Seitenwechsel', 'Animation beim Öffnen einer Seite', selectCtl('pageAnim', PAGE_ANIMS)));
      var sysReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      add(row('Animationen reduzieren', sysReduced
        ? 'Hinweis: In Windows sind „Animationseffekte“ ausgeschaltet. JellyDrax zeigt Animationen trotzdem, solange dieser Schalter aus ist.'
        : 'Schaltet Übergänge und Bewegungen weitgehend ab', toggleCtl('reduceMotion')));
      add(row('Geschwindigkeit', 'Faktor für alle Animationen (kleiner = schneller)', rangeCtl('speed', 0.5, 2, 0.1, function (v) { return v.toFixed(1) + '×'; })));
    } else if (activeTab === 'home') {
      add(row('Hintergrundbilder aus der Mediathek', 'Standard: aus – der Hintergrund bleibt einfarbig', toggleCtl('backdrops')));
      add(row('Banner auf Film- und Serienseiten', 'Farbverlauf statt Hintergrundbild oder das Bild des Titels', selectCtl('detailBanner', [['color', 'Farbverlauf (Theme)'], ['image', 'Bild des Titels']])));
      add(row('Rubriken-Reihe zentrieren', 'Die Bibliotheks-Buttons unter der Media Bar mittig ausrichten', toggleCtl('centerLibraries')));
      add(row('Titel der ersten Rubrik ausblenden', 'z. B. „Meine Medien“', toggleCtl('hideFirstTitle')));
      add(row('Media Bar eines Server-Plugins ausblenden', 'Verhindert doppelte Media Bars', toggleCtl('hidePluginBar')));
    } else if (activeTab === 'advanced') {
      if (needsReload) {
        add(el('div', { class: 'jdx-note' }, [el('span', { text: 'Diese Änderung wird nach dem Neuladen wirksam.' }),
          el('button', { class: 'jdx-b primary', type: 'button', text: 'Jetzt neu laden', onclick: function () { location.reload(); } })]));
      }
      add(row('Server-CSS ignorieren', 'Das unter Dashboard → Branding hinterlegte CSS (z. B. ElegantFin) wird nicht geladen. Plugins und Player bleiben unverändert.',
        toggleCtl('ignoreServerCss', function () { needsReload = true; renderTab(); })));
      add(el('h3', { text: 'Eigenes CSS' }));
      var ta = el('textarea', { spellcheck: 'false' });
      ta.value = S.customCss || '';
      var t;
      ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { S.customCss = ta.value; changed('customCss'); }, 300); });
      add(ta);
      add(el('h3', { text: 'Einstellungen' }));
      add(el('div', { class: 'jdx-buttons' }, [
        el('button', { class: 'jdx-b', type: 'button', text: 'Exportieren (Zwischenablage)', onclick: function (e) {
          var b = e.currentTarget;
          navigator.clipboard.writeText(JSON.stringify(S, null, 2)).then(function () { b.textContent = 'Kopiert ✓'; });
        } }),
        el('button', { class: 'jdx-b', type: 'button', text: 'Importieren', onclick: function () {
          var raw = prompt('JellyDrax-Einstellungen (JSON) einfügen:');
          if (!raw) return;
          try { S = merge(DEFAULTS, JSON.parse(raw)); changed('import'); refreshMediaBar(true); renderTab(); } catch (err) { alert('Ungültige Einstellungen: ' + err.message); }
        } }),
        el('button', { class: 'jdx-b danger', type: 'button', text: 'Alles zurücksetzen', onclick: function () {
          if (!confirm('Alle JellyDrax-Einstellungen auf Standard zurücksetzen?')) return;
          S = clone(DEFAULTS); changed('reset'); refreshMediaBar(true); renderTab();
        } })
      ]));
    }
    c.scrollTop = scroll;
  }

  function openSettings(tab) {
    if (tab) activeTab = tab;
    var existing = document.getElementById('jdx-settings');
    if (existing) { renderTab(); return; }
    var nav = el('nav', null, [
      el('div', { class: 'jdx-brand' }, [el('i'), el('div', null, ['JellyDrax', el('small', { text: 'Client-Einstellungen' })])])
    ]);
    TABS.forEach(function (t) {
      nav.appendChild(el('button', { type: 'button', 'data-tab': t.id, onclick: function () { activeTab = t.id; renderTab(); } }, [icon(t.icon), t.label]));
    });
    nav.appendChild(el('div', { class: 'jdx-spacer' }));
    nav.appendChild(el('div', { class: 'jdx-ver', text: 'Version ' + VERSION }));

    var root = el('div', { id: 'jdx-settings', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'JellyDrax-Einstellungen' }, [
      el('div', { class: 'jdx-panel' }, [
        nav,
        el('main', null, [
          el('header', null, [el('h2'), el('button', { class: 'jdx-close', type: 'button', title: 'Schließen (Esc)', text: '✕', onclick: closeSettings })]),
          el('div', { class: 'jdx-content' })
        ])
      ])
    ]);
    root.addEventListener('mousedown', function (e) { if (e.target === root) closeSettings(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeSettings(); } }, true);
    // Tastatureingaben nicht an Jellyfin weiterreichen (Shortcuts)
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }); });
    document.body.appendChild(root);
    renderTab();
    syncPause();
    var first = root.querySelector('nav button.is-active');
    if (first) first.focus();
  }

  function closeSettings() {
    var root = document.getElementById('jdx-settings');
    if (root) root.remove();
    syncPause();
  }

  // ----------------------------------------------- Button in der Kopfleiste

  var PALETTE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
  var headerMisses = 0;

  function removeFab() { var f = document.getElementById('jdx-fab'); if (f) f.remove(); }

  function isVisible(n) { return !!(n && n.getClientRects().length); }

  function ensureHeaderButton() {
    // Buttons in unsichtbaren Kopfleisten entfernen (Jellyfin 12 behält die alte Kopfleiste
    // versteckt im DOM – dort eingefügte Buttons sieht man nicht)
    document.querySelectorAll('.jdx-headerBtn, .jdx-toolbarBtn').forEach(function (b) { if (!isVisible(b)) b.remove(); });

    // a) moderne Kopfleiste (Jellyfin 10.11+/12.x, Standard)
    var toolbar = Array.prototype.filter.call(document.querySelectorAll('.MuiAppBar-root .MuiToolbar-root'), isVisible)[0];
    if (toolbar) {
      headerMisses = 0; removeFab();
      if (toolbar.querySelector('.jdx-toolbarBtn')) return;
      var ref = toolbar.querySelector('a[href*="search"]') ||
        toolbar.querySelector('[aria-label*="Such"], [aria-label*="Search"]');
      var like = ref || toolbar.querySelector('.MuiIconButton-root');
      var btn = document.createElement('button');
      btn.type = 'button';
      // gleiche Klassen wie der Such-Button -> identisches Aussehen
      btn.className = (like ? like.className.replace(/\bMui-disabled\b/g, '') : 'MuiButtonBase-root MuiIconButton-root') + ' jdx-toolbarBtn';
      btn.title = 'JellyDrax-Design (Strg+,)';
      btn.setAttribute('aria-label', 'JellyDrax-Design');
      btn.style.color = 'inherit';
      btn.innerHTML = PALETTE_SVG;
      btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openSettings(); });
      if (ref && ref.parentNode) ref.parentNode.insertBefore(btn, ref);
      else toolbar.insertBefore(btn, toolbar.lastElementChild);
      return;
    }

    // b) klassische Kopfleiste (Legacy-Layout / TV)
    var right = Array.prototype.filter.call(document.querySelectorAll('.skinHeader:not(.osdHeader) .headerRight'), isVisible)[0];
    if (right) {
      headerMisses = 0; removeFab();
      if (right.querySelector('.jdx-headerBtn')) return;
      var b = el('button', { type: 'button', class: 'headerButton headerButtonRight paper-icon-button-light jdx-headerBtn', title: 'JellyDrax-Design (Strg+,)' }, [icon('palette')]);
      b.addEventListener('click', function () { openSettings(); });
      var user = right.querySelector('.headerUserButton');
      right.insertBefore(b, user || null);
      return;
    }

    // c) keine sichtbare Kopfleiste -> schwebender Button (nicht im Player)
    if (/^#\/?video/.test(location.hash) || /\/video$/.test(location.pathname) || document.documentElement.classList.contains('transparentDocument')) { removeFab(); return; }
    if (!userId() || ++headerMisses < 4 || document.getElementById('jdx-fab')) return;
    var fab = document.createElement('button');
    fab.id = 'jdx-fab';
    fab.type = 'button';
    fab.title = 'JellyDrax-Design (Strg+,)';
    fab.innerHTML = PALETTE_SVG;
    fab.addEventListener('click', function () { openSettings(); });
    document.body.appendChild(fab);
  }

  // =============================================================== Start

  var started = false;

  function isJellyfin() {
    return !!(window.ApiClient || document.querySelector('.skinHeader, .mainAnimatedPages, #reactRoot .skinBody, .skinBody'));
  }

  function tick() {
    if (!started) {
      if (!isJellyfin()) return;
      started = true;
      applyAll();
    }
    ensureStyles();
    ensureHeaderButton();
    silencePluginBar();
    if (S.liquid) ensureLiquidFilter();
    refreshMediaBar(false);
    ensureDetailRatings();
  }

  window.JellyDrax = {
    version: VERSION,
    openSettings: openSettings,
    closeSettings: closeSettings,
    toggleSettings: function () { document.getElementById('jdx-settings') ? closeSettings() : openSettings(); },
    get settings() { return clone(S); },
    themes: THEMES,
    refresh: function () { refreshMediaBar(true); }
  };

  // Farben so früh wie möglich setzen (verhindert Aufblitzen des Standard-Themes)
  if (document.documentElement) {
    document.documentElement.classList.add('jdx');
  }
  document.addEventListener('DOMContentLoaded', tick);
  document.addEventListener('viewshow', function () { setTimeout(tick, 50); }, true);
  window.addEventListener('hashchange', function () { setTimeout(tick, 120); });
  window.addEventListener('popstate', function () { setTimeout(tick, 120); });
  window.addEventListener('scroll', updateHeroHeader, { passive: true });
  window.addEventListener('resize', function () { updatePull(); });
  document.addEventListener('visibilitychange', syncPause);
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') { e.preventDefault(); window.JellyDrax.toggleSettings(); }
    else if (e.key === 'Escape' && document.getElementById('jdx-settings')) { e.preventDefault(); e.stopPropagation(); closeSettings(); }
  }, true);
  setInterval(tick, 700);
  tick();
})();
