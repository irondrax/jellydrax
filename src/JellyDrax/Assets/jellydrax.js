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
      pauseOnHover: true
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
    // immer am Ende des <head>, damit sie nach Jellyfins Theme-CSS greifen
    [styleBase, styleVars, styleCustom].forEach(function (s) {
      if (s.parentNode !== head || s !== head.lastElementChild) head.appendChild(s);
    });
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
      '--jdx-accent2': p.accent2,
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
  }

  // ======================================================== Media Bar

  var MB = { el: null, items: [], idx: 0, key: '', loadedAt: 0, timer: null, timerEnd: 0, remaining: 0, paused: false, hovering: false, visible: false, loading: false, trailerTimer: null, muted: true };

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
    updatePull();
  }

  // Kino-Stil reicht bis unter die (dann transparente) Kopfleiste
  function updatePull() {
    if (!MB.el) return;
    MB.el.style.marginTop = '';
    if (S.mediaBar.style !== 'cinema' || !MB.visible) return;
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
      if (item.CommunityRating) bits.push(el('span', { class: 'jdx-star' }, ['★ ' + item.CommunityRating.toFixed(1)]));
      if (item.CriticRating) bits.push(el('span', { class: 'jdx-rt' }, ['🍅 ' + item.CriticRating + '%']));
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

    var body = el('div', { class: 'jdx-slide-body' }, [title, tagline, meta, overview, actions]);
    var backdrop = imageUrl(item, 'Backdrop', { maxWidth: 1920 });
    var poster = imageUrl(item, 'Primary', { maxHeight: 900 });

    return el('article', { class: 'jdx-slide', 'data-i': i, 'aria-roledescription': 'slide', 'aria-label': item.Name }, [
      el('div', { class: 'jdx-slide-media' }, [
        el('div', { class: 'jdx-slide-img', 'data-src': backdrop }),
        el('div', { class: 'jdx-slide-video' })
      ]),
      el('div', { class: 'jdx-slide-shade' }),
      el('div', { class: 'jdx-slide-poster', 'data-src': poster || backdrop }),
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
      prevSlide._leaveTimer = setTimeout(function () { prevSlide.classList.remove('is-leaving'); }, 1600 * (S.speed || 1));
    }
    var cur = all[i];
    lazyImages(cur);
    lazyImages(all[(i + 1) % all.length]);
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
    var shouldPause = !MB.visible || document.hidden || (S.mediaBar.pauseOnHover && MB.hovering) || !!document.getElementById('jdx-settings');
    if (shouldPause === MB.paused) return;
    MB.paused = shouldPause;
    if (!MB.el) return;
    MB.el.classList.toggle('is-paused', shouldPause);
    var v = MB.el.querySelector('.jdx-slide.is-active video');
    if (shouldPause) {
      clearTimeout(MB.timer);
      MB.remaining = Math.max(500, MB.timerEnd - Date.now());
      if (v) v.pause();
      if (!MB.visible) stopTrailer();
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
    var on = !!(MB.el && MB.visible && S.mediaBar.enabled && S.mediaBar.style === 'cinema' && window.scrollY < 60);
    document.documentElement.classList.toggle('jdx-hero-top', on);
  }

  // =================================================== Einstellungsfenster

  var TABS = [
    { id: 'design', label: 'Design', icon: 'palette' },
    { id: 'mediabar', label: 'Media Bar', icon: 'view_carousel' },
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
    ['compact', 'Kompakt', 'Flaches Banner ohne Beschreibung']
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
    if (path.indexOf('mediaBar.') === 0) {
      var p = path.slice(9);
      if (['source', 'types', 'count'].indexOf(p) >= 0) refreshMediaBar(true);
      else if (MB.el && ['showLogo', 'showOverview', 'showMeta', 'indicator', 'trailers'].indexOf(p) >= 0) renderSlides();
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
      var prev = el('div', { class: 'jdx-theme-prev', style: { background: t.bg } }, [
        el('b', { style: { background: t.text } }), el('em', { style: { background: t.muted } }),
        el('u', { style: { background: 'linear-gradient(135deg,' + t.accent + ',' + t.accent2 + ')' } })
      ]);
      var b = el('button', { class: 'jdx-theme' + (S.theme === id ? ' is-active' : ''), type: 'button', title: t.name }, [
        prev, el('div', { class: 'jdx-theme-name', style: { background: t.surface, color: t.text } }, [t.name])
      ]);
      b.addEventListener('click', function () {
        S.theme = id;
        S.colors = {};
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
      add(row('Glas-Effekt für die Kopfleiste', 'Halbtransparent mit Unschärfe', toggleCtl('glassHeader')));
    } else if (activeTab === 'mediabar') {
      add(row('Media Bar anzeigen', 'Große Vorschau oben auf der Startseite', toggleCtl('mediaBar.enabled')));
      add(el('h3', { text: 'Stil' })); add(tiles('mediaBar.style', MB_STYLES, styleSketch));
      add(row('Höhe', 'Gilt nicht für „Kompakt“', selectCtl('mediaBar.height', HEIGHTS)));
      add(row('Indikator', null, selectCtl('mediaBar.indicator', INDICATORS)));
      add(el('h3', { text: 'Animation' }));
      add(row('Übergang', 'Wie die Bilder wechseln', selectCtl('mediaBar.animation', MB_ANIMS)));
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
    } else if (activeTab === 'anim') {
      add(el('h3', { text: 'Hover über Poster und Medienfelder' }));
      add(tiles('hover', HOVERS));
      add(el('div', { class: 'jdx-row' }, [el('label', null, ['Vorschau', el('small', { text: 'Mit der Maus über die Karten fahren' })]), hoverPreview()]));
      add(el('h3', { text: 'Allgemein' }));
      add(row('Seitenwechsel', 'Animation beim Öffnen einer Seite', selectCtl('pageAnim', PAGE_ANIMS)));
      add(row('Geschwindigkeit', 'Faktor für alle Animationen (kleiner = schneller)', rangeCtl('speed', 0.5, 2, 0.1, function (v) { return v.toFixed(1) + '×'; })));
    } else if (activeTab === 'home') {
      add(row('Hintergrundbilder aus der Mediathek', 'Standard: aus – der Hintergrund bleibt einfarbig', toggleCtl('backdrops')));
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

  function ensureHeaderButton() {
    var right = document.querySelector('.skinHeader:not(.osdHeader) .headerRight');
    if (!right || right.querySelector('.jdx-headerBtn')) return;
    var b = el('button', { type: 'button', class: 'headerButton headerButtonRight paper-icon-button-light jdx-headerBtn', title: 'JellyDrax-Design (Strg+,)' }, [icon('palette')]);
    b.addEventListener('click', function () { openSettings(); });
    var user = right.querySelector('.headerUserButton');
    right.insertBefore(b, user || null);
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
    refreshMediaBar(false);
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
  });
  setInterval(tick, 700);
  tick();
})();
