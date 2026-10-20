/* ═══════════════════════════════════════════════════════════════════════
   CAHIER NUMÉRIQUE ACHIM v4.1
   Application universelle, frugale et résiliente
   - i18n complet
   - Corrections de syntaxe (guide, history, url, library)
   - Traductions des modales, toasts, prompts
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   INTERNATIONALISATION (i18n)
   ═══════════════════════════════════════════════════════════ */
const I18N = {
  availableLangs: ['fr', 'ht', 'en', 'es'],
  defaultLang: 'fr',
  currentLang: 'fr',
  translations: {},
  cache: {},
  langNames: { fr: 'Français', ht: 'Kreyòl', en: 'English', es: 'Español' },
  langFlags: { fr: '🇫🇷', ht: '🇭🇹', en: '🇬🇧', es: '🇪🇸' },

  async init() {
    const saved = localStorage.getItem('cahier-achim-lang');
    let lang = this.defaultLang;
    if (saved && this.availableLangs.includes(saved)) {
      lang = saved;
    } else {
      const browserLang = (navigator.language || 'fr').substring(0, 2);
      if (this.availableLangs.includes(browserLang)) lang = browserLang;
    }
    // Toujours charger fr en fallback
    this.cache.fr = await this.load('fr');
    await this.setLang(lang);
    console.log(`🌐 Langue : ${lang}`);
  },

  async load(lang) {
    if (this.cache[lang]) return this.cache[lang];
    try {
      const response = await fetch(`./locales/${lang}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.cache[lang] = data;
      return data;
    } catch (err) {
      console.warn(`⚠️ Impossible de charger ${lang}.json, fallback fr`);
      if (lang !== 'fr') return this.load('fr');
      return {};
    }
  },

  async setLang(lang) {
    if (!this.availableLangs.includes(lang)) lang = this.defaultLang;
    this.currentLang = lang;
    this.translations = await this.load(lang);
    localStorage.setItem('cahier-achim-lang', lang);
    document.documentElement.lang = lang;
    this.apply();
    this.updateLangButton();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  },

  t(key, vars = {}) {
    let text = this.translations[key];
    if (!text) {
      if (this.currentLang !== 'fr' && this.cache.fr) text = this.cache.fr[key];
      if (!text) {
        console.warn(`[i18n] Clé manquante : "${key}" (lang: ${this.currentLang})`);
        return key;
      }
    }
    return text.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
  },

   apply() {
    // 1. Texte simple (textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (text && text !== key) {
        el.textContent = text;
      }
    });

    // 2. Texte riche avec HTML (innerHTML) — NOUVEAU
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      const html = this.t(key);
      if (html && html !== key) {
        el.innerHTML = html;
      }
    });

    // 3. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const text = this.t(key);
      if (text) el.placeholder = text;
    });

    // 4. Titres (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const text = this.t(key);
      if (text) el.title = text;
    });

    // 5. ARIA labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      const text = this.t(key);
      if (text) el.setAttribute('aria-label', text);
    });

    // 6. Meta content
    document.querySelectorAll('[data-i18n-content]').forEach(el => {
      const key = el.dataset.i18nContent;
      const text = this.t(key);
      if (text) el.setAttribute('content', text);
    });

    // 7. Re-render dynamique
    try {
      if (typeof renderStickers === 'function') renderStickers();
      if (typeof updateSubjectBadge === 'function') updateSubjectBadge();
      if (typeof updateProfileBtn === 'function') updateProfileBtn();
      if (typeof applyLevel === 'function') applyLevel(getCurrentLevel());
      if (typeof initToolButtons === 'function') {
        initToolButtons();
        if (typeof state !== 'undefined' && state.tool && typeof toolButtons !== 'undefined' && toolButtons[state.tool]) {
          Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
          toolButtons[state.tool].classList.add('active');
        }
      }
    } catch (e) {
      console.warn('[i18n] Erreur re-render :', e);
    }
  },

  updateLangButton() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    const flag = this.langFlags[this.currentLang] || '🌐';
    btn.textContent = flag;
    btn.title = `${this.langNames[this.currentLang] || this.currentLang} — ${this.t('language.select')}`;
  },

  async next() {
    const idx = this.availableLangs.indexOf(this.currentLang);
    const nextLang = this.availableLangs[(idx + 1) % this.availableLangs.length];
    await this.setLang(nextLang);
    if (typeof showToast === 'function') showToast(this.langFlags[nextLang], this.t('language.changed'));
  },

  openPicker() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const cards = this.availableLangs.map(lang => {
      const active = lang === this.currentLang ? 'active' : '';
      return `<div class="lang-card ${active}" data-lang="${lang}">
        <span class="lang-flag">${this.langFlags[lang]}</span>
        <span class="lang-name">${this.langNames[lang]}</span>
      </div>`;
    }).join('');
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px">
        <h2 style="margin-top:0;color:var(--achim-bleu)">🌐 ${this.t('language.select')}</h2>
        <div class="lang-grid">${cards}</div>
        <button class="modal-close" style="width:100%;margin-top:16px">${this.t('action.close')}</button>
      </div>`;
    modal.querySelectorAll('.lang-card').forEach(card => {
      card.onclick = async () => {
        await this.setLang(card.dataset.lang);
        modal.remove();
        if (typeof showToast === 'function') {
          showToast(this.langFlags[card.dataset.lang], this.t('language.changed'));
        }
      };
    });
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    document.body.appendChild(modal);
  }
};

function t(key, vars = {}) { return I18N.t(key, vars); }

/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN
   ═══════════════════════════════════════════════════════════ */
const SplashScreen = {
  element: null,
  progressBar: null,
  statusText: null,
  startTime: Date.now(),
  minDisplayTime: 1200,

  init() {
    this.element = document.getElementById('splash-screen');
    this.progressBar = document.getElementById('splashProgress');
    this.statusText = document.getElementById('splashStatus');
  },

  update(percent, status) {
    if (!this.progressBar) return;
    const clamped = Math.max(0, Math.min(100, percent));
    this.progressBar.style.width = clamped + '%';
    const progressContainer = this.element?.querySelector('.splash-progress');
    if (progressContainer) progressContainer.setAttribute('aria-valuenow', Math.round(clamped));
    if (status && this.statusText) {
      this.statusText.style.opacity = '0';
      setTimeout(() => {
        this.statusText.textContent = status;
        this.statusText.style.opacity = '1';
      }, 100);
    }
  },

  async hide() {
    if (!this.element) return;
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.minDisplayTime - elapsed);
    if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
    this.update(100, 'Prêt !');
    await new Promise(r => setTimeout(r, 300));
    const empty = document.getElementById('empty');
    if (empty) {
      empty.style.opacity = '0';
      empty.style.transition = 'opacity 0.6s ease-out';
      void empty.offsetHeight;
      requestAnimationFrame(() => { empty.style.opacity = '1'; });
    }
    this.element.classList.add('hidden');
    setTimeout(() => {
      if (this.element && this.element.parentNode) this.element.remove();
    }, 600);
  },

  showError(message, onRetry) {
    if (!this.statusText) return;
    const progressBar = this.element?.querySelector('.splash-progress');
    if (progressBar) progressBar.style.display = 'none';
    this.statusText.textContent = message;
    this.statusText.style.color = '#ff8a8a';
    if (onRetry && !this.element.querySelector('.splash-retry-btn')) {
      const btn = document.createElement('button');
      btn.className = 'splash-retry-btn';
      btn.textContent = '🔄 Réessayer';
      btn.onclick = onRetry;
      this.statusText.parentNode.appendChild(btn);
    }
  }
};

SplashScreen.init();

/* ═══════════════════════════════════════════════════════════
   1. CONFIG INSTITUTION
   ═══════════════════════════════════════════════════════════ */
window.INSTITUTION = {
  nom: 'École ACHIM',
  produit: 'Cahier Numérique ACHIM',
  version: '4.1',
  anneeScolaire: '2025-2026',
  email: 'academie.achim@gmail.com',
  siteWeb: 'https://academieachim-cloud.github.io/cahier-achim/',
  slogan: 'Un cahier pour chaque élève, de la maternelle au lycée.',
  couleurs: { primaire: '#1A3E62', secondaire: '#337C44' }
};
const ACHIM = window.INSTITUTION;

const LEVELS = {
  maternelle: { label: 'Maternelle', emoji: '🧸', color: '#e91e63',
    subjects: ['cahier','lecture','ecriture','maths','decouverte','chants'],
    showGuides: true, showStickers: true, showRuler: false, showProtractor: false,
    vocab: { work: 'Activité', subject: 'Atelier', send: 'Envoyer à la maîtresse' } },
  cp: { label: 'CP / CE1', emoji: '✏️', color: '#f39c12',
    subjects: ['cahier','francais','kreyol','maths','lecture','ecriture','sciences','decouverte'],
    showGuides: true, showStickers: true, showRuler: true, showProtractor: false,
    vocab: { work: 'Exercice', subject: 'Matière', send: 'Envoyer à l\'école' } },
  ce2: { label: 'CE2 / CM1', emoji: '📚', color: '#3498db',
    subjects: ['cahier','francais','maths','sciences','histoire','geographie','anglais','arts'],
    showGuides: false, showStickers: true, showRuler: true, showProtractor: true,
    vocab: { work: 'Devoir', subject: 'Matière', send: 'Envoyer au professeur' } },
  cm2: { label: 'CM2 / 6e', emoji: '🎓', color: '#9b59b6',
    subjects: ['cahier','francais','maths','sciences','histoire','geographie','anglais','arts','emc'],
    showGuides: false, showStickers: false, showRuler: true, showProtractor: true,
    vocab: { work: 'Devoir', subject: 'Matière', send: 'Envoyer au professeur' } },
  college: { label: 'Collège / Lycée', emoji: '🏫', color: '#16a085',
    subjects: ['cahier','francais','maths','physique','svt','histoire','geographie','anglais','espagnol','philo','ses'],
    showGuides: false, showStickers: false, showRuler: true, showProtractor: true,
    vocab: { work: 'Devoir', subject: 'Matière', send: 'Envoyer au professeur' } },
  adulte: { label: 'Adulte / Formation', emoji: '💼', color: '#34495e',
    subjects: ['cahier','francais','maths','informatique','gestion','langues'],
    showGuides: false, showStickers: false, showRuler: true, showProtractor: true,
    vocab: { work: 'Document', subject: 'Thème', send: 'Envoyer' } }
};
const LEVEL_KEY = 'cahier-achim-level';

const SUBJECTS = {
  cahier:{ emoji:'✍️', name:'Cahier', color:'#7f8c8d' },
  francais:{ emoji:'📕', name:'Français', color:'#1A3E62' },
  kreyol:{ emoji:'🇭🇹', name:'Kreyòl', color:'#337C44' },
  anglais:{ emoji:'🇬🇧', name:'Anglais', color:'#3498db' },
  espagnol:{ emoji:'🇪🇸', name:'Espagnol', color:'#e67e22' },
  langues:{ emoji:'🌍', name:'Langues', color:'#16a085' },
  maths:{ emoji:'🔢', name:'Maths', color:'#e74c3c' },
  lecture:{ emoji:'📖', name:'Lecture', color:'#9b59b6' },
  ecriture:{ emoji:'✏️', name:'Écriture', color:'#e67e22' },
  sciences:{ emoji:'🔬', name:'Sciences', color:'#16a085' },
  decouverte:{ emoji:'🌍', name:'Découverte', color:'#27ae60' },
  chants:{ emoji:'🎵', name:'Chants', color:'#e91e63' },
  histoire:{ emoji:'🏛️', name:'Histoire', color:'#8b4513' },
  geographie:{ emoji:'🗺️', name:'Géographie', color:'#27ae60' },
  physique:{ emoji:'⚗️', name:'Physique-Chimie', color:'#3498db' },
  svt:{ emoji:'🧬', name:'SVT', color:'#27ae60' },
  philo:{ emoji:'🤔', name:'Philosophie', color:'#34495e' },
  ses:{ emoji:'📊', name:'SES', color:'#e67e22' },
  emc:{ emoji:'⚖️', name:'EMC', color:'#95a5a6' },
  arts:{ emoji:'🎨', name:'Arts', color:'#e91e63' },
  informatique:{ emoji:'💻', name:'Informatique', color:'#3498db' },
  gestion:{ emoji:'💼', name:'Gestion', color:'#34495e' }
};

const STICKERS_BY_LEVEL = {
  maternelle:['⭐','🌟','🎉','👏','💖','🏆','😊','🦄','🐶','🐱','🌸','🚗'],
  cp:['⭐','🌟','🎉','👏','💖','🏆','😊','🦄','🐶','🐱','🌸','🚗'],
  ce2:['⭐','🎉','👍','💯','🔥','💡','📌','✅'],
  cm2:['⭐','✅','💯','🔥','📌','💡'],
  college:['✅','📌','💡','⭐','📊','🔍'],
  adulte:['✅','📌','💡','📊','🔍']
};

const EMAILJS_CONFIG = {
  publicKey: localStorage.getItem('cahier-emailjs-pub') || 'REMPLACE_TA_PUBLIC_KEY',
  serviceId: localStorage.getItem('cahier-emailjs-svc') || 'REMPLACE_TON_SERVICE_ID',
  templateId: localStorage.getItem('cahier-emailjs-tpl') || 'REMPLACE_TON_TEMPLATE_ID'
};

/* ═══════════════════════════════════════════════════════════
   2. ÉTAT GLOBAL
   ═══════════════════════════════════════════════════════════ */
const state = {
  pdfDoc: null, imageBitmaps: [], numPages: 0, currentPage: 1,
  scale: 1.6, zoom: 1, tool: 'pen', color: '#000000', size: 5,
  bgMode: 'none', twoPages: false, selectedSticker: '⭐',
  drawData: {}, bgData: {}, activeStroke: null,
  globalHistory: [], globalHistoryIndex: -1, fileHash: null,
  student: { name: '', classe: '', ecole: ACHIM.nom, emailEcole: ACHIM.email },
  subject: 'cahier', source: { type: null, pdfName: '', pdfBlob: null, images: [] },
  sessionStart: Date.now(), workName: '', currentWorkId: null,
  renderedPages: new Set(), collageMode: false, selectedClip: null,
  customClips: [], schoolLogo: null, textSelectMode: false
};

const toolButtons = {};
const EXTRA_SHAPES = ['pentagon','hexagon','heart','arrow','speech','music'];
const DRAW_TOOLS = [
  { id: 'toolPen', tool: 'pen', emoji: '✏️', titleKey: 'toolbar.pen', active: true },
  { id: 'toolHighlighter', tool: 'highlighter', emoji: '🖍️', titleKey: 'toolbar.highlighter' },
  { id: 'toolEraser', tool: 'eraser', emoji: '🧽', titleKey: 'toolbar.eraser' },
  { id: 'toolLine', tool: 'line', emoji: '📏', titleKey: 'toolbar.line' },
  { id: 'toolCircle', tool: 'circle', emoji: '⭕', titleKey: 'toolbar.circle' },
  { id: 'toolRect', tool: 'rect', emoji: '▭', titleKey: 'toolbar.rect' },
  { id: 'toolTriangle', tool: 'triangle', emoji: '△', titleKey: 'toolbar.triangle' },
  { id: 'toolStar', tool: 'star', emoji: '⭐', titleKey: 'toolbar.star' },
  { id: 'toolPentagon', tool: 'pentagon', emoji: '⬟', titleKey: 'toolbar.pentagon' },
  { id: 'toolHexagon', tool: 'hexagon', emoji: '⬢', titleKey: 'toolbar.hexagon' },
  { id: 'toolHeart', tool: 'heart', emoji: '❤️', titleKey: 'toolbar.heart' },
  { id: 'toolArrow', tool: 'arrow', emoji: '➡️', titleKey: 'toolbar.arrow' },
  { id: 'toolSpeech', tool: 'speech', emoji: '💬', titleKey: 'toolbar.speech' },
  { id: 'toolMusic', tool: 'music', emoji: '🎵', titleKey: 'toolbar.music' },
  { id: 'toolText', tool: 'text', emoji: '🅰️', titleKey: 'toolbar.text' },
  { id: 'toolSticker', tool: 'sticker', emoji: '😊', titleKey: 'toolbar.sticker' },
  { id: 'toolCollage', tool: 'collage', emoji: '✂️', titleKey: 'toolbar.collage', cssClass: 'collage' },
  { id: 'btnTextSelect', tool: 'textSelect', emoji: '🗣️', titleKey: 'toolbar.listen', cssClass: 'text-select' }
];

/* ═══════════════════════════════════════════════════════════
   3. UTILITAIRES
   ═══════════════════════════════════════════════════════════ */
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function generateId(prefix = 'clip') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}
function setLoading(show, text) {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const progressBar = document.getElementById('progressBar');
  if (!loading) return;
  if (show) {
    loadingText.textContent = text || t('message.loading');
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
    if (progressBar) progressBar.style.width = '0%';
  }
}
function showToast(emoji, msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `${emoji}<small>${msg}</small>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}
function buildFileName(prefix, ext) {
  const name = (state.student.name || 'Eleve').replace(/\s+/g, '_');
  const subj = t('subject.' + state.subject) || 'Cahier';
  return `ACHIM_${name}_${subj}_${todayStr()}.${ext}`;
}
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
function arrayBufferToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
async function compressImage(dataURL, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
}
async function compressPNG(dataURL, maxWidth = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
}
function loadImageFromDataURL(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataURL;
  });
}
function svgToDataURL(svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/* ═══════════════════════════════════════════════════════════
   4. INDEXEDDB
   ═══════════════════════════════════════════════════════════ */
const DB_NAME = 'cahier-achim-db';
const DB_VERSION = 2;
const STORE = 'works';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('subject', 'subject');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(work) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(work);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ═══════════════════════════════════════════════════════════
   5. THÈME
   ═══════════════════════════════════════════════════════════ */
const THEME_KEY = 'cahier-achim-theme';
let themeMode = 'auto';

function getEffectiveTheme() {
  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  const h = new Date().getHours();
  return (h >= 7 && h < 19) ? 'light' : 'dark';
}
function applyTheme() {
  const eff = getEffectiveTheme();
  document.documentElement.setAttribute('data-theme', eff);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    if (themeMode === 'auto') btn.textContent = eff === 'light' ? '🌤️' : '🌙';
    else if (themeMode === 'light') btn.textContent = '☀️';
    else btn.textContent = '🌙';
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
    eff === 'light' ? '#ffffff' : ACHIM.couleurs.primaire);
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'auto';
  themeMode = ['auto','light','dark'].includes(saved) ? saved : 'auto';
  applyTheme();
  setInterval(() => { if (themeMode === 'auto') applyTheme(); }, 5*60*1000);
}
function toggleTheme() {
  themeMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto';
  localStorage.setItem(THEME_KEY, themeMode);
  applyTheme();
  const labels = { auto: '🌤️ Auto', light: '☀️ Clair', dark: '🌙 Sombre' };
  showToast(labels[themeMode], t('customBg.applied'));
}

/* ═══════════════════════════════════════════════════════════
   6. NIVEAUX SCOLAIRES
   ═══════════════════════════════════════════════════════════ */
function getCurrentLevel() {
  const saved = localStorage.getItem(LEVEL_KEY);
  return saved && LEVELS[saved] ? saved : 'cp';
}
function setCurrentLevel(levelKey) {
  if (!LEVELS[levelKey]) return;
  localStorage.setItem(LEVEL_KEY, levelKey);
  applyLevel(levelKey);
  renderStickers();
  updateSubjectBadge();
}
function applyLevel(levelKey) {
  const level = LEVELS[levelKey] || LEVELS.cp;
  document.body.dataset.level = levelKey;
  const btnGuideLetter = document.getElementById('btnGuideLetter');
  const btnGuideNumber = document.getElementById('btnGuideNumber');
  const btnRuler = document.getElementById('btnRuler');
  const btnProtractor = document.getElementById('btnProtractor');
  if (btnGuideLetter) btnGuideLetter.style.display = level.showGuides ? '' : 'none';
  if (btnGuideNumber) btnGuideNumber.style.display = level.showGuides ? '' : 'none';
  if (btnRuler) btnRuler.style.display = level.showRuler ? '' : 'none';
  if (btnProtractor) btnProtractor.style.display = level.showProtractor ? '' : 'none';
  updateStickerBarVisibility();
  const badge = document.getElementById('levelBadge');
  if (badge) {
    badge.textContent = `${level.emoji} ${t('level.' + levelKey)}`;
    badge.style.background = level.color;
  }
  const footerBadge = document.getElementById('footerBadge');
  if (footerBadge) footerBadge.textContent = t('level.' + levelKey);
}

function updateStickerBarVisibility() {
  const stickerBarEl = document.getElementById('stickerBar');
  if (!stickerBarEl) return;
  const levelKey = localStorage.getItem('cahier-achim-level') || 'cp';
  const level = (typeof LEVELS !== 'undefined' && LEVELS[levelKey]) ? LEVELS[levelKey] : { showStickers: true };
  const hasDocument = (typeof state !== 'undefined') && state.numPages > 0;
  const isDrawing = (typeof state !== 'undefined') && !state.collageMode && !state.textSelectMode;
  if (hasDocument && isDrawing && level.showStickers) stickerBarEl.classList.add('show');
  else stickerBarEl.classList.remove('show');
}
function openLevelPicker(forceShow = false) {
  const isFirstTime = !localStorage.getItem(LEVEL_KEY);
  if (!isFirstTime && !forceShow) return;
  const modal = document.createElement('div');
  modal.className = 'modal level-picker-modal';
  const current = getCurrentLevel();
  const cards = Object.entries(LEVELS).map(([key, lv]) => `
    <div class="level-card ${key === current ? 'active' : ''}" data-key="${key}" style="--level-color: ${lv.color}">
      <span class="level-emoji">${lv.emoji}</span>
      <span class="level-label">${t('level.' + key)}</span>
    </div>
  `).join('');
  modal.innerHTML = `
    <div class="modal-content" style="max-width:640px">
      <h2 style="margin-top:0;color:var(--achim-bleu)">🎓 ${t('level.question')}</h2>
      <p style="color:#7f8c8d;font-size:14px">${t('level.description')}</p>
      <div class="level-grid">${cards}</div>
      <button class="modal-close" style="width:100%;margin-top:16px">${t('action.close')}</button>
    </div>`;
  modal.querySelectorAll('.level-card').forEach(card => {
    card.onclick = () => {
      setCurrentLevel(card.dataset.key);
      modal.remove();
      const lv = LEVELS[card.dataset.key];
      showToast(lv.emoji, t('level.changed'));
    };
  });
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  document.body.appendChild(modal);
}
function renderStickers() {
  const level = getCurrentLevel();
  const stickers = STICKERS_BY_LEVEL[level] || STICKERS_BY_LEVEL.cp;
  const bar = document.getElementById('stickerBar');
  if (!bar) return;
  bar.innerHTML = stickers.map(s => `<button data-sticker="${s}">${s}</button>`).join('');
  bar.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      state.selectedSticker = btn.dataset.sticker;
      state.tool = 'sticker';
      Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
      if (toolButtons.sticker) toolButtons.sticker.classList.add('active');
    };
  });
}

/* ═══════════════════════════════════════════════════════════
   7. PROFIL
   ═══════════════════════════════════════════════════════════ */
const PROFILE_KEY = 'cahier-achim-profile';
const AUTOSAVE_KEY = 'cahier-achim-autosave';
const AUTOSAVE_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const CUSTOM_CLIPS_KEY = 'cahier-achim-clips';

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) state.student = { ...state.student, ...JSON.parse(raw) };
    if (!state.student.ecole) state.student.ecole = ACHIM.nom;
    if (!state.student.emailEcole) state.student.emailEcole = ACHIM.email;
  } catch {}
  updateProfileBtn();
}
function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.student)); } catch {}
  updateProfileBtn();
}
function updateProfileBtn() {
  const name = state.student.name || t('toolbar.profile');
  const pn = document.getElementById('profileName');
  const pa = document.getElementById('profileAvatar');
  if (pn) pn.textContent = name.split(' ')[0] || '?';
  if (pa) pa.textContent = (state.student.name || '?')[0].toUpperCase();
}
function openProfileModal() {
  const modal = document.createElement('div');
  modal.className = 'modal form-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>👤 ${t('profile.title', { school: ACHIM.nom })}</h2>
      <label class="modal-label">${t('profile.name')}</label>
      <input id="pName" type="text" value="${escapeHtml(state.student.name)}" placeholder="${t('profile.namePlaceholder')}">
      <label class="modal-label">${t('profile.class')}</label>
      <input id="pClasse" type="text" value="${escapeHtml(state.student.classe)}" placeholder="${t('profile.classPlaceholder')}">
      <label class="modal-label">${t('profile.school')}</label>
      <input id="pEcole" type="text" value="${escapeHtml(state.student.ecole)}" readonly style="background:#f0f0f0">
      <label class="modal-label">${t('profile.email')}</label>
      <input id="pEmail" type="email" value="${escapeHtml(state.student.emailEcole)}" readonly style="background:#f0f0f0">
      <div class="actions-modal">
        <button class="secondary" id="pCancel">${t('action.cancel')}</button>
        <button class="primary" id="pSave">${t('action.save')}</button>
      </div>
    </div>`;
  modal.querySelector('#pCancel').onclick = () => modal.remove();
  modal.querySelector('#pSave').onclick = () => {
    state.student.name = modal.querySelector('#pName').value.trim();
    state.student.classe = modal.querySelector('#pClasse').value.trim();
    state.student.ecole = ACHIM.nom;
    state.student.emailEcole = ACHIM.email;
    saveProfile();
    modal.remove();
    showToast('👤', t('profile.saved'));
  };
  document.body.appendChild(modal);
}

/* ═══════════════════════════════════════════════════════════
   8. MATIÈRES
   ═══════════════════════════════════════════════════════════ */
function updateSubjectBadge() {
  const s = SUBJECTS[state.subject] || SUBJECTS.cahier;
  const e = document.getElementById('subjectEmoji');
  const n = document.getElementById('subjectName');
  const w = document.getElementById('subjectWorkName');
  if (e) e.textContent = s.emoji;
  if (n) n.textContent = t('subject.' + state.subject);
  if (w) w.textContent = state.workName ? `« ${state.workName} »` : '';
  const badge = document.getElementById('subjectBadge');
  if (badge) {
    badge.style.borderColor = s.color;
    badge.style.color = s.color;
  }
}
function openSubjectPicker() {
  const level = LEVELS[getCurrentLevel()] || LEVELS.cp;
  const availableSubjects = {};
  level.subjects.forEach(key => { if (SUBJECTS[key]) availableSubjects[key] = SUBJECTS[key]; });
  const modal = document.createElement('div');
  modal.className = 'modal';
  const cards = Object.entries(availableSubjects).map(([key, s]) => `
    <div class="subj-card ${state.subject === key ? 'active' : ''}" data-key="${key}"
         style="background:${s.color}20;border-color:${state.subject === key ? s.color : 'transparent'}">
      <span class="emoji">${s.emoji}</span><span class="name">${t('subject.' + key)}</span>
    </div>
  `).join('');
  modal.innerHTML = `
    <div class="modal-content" style="max-width:560px">
      <h2 style="margin-top:0;color:var(--achim-bleu)">🎨 ${t('subjectPicker.title')}</h2>
      <p style="font-size:12px;color:#7f8c8d;margin-top:0">
        ${level.emoji} ${t('level.' + getCurrentLevel())}
      </p>
      <div class="subject-picker">${cards}</div>
      <label class="modal-label">${t('subjectPicker.workName')}</label>
      <input type="text" id="workNameInput" value="${escapeHtml(state.workName)}" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;font-size:15px;margin-top:4px">
      <button class="modal-close" style="width:100%;margin-top:12px">${t('action.close')}</button>
    </div>`;
  modal.querySelectorAll('.subj-card').forEach(card => {
    card.onclick = () => {
      state.subject = card.dataset.key;
      state.workName = modal.querySelector('#workNameInput').value.trim();
      updateSubjectBadge(); modal.remove(); scheduleSave();
    };
  });
  modal.querySelector('.modal-close').onclick = () => {
    state.workName = modal.querySelector('#workNameInput').value.trim();
    updateSubjectBadge(); modal.remove(); scheduleSave();
  };
  document.body.appendChild(modal);
}

/* ═══════════════════════════════════════════════════════════
   9. VOIX / SYNTHÈSE VOCALE
   ═══════════════════════════════════════════════════════════ */
let currentSelectedText = '';

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  if (!text || text.trim().length === 0) return;
  const cleanText = text
    .replace(/n°\s*([0-9]+)/gi, 'numero $1')
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, ', ')
    .replace(/[^\w\s\u00C0-\u017F.,!?;:''-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleanText.length < 2) return;
  const u = new SpeechSynthesisUtterance(cleanText);
  u.lang = 'fr-FR';
  u.rate = 0.9;
  const fr = speechSynthesis.getVoices().find(v => v.lang.startsWith('fr'));
  if (fr) u.voice = fr;
  window._currentUtterance = u;
  speechSynthesis.speak(u);
}
function initTextSelection() {
  const btnTextSelect = document.getElementById('btnTextSelect');
  const textContextMenu = document.getElementById('textContextMenu');
  if (!btnTextSelect) return;
  btnTextSelect.onclick = () => {
    state.textSelectMode = !state.textSelectMode;
    btnTextSelect.classList.toggle('active', state.textSelectMode);
    document.body.classList.toggle('text-select-mode', state.textSelectMode);
    if (state.textSelectMode && state.collageMode) exitCollageMode();
    updateStickerBarVisibility();
    showToast(state.textSelectMode ? '🗣️' : '✏️',
      state.textSelectMode ? t('toolbar.listen') : t('toolbar.pen'));
  };
  function handleTextSelection() {
    if (!state.textSelectMode) return;
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text.length > 0 && textContextMenu) {
      currentSelectedText = text;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      textContextMenu.style.display = 'flex';
      textContextMenu.style.top = (window.scrollY + rect.top - 55) + 'px';
      textContextMenu.style.left = (window.scrollX + rect.left + (rect.width / 2) - (textContextMenu.offsetWidth / 2)) + 'px';
    }
  }
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('touchend', () => setTimeout(handleTextSelection, 100));
  document.addEventListener('mousedown', (e) => {
    if (!textContextMenu) return;
    if (!textContextMenu.contains(e.target) && !e.target.closest('#btnTextSelect')) textContextMenu.style.display = 'none';
  });
  document.getElementById('ctxSpeak').onclick = () => { if (currentSelectedText) speakText(currentSelectedText); textContextMenu.style.display = 'none'; };
  document.getElementById('ctxTranslate').onclick = () => { if (currentSelectedText) window.open(`https://translate.google.com/?sl=auto&tl=fr&text=${encodeURIComponent(currentSelectedText)}&op=translate`, '_blank'); textContextMenu.style.display = 'none'; };
  document.getElementById('ctxWeb').onclick = () => { if (currentSelectedText) window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSelectedText)}`, '_blank'); textContextMenu.style.display = 'none'; };
  document.getElementById('ctxCopy').onclick = async () => {
    if (currentSelectedText) {
      try { await navigator.clipboard.writeText(currentSelectedText); showToast('📋', t('message.copy')); }
      catch { alert(currentSelectedText); }
    }
    textContextMenu.style.display = 'none';
  };
}

/* ═══════════════════════════════════════════════════════════
   10. CHARGEMENT PDF / IMAGES
   ═══════════════════════════════════════════════════════════ */
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function initPdfLoader() {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput) return;
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true, t('message.loading'));
    showWorkspace();
    try {
      const buf = await file.arrayBuffer();
      state.pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
      state.numPages = state.pdfDoc.numPages;
      state.fileHash = file.name + '_' + file.size;
      state.source = { type: 'pdf', pdfName: file.name, pdfBlob: file, images: [] };
      state.currentWorkId = null;
      const autosave = loadAutoSave();
      if (autosave?.fileHash === state.fileHash) {
        state.drawData = autosave.drawData || {};
        state.bgData = autosave.bgData || {};
        state.currentPage = autosave.currentPage || 1;
      } else { state.drawData = {}; state.bgData = {}; state.currentPage = 1; }
      await renderPdfPages();
      updatePageInfo();
      if (state.currentPage > 1) gotoPage(state.currentPage);
      updatePdfSearchButtonState();
    } catch (err) { alert(t('message.error') + ' : ' + err.message); }
    finally { setLoading(false); fileInput.value = ''; }
  });
}
function initImageLoaders() {
  const imgInput = document.getElementById('imgInput');
  const camInput = document.getElementById('camInput');
  if (imgInput) imgInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await handleImageFiles(files);
    imgInput.value = '';
  });
  if (camInput) camInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await handleImageFiles(files);
    camInput.value = '';
  });
}
async function handleImageFiles(files) {
  setLoading(true, t('message.processing'));
  showWorkspace();
  try {
    const hasContent = state.pdfDoc || (state.imageBitmaps && state.imageBitmaps.length > 0);
    let mode = 'replace';
    
    // Si des pages existent déjà, on demande à l'utilisateur s'il veut AJOUTER ou REMPLACER
    if (hasContent) { 
      mode = await askMode(files.length); 
      if (!mode) { setLoading(false); return; } // Si l'utilisateur clique sur Annuler
    }

    // 1. Si on choisit de remplacer, on remet tout à zéro proprement
    if (mode === 'replace') {
      state.pdfDoc = null; 
      state.imageBitmaps = []; 
      state.drawData = {}; 
      state.bgData = {}; 
      state.currentPage = 1;
      state.source = { type: 'images', pdfBlob: null, pdfName: '', images: [] };
      state.currentWorkId = null;
    }

    // 2. Traitement et ajout des nouvelles images (que ce soit en mode "remplacer" ou "ajouter")
    for (let i = 0; i < files.length; i++) {
      const progressBar = document.getElementById('progressBar');
      if (progressBar) progressBar.style.width = Math.round((i / files.length) * 100) + '%';
      
      let dataURL = await readAsDataURL(files[i]);
      dataURL = await compressImage(dataURL, 1600, files[i].size > 1.5 * 1024 * 1024 ? 0.75 : 0.85);
      const bmp = await loadImageFromDataURL(dataURL);
      
      if (!state.imageBitmaps) state.imageBitmaps = [];
      if (!state.source.images) state.source.images = [];

      state.imageBitmaps.push(bmp);
      state.source.images.push({ dataURL, width: bmp.width, height: bmp.height });
    }

    state.source.type = 'images';
    state.fileHash = (state.fileHash || '') + '_img_' + Date.now();
    
    // Calcul précis du nombre total de pages (PDF éventuel + toutes les images accumulées)
    const pdfCount = (state.pdfDoc && state.pdfDoc.numPages) ? state.pdfDoc.numPages : 0;
    state.numPages = pdfCount + state.imageBitmaps.length;

    await renderAllPages();
    updatePageInfo();
    showToast('🖼️', t('message.imagesAdded'));
  } catch (err) { 
    alert(t('message.error') + ' : ' + err.message); 
  } finally { 
    setLoading(false); 
  }
}
function askMode(count) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const title = count > 1
      ? `${t('action.add')} ${count} ${t('button.image')}`
      : `${t('action.add')} 1 ${t('button.image')}`;
    modal.innerHTML = `
      <div class="modal-content" style="text-align:center">
        <h2 style="margin-top:0">${title}</h2>
        <div class="modal-actions-inline" style="margin-top:20px">
          <button class="modal-btn primary" data-action="add">➕ ${t('action.add')}</button>
          <button class="modal-btn secondary" data-action="replace">🔄 ${t('action.replace')}</button>
        </div>
      </div>`;
    modal.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => { modal.remove(); resolve(btn.dataset.action); };
    });
    document.body.appendChild(modal);
  });
}

/* ═══════════════════════════════════════════════════════════
   11. RENDU DES PAGES
   ═══════════════════════════════════════════════════════════ */
function makePageContainer(pageNum, w, h) {
  const container = document.createElement('div');
  container.className = 'page-container';
  container.dataset.page = pageNum;
  container.dataset.originalWidth = w;
  container.dataset.originalHeight = h;
  container.style.aspectRatio = `${w} / ${h}`;
  container.style.width = '100%';
  container.style.maxWidth = w + 'px';

  const pdfCanvas = document.createElement('canvas');
  pdfCanvas.width = w; pdfCanvas.height = h;
  pdfCanvas.className = 'pdf-canvas';
  container.appendChild(pdfCanvas);

  const textLayer = document.createElement('div');
  textLayer.className = 'text-layer';
  container.appendChild(textLayer);

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = w; bgCanvas.height = h;
  bgCanvas.className = 'bg-canvas';
  bgCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  container.appendChild(bgCanvas);

  const clipsLayer = document.createElement('div');
  clipsLayer.className = 'clips-layer';
  container.appendChild(clipsLayer);

  const drawCanvas = document.createElement('canvas');
  drawCanvas.width = w; drawCanvas.height = h;
  drawCanvas.className = 'draw-canvas';
  drawCanvas.dataset.page = pageNum;
  container.appendChild(drawCanvas);

  return container;
}
async function renderPdfPages() {
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = '';
  state.renderedPages.clear();
  for (let i = 1; i <= state.pdfDoc.numPages; i++) {
    const page = await state.pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: state.scale });
    viewer.appendChild(makePageContainer(i, viewport.width, viewport.height));
  }
  setupLazyRendering();
  await ensurePageRendered(1);
  finalizeAllPages();
}
async function renderImagePages() {
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = '';
  state.renderedPages.clear();
  state.imageBitmaps.forEach((bmp, idx) => {
    const pageNum = idx + 1;
    const w = bmp.width, h = bmp.height;
    const container = makePageContainer(pageNum, w, h);
    const canvas = container.querySelector('.pdf-canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp.img, 0, 0, w, h);
    viewer.appendChild(container);
    state.renderedPages.add(pageNum);
  });
  state.numPages = state.imageBitmaps.length;
  finalizeAllPages();
}
async function renderBlankPages(n) {
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = '';
  state.renderedPages.clear();
  for (let i = 1; i <= n; i++) {
    const container = makePageContainer(i, 800, 1130);
    const ctx = container.querySelector('.pdf-canvas').getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 800, 1130);
    viewer.appendChild(container);
    state.renderedPages.add(i);
  }
  finalizeAllPages();
}
async function renderAllPages() {
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = '';
  state.renderedPages.clear();
  if (state.pdfDoc) {
    for (let i = 1; i <= state.pdfDoc.numPages; i++) {
      const page = await state.pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: state.scale });
      viewer.appendChild(makePageContainer(i, viewport.width, viewport.height));
    }
  }
  const pdfCount = state.pdfDoc ? state.pdfDoc.numPages : 0;
  state.imageBitmaps.forEach((bmp, idx) => {
    const pageNum = pdfCount + idx + 1;
    const w = bmp.width, h = bmp.height;
    const container = makePageContainer(pageNum, w, h);
    const ctx = container.querySelector('.pdf-canvas').getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp.img, 0, 0, w, h);
    viewer.appendChild(container);
    state.renderedPages.add(pageNum);
  });
  state.numPages = pdfCount + state.imageBitmaps.length;
  if (state.pdfDoc) { setupLazyRendering(); await ensurePageRendered(1); }
  finalizeAllPages();
  updatePageInfo();
}
let lazyObserver = null;
function setupLazyRendering() {
  const viewer = document.getElementById('viewer');
  if (lazyObserver) lazyObserver.disconnect();
  lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) ensurePageRendered(parseInt(entry.target.dataset.page));
    });
  }, { rootMargin: '200px 0px' });
  viewer.querySelectorAll('.page-container').forEach(c => {
    if (!state.renderedPages.has(parseInt(c.dataset.page))) {
      c.classList.add('page-loading');
      lazyObserver.observe(c);
    }
  });
}
async function ensurePageRendered(pageNum) {
  if (state.renderedPages.has(pageNum)) return;
  if (!state.pdfDoc || pageNum > state.pdfDoc.numPages) return;
  const viewer = document.getElementById('viewer');
  const container = viewer.querySelector(`.page-container[data-page="${pageNum}"]`);
  if (!container) return;
  try {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: state.scale });
    const canvas = container.querySelector('.pdf-canvas');
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const textLayerDiv = container.querySelector('.text-layer');
    if (textLayerDiv) {
      textLayerDiv.innerHTML = '';
      try {
        const textContent = await page.getTextContent();
        if (pdfjsLib.renderTextLayer) {
          await pdfjsLib.renderTextLayer({ textContent, container: textLayerDiv, viewport, textDivs: [] }).promise;
          const items = textContent.items;
          if (items && items.length > 0) {
            const lineMap = {};
            items.forEach(item => {
              if (!item.str || !item.str.trim()) return;
              const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
              const yCoord = Math.round(tx[5]);
              let foundKey = Object.keys(lineMap).find(k => Math.abs(parseInt(k) - yCoord) < 12);
              if (!foundKey) { foundKey = yCoord; lineMap[foundKey] = { items: [], y: tx[5] }; }
              lineMap[foundKey].items.push({ str: item.str, x: tx[4] });
            });
            const sortedLines = Object.values(lineMap).sort((a, b) => a.y - b.y);
            const paragraphs = [];
            let currentPara = null;
            sortedLines.forEach(line => {
              line.items.sort((a, b) => a.x - b.x);
              const lineText = line.items.map(i => i.str).join(' ');
              if (!currentPara) currentPara = { lines: [lineText], minX: line.items[0].x, topY: line.y };
              else {
                const gap = Math.abs(currentPara.topY - line.y);
                if (gap < 28) { currentPara.lines.push(lineText); currentPara.topY = line.y; }
                else { paragraphs.push(currentPara); currentPara = { lines: [lineText], minX: line.items[0].x, topY: line.y }; }
              }
            });
            if (currentPara) paragraphs.push(currentPara);
            paragraphs.forEach(para => {
              const fullText = para.lines.join(' ').trim();
              if (fullText.length < 3) return;
              const audioBtn = document.createElement('button');
              audioBtn.className = 'pdf-audio-btn';
              audioBtn.innerHTML = '🔊';
              audioBtn.style.left = Math.max(5, para.minX - 35) + 'px';
              audioBtn.style.top = (para.topY - 12) + 'px';
              audioBtn.addEventListener('click', (e) => { e.stopPropagation(); speakText(fullText); });
              audioBtn.addEventListener('touchend', (e) => { e.stopPropagation(); speakText(fullText); });
              textLayerDiv.appendChild(audioBtn);
            });
          }
        }
      } catch (e) { console.warn('TextLayer error:', e); }
    }
    container.classList.remove('page-loading');
    state.renderedPages.add(pageNum);
    finalizePage(container, pageNum);
  } catch (err) { console.warn('Erreur rendu page', pageNum, err); }
}
function finalizeAllPages() {
  const viewer = document.getElementById('viewer');
  viewer.querySelectorAll('.page-container').forEach(container => {
    finalizePage(container, parseInt(container.dataset.page));
  });
}
function finalizePage(container, pageNum) {
  if (state.drawData[pageNum]) redrawPage(pageNum, container.querySelector('.draw-canvas'));
  const bgMode = state.bgData[pageNum] || state.bgMode || 'none';
  drawBackground(container.querySelector('.bg-canvas'), bgMode);
  attachDrawEvents(container.querySelector('.draw-canvas'), pageNum);
  renderAllClips(pageNum);
}
function drawBackground(canvas, mode) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  if (mode === 'lines') {
    const s = 40;
    ctx.strokeStyle = 'rgba(52,152,219,0.35)'; ctx.lineWidth = 1;
    for (let y = s; y < h; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(231,76,60,0.5)';
    ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(80, h); ctx.stroke();
  } else if (mode === 'grid') {
    const g = 40;
    ctx.strokeStyle = 'rgba(52,152,219,0.25)';
    for (let x = 0; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  } else if (mode === 'dots') {
    const g = 40;
    ctx.fillStyle = 'rgba(52,152,219,0.5)';
    for (let x = g; x < w; x += g)
      for (let y = g; y < h; y += g) {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
      }
  }
}
function gotoPage(n) {
  if (n < 1 || n > state.numPages) return;
  state.currentPage = n;
  const viewer = document.getElementById('viewer');
  const el = viewer.querySelector(`.page-container[data-page="${n}"]`);
  if (el) window.scrollTo({ top: el.offsetTop - 170, behavior: 'smooth' });
  updatePageInfo();
  scheduleSave();
  updatePresentPageInfo();
  if (state.selectedClip && state.selectedClip.pageNum !== n) deselectClip();
}
function updatePageInfo() {
  const pageJumpInput = document.getElementById('pageJumpInput');
  const pageInfo = document.getElementById('pageInfo');
  if (pageJumpInput) { pageJumpInput.value = state.currentPage; pageJumpInput.max = state.numPages; }
  if (pageInfo) pageInfo.textContent = `/${state.numPages}`;
}
function showWorkspace() {
  const empty = document.getElementById('empty');
  if (empty) empty.style.display = 'none';
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('pedagoBar').style.display = 'flex';
  document.getElementById('zoomBar').style.display = 'flex';
  document.getElementById('subjectBadge').classList.add('show');
  updateStickerBarVisibility();
  updatePdfSearchButtonState();
}

/* ═══════════════════════════════════════════════════════════
   12. OUTILS DE DESSIN
   ═══════════════════════════════════════════════════════════ */
function initToolButtons() {
  const group = document.getElementById('drawToolsGroup');
  if (!group) return;
  group.innerHTML = DRAW_TOOLS.map(tool => {
    const title = I18N.t(tool.titleKey);
    return `<button class="tool-btn ${tool.cssClass || ''} ${tool.active ? 'active' : ''}" id="${tool.id}" title="${title}" aria-label="${title}" data-i18n-title="${tool.titleKey}" data-i18n-aria="${tool.titleKey}">${tool.emoji}</button>`;
  }).join('');
  DRAW_TOOLS.forEach(tool => {
    toolButtons[tool.tool] = document.getElementById(tool.id);
  });
  DRAW_TOOLS.forEach(tool => {
    const btn = document.getElementById(tool.id);
    if (!btn) return;
    if (tool.tool === 'collage' || tool.tool === 'textSelect') return;
    btn.onclick = () => {
      if (state.collageMode) exitCollageMode();
      if (state.textSelectMode && document.getElementById('btnTextSelect')) document.getElementById('btnTextSelect').click();
      state.tool = tool.tool;
      Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
  const penMagic = document.getElementById('penMagic');
  if (penMagic) penMagic.onclick = () => {
    state.tool = 'magic';
    Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
    penMagic.classList.add('active');
  };
  const penNeon = document.getElementById('penNeon');
  if (penNeon) penNeon.onclick = () => {
    state.tool = 'neon';
    Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
    penNeon.classList.add('active');
  };
}
function initDrawColorsAndSizes() {
  const colorPalette = document.getElementById('colorPalette');
  const sizePicker = document.getElementById('sizePicker');
  if (colorPalette) {
    colorPalette.innerHTML = `
      <div class="color-swatch active" data-color="#000000" style="background:#000000"></div>
      <div class="color-swatch" data-color="#00209F" style="background:#00209F"></div>
      <div class="color-swatch" data-color="#D21034" style="background:#D21034"></div>
      <div class="color-swatch" data-color="#27ae60" style="background:#27ae60"></div>
      <div class="color-swatch" data-color="#f1c40f" style="background:#f1c40f"></div>
      <div class="color-swatch" data-color="#e67e22" style="background:#e67e22"></div>
      <div class="color-swatch" data-color="#8e44ad" style="background:#8e44ad"></div>
      <input type="color" id="customColor" value="#000000" title="${t('tool.placeholder.color')}">
    `;
    colorPalette.querySelectorAll('.color-swatch').forEach(sw => {
      sw.onclick = () => {
        state.color = sw.dataset.color;
        document.getElementById('customColor').value = state.color;
        colorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      };
    });
    document.getElementById('customColor').oninput = (e) => { state.color = e.target.value; };
  }
  if (sizePicker) {
    sizePicker.innerHTML = `
      <div class="size-btn" data-size="2"><span class="size-dot" style="width:4px;height:4px"></span></div>
      <div class="size-btn active" data-size="5"><span class="size-dot" style="width:8px;height:8px"></span></div>
      <div class="size-btn" data-size="10"><span class="size-dot" style="width:14px;height:14px"></span></div>
      <div class="size-btn" data-size="20"><span class="size-dot" style="width:22px;height:22px"></span></div>
    `;
    sizePicker.querySelectorAll('.size-btn').forEach(btn => {
      btn.onclick = () => {
        state.size = +btn.dataset.size;
        sizePicker.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
  }
}
function attachDrawEvents(canvas, pageNum) {
  let drawing = false;
  let previewShape = null;
  let activePointerId = null;
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const start = (e) => {
    if (state.collageMode || state.textSelectMode) return;
    if (state.tool === 'text' || state.tool === 'sticker') return;
    e.preventDefault();
    if (e.pointerType === 'touch' && activePointerId !== null) return;
    activePointerId = e.pointerId;
    drawing = true;
    const pos = getPos(e);
    const data = state.drawData[pageNum] || (state.drawData[pageNum] = { strokes: [], clips: [] });
    if (state.tool === 'eraser') {
      const prevStrokes = [...data.strokes];
      eraseAt(pageNum, pos, state.size * 4, canvas);
      if (data.strokes.length !== prevStrokes.length) {
        pushGlobalAction({ type: 'erase', page: pageNum, prevStrokes, newStrokes: [...data.strokes] });
      }
      return;
    }
    if (['pen','highlighter','magic','neon'].includes(state.tool)) {
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
      const stroke = {
        tool: state.tool, color: state.color,
        size: (state.tool === 'highlighter' ? state.size * 3 : state.size) * (e.pointerType === 'touch' ? 1 : (0.5 + pressure)),
        alpha: state.tool === 'highlighter' ? 0.35 : 1,
        points: [pos]
      };
      data.strokes.push(stroke);
      state.activeStroke = stroke;
      drawStroke(canvas.getContext('2d'), stroke);
    } else {
      previewShape = { tool: state.tool, color: state.color, size: state.size, from: pos, to: pos };
    }
  };
  const move = (e) => {
    if (!drawing || e.pointerId !== activePointerId || state.textSelectMode) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvas.getContext('2d');
    if (state.tool === 'eraser') eraseAt(pageNum, pos, state.size * 4, canvas);
    else if (state.activeStroke) {
      state.activeStroke.points.push(pos);
      const pts = state.activeStroke.points;
      drawStrokeSegment(ctx, state.activeStroke, pts[pts.length-2], pos);
    } else if (previewShape) {
      previewShape.to = pos;
      redrawPage(pageNum, canvas);
      drawShape(ctx, previewShape, true);
    }
  };
  const end = (e) => {
    if (e && e.pointerId !== activePointerId) return;
    if (!drawing) return;
    drawing = false; activePointerId = null;
    if (previewShape) {
      const data = state.drawData[pageNum];
      const stroke = { ...previewShape, alpha: 1 };
      data.strokes.push(stroke);
      pushGlobalAction({ type: 'stroke', page: pageNum, stroke });
      previewShape = null;
      redrawPage(pageNum, canvas);
    }
    if (state.activeStroke) {
      pushGlobalAction({ type: 'stroke', page: pageNum, stroke: state.activeStroke });
      scheduleSave();
    }
    state.activeStroke = null;
  };
  canvas.addEventListener('click', (e) => {
    if (state.collageMode || state.textSelectMode) return;
    if (state.tool === 'text') createTextOverlay(canvas, pageNum, getPos(e));
    else if (state.tool === 'sticker') placeSticker(canvas, pageNum, getPos(e));
  });
  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
function drawStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = stroke.alpha || 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (stroke.tool === 'neon') {
    ctx.shadowColor = stroke.color; ctx.shadowBlur = 20;
    ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size;
  } else if (stroke.tool === 'magic') {
    ctx.lineWidth = stroke.size; ctx.strokeStyle = stroke.color;
  } else {
    ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
  }
  if (['line','circle','rect','triangle','star'].includes(stroke.tool)) drawShape(ctx, stroke, false);
  else if (EXTRA_SHAPES.includes(stroke.tool)) drawExtraShape(ctx, stroke, false);
  else if (stroke.tool !== 'sticker' && stroke.tool !== 'text') {
    const pts = stroke.points || [];
    if (pts.length === 1) {
      ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, stroke.size/2, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawStrokeSegment(ctx, stroke, from, to) {
  ctx.save();
  ctx.globalAlpha = stroke.alpha || 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size;
  if (stroke.tool === 'neon') {
    ctx.shadowColor = stroke.color; ctx.shadowBlur = 15;
    ctx.strokeStyle = stroke.color;
  } else if (stroke.tool === 'magic') {
    const colors = ['#e74c3c','#e67e22','#f1c40f','#27ae60','#3498db','#8e44ad'];
    ctx.strokeStyle = colors[stroke.points.length % colors.length];
  } else {
    ctx.strokeStyle = stroke.color;
  }
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}
function drawShape(ctx, shape, isPreview) {
  const { tool, from, to, color, size } = shape;
  ctx.save();
  ctx.globalAlpha = isPreview ? 0.6 : (shape.alpha || 1);
  ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round';
  ctx.setLineDash(isPreview ? [8, 6] : []);
  const cx = (from.x + to.x) / 2, cy = (from.y + to.y) / 2;
  const rx = Math.abs(to.x - from.x) / 2, ry = Math.abs(to.y - from.y) / 2;
  if (tool === 'line') { ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
  else if (tool === 'circle') { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.stroke(); }
  else if (tool === 'rect') { ctx.strokeRect(Math.min(from.x,to.x), Math.min(from.y,to.y), rx*2, ry*2); }
  else if (tool === 'triangle') { ctx.beginPath(); ctx.moveTo(cx, from.y); ctx.lineTo(to.x, to.y); ctx.lineTo(from.x, to.y); ctx.closePath(); ctx.stroke(); }
  else if (tool === 'star') {
    const spikes = 5, outerR = Math.max(rx, ry);
    const innerR = outerR * 0.4;
    let rot = -Math.PI/2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot)*outerR, cy + Math.sin(rot)*outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot)*innerR, cy + Math.sin(rot)*innerR);
      rot += step;
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}
function drawExtraShape(ctx, shape, isPreview) {
  const { tool, from, to, color, size } = shape;
  ctx.save();
  ctx.globalAlpha = isPreview ? 0.6 : (shape.alpha || 1);
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash(isPreview ? [8, 6] : []);
  const cx = (from.x + to.x) / 2, cy = (from.y + to.y) / 2;
  const rx = Math.abs(to.x - from.x) / 2, ry = Math.abs(to.y - from.y) / 2;
  if (tool === 'pentagon' || tool === 'hexagon') {
    const n = tool === 'pentagon' ? 5 : 6;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle) * ry;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  } else if (tool === 'heart') {
    ctx.beginPath();
    const w = rx * 1.2, h = ry * 1.2;
    ctx.moveTo(cx, cy + h * 0.7);
    ctx.bezierCurveTo(cx - w * 1.5, cy - h * 0.3, cx - w * 0.5, cy - h * 1.3, cx, cy - h * 0.4);
    ctx.bezierCurveTo(cx + w * 0.5, cy - h * 1.3, cx + w * 1.5, cy - h * 0.3, cx, cy + h * 0.7);
    ctx.closePath(); ctx.stroke();
  } else if (tool === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = Math.max(14, size * 3);
    ctx.lineTo(to.x - headLen * Math.cos(angle - 0.4), to.y - headLen * Math.sin(angle - 0.4));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle + 0.4), to.y - headLen * Math.sin(angle + 0.4));
    ctx.stroke();
  } else if (tool === 'speech') {
    const w = rx * 2, h = ry * 2;
    const r = Math.min(w, h) * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx - w/2 + r, cy - h/2);
    ctx.lineTo(cx + w/2 - r, cy - h/2);
    ctx.quadraticCurveTo(cx + w/2, cy - h/2, cx + w/2, cy - h/2 + r);
    ctx.lineTo(cx + w/2, cy + h/2 - r);
    ctx.quadraticCurveTo(cx + w/2, cy + h/2, cx + w/2 - r, cy + h/2);
    ctx.lineTo(cx + w * 0.1, cy + h/2);
    ctx.lineTo(cx - w * 0.05, cy + h/2 + h * 0.25);
    ctx.lineTo(cx - w * 0.05, cy + h/2);
    ctx.lineTo(cx - w/2 + r, cy + h/2);
    ctx.quadraticCurveTo(cx - w/2, cy + h/2, cx - w/2, cy + h/2 - r);
    ctx.lineTo(cx - w/2, cy - h/2 + r);
    ctx.quadraticCurveTo(cx - w/2, cy - h/2, cx - w/2 + r, cy - h/2);
    ctx.closePath(); ctx.stroke();
  } else if (tool === 'music') {
    const R = Math.max(rx, ry) * 0.7;
    ctx.beginPath(); ctx.arc(cx - R * 0.3, cy + R * 0.4, R * 0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.05, cy + R * 0.4);
    ctx.lineTo(cx - R * 0.05, cy - R * 0.6);
    ctx.lineTo(cx + R * 0.5, cy - R * 0.5);
    ctx.lineTo(cx + R * 0.5, cy + R * 0.3);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + R * 0.25, cy + R * 0.3, R * 0.25, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function redrawPage(pageNum, canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const data = state.drawData[pageNum];
  if (!data || !data.strokes) return;
  data.strokes.forEach(s => {
    if (s.tool === 'text') {
      ctx.save(); ctx.fillStyle = s.color;
      ctx.font = `${s.fontSize}px system-ui, sans-serif`;
      ctx.textBaseline = 'top'; ctx.fillText(s.text, s.x, s.y);
      ctx.restore();
    } else if (s.tool === 'sticker') {
      ctx.save(); ctx.font = `${s.size * 6}px serif`;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(s.emoji, s.x, s.y);
      ctx.restore();
    } else {
      drawStroke(ctx, s);
    }
  });
}
function eraseAt(pageNum, pos, radius, canvas) {
  const data = state.drawData[pageNum];
  if (!data) return;
  const r2 = radius * radius;
  const keep = [];
  let changed = false;
  for (const stroke of data.strokes) {
    let touched = false;
    if (stroke.points) {
      for (const p of stroke.points) {
        const dx = p.x - pos.x, dy = p.y - pos.y;
        if (dx*dx + dy*dy < r2) { touched = true; break; }
      }
    } else if (stroke.x !== undefined) {
      const dx = stroke.x - pos.x, dy = stroke.y - pos.y;
      if (dx*dx + dy*dy < r2*4) touched = true;
    }
    if (!touched) keep.push(stroke); else changed = true;
  }
  if (changed) { data.strokes = keep; redrawPage(pageNum, canvas); scheduleSave(); }
}
function placeSticker(canvas, pageNum, pos) {
  const data = state.drawData[pageNum] || (state.drawData[pageNum] = { strokes: [], clips: [] });
  const stroke = { tool: 'sticker', emoji: state.selectedSticker, x: pos.x, y: pos.y, size: state.size };
  data.strokes.push(stroke);
  pushGlobalAction({ type: 'sticker', page: pageNum, stroke });
  redrawPage(pageNum, canvas);
  scheduleSave();
  showToast(state.selectedSticker, t('message.success'));
}
function pushGlobalAction(action) {
  state.globalHistory = state.globalHistory.slice(0, state.globalHistoryIndex + 1);
  state.globalHistory.push(action);
  if (state.globalHistory.length > 100) state.globalHistory.shift();
  else state.globalHistoryIndex++;
}
function undoGlobal() {
  if (state.globalHistoryIndex < 0) return;
  const action = state.globalHistory[state.globalHistoryIndex];
  const data = state.drawData[action.page];
  if (!data) return;
  if (action.type === 'stroke' || action.type === 'text' || action.type === 'sticker') data.strokes.pop();
  else if (action.type === 'erase' || action.type === 'clear') data.strokes = action.prevStrokes;
  state.globalHistoryIndex--;
  redrawPage(action.page, getCanvasByPage(action.page));
  scheduleSave();
  if (action.page !== state.currentPage) gotoPage(action.page);
}
function redoGlobal() {
  if (state.globalHistoryIndex >= state.globalHistory.length - 1) return;
  state.globalHistoryIndex++;
  const action = state.globalHistory[state.globalHistoryIndex];
  const data = state.drawData[action.page] || (state.drawData[action.page] = { strokes: [], clips: [] });
  if (action.type === 'stroke' || action.type === 'text' || action.type === 'sticker') data.strokes.push(action.stroke);
  else if (action.type === 'erase' || action.type === 'clear') data.strokes = action.newStrokes;
  redrawPage(action.page, getCanvasByPage(action.page));
  scheduleSave();
  if (action.page !== state.currentPage) gotoPage(action.page);
}
function getCanvasByPage(pageNum) {
  return document.getElementById('viewer').querySelector(`.draw-canvas[data-page="${pageNum}"]`);
}
function applyZoom() {
  const viewer = document.getElementById('viewer');
  viewer.querySelectorAll('.page-container').forEach(c => {
    c.style.transform = `scale(${state.zoom})`;
    if (state.twoPages) {
      c.style.marginRight = '0';
      c.style.marginBottom = '0';
    } else {
      c.style.marginRight = '0';
      c.style.marginBottom = (state.zoom - 1) * c.offsetHeight + 'px';
    }
  });
  document.getElementById('zoomLevel').textContent = Math.round(state.zoom * 100) + '%';
}

/* ═══════════════════════════════════════════════════════════
   13. COLLAGE (CLIPS)
   ═══════════════════════════════════════════════════════════ */
const ACHIM_PACK = [
  { name: 'Poisson', cat: 'mer', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10,30 Q30,5 60,20 L85,5 L85,55 L60,40 Q30,55 10,30 Z" fill="#f39c12" stroke="#d35400" stroke-width="2"/><circle cx="25" cy="28" r="3" fill="#000"/></svg>` },
  { name: 'Bateau', cat: 'mer', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,10 L50,60 M50,10 L85,55 L50,55 Z" fill="#3498db" stroke="#2c3e50" stroke-width="2"/><rect x="20" y="60" width="60" height="15" fill="#e74c3c" rx="3"/></svg>` },
  { name: 'Soleil', cat: 'nature', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/><g stroke="#f39c12" stroke-width="4"><line x1="50" y1="8" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="92"/><line x1="8" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="92" y2="50"/></g></svg>` },
  { name: 'Arbre', cat: 'nature', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><rect x="44" y="70" width="12" height="45" fill="#8b4513"/><circle cx="50" cy="45" r="28" fill="#27ae60"/></svg>` },
  { name: 'Fleur', cat: 'nature', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><line x1="50" y1="60" x2="50" y2="115" stroke="#27ae60" stroke-width="4"/><circle cx="50" cy="35" r="12" fill="#f1c40f"/><circle cx="32" cy="42" r="14" fill="#e74c3c"/><circle cx="68" cy="42" r="14" fill="#e74c3c"/></svg>` },
  { name: 'Maison', cat: 'maison', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="50" width="60" height="45" fill="#f5cba7"/><path d="M10,50 L50,15 L90,50 Z" fill="#e74c3c"/><rect x="42" y="65" width="16" height="30" fill="#8b4513"/></svg>` },
  { name: 'Chat', cat: 'animaux', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="25" ry="22" fill="#f39c12"/><circle cx="50" cy="38" r="22" fill="#f39c12"/><circle cx="42" cy="38" r="3" fill="#000"/><circle cx="58" cy="38" r="3" fill="#000"/></svg>` },
  { name: 'Chien', cat: 'animaux', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="28" ry="22" fill="#d35400"/><circle cx="50" cy="42" r="20" fill="#d35400"/><circle cx="43" cy="40" r="3" fill="#000"/><circle cx="57" cy="40" r="3" fill="#000"/></svg>` },
  { name: 'Palmier', cat: 'haiti', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><path d="M45,130 Q48,80 50,40" stroke="#8b4513" stroke-width="8" fill="none"/><path d="M50,40 Q30,25 15,35 Q30,30 50,40 Z" fill="#27ae60"/><path d="M50,40 Q70,25 85,35 Q70,30 50,40 Z" fill="#27ae60"/></svg>` },
  { name: 'Drapeau Haïti', cat: 'haiti', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><rect x="5" y="5" width="90" height="30" fill="#00209F"/><rect x="5" y="35" width="90" height="30" fill="#D21034"/></svg>` },
  { name: 'Pomme', cat: 'food', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,30 Q30,20 20,50 Q15,80 40,90 Q50,95 60,90 Q85,80 80,50 Q70,20 50,30 Z" fill="#e74c3c"/><path d="M50,20 Q60,15 65,22 Q58,25 50,20 Z" fill="#27ae60"/></svg>` },
  { name: 'Banane', cat: 'food', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><path d="M15,25 Q20,70 60,75 Q95,72 105,40 Q95,65 60,65 Q30,60 25,25 Z" fill="#f1c40f"/></svg>` }
];
function loadCustomClips() {
  try {
    const raw = localStorage.getItem(CUSTOM_CLIPS_KEY);
    state.customClips = raw ? JSON.parse(raw) : [];
  } catch { state.customClips = []; }
}
function saveCustomClips() {
  try { localStorage.setItem(CUSTOM_CLIPS_KEY, JSON.stringify(state.customClips)); } catch {}
}
function getClips(pageNum) {
  if (!state.drawData[pageNum]) state.drawData[pageNum] = { strokes: [], clips: [] };
  if (!state.drawData[pageNum].clips) state.drawData[pageNum].clips = [];
  return state.drawData[pageNum].clips;
}
function getClipsLayer(pageNum) {
  const viewer = document.getElementById('viewer');
  const container = viewer.querySelector(`.page-container[data-page="${pageNum}"]`);
  if (!container) return null;
  let layer = container.querySelector('.clips-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'clips-layer';
    const drawCanvas = container.querySelector('.draw-canvas');
    if (drawCanvas) container.insertBefore(layer, drawCanvas);
    else container.appendChild(layer);
  }
  return layer;
}
function renderClip(clip, pageNum) {
  const layer = getClipsLayer(pageNum);
  if (!layer) return;
  layer.querySelector(`[data-clip-id="${clip.id}"]`)?.remove();
  const el = document.createElement('div');
  el.className = 'clip';
  el.dataset.clipId = clip.id;
  el.style.left = clip.x + 'px'; el.style.top = clip.y + 'px';
  el.style.width = clip.width + 'px'; el.style.height = clip.height + 'px';
  el.style.transform = `rotate(${clip.rotation || 0}deg) scaleX(${clip.flipX ? -1 : 1})`;
  el.style.zIndex = clip.zIndex || 1;
  const img = document.createElement('img');
  img.src = clip.src; img.alt = clip.name || t('button.image');
  img.draggable = false;
  el.appendChild(img);
  ['resize', 'rotate', 'delete', 'flip'].forEach(type => {
    const h = document.createElement('div');
    h.className = `clip-handle ${type}`;
    h.dataset.handle = type;
    h.textContent = { resize: '⤡', rotate: '🔄', delete: '✕', flip: '⇄' }[type];
    el.appendChild(h);
  });
  layer.appendChild(el);
  attachClipEvents(el, clip, pageNum);
}
function renderAllClips(pageNum) {
  const layer = getClipsLayer(pageNum);
  if (!layer) return;
  layer.innerHTML = '';
  getClips(pageNum).forEach(c => renderClip(c, pageNum));
}
function attachClipEvents(el, clip, pageNum) {
  let dragging = false, resizing = false, rotating = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startW = 0, startH = 0, startRotation = 0, startAngle = 0;
  let activePointer = null;
  const getPageScale = () => {
    const viewer = document.getElementById('viewer');
    const container = viewer.querySelector(`.page-container[data-page="${pageNum}"]`);
    if (!container) return 1;
    return container.getBoundingClientRect().width / container.offsetWidth || 1;
  };
  el.addEventListener('pointerdown', (e) => {
    if (!state.collageMode || activePointer !== null) return;
    const handle = e.target.closest('.clip-handle');
    if (handle && clip.locked) return;
    e.preventDefault(); e.stopPropagation();
    activePointer = e.pointerId;
    el.setPointerCapture(e.pointerId);
    selectClip(clip.id, pageNum);
    startX = e.clientX; startY = e.clientY;
    startLeft = clip.x; startTop = clip.y;
    startW = clip.width; startH = clip.height;
    startRotation = clip.rotation || 0;
    if (handle) {
      const type = handle.dataset.handle;
      if (type === 'delete') { deleteClip(clip.id, pageNum); activePointer = null; return; }
      if (type === 'flip') { clip.flipX = !clip.flipX; renderClip(clip, pageNum); selectClip(clip.id, pageNum); scheduleSave(); activePointer = null; return; }
      if (type === 'resize') resizing = true;
      else if (type === 'rotate') {
        rotating = true;
        const rect = el.getBoundingClientRect();
        startAngle = Math.atan2(e.clientY - (rect.top + rect.height/2), e.clientX - (rect.left + rect.width/2));
      }
    } else if (!clip.locked) dragging = true;
  });
  el.addEventListener('pointermove', (e) => {
    if (activePointer !== e.pointerId) return;
    const scale = getPageScale();
    const dx = (e.clientX - startX) / scale, dy = (e.clientY - startY) / scale;
    if (dragging) { clip.x = startLeft + dx; clip.y = startTop + dy; el.style.left = clip.x + 'px'; el.style.top = clip.y + 'px'; }
    else if (resizing) {
      const newW = Math.max(30, startW + dx);
      const newH = startH * (newW / startW);
      clip.width = newW; clip.height = newH;
      el.style.width = newW + 'px'; el.style.height = newH + 'px';
    } else if (rotating) {
      const rect = el.getBoundingClientRect();
      const angle = Math.atan2(e.clientY - (rect.top + rect.height/2), e.clientX - (rect.left + rect.width/2));
      clip.rotation = startRotation + (angle - startAngle) * 180 / Math.PI;
      el.style.transform = `rotate(${clip.rotation}deg) scaleX(${clip.flipX ? -1 : 1})`;
    }
  });
  const endDrag = (e) => {
    if (activePointer !== e.pointerId) return;
    activePointer = null;
    if (dragging || resizing || rotating) scheduleSave();
    dragging = resizing = rotating = false;
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
}
function selectClip(clipId, pageNum) {
  document.querySelectorAll('.clip.selected').forEach(el => el.classList.remove('selected'));
  state.selectedClip = { clipId, pageNum };
  const layer = getClipsLayer(pageNum);
  layer?.querySelector(`[data-clip-id="${clipId}"]`)?.classList.add('selected');
  updateClipInfo();
}
function deselectClip() {
  document.querySelectorAll('.clip.selected').forEach(el => el.classList.remove('selected'));
  state.selectedClip = null;
  updateClipInfo();
}
function updateClipInfo() {
  const clipInfo = document.getElementById('clipInfo');
  if (!clipInfo) return;
  if (!state.selectedClip) { clipInfo.textContent = t('collage.noneSelected'); return; }
  const clips = getClips(state.selectedClip.pageNum);
  const clip = clips.find(c => c.id === state.selectedClip.clipId);
  if (!clip) { clipInfo.textContent = t('collage.noneSelected'); return; }
  clipInfo.textContent = `${clip.name || t('button.image')} • ${Math.round(clip.width)}×${Math.round(clip.height)} • ${Math.round(clip.rotation || 0)}° ${clip.locked ? '🔒' : ''}`;
}
function deleteClip(clipId, pageNum) {
  const clips = getClips(pageNum);
  const idx = clips.findIndex(c => c.id === clipId);
  if (idx < 0) return;
  clips.splice(idx, 1);
  getClipsLayer(pageNum)?.querySelector(`[data-clip-id="${clipId}"]`)?.remove();
  if (state.selectedClip?.clipId === clipId) deselectClip();
  scheduleSave();
  showToast('🗑️', t('message.imageDeleted'));
}
function addClipToPage(imageSrc, name, pageNum, options = {}) {
  const clips = getClips(pageNum);
  const viewer = document.getElementById('viewer');
  const container = viewer.querySelector(`.page-container[data-page="${pageNum}"]`);
  if (!container) return;
  const w = container.offsetWidth, h = container.offsetHeight;
  const img = new Image();
  img.onload = () => {
    const maxSize = Math.min(w, h) * 0.4;
    let cw = img.width, ch = img.height;
    if (cw > maxSize || ch > maxSize) {
      const ratio = Math.min(maxSize / cw, maxSize / ch);
      cw *= ratio; ch *= ratio;
    }
    const clip = {
      id: generateId('clip'), src: imageSrc, name: name || t('button.image'),
      x: (w - cw) / 2, y: (h - ch) / 2, width: cw, height: ch,
      rotation: 0, flipX: false,
      zIndex: (clips.length ? Math.max(...clips.map(c => c.zIndex || 1)) + 1 : 1),
      locked: false, ...options
    };
    clips.push(clip);
    renderClip(clip, pageNum);
    selectClip(clip.id, pageNum);
    scheduleSave();
    showToast('🖼️', t('message.imageAdded'));
  };
  img.onerror = () => {
    const clip = {
      id: generateId('clip'), src: imageSrc, name: name || t('button.image'),
      x: w / 2 - 60, y: h / 2 - 60, width: 120, height: 120,
      rotation: 0, flipX: false,
      zIndex: (clips.length ? Math.max(...clips.map(c => c.zIndex || 1)) + 1 : 1),
      locked: false, ...options
    };
    clips.push(clip);
    renderClip(clip, pageNum);
    selectClip(clip.id, pageNum);
    scheduleSave();
  };
  img.src = imageSrc;
}
function enterCollageMode() {
  if (state.textSelectMode) {
    state.textSelectMode = false;
    document.body.classList.remove('text-select-mode');
  }
  state.collageMode = true;
  document.body.classList.add('collage-mode');
  document.getElementById('collageBar').classList.add('show');
  if (toolButtons.collage) toolButtons.collage.classList.add('active');
  updateStickerBarVisibility();
  showToast('✂️', t('collage.title'));
}

function exitCollageMode() {
  state.collageMode = false;
  document.body.classList.remove('collage-mode');
  document.getElementById('collageBar').classList.remove('show');
  if (toolButtons.collage) toolButtons.collage.classList.remove('active');
  deselectClip();
  updateStickerBarVisibility();
  showToast('✏️', t('toolbar.pen'));
}
function openClipPicker() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'clipPicker';
  const categories = [
    { key: 'all', label: t('clip.tabs.all'), filter: () => true },
    { key: 'mer', label: t('clip.tabs.sea'), filter: (i) => i.cat === 'mer' },
    { key: 'nature', label: t('clip.tabs.nature'), filter: (i) => i.cat === 'nature' },
    { key: 'maison', label: t('clip.tabs.house'), filter: (i) => i.cat === 'maison' },
    { key: 'animaux', label: t('clip.tabs.animals'), filter: (i) => i.cat === 'animaux' },
    { key: 'food', label: t('clip.tabs.food'), filter: (i) => i.cat === 'food' },
    { key: 'haiti', label: t('clip.tabs.haiti'), filter: (i) => i.cat === 'haiti' },
    { key: 'custom', label: t('clip.tabs.custom'), filter: null }
  ];
  let currentTab = 'all';
  function renderContent() {
    const grid = modal.querySelector('.clip-pack-grid');
    if (currentTab === 'custom') {
      if (state.customClips.length === 0) {
        grid.innerHTML = `<div class="clip-empty" style="grid-column: 1/-1">${t('clip.empty')}<br><small>${t('scissors.keep')}</small></div>`;
        return;
      }
      grid.innerHTML = state.customClips.map((c, i) => `
        <div class="clip-pack-item custom" data-custom-index="${i}">
          <img src="${c.src}" alt="${escapeHtml(c.name)}">
          <div class="clip-name">${escapeHtml(c.name)}</div>
          <button class="clip-del" data-del-index="${i}" title="${t('action.delete')}">✕</button>
        </div>
      `).join('');
      grid.querySelectorAll('.clip-pack-item').forEach(item => {
        item.onclick = (e) => {
          if (e.target.closest('.clip-del')) return;
          const idx = parseInt(item.dataset.customIndex);
          const c = state.customClips[idx];
          modal.remove();
          addClipToPage(c.src, c.name, state.currentPage);
        };
      });
      grid.querySelectorAll('.clip-del').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.delIndex);
          if (!confirm(t('message.confirmDelete'))) return;
          state.customClips.splice(idx, 1);
          saveCustomClips();
          renderContent();
        };
      });
      return;
    }
    const cat = categories.find(c => c.key === currentTab);
    const items = ACHIM_PACK.filter(cat.filter);
    grid.innerHTML = items.map((item) => {
      const src = svgToDataURL(item.svg);
      return `<div class="clip-pack-item" data-pack-name="${escapeHtml(item.name)}" data-pack-src="${src}">
        <img src="${src}" alt="${escapeHtml(item.name)}">
        <div class="clip-name">${escapeHtml(item.name)}</div>
      </div>`;
    }).join('');
    grid.querySelectorAll('.clip-pack-item').forEach(item => {
      item.onclick = () => { modal.remove(); addClipToPage(item.dataset.packSrc, item.dataset.packName, state.currentPage); };
    });
  }
  const tabsHTML = categories.map(cat => `<button class="clip-tab ${cat.key === currentTab ? 'active' : ''}" data-tab="${cat.key}">${cat.label}</button>`).join('');
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🖼️ ${t('clip.title')}</h2>
      <p style="font-size:13px;color:#7f8c8d;margin-top:0">${t('clip.hint')}</p>
      <div class="clip-tabs">${tabsHTML}</div>
      <div class="clip-pack-grid"></div>
      <div class="clip-tab-actions">
        <button class="scissors-btn" id="clipScissors">${t('clip.cut')}</button>
        <button class="import-btn" id="clipImportBtn">${t('clip.import')}</button>
        <button class="cancel-btn" id="clipCancel">${t('action.close')}</button>
      </div>
    </div>`;
  modal.querySelectorAll('.clip-tab').forEach(tab => {
    tab.onclick = () => {
      currentTab = tab.dataset.tab;
      modal.querySelectorAll('.clip-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderContent();
    };
  });
  modal.querySelector('#clipImportBtn').onclick = () => { modal.remove(); document.getElementById('clipFileInput').click(); };
  modal.querySelector('#clipScissors').onclick = () => { modal.remove(); startScissorsTool(); };
  modal.querySelector('#clipCancel').onclick = () => modal.remove();
  renderContent();
  document.body.appendChild(modal);
}
function initClips() {
  loadCustomClips();
  if (toolButtons.collage) toolButtons.collage.onclick = () => { state.collageMode ? exitCollageMode() : enterCollageMode(); };
  document.getElementById('clipExit').onclick = exitCollageMode;
  document.getElementById('clipAdd').onclick = openClipPicker;
  document.getElementById('clipRotate').onclick = () => {
    if (!state.selectedClip) { showToast('⚠️', t('message.selectImageFirst')); return; }
    const clip = getClips(state.selectedClip.pageNum).find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    clip.rotation = (clip.rotation || 0) + 15;
    renderClip(clip, state.selectedClip.pageNum);
    selectClip(clip.id, state.selectedClip.pageNum);
    scheduleSave();
  };
  document.getElementById('clipFlip').onclick = () => {
    if (!state.selectedClip) return;
    const clip = getClips(state.selectedClip.pageNum).find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    clip.flipX = !clip.flipX;
    renderClip(clip, state.selectedClip.pageNum);
    selectClip(clip.id, state.selectedClip.pageNum);
    scheduleSave();
  };
  document.getElementById('clipFront').onclick = () => {
    if (!state.selectedClip) return;
    const clips = getClips(state.selectedClip.pageNum);
    const clip = clips.find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    clip.zIndex = Math.max(...clips.map(c => c.zIndex || 1)) + 1;
    renderClip(clip, state.selectedClip.pageNum);
    selectClip(clip.id, state.selectedClip.pageNum);
    scheduleSave();
  };
  document.getElementById('clipBack').onclick = () => {
    if (!state.selectedClip) return;
    const clips = getClips(state.selectedClip.pageNum);
    const clip = clips.find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    clip.zIndex = Math.max(1, Math.min(...clips.map(c => c.zIndex || 1)) - 1);
    renderClip(clip, state.selectedClip.pageNum);
    selectClip(clip.id, state.selectedClip.pageNum);
    scheduleSave();
  };
  document.getElementById('clipLock').onclick = () => {
    if (!state.selectedClip) return;
    const clip = getClips(state.selectedClip.pageNum).find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    clip.locked = !clip.locked;
    renderClip(clip, state.selectedClip.pageNum);
    selectClip(clip.id, state.selectedClip.pageNum);
    scheduleSave();
    showToast(clip.locked ? '🔒' : '🔓', clip.locked ? t('collage.lock') : t('collage.lock'));
  };
  document.getElementById('clipDuplicate').onclick = () => {
    if (!state.selectedClip) return;
    const clips = getClips(state.selectedClip.pageNum);
    const clip = clips.find(c => c.id === state.selectedClip.clipId);
    if (!clip) return;
    const copy = { ...clip, id: generateId('clip'), x: clip.x + 20, y: clip.y + 20, zIndex: Math.max(...clips.map(c => c.zIndex || 1)) + 1 };
    clips.push(copy);
    renderClip(copy, state.selectedClip.pageNum);
    selectClip(copy.id, state.selectedClip.pageNum);
    scheduleSave();
  };
  document.getElementById('clipDelete').onclick = () => {
    if (state.selectedClip) deleteClip(state.selectedClip.clipId, state.selectedClip.pageNum);
  };
  const clipFileInput = document.getElementById('clipFileInput');
  if (clipFileInput) clipFileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true, t('message.processing'));
    try {
      for (const f of files) {
        const dataURL = await readAsDataURL(f);
        const compressed = await compressPNG(dataURL, 400);
        state.customClips.push({ id: generateId('custom'), name: f.name.replace(/\.[^.]+$/, ''), src: compressed, date: Date.now() });
      }
      saveCustomClips();
      showToast('📁', t('message.imagesAdded'));
      openClipPicker();
      setTimeout(() => { document.querySelector('.clip-tab[data-tab="custom"]')?.click(); }, 100);
    } catch (err) { alert(t('message.error') + ' : ' + err.message); }
    finally { setLoading(false); clipFileInput.value = ''; }
  });
  const scissorsBtn = document.getElementById('scissorsBtn');
  if (scissorsBtn) scissorsBtn.onclick = () => startScissorsTool();
}

/* ═══════════════════════════════════════════════════════════
   14. DÉCOUPAGE (SCISSORS + LASSO)
   ═══════════════════════════════════════════════════════════ */
const scissorsState = { active: false, stage: null, img: null, imgNaturalW: 0, imgNaturalH: 0, scale: 1, offsetX: 0, offsetY: 0, sel: { x: 0, y: 0, w: 0, h: 0 } };

function startScissorsTool(sourceOverride = null) {
  if (sourceOverride) { launchScissors(sourceOverride); return; }
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:520px;text-align:left">
      <h2 style="margin-top:0;color:#e74c3c">✂️ ${t('scissors.title')}</h2>
      <p style="color:#7f8c8d;font-size:13px;margin-top:0">${t('clip.hint')}</p>
      <div class="menu-list">
        <div class="menu-item" data-source="page"><span class="icon">📄</span><div><div class="label">${t('scissors.sourcePage')}</div><div class="desc">${t('scissors.sourcePageDesc')}</div></div></div>
        <div class="menu-item" data-source="custom"><span class="icon">📁</span><div><div class="label">${t('scissors.sourceCustom')}</div><div class="desc">${state.customClips.length} ${t('clip.tabs.custom')}</div></div></div>
        <div class="menu-item" data-source="import"><span class="icon">📷</span><div><div class="label">${t('scissors.sourceImport')}</div><div class="desc">${t('scissors.sourceImportDesc')}</div></div></div>
      </div>
      <button class="modal-close" style="width:100%">${t('action.cancel')}</button>
    </div>`;
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.querySelectorAll('.menu-item').forEach(item => {
    item.onclick = () => {
      const src = item.dataset.source;
      modal.remove();
      if (src === 'page') startScissorsFromPage();
      else if (src === 'custom') startScissorsFromCustom();
      else if (src === 'import') document.getElementById('scissorsFileInput').click();
    };
  });
  document.body.appendChild(modal);
}
function startScissorsFromPage() {
  const viewer = document.getElementById('viewer');
  const container = viewer.querySelector(`.page-container[data-page="${state.currentPage}"]`);
  if (!container) { alert(t('message.noDocument')); return; }
  const pdfCanvas = container.querySelector('.pdf-canvas');
  const bgCanvas = container.querySelector('.bg-canvas');
  const drawCanvas = container.querySelector('.draw-canvas');
  if (!pdfCanvas) { alert(t('message.noDocument')); return; }
  const merged = document.createElement('canvas');
  merged.width = pdfCanvas.width; merged.height = pdfCanvas.height;
  const ctx = merged.getContext('2d');
  ctx.drawImage(pdfCanvas, 0, 0);
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.drawImage(drawCanvas, 0, 0);
  launchScissors({ src: merged.toDataURL('image/png'), name: `Page ${state.currentPage}` });
}
function startScissorsFromCustom() {
  if (state.customClips.length === 0) {
    if (confirm(t('clip.empty'))) document.getElementById('clipFileInput').click();
    return;
  }
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:600px">
      <h2 style="margin-top:0;color:#e74c3c">📁 ${t('scissors.title')}</h2>
      <div class="clip-pack-grid" id="scissorsGrid"></div>
      <button class="modal-close" style="width:100%">${t('action.cancel')}</button>
    </div>`;
  const grid = modal.querySelector('#scissorsGrid');
  grid.innerHTML = state.customClips.map((c, i) => `
    <div class="clip-pack-item" data-index="${i}">
      <img src="${c.src}" alt="${escapeHtml(c.name)}">
      <div class="clip-name">${escapeHtml(c.name)}</div>
    </div>`).join('');
  grid.querySelectorAll('.clip-pack-item').forEach(item => {
    item.onclick = () => {
      const idx = parseInt(item.dataset.index);
      const c = state.customClips[idx];
      modal.remove();
      launchScissors({ src: c.src, name: c.name });
    };
  });
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  document.body.appendChild(modal);
}
function launchScissors({ src, name }) {
  const modal = document.createElement('div');
  modal.className = 'modal scissors-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="scissors-header">
        <h3>✂️ ${t('scissors.title')}</h3>
        <span class="source-info">${escapeHtml(name || t('button.image'))}</span>
        <div class="scissors-zoom-controls">
          <button id="scissorsModeRect" class="scissors-mode-btn active" title="Rectangle">▭</button>
          <button id="scissorsModeLasso" class="scissors-mode-btn" title="Lasso">🖊️</button>
          <button id="scissorsZoomOut">−</button>
          <span id="scissorsZoomLevel">100%</span>
          <button id="scissorsZoomIn">+</button>
          <button id="scissorsZoomReset">⟲</button>
        </div>
      </div>
      <div class="scissors-stage" id="scissorsStage">
        <div class="scissors-stage-inner" id="scissorsStageInner"><img id="scissorsImg" src="${src}" alt="image"></div>
        <div class="scissors-selection" id="scissorsSelection" style="display:none">
          <div class="scissors-handle corner" data-handle="tl"></div>
          <div class="scissors-handle corner" data-handle="tr"></div>
          <div class="scissors-handle corner" data-handle="bl"></div>
          <div class="scissors-handle corner" data-handle="br"></div>
          <div class="scissors-handle" data-handle="top"></div>
          <div class="scissors-handle" data-handle="bottom"></div>
          <div class="scissors-handle" data-handle="left"></div>
          <div class="scissors-handle" data-handle="right"></div>
        </div>
        <canvas class="scissors-lasso-canvas" id="scissorsLassoCanvas"></canvas>
        <div class="scissors-preview-panel" id="scissorsPreview">
          <div class="label">Aperçu</div>
          <img id="scissorsPreviewImg" src="" alt="preview">
        </div>
      </div>
      <div class="scissors-actions">
        <label><input type="checkbox" id="scissorsRound"> ${t('scissors.keep')}</label>
        <label><input type="checkbox" id="scissorsKeep"> ${t('scissors.keep')}</label>
        <button class="btn-cancel" id="scissorsCancel">${t('action.cancel')}</button>
        <button class="btn-cut" id="scissorsCut">✂️ ${t('clip.cut')}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const stage = modal.querySelector('#scissorsStage');
  const stageInner = modal.querySelector('#scissorsStageInner');
  const img = modal.querySelector('#scissorsImg');
  const selection = modal.querySelector('#scissorsSelection');
  const previewPanel = modal.querySelector('#scissorsPreview');
  const previewImg = modal.querySelector('#scissorsPreviewImg');
  const zoomLevel = modal.querySelector('#scissorsZoomLevel');

  scissorsState.active = true;
  scissorsState.stage = stage;
  scissorsState.img = img;
  scissorsState.scale = 1;
  scissorsState.offsetX = 0;
  scissorsState.offsetY = 0;

  const lassoCanvas = modal.querySelector('#scissorsLassoCanvas');
  const lassoCtx = lassoCanvas.getContext('2d');
  const modeRectBtn = modal.querySelector('#scissorsModeRect');
  const modeLassoBtn = modal.querySelector('#scissorsModeLasso');
  let lassoMode = 'rect';
  let lassoPath = [];
  let lassoDone = false;
  let lassoPathInImage = [];

  function resizeLassoCanvas() {
    const r = stage.getBoundingClientRect();
    lassoCanvas.width = r.width;
    lassoCanvas.height = r.height;
    redrawLasso();
  }
  function redrawLasso() {
    lassoCtx.clearRect(0, 0, lassoCanvas.width, lassoCanvas.height);
    if (lassoPath.length < 2) return;
    lassoCtx.save();
    lassoCtx.strokeStyle = '#f39c12';
    lassoCtx.lineWidth = 3;
    lassoCtx.lineJoin = 'round';
    lassoCtx.lineCap = 'round';
    lassoCtx.setLineDash([8, 5]);
    lassoCtx.beginPath();
    lassoCtx.moveTo(lassoPath[0].x, lassoPath[0].y);
    for (let i = 1; i < lassoPath.length; i++) lassoCtx.lineTo(lassoPath[i].x, lassoPath[i].y);
    if (lassoDone) {
      lassoCtx.closePath();
      lassoCtx.fillStyle = 'rgba(243,156,18,0.15)';
      lassoCtx.fill();
    }
    lassoCtx.stroke();
    lassoCtx.restore();
  }
  function switchMode(mode) {
    lassoMode = mode;
    modeRectBtn.classList.toggle('active', mode === 'rect');
    modeLassoBtn.classList.toggle('active', mode === 'lasso');
    lassoCanvas.classList.toggle('active', mode === 'lasso');
    selection.style.display = (mode === 'rect') ? 'block' : 'none';
    if (mode === 'rect') { lassoPath = []; lassoDone = false; redrawLasso(); }
  }
  modeLassoBtn.addEventListener('click', () => { switchMode('lasso'); modal.querySelector('#scissorsRound').disabled = true; });
  modeRectBtn.addEventListener('click', () => { switchMode('rect'); modal.querySelector('#scissorsRound').disabled = false; });

  img.onload = () => {
    scissorsState.imgNaturalW = img.naturalWidth;
    scissorsState.imgNaturalH = img.naturalHeight;
    fitImageToStage();
    const w = img.naturalWidth * 0.5, h = img.naturalHeight * 0.5;
    scissorsState.sel = { x: (img.naturalWidth - w) / 2, y: (img.naturalHeight - h) / 2, w, h };
    drawSelection();
    selection.style.display = 'block';
    resizeLassoCanvas();
  };
  window.addEventListener('resize', resizeLassoCanvas);

  function fitImageToStage() {
    const rect = stage.getBoundingClientRect();
    scissorsState.scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight, 1);
    scissorsState.offsetX = 0; scissorsState.offsetY = 0;
    applyTransform();
  }
  function applyTransform() {
    stageInner.style.transform = `translate(${scissorsState.offsetX}px, ${scissorsState.offsetY}px) scale(${scissorsState.scale})`;
    stageInner.style.width = img.naturalWidth + 'px';
    stageInner.style.height = img.naturalHeight + 'px';
    img.style.width = img.naturalWidth + 'px';
    img.style.height = img.naturalHeight + 'px';
    zoomLevel.textContent = Math.round(scissorsState.scale * 100) + '%';
    drawSelection();
    redrawLasso();
  }
  function drawSelection() {
    const s = scissorsState.sel;
    selection.style.left = (scissorsState.offsetX + s.x * scissorsState.scale) + 'px';
    selection.style.top = (scissorsState.offsetY + s.y * scissorsState.scale) + 'px';
    selection.style.width = (s.w * scissorsState.scale) + 'px';
    selection.style.height = (s.h * scissorsState.scale) + 'px';
    updatePreview();
  }
  function updatePreview() {
    const s = scissorsState.sel;
    if (s.w < 5 || s.h < 5) { previewPanel.classList.remove('show'); return; }
    const c = document.createElement('canvas');
    const MAX = 140;
    let cw = s.w, ch = s.h;
    if (cw > MAX || ch > MAX) { const r = Math.min(MAX / cw, MAX / ch); cw *= r; ch *= r; }
    c.width = cw; c.height = ch;
    c.getContext('2d').drawImage(img, s.x, s.y, s.w, s.h, 0, 0, cw, ch);
    previewImg.src = c.toDataURL('image/png');
    previewPanel.classList.add('show');
  }
  let panning = false, panStartX = 0, panStartY = 0, panOffsetX = 0, panOffsetY = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (lassoMode === 'lasso') return;
    if (e.target.closest('.scissors-handle') || e.target.closest('.scissors-selection') || e.target.closest('.scissors-preview-panel')) return;
    panning = true;
    panStartX = e.clientX; panStartY = e.clientY;
    panOffsetX = scissorsState.offsetX; panOffsetY = scissorsState.offsetY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!panning) return;
    scissorsState.offsetX = panOffsetX + (e.clientX - panStartX);
    scissorsState.offsetY = panOffsetY + (e.clientY - panStartY);
    applyTransform();
  });
  stage.addEventListener('pointerup', () => { panning = false; });

  let movingSel = false, moveStartX = 0, moveStartY = 0, moveSelX = 0, moveSelY = 0;
  selection.addEventListener('pointerdown', (e) => {
    if (lassoMode === 'lasso') return;
    if (e.target.closest('.scissors-handle')) return;
    movingSel = true;
    moveStartX = e.clientX; moveStartY = e.clientY;
    moveSelX = scissorsState.sel.x; moveSelY = scissorsState.sel.y;
    selection.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  selection.addEventListener('pointermove', (e) => {
    if (!movingSel) return;
    const dx = (e.clientX - moveStartX) / scissorsState.scale;
    const dy = (e.clientY - moveStartY) / scissorsState.scale;
    scissorsState.sel.x = Math.max(0, Math.min(img.naturalWidth - scissorsState.sel.w, moveSelX + dx));
    scissorsState.sel.y = Math.max(0, Math.min(img.naturalHeight - scissorsState.sel.h, moveSelY + dy));
    drawSelection();
    e.stopPropagation();
  });
  selection.addEventListener('pointerup', (e) => { movingSel = false; e.stopPropagation(); });

  let handleDrag = null;
  selection.querySelectorAll('.scissors-handle').forEach(h => {
    h.addEventListener('pointerdown', (e) => {
      handleDrag = { handle: h.dataset.handle, startX: e.clientX, startY: e.clientY, sel: { ...scissorsState.sel } };
      h.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    h.addEventListener('pointermove', (e) => {
      if (!handleDrag) return;
      const dx = (e.clientX - handleDrag.startX) / scissorsState.scale;
      const dy = (e.clientY - handleDrag.startY) / scissorsState.scale;
      let { x, y, w, h: hh } = handleDrag.sel;
      const H = handleDrag.handle;
      if (H === 'tl') { x += dx; y += dy; w -= dx; hh -= dy; }
      else if (H === 'tr') { y += dy; w += dx; hh -= dy; }
      else if (H === 'bl') { x += dx; w -= dx; hh += dy; }
      else if (H === 'br') { w += dx; hh += dy; }
      else if (H === 'top') { y += dy; hh -= dy; }
      else if (H === 'bottom') { hh += dy; }
      else if (H === 'left') { x += dx; w -= dx; }
      else if (H === 'right') { w += dx; }
      if (w < 20) w = 20; if (hh < 20) hh = 20;
      x = Math.max(0, Math.min(img.naturalWidth - 20, x));
      y = Math.max(0, Math.min(img.naturalHeight - 20, y));
      w = Math.min(img.naturalWidth - x, w);
      hh = Math.min(img.naturalHeight - y, hh);
      scissorsState.sel = { x, y, w, h: hh };
      drawSelection();
      e.stopPropagation();
    });
    h.addEventListener('pointerup', (e) => { handleDrag = null; e.stopPropagation(); });
  });

  let lassoDrawing = false;
  lassoCanvas.addEventListener('pointerdown', (e) => {
    if (lassoMode !== 'lasso') return;
    e.preventDefault();
    lassoDrawing = true;
    lassoPath = [];
    lassoPathInImage = [];
    lassoDone = false;
    const r = lassoCanvas.getBoundingClientRect();
    lassoPath.push({ x: e.clientX - r.left, y: e.clientY - r.top });
    lassoCanvas.setPointerCapture(e.pointerId);
  });
  lassoCanvas.addEventListener('pointermove', (e) => {
    if (!lassoDrawing) return;
    e.preventDefault();
    const r = lassoCanvas.getBoundingClientRect();
    lassoPath.push({ x: e.clientX - r.left, y: e.clientY - r.top });
    redrawLasso();
  });
  lassoCanvas.addEventListener('pointerup', (e) => {
    if (!lassoDrawing) return;
    lassoDrawing = false;
    if (lassoPath.length > 2) {
      lassoDone = true;
      lassoPathInImage = lassoPath.map(p => ({
        x: (p.x - scissorsState.offsetX) / scissorsState.scale,
        y: (p.y - scissorsState.offsetY) / scissorsState.scale
      }));
      scissorsState._lassoPath = lassoPath;
      redrawLasso();
      updateLassoPreview();
    }
  });
  function updateLassoPreview() {
    if (lassoPath.length < 3) { previewPanel.classList.remove('show'); return; }
    const ptsInImage = lassoPath.map(p => ({
      x: (p.x - scissorsState.offsetX) / scissorsState.scale,
      y: (p.y - scissorsState.offsetY) / scissorsState.scale
    }));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ptsInImage.forEach(p => {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    });
    minX = Math.max(0, Math.floor(minX)); minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(img.naturalWidth, Math.ceil(maxX)); maxY = Math.min(img.naturalHeight, Math.ceil(maxY));
    const w = maxX - minX, h = maxY - minY;
    if (w < 5 || h < 5) { previewPanel.classList.remove('show'); return; }
    const c = document.createElement('canvas');
    const MAX = 140;
    let cw = w, ch = h;
    if (cw > MAX || ch > MAX) { const r = Math.min(MAX/cw, MAX/ch); cw *= r; ch *= r; }
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.scale(cw / w, ch / h);
    ctx.translate(-minX, -minY);
    ctx.beginPath();
    ctx.moveTo(ptsInImage[0].x, ptsInImage[0].y);
    for (let i = 1; i < ptsInImage.length; i++) ctx.lineTo(ptsInImage[i].x, ptsInImage[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    previewImg.src = c.toDataURL('image/png');
    previewPanel.classList.add('show');
  }

  modal.querySelector('#scissorsZoomIn').onclick = () => { scissorsState.scale = Math.min(5, scissorsState.scale * 1.3); applyTransform(); };
  modal.querySelector('#scissorsZoomOut').onclick = () => { scissorsState.scale = Math.max(0.1, scissorsState.scale / 1.3); applyTransform(); };
  modal.querySelector('#scissorsZoomReset').onclick = fitImageToStage;
  modal.querySelector('#scissorsCancel').onclick = () => { scissorsState.active = false; modal.remove(); };

  modal.querySelector('#scissorsCut').onclick = async () => {
    const round = modal.querySelector('#scissorsRound').checked;
    const keep = modal.querySelector('#scissorsKeep').checked;
    let result;
    if (lassoMode === 'lasso') {
      if (lassoPath.length < 3 || !lassoDone) { showToast('⚠️', t('scissors.drawFirst')); return; }
      playCutAnimation();
      result = await extractLassoSelection(src);
    } else {
      const s = scissorsState.sel;
      if (s.w < 5 || s.h < 5) { showToast('⚠️', t('scissors.tooSmall')); return; }
      playCutAnimation();
      result = await extractSelection(src, s, round);
    }
    modal.remove();
    scissorsState.active = false;
    setTimeout(() => showCutResult(result, name, keep), 400);
  };
}
function playCutAnimation() {
  const anim = document.createElement('div');
  anim.className = 'cut-animation play';
  anim.innerHTML = '<div class="scissors-icon">✂️</div>';
  document.body.appendChild(anim);
  setTimeout(() => anim.remove(), 800);
}
async function extractSelection(src, sel, round = false) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = sel.w; c.height = sel.h;
      const ctx = c.getContext('2d');
      if (round) {
        const r = Math.min(sel.w, sel.h) * 0.15;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(sel.w - r, 0);
        ctx.quadraticCurveTo(sel.w, 0, sel.w, r);
        ctx.lineTo(sel.w, sel.h - r);
        ctx.quadraticCurveTo(sel.w, sel.h, sel.w - r, sel.h);
        ctx.lineTo(r, sel.h);
        ctx.quadraticCurveTo(0, sel.h, 0, sel.h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath(); ctx.clip();
      }
      ctx.drawImage(img, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
async function extractLassoSelection(src) {
  return new Promise((resolve) => {
    if (!scissorsState._lassoPath || scissorsState._lassoPath.length < 3) { resolve(null); return; }
    const lassoPath = scissorsState._lassoPath;
    const ptsInImage = lassoPath.map(p => ({
      x: (p.x - scissorsState.offsetX) / scissorsState.scale,
      y: (p.y - scissorsState.offsetY) / scissorsState.scale
    }));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ptsInImage.forEach(p => {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    });
    minX = Math.max(0, Math.floor(minX)); minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(scissorsState.imgNaturalW, Math.ceil(maxX));
    maxY = Math.min(scissorsState.imgNaturalH, Math.ceil(maxY));
    const w = maxX - minX, h = maxY - minY;
    if (w < 3 || h < 3) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(-minX, -minY);
      ctx.beginPath();
      ctx.moveTo(ptsInImage[0].x, ptsInImage[0].y);
      for (let i = 1; i < ptsInImage.length; i++) ctx.lineTo(ptsInImage[i].x, ptsInImage[i].y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function showCutResult(result, sourceName, keepInLibrary) {
  if (!result) { showToast('❌', t('scissors.error')); return; }
  const modal = document.createElement('div');
  modal.className = 'modal cut-result-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>✅ ${t('scissors.result')}</h3>
      <div class="cut-result-preview"><img src="${result}" alt="Découpe"></div>
      <div class="cut-result-actions">
        <button class="redo" id="cutRedo">${t('scissors.redo')}</button>
        <button class="save" id="cutSave">${t('scissors.keep')}</button>
        <button class="place" id="cutPlace">${t('scissors.place')}</button>
      </div>
    </div>`;
  modal.querySelector('#cutRedo').onclick = () => { modal.remove(); launchScissors({ src: result, name: sourceName }); };
  modal.querySelector('#cutSave').onclick = () => {
    state.customClips.push({ id: generateId('custom'), name: sourceName ? `${sourceName} (découpé)` : t('clip.cut'), src: result, date: Date.now() });
    saveCustomClips(); modal.remove(); showToast('💾', t('library.saved'));
  };
  modal.querySelector('#cutPlace').onclick = () => {
    modal.remove();
    if (keepInLibrary) {
      state.customClips.push({ id: generateId('custom'), name: sourceName ? `${sourceName} (découpé)` : t('clip.cut'), src: result, date: Date.now() });
      saveCustomClips();
    }
    if (!state.collageMode) enterCollageMode();
    addClipToPage(result, sourceName ? `${sourceName} (découpé)` : t('clip.cut'), state.currentPage);
  };
  document.body.appendChild(modal);
}

/* ═══════════════════════════════════════════════════════════
   15. TEXTES ÉDITABLES
   ═══════════════════════════════════════════════════════════ */
function createTextOverlay(canvas, pageNum, pos) {
  const container = canvas.parentElement;
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / canvas.width, sy = rect.height / canvas.height;
  const input = document.createElement('div');
  input.className = 'text-overlay';
  input.contentEditable = true;
  input.style.left = (pos.x * sx) + 'px';
  input.style.top = (pos.y * sy) + 'px';
  input.style.color = state.color;
  input.style.fontSize = Math.max(16, state.size * 4) + 'px';
  container.appendChild(input);
  input.focus();
  let dragging = false, dx = 0, dy = 0;
  input.addEventListener('pointerdown', (e) => {
    if (e.altKey || e.button === 1) {
      dragging = true;
      const r = input.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
      input.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  });
  input.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    input.style.left = (e.clientX - dx) + 'px';
    input.style.top = (e.clientY - dy) + 'px';
  });
  input.addEventListener('pointerup', () => { dragging = false; });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); input.blur(); }
    if (ev.key === 'Escape') input.remove();
  });
  input.addEventListener('blur', () => {
    const text = input.textContent.trim();
    if (text) {
      const finalRect = input.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const finalX = (finalRect.left - canvasRect.left) * (canvas.width / canvasRect.width);
      const finalY = (finalRect.top - canvasRect.top) * (canvas.height / canvasRect.height);
      const data = state.drawData[pageNum] || (state.drawData[pageNum] = { strokes: [], clips: [] });
      const stroke = {
        tool: 'text', text, x: finalX, y: finalY,
        color: state.color, fontSize: Math.max(16, state.size * 4)
      };
      data.strokes.push(stroke);
      pushGlobalAction({ type: 'text', page: pageNum, stroke });
      redrawPage(pageNum, canvas);
      scheduleSave();
    }
    input.remove();
  });
}

/* ═══════════════════════════════════════════════════════════
   16. OUTILS PÉDAGOGIQUES
   ═══════════════════════════════════════════════════════════ */
function initTools() {
  document.querySelectorAll('.pedago-btn[data-mode]').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      state.bgMode = mode;
      document.querySelectorAll('.pedago-btn[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewer = document.getElementById('viewer');
      viewer.querySelectorAll('.bg-canvas').forEach(c => {
        state.bgData[c.parentElement.dataset.page] = mode;
        drawBackground(c, mode);
      });
      scheduleSave();
    };
  });
  document.getElementById('btnGuideLetter').onclick = () => showGuide('lettres');
  document.getElementById('btnGuideNumber').onclick = () => showGuide('chiffres');
  buildRuler();
  makeDraggable(document.getElementById('ruler'));
  makeDraggable(document.getElementById('protractor'));
  document.getElementById('btnRuler').onclick = () => {
    const r = document.getElementById('ruler');
    const visible = r.style.display === 'block';
    r.style.display = visible ? 'none' : 'block';
    if (!visible && !r.style.left) { r.style.left = '30%'; r.style.top = '30%'; }
    document.getElementById('btnRuler').classList.toggle('active', !visible);
  };
  document.getElementById('btnProtractor').onclick = () => {
    const p = document.getElementById('protractor');
    const visible = p.style.display === 'block';
    p.style.display = visible ? 'none' : 'block';
    if (!visible && !p.style.left) { p.style.left = '60%'; p.style.top = '40%'; }
    document.getElementById('btnProtractor').classList.toggle('active', !visible);
  };
  initTimer();
  initVoiceRecognition();
}
function showGuide(type) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  const content = document.createElement('div');
  content.className = 'modal-content';
  if (type === 'lettres') {
    content.innerHTML = `
      <h2 style="margin-top:0">${t('guide.alphabet')}</h2>
      <div style="font-family:'Comic Sans MS',cursive;font-size:44px;line-height:1.4;letter-spacing:6px;word-break:break-all">a b c d e f g h i j k l m n o p q r s t u v w x y z</div>
      <h3>${t('guide.uppercase')}</h3>
      <div style="font-family:'Comic Sans MS',cursive;font-size:44px;line-height:1.4;letter-spacing:6px;word-break:break-all">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</div>
    `;
  } else {
    content.innerHTML = `
      <h2 style="margin-top:0">${t('guide.numbers')}</h2>
      <div style="font-family:'Comic Sans MS',cursive;font-size:60px;line-height:1.4;letter-spacing:10px">0 1 2 3 4 5 6 7 8 9</div>
      <h3>${t('guide.numberLine')}</h3>
      <div style="font-size:22px;letter-spacing:4px;color:#3498db;padding:8px;border-bottom:2px solid #3498db">0 • 1 • 2 • 3 • 4 • 5 • 6 • 7 • 8 • 9 • 10</div>
    `;
  }
  const close = document.createElement('button');
  close.className = 'modal-close';
  close.textContent = t('action.close');
  close.onclick = () => modal.remove();
  modal.appendChild(content);
  modal.appendChild(close);
  document.body.appendChild(modal);
}
function buildRuler() {
  const ruler = document.getElementById('ruler');
  if (!ruler) return;
  ruler.querySelectorAll('g.marks').forEach(g => g.remove());
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'marks');
  for (let i = 0; i <= 50; i++) {
    const x = i * 10;
    const isCm = i % 10 === 0, isHalf = i % 5 === 0;
    const y2 = isCm ? 25 : (isHalf ? 35 : 42);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', 60);
    line.setAttribute('x2', x); line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', isCm ? 2 : 1);
    g.appendChild(line);
    if (isCm) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + 3); text.setAttribute('y', 20);
      text.setAttribute('font-size', '12'); text.setAttribute('fill', '#333');
      text.textContent = i / 10;
      g.appendChild(text);
    }
  }
  ruler.appendChild(g);
}
function makeDraggable(el) {
  if (!el) return;
  let ox = 0, oy = 0, dragging = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.target !== el && !e.target.closest('svg')) return;
    dragging = true;
    const r = el.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    el.style.left = (e.clientX - ox) + 'px';
    el.style.top = (e.clientY - oy) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  });
  el.addEventListener('pointerup', () => { dragging = false; });
  el.addEventListener('pointercancel', () => { dragging = false; });
}
let timerSeconds = 120, timerRunning = false, timerInterval = null;
function initTimer() {
  const timer = document.getElementById('timer');
  document.getElementById('btnTimer').onclick = () => {
    const visible = timer.classList.contains('show');
    timer.classList.toggle('show', !visible);
    document.getElementById('btnTimer').classList.toggle('active', !visible);
  };
  updateTimerDisplay();
  document.getElementById('timerToggle').onclick = () => {
    if (timerRunning) {
      clearInterval(timerInterval); timerRunning = false;
      document.getElementById('timerToggle').textContent = '▶';
      timer.classList.remove('running');
    } else {
      if (timerSeconds <= 0) timerSeconds = 120;
      timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        if (timerSeconds <= 0) {
          clearInterval(timerInterval); timerRunning = false;
          document.getElementById('timerToggle').textContent = '▶';
          timer.classList.remove('running');
          showToast('⏰', t('timer.ended')); beep();
        }
      }, 1000);
      timerRunning = true;
      document.getElementById('timerToggle').textContent = '⏸';
      timer.classList.add('running');
    }
  };
  document.getElementById('timerReset').onclick = () => {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('timerToggle').textContent = '▶';
    timer.classList.remove('running');
    timerSeconds = 120; updateTimerDisplay();
  };
  document.getElementById('timerClose').onclick = () => {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('timerToggle').textContent = '▶';
    timerSeconds = 120; updateTimerDisplay();
    timer.classList.remove('show');
    document.getElementById('btnTimer').classList.remove('active');
  };
}
function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timerDisplay');
  if (!timerDisplay) return;
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
  timerDisplay.style.color = (timerSeconds <= 10 && timerSeconds > 0) ? '#e74c3c' : 'var(--achim-or)';
}
function beep() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.value = 800; gain.gain.value = 0.2;
    osc.start(); setTimeout(() => osc.stop(), 300);
  } catch {}
}
function initVoiceRecognition() {
  document.getElementById('btnRecognize').onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert(t('voice.notAvailable')); return; }
    const rec = new SR();
    rec.lang = 'fr-FR'; rec.continuous = false;
    showToast('🎤', t('voice.listening'));
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.trim().toLowerCase();
      const map = {'zéro':0,'un':1,'deux':2,'trois':3,'quatre':4,'cinq':5,'six':6,'sept':7,'huit':8,'neuf':9,'dix':10};
      let target = map[text] !== undefined ? String(map[text]) : text;
      if (target.length > 1 && /^[a-z]$/.test(target[0])) target = target[0];
      showLetterForCopy(target);
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed') alert(t('voice.micDenied')); else showToast('❌', t('voice.notUnderstood')); };
    try { rec.start(); } catch { showToast('❌', t('voice.micError')); }
  };
}
function showLetterForCopy(letter) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="background:#fff;color:#000;padding:32px 60px">
      <p style="font-size:16px;color:#888;margin:0">${t('guide.copy')}</p>
      <div style="font-family:'Comic Sans MS',cursive;font-size:180px;font-weight:bold;color:#e74c3c;line-height:1">${escapeHtml(letter)}</div>
    </div>`;
  const close = document.createElement('button');
  close.className = 'modal-close';
  close.textContent = t('action.close');
  close.onclick = () => modal.remove();
  modal.appendChild(close); document.body.appendChild(modal);
  if ('speechSynthesis' in window) {
    const utt = new SpeechSynthesisUtterance(letter);
    utt.lang = 'fr-FR'; speechSynthesis.speak(utt);
  }
}

/* ═══════════════════════════════════════════════════════════
   17. EXPORT PDF
   ═══════════════════════════════════════════════════════════ */
function computeStats() {
  const durationMs = Date.now() - state.sessionStart;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const duration = minutes > 0 ? `${minutes} min ${seconds} s` : `${seconds} s`;
  const pageDetails = [];
  let pagesTouched = 0, clipsTotal = 0;
  for (let i = 1; i <= state.numPages; i++) {
    const d = state.drawData[i];
    const strokes = d?.strokes?.length || 0;
    const clips = d?.clips?.length || 0;
    clipsTotal += clips;
    if (strokes > 0 || clips > 0) {
      pagesTouched++;
      const total = strokes + clips * 3;
      const lvl = getCurrentLevel();
      let level;
      if (lvl === 'maternelle' || lvl === 'cp') {
        level = total < 5 ? '🟢 Début' : total < 20 ? '🟡 En cours' : '🟠 Bien travaillé';
      } else {
        level = total < 5 ? '🟢 Faible' : total < 20 ? '🟡 Moyen' : total < 50 ? '🟠 Bon' : '🟢 Excellent';
      }
      pageDetails.push({ page: i, strokes, clips, level });
    }
  }
  return { duration, pagesTouched, pageDetails, clipsTotal };
}
function addStatsPage(pdf, stats) {
  const w = 595, h = 842;
  pdf.addPage([w, h], 'portrait');
  const subj = SUBJECTS[state.subject] || SUBJECTS.cahier;
  pdf.setFillColor(245, 247, 250); pdf.rect(0, 0, w, h, 'F');
  pdf.setFillColor(26, 62, 98); pdf.rect(0, 0, w/2, 10, 'F');
  pdf.setFillColor(51, 124, 68); pdf.rect(w/2, 0, w/2, 10, 'F');
  pdf.setTextColor(26, 62, 98); pdf.setFontSize(14); pdf.setFont(undefined, 'bold');
  pdf.text('🎓 ' + ACHIM.produit, 40, 40);
  pdf.setTextColor(44, 62, 80); pdf.setFontSize(22);
  pdf.text('📊 Fiche de suivi', 40, 75);
  pdf.setFontSize(12); pdf.setFont(undefined, 'normal'); pdf.setTextColor(127, 140, 141);
  pdf.text(`${subj.emoji} ${t('subject.' + state.subject)} — ${ACHIM.anneeScolaire}`, 40, 97);
  pdf.setDrawColor(26, 62, 98); pdf.setLineWidth(2); pdf.line(40, 115, w - 40, 115);
  pdf.setTextColor(44, 62, 80); pdf.setFontSize(14); pdf.setFont(undefined, 'bold');
  pdf.text(t('profile.name'), 40, 145);
  pdf.setFont(undefined, 'normal'); pdf.setFontSize(13);
  pdf.text(state.student.name || '?', 40, 167);
  if (state.student.classe) pdf.text(t('profile.class') + ' : ' + state.student.classe, 40, 187);
  pdf.text(t('profile.school') + ' : ' + ACHIM.nom, 40, 207);
  pdf.text(ACHIM.anneeScolaire, 40, 227);
  pdf.setFont(undefined, 'bold'); pdf.setFontSize(14); pdf.text('Séance', 40, 265);
  pdf.setFont(undefined, 'normal'); pdf.setFontSize(13);
  pdf.text(new Date().toLocaleDateString(), 40, 287);
  pdf.text(stats.duration, 40, 309);
  pdf.text(`${stats.pagesTouched} / ${state.numPages}`, 40, 331);
  if (stats.clipsTotal > 0) pdf.text(String(stats.clipsTotal), 40, 353);
  pdf.setFont(undefined, 'bold'); pdf.setFontSize(14);
  pdf.text('Détail par page', 40, 385);
  pdf.setFont(undefined, 'normal'); pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  let y = 410;
  pdf.setFillColor(230, 240, 250);
  pdf.rect(40, y - 14, w - 80, 20, 'F');
  pdf.setFont(undefined, 'bold'); pdf.setTextColor(44, 62, 80);
  pdf.text('Page', 50, y); pdf.text('Dessins', 140, y); pdf.text('Images', 230, y); pdf.text('Activité', 320, y);
  y += 12; pdf.setFont(undefined, 'normal'); pdf.setTextColor(80, 80, 80);
  stats.pageDetails.forEach(pd => {
    if (y > h - 100) { pdf.addPage([w, h], 'portrait'); y = 60; }
    pdf.setDrawColor(220, 220, 220); pdf.line(40, y + 2, w - 40, y + 2);
    pdf.text(String(pd.page), 50, y);
    pdf.text(String(pd.strokes), 140, y);
    pdf.text(String(pd.clips), 230, y);
    pdf.text(pd.level, 320, y);
    y += 22;
  });
  pdf.setFontSize(9); pdf.setTextColor(150, 150, 150);
  pdf.text(ACHIM.produit + ' • ' + ACHIM.anneeScolaire, 40, h - 30);
}
async function exportFinishedPDF(silent = false) {
  if (!state.numPages) return;
  let workName = state.workName;
  if (!silent) {
    const defaultName = `ACHIM_${(state.student.name || 'Eleve').replace(/\s+/g,'_')}_${todayStr()}`;
    workName = prompt(t('subjectPicker.workName') + ' :', workName || defaultName);
    if (workName === null) return;
    state.workName = workName;
    updateSubjectBadge();
  }
  setLoading(true, t('message.processing'));
  try {
    const { jsPDF } = window.jspdf;
    let pdf = null;
    for (let i = 1; i <= state.numPages; i++) {
      await ensurePageRendered(i);
      const viewer = document.getElementById('viewer');
      const container = viewer.querySelector(`.page-container[data-page="${i}"]`);
      if (!container) continue;
      const pdfCanvas = container.querySelector('.pdf-canvas');
      const bgCanvas = container.querySelector('.bg-canvas');
      const drawCanvas = container.querySelector('.draw-canvas');
      const merged = document.createElement('canvas');
      merged.width = pdfCanvas.width; merged.height = pdfCanvas.height;
      const mctx = merged.getContext('2d');
      mctx.drawImage(pdfCanvas, 0, 0);
      mctx.drawImage(bgCanvas, 0, 0);
      for (const clip of getClips(i)) await drawClipOnCanvas(mctx, clip, container.offsetWidth);
      mctx.drawImage(drawCanvas, 0, 0);
      if (i === 1) addHeaderToCanvas(merged);
      const imgData = merged.toDataURL('image/jpeg', 0.85);
      const w = merged.width, h = merged.height;
      const orientation = w > h ? 'landscape' : 'portrait';
      if (!pdf) pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
      else pdf.addPage([w, h], orientation);
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
      const progressBar = document.getElementById('progressBar');
      if (progressBar) progressBar.style.width = Math.round((i / state.numPages) * 90) + '%';
    }
    addStatsPage(pdf, computeStats());
    const filename = (workName || 'Travail_ACHIM').replace(/[\\/:*?"<>|]/g, '_') + '.pdf';
    const blob = pdf.output('blob');
    downloadBlob(blob, filename);
    showToast('📤', t('message.downloaded'));
    return blob;
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setTimeout(() => setLoading(false), 500); }
}
async function drawClipOnCanvas(ctx, clip, containerWidth) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = ctx.canvas.width / containerWidth;
      const cx = (clip.x + clip.width / 2) * scale;
      const cy = (clip.y + clip.height / 2) * scale;
      const w = clip.width * scale, h = clip.height * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((clip.rotation || 0) * Math.PI / 180);
      ctx.scale(clip.flipX ? -1 : 1, 1);
      ctx.drawImage(img, -w/2, -h/2, w, h);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = clip.src;
  });
}
function addHeaderToCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, headerH = 80;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = ACHIM.couleurs.primaire; ctx.fillRect(0, headerH - 5, w/2, 5);
  ctx.fillStyle = ACHIM.couleurs.secondaire; ctx.fillRect(w/2, headerH - 5, w/2, 5);
  ctx.fillStyle = ACHIM.couleurs.primaire; ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textBaseline = 'top'; ctx.fillText('🎓 ' + ACHIM.produit, 20, 12);
  ctx.fillStyle = '#2c3e50'; ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`👦 ${state.student.name || '?'}`, 20, 34);
  ctx.font = '14px system-ui, sans-serif'; ctx.fillStyle = '#7f8c8d';
  const infos = [state.student.classe, state.student.ecole || ACHIM.nom].filter(Boolean).join(' • ');
  if (infos) ctx.fillText(infos, 20, 58);
  const subj = SUBJECTS[state.subject] || SUBJECTS.cahier;
  ctx.textAlign = 'right';
  ctx.fillStyle = subj.color;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`${subj.emoji} ${t('subject.' + state.subject)}`, w - 20, 12);
  ctx.fillStyle = '#2c3e50'; ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(new Date().toLocaleDateString(), w - 20, 36);
  ctx.fillStyle = '#95a5a6'; ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(ACHIM.anneeScolaire, w - 20, 56);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   18. EMAIL
   ═══════════════════════════════════════════════════════════ */
function emailjsIsReady() {
  return EMAILJS_CONFIG.publicKey && !EMAILJS_CONFIG.publicKey.includes('REMPLACE') &&
         EMAILJS_CONFIG.serviceId && !EMAILJS_CONFIG.serviceId.includes('REMPLACE') &&
         EMAILJS_CONFIG.templateId && !EMAILJS_CONFIG.templateId.includes('REMPLACE');
}
const EMAIL_RATE_KEY = 'cahier-email-rate';
function checkEmailRate() {
  try {
    const raw = localStorage.getItem(EMAIL_RATE_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, resetAt: 0 };
    const now = Date.now();
    if (now > data.resetAt) { data.count = 0; data.resetAt = now + 3600*1000; }
    if (data.count >= 10) return false;
    data.count++;
    localStorage.setItem(EMAIL_RATE_KEY, JSON.stringify(data));
    return true;
  } catch { return true; }
}
async function sendByEmail() {
  if (!state.numPages) { alert(t('message.noDocument')); return; }
  await sendByMailto();
}
async function sendByEmailJS() {
  if (!confirm(`Envoyer à ${ACHIM.nom} ?`)) return;
  setLoading(true, t('message.processing'));
  try {
    const pdfBlob = await exportFinishedPDF(true);
    if (!pdfBlob) throw new Error(t('message.error'));
    const base64 = await blobToBase64(pdfBlob);
    emailjs.init(EMAILJS_CONFIG.publicKey);
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      to_email: ACHIM.email,
      from_name: state.student.name || 'Élève',
      student_name: state.student.name || 'Élève',
      student_classe: state.student.classe || '',
      student_ecole: ACHIM.nom,
      subject_name: t('subject.' + state.subject),
      work_name: state.workName || '',
      date: new Date().toLocaleDateString(),
      duration: computeStats().duration,
      clips_total: computeStats().clipsTotal,
      attachment: base64,
      filename: buildFileName('travail', 'pdf')
    });
    showToast('📧', t('message.sent'));
  } catch (err) {
    const msg = err?.text || err?.message || t('message.error');
    if (confirm(t('email.errorFallback', { msg }))) await sendByMailto();
  } finally { setLoading(false); }
}
async function sendByMailto() {
  setLoading(true, t('message.processing'));
  try {
    const pdfBlob = await exportFinishedPDF(true);
    if (!pdfBlob) return;
    const filename = buildFileName('travail', 'pdf');
    downloadBlob(pdfBlob, filename);
    const subject = encodeURIComponent(t('email.defaultSubject', { name: state.student.name || 'élève' }) + ' — ' + t('subject.' + state.subject));
    const body = encodeURIComponent(
      t('email.defaultBody', { name: state.student.name || 'élève' }) + '\n\n' +
      `📚 ${t('subject.' + state.subject)}\n` +
      `📅 ${new Date().toLocaleDateString()}\n\n` +
      `👉 PDF "${filename}" à joindre.\n\n${state.student.name || ''} — ${ACHIM.nom}`
    );
    window.location.href = `mailto:${ACHIM.email}?subject=${subject}&body=${body}`;
    showToast('✉️', t('message.downloaded'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setTimeout(() => setLoading(false), 800); }
}
async function shareWork() {
  if (!state.numPages) return;
  setLoading(true, t('message.processing'));
  try {
    const blob = await exportFinishedPDF(true);
    if (!blob) return;
    const filename = buildFileName('travail', 'pdf');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: ACHIM.produit });
      showToast('📤', t('message.shared'));
    } else {
      downloadBlob(blob, filename);
      showToast('📤', t('message.downloaded'));
    }
  } catch (err) { if (err.name !== 'AbortError') alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}

/* ═══════════════════════════════════════════════════════════
   19. HISTORIQUE / SAUVEGARDE
   ═══════════════════════════════════════════════════════════ */
let saveTimeout = null;
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveLocalAuto, 800);
}
function saveLocalAuto() {
  try {
    const data = {
      version: 7, drawData: state.drawData, bgData: state.bgData,
      currentPage: state.currentPage, fileHash: state.fileHash,
      numPages: state.numPages, student: state.student,
      subject: state.subject, workName: state.workName,
      source: { type: state.source.type, pdfName: state.source.pdfName, images: state.source.images.slice(0, 5) },
      savedAt: Date.now()
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    const saveBadge = document.getElementById('saveBadge');
    if (saveBadge) {
      saveBadge.classList.add('show');
      setTimeout(() => saveBadge.classList.remove('show'), 1200);
    }
  } catch (e) { console.warn('Autosave failed:', e); }
}
function loadAutoSave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.savedAt && (Date.now() - data.savedAt) > AUTOSAVE_MAX_AGE_MS) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}
async function restoreAutoSave(autosave) {
  setLoading(true, t('message.processing'));
  showWorkspace();
  try {
    state.drawData = autosave.drawData || {};
    state.bgData = autosave.bgData || {};
    state.currentPage = autosave.currentPage || 1;
    state.fileHash = autosave.fileHash;
    state.student = autosave.student || state.student;
    state.subject = autosave.subject || 'cahier';
    state.workName = autosave.workName || '';
    updateProfileBtn(); updateSubjectBadge();
    if (autosave.source?.type === 'images' && autosave.source.images?.length) {
      state.imageBitmaps = []; state.source.images = [];
      for (const im of autosave.source.images) {
        const bmp = await loadImageFromDataURL(im.dataURL);
        state.imageBitmaps.push(bmp); state.source.images.push(im);
      }
      await renderImagePages();
    } else if (autosave.source?.type === 'pdf') {
      if (confirm(t('save.pdf'))) { document.getElementById('fileInput').click(); return; }
    }
    updatePageInfo();
    showToast('📂', t('message.restored'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
function openSaveMenu() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:540px;text-align:left">
      <h2 style="margin-top:0;color:var(--achim-bleu)">💾 ${t('save.title')}</h2>
      <div class="menu-list">
        <div class="menu-item" data-action="history"><span class="icon">📚</span><div><div class="label">${t('save.history')}</div><div class="desc">${t('save.historyDesc')}</div></div></div>
        <div class="menu-item" data-action="cahier"><span class="icon">📦</span><div><div class="label">${t('save.cahier')}</div><div class="desc">${t('save.cahierDesc')}</div></div></div>
        <div class="menu-item" data-action="pdf"><span class="icon">📄</span><div><div class="label">${t('save.pdf')}</div><div class="desc">${t('save.pdfDesc')}</div></div></div>
        <div class="menu-item" data-action="mail"><span class="icon">📧</span><div><div class="label">${t('save.mail')}</div><div class="desc">→ ${ACHIM.email}</div></div></div>
        <div class="menu-item" data-action="share"><span class="icon">📤</span><div><div class="label">${t('save.share')}</div><div class="desc">${t('save.shareDesc')}</div></div></div>
      </div>
      <button class="modal-close" style="width:100%">${t('action.cancel')}</button>
    </div>`;
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.querySelectorAll('.menu-item').forEach(item => {
    item.onclick = () => {
      const a = item.dataset.action; modal.remove();
      if (a === 'history') saveToHistory();
      else if (a === 'cahier') saveAsCahier();
      else if (a === 'pdf') exportFinishedPDF();
      else if (a === 'mail') sendByEmail();
      else if (a === 'share') shareWork();
    };
  });
  document.body.appendChild(modal);
}
async function saveToHistory() {
  setLoading(true, t('message.processing'));
  try {
    let pdfBlob = null;
    if (state.source.type === 'pdf' && state.pdfDoc) {
      try { const data = await state.pdfDoc.getData(); pdfBlob = new Blob([data], { type: 'application/pdf' }); } catch {}
    }
    const work = {
      id: state.currentWorkId || 'achim_' + Date.now(),
      date: Date.now(),
      student: { ...state.student },
      subject: state.subject,
      workName: state.workName,
      numPages: state.numPages,
      currentPage: state.currentPage,
      drawData: state.drawData,
      bgData: state.bgData,
      sessionDuration: Date.now() - state.sessionStart,
      stats: computeStats(),
      source: { type: state.source.type, pdfName: state.source.pdfName, pdfBlob, images: state.source.images }
    };
    await dbPut(work);
    state.currentWorkId = work.id;
    showToast('📚', t('message.savedHistory'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
async function saveAsCahier() {
  setLoading(true, t('message.processing'));
  try {
    let pdfBase64 = null;
    if (state.pdfDoc) { const data = await state.pdfDoc.getData(); pdfBase64 = arrayBufferToBase64(data); }
    const data = {
      version: 7, createdAt: Date.now(), achim: true,
      student: state.student, subject: state.subject, workName: state.workName,
      numPages: state.numPages, currentPage: state.currentPage,
      drawData: state.drawData, bgData: state.bgData,
      source: { type: state.source.type, pdfName: state.source.pdfName, pdfBase64, images: state.source.images || [] }
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    downloadBlob(blob, buildFileName('cahier', 'cahier'));
    showToast('💾', t('message.saved'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
async function loadWorkFile(file) {
  setLoading(true, t('message.loading'));
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.version || !data.drawData) throw new Error('Invalid file');
    showWorkspace();
    state.drawData = data.drawData || {};
    state.bgData = data.bgData || {};
    state.currentPage = data.currentPage || 1;
    state.numPages = data.numPages || 0;
    state.student = data.student || state.student;
    state.subject = data.subject || 'cahier';
    state.workName = data.workName || '';
    state.currentWorkId = null;
    updateProfileBtn(); updateSubjectBadge();
    if (data.source?.pdfBase64) {
      const bin = atob(data.source.pdfBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      state.pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      state.numPages = state.pdfDoc.numPages;
      state.source.type = 'pdf'; state.source.pdfName = data.source.pdfName;
      state.fileHash = file.name;
      await renderPdfPages();
    } else if (data.source?.images?.length) {
      state.imageBitmaps = []; state.source.images = [];
      for (const im of data.source.images) {
        const bmp = await loadImageFromDataURL(im.dataURL);
        state.imageBitmaps.push(bmp); state.source.images.push(im);
      }
      state.source.type = 'images'; state.numPages = state.imageBitmaps.length;
      state.fileHash = file.name;
      await renderImagePages();
    } else {
      state.numPages = data.numPages || 1;
      state.source.type = 'blank';
      await renderBlankPages(state.numPages);
    }
    updatePageInfo();
    if (state.currentPage > 1) gotoPage(state.currentPage);
    showToast('📂', t('message.restored'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
let historyFilter = 'all';
async function openHistory() {
  setLoading(true, t('message.loading'));
  const allWorks = await dbGetAll();
  allWorks.sort((a, b) => b.date - a.date);
  setLoading(false);
  renderHistoryModal(allWorks);
}
function renderHistoryModal(allWorks) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'historyModal';
  const filtered = historyFilter === 'all' ? allWorks : allWorks.filter(w => w.subject === historyFilter);
  const filters = ['all', ...Object.keys(SUBJECTS)].map(k => {
    const label = k === 'all' ? t('history.all') : `${SUBJECTS[k].emoji} ${t('subject.' + k)}`;
    return `<button class="filter-chip ${historyFilter === k ? 'active' : ''}" data-filter="${k}">${label}</button>`;
  }).join('');
  const emptyMsg = `<p style="text-align:center;color:#95a5a6;padding:32px">${t('history.empty')}</p>`;
  const items = filtered.length === 0 ? emptyMsg : filtered.map(w => {
    const subj = SUBJECTS[w.subject] || SUBJECTS.cahier;
    const date = new Date(w.date);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    const dur = Math.round((w.sessionDuration || 0) / 60000);
    const clipsCount = Object.values(w.drawData || {}).reduce((s, d) => s + (d.clips?.length || 0), 0);
    const pagesTouched = Object.keys(w.drawData || {}).filter(k => (w.drawData[k].strokes||[]).length > 0).length;
    const title = w.workName ? `${w.student?.name || '?'} • ${w.workName}` : `${w.student?.name || '?'} • ${t('subject.' + w.subject)}`;
    const clipsTxt = clipsCount > 0 ? ` • 🖼️ ${clipsCount}` : '';
    return `
      <div class="history-item" data-id="${w.id}" style="border-left-color:${subj.color}">
        <div class="subj-icon">${subj.emoji}</div>
        <div class="info">
          <div class="title">${escapeHtml(title)}</div>
          <div class="meta">${dateStr} • ${dur} min • ${pagesTouched} p.${clipsTxt}</div>
        </div>
        <div class="actions-h">
          <button class="resume" title="${t('history.resume')}">📂</button>
          <button class="export" title="${t('history.exportPDF')}">📤</button>
          <button class="delete" title="${t('history.delete')}">🗑️</button>
        </div>
      </div>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <h2 style="margin-top:0;color:var(--achim-bleu)">📚 ${t('history.title')}</h2>
      <div class="history-filters">${filters}</div>
      <div class="history-list">${items}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button id="exportAllHistory" style="flex:1;padding:10px;border:none;border-radius:8px;background:#3498db;color:white;font-weight:bold;cursor:pointer">${t('history.exportAll')}</button>
        <button id="clearHistory" style="padding:10px;border:none;border-radius:8px;background:#e74c3c;color:white;font-weight:bold;cursor:pointer">${t('history.clear')}</button>
        <button class="modal-close" style="width:auto;padding:10px 20px;margin:0">${t('action.close')}</button>
      </div>
    </div>`;

  modal.querySelectorAll('.filter-chip').forEach(chip => {
    chip.onclick = () => { historyFilter = chip.dataset.filter; modal.remove(); renderHistoryModal(allWorks); };
  });
  modal.querySelectorAll('.history-item').forEach(item => {
    const id = item.dataset.id;
    item.querySelector('.resume').onclick = (e) => { e.stopPropagation(); modal.remove(); resumeFromHistory(id); };
    item.querySelector('.export').onclick = (e) => { e.stopPropagation(); modal.remove(); exportFromHistory(id); };
    item.querySelector('.delete').onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(t('message.confirmDelete'))) return;
      await dbDelete(id); modal.remove(); openHistory();
    };
  });
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.querySelector('#exportAllHistory').onclick = async () => {
    if (filtered.length === 0) { alert(t('history.empty')); return; }
    modal.remove();
    await exportHistoryAsZip(filtered);
  };
  modal.querySelector('#clearHistory').onclick = async () => {
    if (!confirm(t('message.confirmDeleteAll'))) return;
    await dbClear(); modal.remove(); showToast('🗑️', t('history.clear'));
  };
  document.body.appendChild(modal);
}
async function exportHistoryAsZip(works) {
  setLoading(true, t('message.processing'));
  try {
    if (typeof JSZip === 'undefined') {
      const exportData = works.map(w => ({ id: w.id, date: w.date, student: w.student, subject: w.subject, workName: w.workName, numPages: w.numPages, drawData: w.drawData, bgData: w.bgData, stats: w.stats }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `historique-achim-${todayStr()}.json`);
      showToast('📦', `${works.length} ${t('history.exportAll')}`);
      return;
    }
    const zip = new JSZip();
    const indexData = [];
    for (const w of works) {
      const folder = zip.folder(w.id);
      indexData.push({ id: w.id, date: w.date, student: w.student, subject: w.subject, workName: w.workName, numPages: w.numPages, stats: w.stats });
      folder.file('data.json', JSON.stringify(w.drawData));
      folder.file('bg.json', JSON.stringify(w.bgData));
      if (w.source?.pdfBlob) folder.file('source.pdf', w.source.pdfBlob);
    }
    zip.file('index.json', JSON.stringify(indexData, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `historique-achim-${todayStr()}.zip`);
    showToast('📦', `${works.length} ${t('history.exportAll')}`);
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
async function resumeFromHistory(id) {
  setLoading(true, t('message.processing'));
  try {
    const work = await dbGet(id);
    if (!work) throw new Error('Not found');
    showWorkspace();
    state.drawData = work.drawData || {};
    state.bgData = work.bgData || {};
    state.currentPage = work.currentPage || 1;
    state.student = work.student || state.student;
    state.subject = work.subject || 'cahier';
    state.workName = work.workName || '';
    state.currentWorkId = work.id;
    state.sessionStart = Date.now();
    updateProfileBtn(); updateSubjectBadge();
    if (work.source?.pdfBlob) {
      const buf = await work.source.pdfBlob.arrayBuffer();
      state.pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
      state.numPages = state.pdfDoc.numPages;
      state.source.type = 'pdf'; state.source.pdfName = work.source.pdfName;
      state.source.pdfBlob = work.source.pdfBlob;
      state.fileHash = 'history_' + id;
      await renderPdfPages();
    } else if (work.source?.images?.length) {
      state.imageBitmaps = []; state.source.images = [];
      for (const im of work.source.images) {
        const bmp = await loadImageFromDataURL(im.dataURL);
        state.imageBitmaps.push(bmp); state.source.images.push(im);
      }
      state.source.type = 'images'; state.numPages = state.imageBitmaps.length;
      state.fileHash = 'history_' + id;
      await renderImagePages();
    } else {
      state.numPages = work.numPages || 1;
      state.source.type = 'blank';
      await renderBlankPages(state.numPages);
    }
    updatePageInfo();
    if (state.currentPage > 1) gotoPage(state.currentPage);
    showToast('📚', t('history.resume'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
async function exportFromHistory(id) {
  setLoading(true, t('message.processing'));
  try { await resumeFromHistory(id); await exportFinishedPDF(true); }
  finally { setLoading(false); }
}
function initHistory() {
  document.getElementById('btnSaveWork').onclick = openSaveMenu;
  document.getElementById('btnLoadWork').onclick = () => document.getElementById('workInput').click();
  if (document.getElementById('workInputLabel')) document.getElementById('workInputLabel').onclick = () => document.getElementById('workInput').click();
  document.getElementById('btnExportWork').onclick = () => exportFinishedPDF();
  document.getElementById('workInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await loadWorkFile(file);
    e.target.value = '';
  });
  document.getElementById('btnHistory').onclick = openHistory;
  document.getElementById('btnHistoryHome').onclick = openHistory;
}

/* ═══════════════════════════════════════════════════════════
   20. URL
   ═══════════════════════════════════════════════════════════ */
const URL_HISTORY_KEY = 'cahier-achim-url-history';
function normalizeUrl(url) {
  url = url.trim(); if (!url) return '';
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    url = url.replace(/[?&]dl=0/, '').replace(/[?&]dl=[0-9]/, '');
    url += (url.includes('?') ? '&' : '?') + 'dl=1';
    return url;
  }
  const gdocMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (gdocMatch) {
    const type = gdocMatch[1], id = gdocMatch[2];
    if (type === 'document') return `https://docs.google.com/document/d/${id}/export?format=pdf`;
    if (type === 'spreadsheets') return `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`;
    if (type === 'presentation') return `https://docs.google.com/presentation/d/${id}/export/pdf`;
  }
  return url;
}
function detectType(url, contentType = '') {
  const lower = (url + ' ' + contentType).toLowerCase();
  if (lower.includes('application/pdf') || lower.endsWith('.pdf') || lower.includes('.pdf?')) return 'pdf';
  if (lower.includes('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i.test(lower)) return 'image';
  return 'unknown';
}
async function loadFromUrl(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) { alert(t('url.placeholder')); return; }
  setLoading(true, t('message.loading'));
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    const blob = await response.blob();
    const type = detectType(url, contentType);
    if (type === 'pdf') await openPdfFromBlob(blob, url.split('/').pop() || 'document.pdf');
    else if (type === 'image') await openImageFromBlob(blob, url);
    else await openPdfFromBlob(blob, url.split('/').pop() || 'document.pdf');
    saveUrlToHistory(url);
    showToast('🌐', t('url.loaded'));
  } catch (err) {
    alert(t('message.error') + ' : ' + err.message);
  } finally { setLoading(false); }
}
async function openPdfFromBlob(blob, name) {
  const buf = await blob.arrayBuffer();
  state.pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
  state.numPages = state.pdfDoc.numPages;
  state.fileHash = 'url_' + name + '_' + buf.byteLength;
  state.source = { type: 'pdf', pdfName: name, pdfBlob: blob, images: [] };
  state.currentWorkId = null;
  state.drawData = {}; state.bgData = {}; state.currentPage = 1;
  showWorkspace();
  await renderPdfPages();
  updatePageInfo();
}
async function openImageFromBlob(blob, url) {
  const dataURL = await blobToDataURL(blob);
  const compressed = await compressImage(dataURL, 1600, 0.85);
  const bmp = await loadImageFromDataURL(compressed);
  state.pdfDoc = null; state.imageBitmaps = []; state.drawData = {}; state.bgData = {}; state.currentPage = 1;
  state.source = { type: 'images', pdfBlob: null, pdfName: '', images: [] };
  state.imageBitmaps.push(bmp);
  state.source.images.push({ dataURL: compressed, width: bmp.width, height: bmp.height });
  state.source.type = 'images';
  state.numPages = state.imageBitmaps.length;
  showWorkspace();
  await renderAllPages();
  updatePageInfo();
}
function loadUrlHistory() { try { return JSON.parse(localStorage.getItem(URL_HISTORY_KEY) || '[]'); } catch { return []; } }
function saveUrlToHistory(url) {
  const history = loadUrlHistory().filter(u => u.url !== url);
  history.unshift({ url, date: Date.now() });
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}
function openUrlModal() {
  const modal = document.createElement('div');
  modal.className = 'modal url-modal';
  const history = loadUrlHistory();
  const recentChips = history.length
    ? history.slice(0, 6).map(h => {
        const name = h.url.split('/').pop() || h.url;
        return `<span class="recent-chip" data-url="${escapeHtml(h.url)}">${escapeHtml(name.substring(0, 30))}</span>`;
      }).join('')
    : `<span style="font-size:12px;color:#95a5a6">${t('url.none')}</span>`;
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🌐 ${t('url.title')}</h2>
      <label class="modal-label">${t('url.label')}</label>
      <input type="text" id="urlInput" placeholder="${t('url.placeholder')}" autocomplete="off" spellcheck="false">
      <div class="hint">${t('url.hint')}</div>
      <label class="modal-label">${t('url.recent')}</label>
      <div class="url-recent">${recentChips}</div>
      <div class="modal-actions-inline">
        <button class="modal-btn secondary" id="urlCancel">${t('action.cancel')}</button>
        <button class="modal-btn primary" id="urlLoad">${t('url.load')}</button>
      </div>
    </div>`;
  modal.querySelector('#urlCancel').onclick = () => modal.remove();
  modal.querySelector('#urlLoad').onclick = async () => {
    const url = modal.querySelector('#urlInput').value.trim();
    if (!url) { alert(t('url.placeholder')); return; }
    modal.remove();
    await loadFromUrl(url);
  };
  modal.querySelector('#urlInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') modal.querySelector('#urlLoad').click(); });
  modal.querySelectorAll('.recent-chip[data-url]').forEach(chip => {
    chip.onclick = async () => { const url = chip.dataset.url; modal.remove(); await loadFromUrl(url); };
  });
  document.body.appendChild(modal);
}

/* ═══════════════════════════════════════════════════════════
   21. BIBLIOTHÈQUE
   ═══════════════════════════════════════════════════════════ */
const LIBRARY_KEY = 'cahier-achim-library';
function loadLibrary() { try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]'); } catch { return []; } }
function saveLibrary(lib) { localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib)); }
function openLibraryModal() {
  const lib = loadLibrary();
  const modal = document.createElement('div');
  modal.className = 'modal';
  const items = lib.length === 0
    ? `<p style="text-align:center;color:#95a5a6;padding:32px">${t('library.empty')}</p>`
    : lib.map((r, i) => `
        <div class="library-item" data-index="${i}" style="border-left:4px solid #16a085;background:#f5f7fa;padding:12px 14px;border-radius:10px;margin:6px 0;display:flex;align-items:center;gap:12px">
          <div class="lib-icon" style="font-size:24px;min-width:36px;text-align:center;cursor:pointer">${r.icon || '📄'}</div>
          <div class="lib-info" style="flex:1;min-width:0;cursor:pointer">
            <div style="font-weight:bold;color:#2c3e50;font-size:14px">${escapeHtml(r.title)}</div>
            <div style="font-size:12px;color:#7f8c8d">${escapeHtml(r.desc || r.url)}</div>
          </div>
          <button class="edit" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer">✏️</button>
          <button class="delete" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer">🗑️</button>
        </div>`).join('');
  modal.innerHTML = `
    <div class="modal-content" style="max-width:640px;text-align:left;width:90vw">
      <h2 style="margin-top:0;color:#16a085">📚 ${t('library.title')}</h2>
      <div class="library-list">${items}</div>
      <div class="modal-actions-inline">
        <button id="libAdd" class="modal-btn primary">${t('library.add')}</button>
        <button class="modal-close" style="width:auto;padding:12px 20px;margin:0">${t('action.close')}</button>
      </div>
    </div>`;
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.querySelector('#libAdd').onclick = () => { modal.remove(); openAddLibraryItem(); };
  modal.querySelectorAll('.library-item').forEach(item => {
    const index = parseInt(item.dataset.index);
    item.querySelector('.lib-icon').onclick = item.querySelector('.lib-info').onclick = async () => {
      const r = lib[index];
      modal.remove();
      await loadFromUrl(r.url);
    };
    item.querySelector('.edit').onclick = (e) => { e.stopPropagation(); modal.remove(); openAddLibraryItem(index); };
    item.querySelector('.delete').onclick = (e) => {
      e.stopPropagation();
      if (!confirm(t('message.confirmDelete'))) return;
      lib.splice(index, 1); saveLibrary(lib); modal.remove(); openLibraryModal();
    };
  });
  document.body.appendChild(modal);
}
function openAddLibraryItem(editIndex = null) {
  const lib = loadLibrary();
  const existing = editIndex !== null ? lib[editIndex] : { icon: '📄', title: '', desc: '', url: '' };
  const modal = document.createElement('div');
  modal.className = 'modal url-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${editIndex !== null ? '✏️ ' + t('library.edit') : '➕ ' + t('library.add')}</h2>
      <label class="modal-label">${t('library.icon')}</label>
      <input type="text" id="libIcon" value="${escapeHtml(existing.icon)}" maxlength="4" style="font-size:24px;text-align:center">
      <label class="modal-label">${t('library.name')}</label>
      <input type="text" id="libTitle" value="${escapeHtml(existing.title)}">
      <label class="modal-label">${t('library.description')}</label>
      <input type="text" id="libDesc" value="${escapeHtml(existing.desc)}">
      <label class="modal-label">${t('library.link')}</label>
      <input type="text" id="libUrl" value="${escapeHtml(existing.url)}">
      <div class="modal-actions-inline">
        <button class="modal-btn secondary" id="libCancel">${t('action.cancel')}</button>
        <button class="modal-btn primary" id="libSave">💾 ${t('action.save')}</button>
      </div>
    </div>`;
  modal.querySelector('#libCancel').onclick = () => modal.remove();
  modal.querySelector('#libSave').onclick = () => {
    const item = {
      icon: modal.querySelector('#libIcon').value.trim() || '📄',
      title: modal.querySelector('#libTitle').value.trim(),
      desc: modal.querySelector('#libDesc').value.trim(),
      url: modal.querySelector('#libUrl').value.trim()
    };
    if (!item.title || !item.url) { alert(t('library.required')); return; }
    if (editIndex !== null) lib[editIndex] = item; else lib.push(item);
    saveLibrary(lib);
    modal.remove();
    showToast(item.icon, t('library.saved'));
    openLibraryModal();
  };
  document.body.appendChild(modal);
}

/* ═══════════════════════════════════════════════════════════
   22. PARTAGE
   ═══════════════════════════════════════════════════════════ */
function initShare() {
  const shareLinkModal = document.getElementById('shareLinkModal');
  const shareLinkOutput = document.getElementById('shareLinkOutput');
  document.getElementById('btnShareLink').onclick = () => {
    shareLinkModal.style.display = 'flex';
    generateShareLink();
  };
  document.getElementById('shareClose').onclick = () => { shareLinkModal.style.display = 'none'; };
  document.getElementById('shareCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(shareLinkOutput.value); showToast('📋', t('message.copy')); }
    catch { shareLinkOutput.select(); document.execCommand('copy'); }
  };
  document.getElementById('shareQR').onclick = () => {
    const qrDiv = document.getElementById('shareQRCode');
    const url = shareLinkOutput.value;
    if (!url || url.length > 1500) {
      qrDiv.innerHTML = `<p style="color:#e74c3c">${t('share.tooLong')}</p>`;
      return;
    }
    qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}" alt="QR">`;
  };
}
function generateShareLink() {
  const shareLinkOutput = document.getElementById('shareLinkOutput');
  try {
    const payload = {
      v: 1,
      s: { n: state.student.name, c: state.student.classe },
      j: state.subject, w: state.workName, p: state.numPages, d: {}
    };
    for (const [page, data] of Object.entries(state.drawData)) {
      payload.d[page] = {
        st: (data.strokes || []).map(s => {
          if (s.points) return { t: s.tool, c: s.color, sz: s.size, a: s.alpha, p: s.points.map(p => [Math.round(p.x), Math.round(p.y)]) };
          return s;
        }),
        cl: []
      };
    }
    const json = JSON.stringify(payload);
    let encoded;
    if (typeof LZString !== 'undefined') encoded = LZString.compressToEncodedURIComponent(json);
    else encoded = btoa(encodeURIComponent(json));
    shareLinkOutput.value = `${location.origin}${location.pathname}#share=${encoded}`;
  } catch (err) {
    shareLinkOutput.value = t('message.error') + ' : ' + err.message;
  }
}
async function tryLoadSharedLink() {
  const hash = location.hash;
  if (!hash.startsWith('#share=')) return;
  const encoded = hash.substring(7);
  try {
    let json;
    if (typeof LZString !== 'undefined') json = LZString.decompressFromEncodedURIComponent(encoded);
    else json = decodeURIComponent(atob(encoded));
    if (!json) throw new Error('Invalid');
    const payload = JSON.parse(json);
    showWorkspace();
    state.student.name = payload.s?.n || '';
    state.student.classe = payload.s?.c || '';
    state.subject = payload.j || 'cahier';
    state.workName = payload.w || '';
    state.numPages = payload.p || 1;
    state.drawData = {};
    for (const [page, data] of Object.entries(payload.d || {})) {
      state.drawData[page] = {
        strokes: (data.st || []).map(s => {
          if (s.p) return { ...s, points: s.p.map(([x, y]) => ({ x, y })) };
          return s;
        }),
        clips: []
      };
    }
    state.source.type = 'blank';
    await renderBlankPages(state.numPages);
    updateProfileBtn();
    updateSubjectBadge();
    updatePageInfo();
    showToast('🔗', t('message.shared'));
    history.replaceState(null, '', location.pathname);
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
}

/* ═══════════════════════════════════════════════════════════
   23. VERROU PARENTAL
   ═══════════════════════════════════════════════════════════ */
const PIN_KEY = 'cahier-achim-parental-pin';
let pendingParentalAction = null;

function getParentalPin() { return localStorage.getItem(PIN_KEY); }
function isParentalLocked() { return document.body.classList.contains('parental-lock-on'); }
function initParentalLock() {
  document.getElementById('btnParentalLock').onclick = () => {
    if (getParentalPin()) {
      const isOn = isParentalLocked();
      askParentalPin((ok) => {
        if (!ok) return;
        if (isOn) {
          if (confirm(t('parental.confirmDeactivate'))) {
            document.body.classList.remove('parental-lock-on');
            showToast('🔓', t('parental.deactivated'));
          }
        } else {
          document.body.classList.add('parental-lock-on');
          showToast('🔐', t('parental.activated'));
        }
      }, isOn ? t('parental.confirmDeactivate') : t('parental.confirmActivate'));
    } else {
      const pin = prompt(t('parental.create'));
      if (!pin || !/^\d{4}$/.test(pin)) { alert(t('parental.invalid')); return; }
      localStorage.setItem(PIN_KEY, pin);
      document.body.classList.add('parental-lock-on');
      showToast('🔐', t('parental.activated'));
    }
  };
  document.getElementById('parentalConfirm').onclick = () => {
    const pin = document.getElementById('parentalPinInput').value.trim();
    if (pin === getParentalPin()) {
      document.getElementById('parentalLockModal').style.display = 'none';
      pendingParentalAction?.(true);
    } else {
      document.getElementById('parentalLockMsg').textContent = t('parental.wrong');
      document.getElementById('parentalPinInput').value = '';
    }
  };
  document.getElementById('parentalCancel').onclick = () => {
    document.getElementById('parentalLockModal').style.display = 'none';
    pendingParentalAction?.(false);
  };
}
function askParentalPin(callback, actionLabel = '') {
  document.getElementById('parentalLockModal').style.display = 'flex';
  document.getElementById('parentalPinInput').value = '';
  document.getElementById('parentalPinInput').focus();
  document.getElementById('parentalLockMsg').textContent = actionLabel || t('parental.message');
  pendingParentalAction = callback;
}

/* ═══════════════════════════════════════════════════════════
   24. SCAN INTELLIGENT
   ═══════════════════════════════════════════════════════════ */
function startSmartScan() {
  const temp = document.createElement('input');
  temp.type = 'file'; temp.accept = 'image/*'; temp.capture = 'environment';
  temp.onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const dataURL = await readAsDataURL(f);
    await processSmartScan(dataURL);
  };
  temp.click();
}
async function processSmartScan(dataURL) {
  setLoading(true, t('scan.analyzing'));
  try {
    const img = await loadImageFromDataURL(dataURL);
    const bounds = detectPaperBounds(img.img);
    const canvas = document.createElement('canvas');
    canvas.width = bounds.w; canvas.height = bounds.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img.img, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
    enhanceContrast(ctx, bounds.w, bounds.h);
    const enhanced = canvas.toDataURL('image/jpeg', 0.85);
    const compressed = await compressImage(enhanced, 1600, 0.85);
    const bmp = await loadImageFromDataURL(compressed);
    const hasContent = state.pdfDoc || state.imageBitmaps.length > 0;
    let mode = 'replace';
    if (hasContent) { mode = await askMode(1); if (!mode) return; }
    if (mode === 'replace') {
      state.pdfDoc = null; state.imageBitmaps = []; state.drawData = {}; state.bgData = {}; state.currentPage = 1;
      state.source = { type: 'images', pdfBlob: null, pdfName: '', images: [] };
    }
    state.imageBitmaps.push(bmp);
    state.source.images.push({ dataURL: compressed, width: bmp.width, height: bmp.height });
    state.source.type = 'images';
    state.numPages = state.imageBitmaps.length;
    await renderAllPages();
    updatePageInfo();
    showToast('📸', t('scan.added'));
  } catch (err) { alert(t('message.error') + ' : ' + err.message); }
  finally { setLoading(false); }
}
function detectPaperBounds(image) {
  const canvas = document.createElement('canvas');
  const MAX = 300;
  const ratio = image.width / image.height;
  canvas.width = MAX; canvas.height = Math.round(MAX / ratio);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  const THRESHOLD = 180;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      if (lum > THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w: image.width, h: image.height };
  const scaleX = image.width / canvas.width;
  const scaleY = image.height / canvas.height;
  const pad = 10;
  return {
    x: Math.max(0, Math.round((minX - pad) * scaleX)),
    y: Math.max(0, Math.round((minY - pad) * scaleY)),
    w: Math.min(image.width, Math.round((maxX - minX + pad * 2) * scaleX)),
    h: Math.min(image.height, Math.round((maxY - minY + pad * 2) * scaleY))
  };
}
function enhanceContrast(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }
  const range = max - min || 1;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, ((data[i] - min) / range) * 255));
    data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - min) / range) * 255));
    data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - min) / range) * 255));
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ═══════════════════════════════════════════════════════════
   25. RECHERCHE PDF
   ═══════════════════════════════════════════════════════════ */
let searchMatches = [];
let searchIndex = -1;
let pdfSearchOpen = false;

function updatePdfSearchButtonState() {
  const btnPdfSearch = document.getElementById('btnPdfSearch');
  if (!btnPdfSearch) return;
  if (!state.numPages) { btnPdfSearch.style.display = 'none'; return; }
  btnPdfSearch.style.display = 'flex';
  const isPdf = state.source.type === 'pdf' && state.pdfDoc;
  if (!isPdf) {
    btnPdfSearch.disabled = true;
    btnPdfSearch.style.opacity = '0.4';
  } else {
    btnPdfSearch.disabled = false;
    btnPdfSearch.style.opacity = '1';
  }
}
function initPdfSearch() {
  const bar = document.createElement('div');
  bar.id = 'pdfSearchBar';
  bar.innerHTML = `
    <input type="text" id="pdfSearchInput" placeholder="${t('search.placeholder')}">
    <span id="pdfSearchResults">${t('search.notFound')}</span>
    <button id="pdfSearchPrev">◀</button>
    <button id="pdfSearchNext">▶</button>
    <button id="pdfSearchClose">✕</button>`;
  document.body.appendChild(bar);
  const btnPdfSearch = document.getElementById('btnPdfSearch');
  if (btnPdfSearch) btnPdfSearch.onclick = togglePdfSearch;
  document.getElementById('pdfSearchClose').onclick = closePdfSearch;
  document.getElementById('pdfSearchNext').onclick = () => {
    if (searchMatches.length === 0) return;
    searchIndex = (searchIndex + 1) % searchMatches.length;
    highlightCurrentMatch();
  };
  document.getElementById('pdfSearchPrev').onclick = () => {
    if (searchMatches.length === 0) return;
    searchIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    highlightCurrentMatch();
  };
  document.getElementById('pdfSearchInput').addEventListener('input', (e) => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(() => runPdfSearch(e.target.value), 300);
  });
  document.getElementById('pdfSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('pdfSearchNext').click(); }
    if (e.key === 'Escape') closePdfSearch();
  });
}
function togglePdfSearch() { pdfSearchOpen ? closePdfSearch() : openPdfSearch(); }
function openPdfSearch() {
  const isPdf = state.source.type === 'pdf' && state.pdfDoc;
  if (!isPdf) { showToast('📷', t('search.noText')); return; }
  pdfSearchOpen = true;
  document.getElementById('pdfSearchBar').classList.add('show');
  document.getElementById('btnPdfSearch').classList.add('active');
  setTimeout(() => document.getElementById('pdfSearchInput').focus(), 200);
}
function closePdfSearch() {
  pdfSearchOpen = false;
  document.getElementById('pdfSearchBar').classList.remove('show');
  document.getElementById('btnPdfSearch').classList.remove('active');
  clearSearchHighlights();
  document.getElementById('pdfSearchInput').value = '';
}
function clearSearchHighlights() {
  document.querySelectorAll('.pdf-search-highlight, .pdf-search-current')
    .forEach(el => el.classList.remove('pdf-search-highlight', 'pdf-search-current'));
  searchMatches = [];
  searchIndex = -1;
  const el = document.getElementById('pdfSearchResults');
  if (el) el.textContent = t('search.notFound');
}
function runPdfSearch(query) {
  clearSearchHighlights();
  if (!query || query.length < 2) return;
  query = query.toLowerCase();
  for (let p = 1; p <= state.numPages; p++) {
    const container = document.getElementById('viewer').querySelector(`.page-container[data-page="${p}"]`);
    const textLayer = container?.querySelector('.text-layer');
    if (!textLayer) continue;
    textLayer.querySelectorAll('span').forEach(span => {
      if (span.textContent.toLowerCase().includes(query)) {
        span.classList.add('pdf-search-highlight');
        searchMatches.push({ page: p, span });
      }
    });
  }
  document.getElementById('pdfSearchResults').textContent = t('search.results', { n: searchMatches.length });
  if (searchMatches.length > 0) { searchIndex = 0; highlightCurrentMatch(); }
}
function highlightCurrentMatch() {
  document.querySelectorAll('.pdf-search-current').forEach(el => el.classList.remove('pdf-search-current'));
  if (searchIndex < 0 || searchIndex >= searchMatches.length) return;
  const m = searchMatches[searchIndex];
  m.span.classList.add('pdf-search-current');
  if (m.page !== state.currentPage) gotoPage(m.page);
  setTimeout(() => m.span.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

/* ═══════════════════════════════════════════════════════════
   26. MINIATURES
   ═══════════════════════════════════════════════════════════ */
function initThumbnails() {
  const sidebar = document.createElement('aside');
  sidebar.id = 'thumbnailSidebar';
  sidebar.innerHTML = `
    <div class="thumb-header">
      <span>📑 ${t('toolbar.thumbnails')}</span>
      <button id="thumbClose">✕</button>
    </div>
    <div id="thumbList"></div>`;
  document.body.appendChild(sidebar);
  document.getElementById('thumbClose').onclick = toggleThumbnailSidebar;
  const btn = document.getElementById('btnThumbnails');
  if (btn) btn.onclick = toggleThumbnailSidebar;
}
function toggleThumbnailSidebar() {
  const sidebar = document.getElementById('thumbnailSidebar');
  const btn = document.getElementById('btnThumbnails');
  const visible = sidebar.classList.toggle('show');
  if (btn) btn.classList.toggle('active', visible);
  if (visible) buildThumbnails();
}
function buildThumbnails() {
  const thumbList = document.getElementById('thumbList');
  if (!thumbList) return;
  thumbList.innerHTML = '';
  for (let i = 1; i <= state.numPages; i++) {
    const container = document.getElementById('viewer').querySelector(`.page-container[data-page="${i}"]`);
    if (!container) continue;
    const item = document.createElement('div');
    item.className = 'thumb-item';
    if (i === state.currentPage) item.classList.add('active');
    const num = document.createElement('div');
    num.className = 'thumb-num';
    num.textContent = `${t('button.pdf')} ${i}`;
    item.appendChild(num);
    const pdfCanvas = container.querySelector('.pdf-canvas');
    const thumbCanvas = document.createElement('canvas');
    const targetWidth = 160;
    const ratio = pdfCanvas.width / pdfCanvas.height;
    thumbCanvas.width = targetWidth;
    thumbCanvas.height = Math.round(targetWidth / ratio);
    try { thumbCanvas.getContext('2d').drawImage(pdfCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height); } catch {}
    item.appendChild(thumbCanvas);
    item.onclick = () => {
      gotoPage(i);
      thumbList.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
    };
    thumbList.appendChild(item);
  }
}

/* ═══════════════════════════════════════════════════════════
   27. MODE PRÉSENTATION
   ═══════════════════════════════════════════════════════════ */
const presentation = { active: false, spotlight: false };

function initPresentation() {
  document.getElementById('btnPresent').onclick = () => { if (presentation.active) exitPresentation(); else enterPresentation(); };
  document.getElementById('presentPrev').onclick = () => gotoPage(state.currentPage - 1);
  document.getElementById('presentNext').onclick = () => gotoPage(state.currentPage + 1);
  document.getElementById('presentZoomIn').onclick = () => { state.zoom = Math.min(3, state.zoom + 0.2); applyZoom(); };
  document.getElementById('presentZoomOut').onclick = () => { state.zoom = Math.max(0.4, state.zoom - 0.2); applyZoom(); };
  document.getElementById('presentSpotlight').onclick = toggleSpotlight;
  document.getElementById('presentFullscreen').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  document.getElementById('presentExit').onclick = exitPresentation;
  document.getElementById('presentPen').onclick = () => {
    state.tool = 'pen';
    Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
    if (toolButtons.pen) toolButtons.pen.classList.add('active');
    document.getElementById('presentPen').classList.add('active');
    document.getElementById('presentEraser').classList.remove('active');
    showToast('✏️', t('toolbar.pen'));
  };
  document.getElementById('presentEraser').onclick = () => {
    state.tool = 'eraser';
    Object.values(toolButtons).forEach(b => b && b.classList.remove('active'));
    if (toolButtons.eraser) toolButtons.eraser.classList.add('active');
    document.getElementById('presentEraser').classList.add('active');
    document.getElementById('presentPen').classList.remove('active');
    showToast('🧽', t('toolbar.eraser'));
  };
}
function enterPresentation() {
  if (!state.numPages) { alert(t('message.noDocument')); return; }
  presentation.active = true;
  document.body.classList.add('presentation-mode');
  const help = document.getElementById('keyboardHelp');
  if (help) { help.classList.add('show'); setTimeout(() => help.classList.remove('show'), 5000); }
  updatePresentPageInfo();
  if (document.fullscreenElement === null) document.documentElement.requestFullscreen?.().catch(() => {});
  document.addEventListener('keydown', handlePresentationKey);
  document.addEventListener('mousemove', handleSpotlightMove);
  setTimeout(() => { document.getElementById('presentPen')?.classList.add('active'); }, 100);
  showToast('🖥️', t('presentation.mode'));
}
function exitPresentation() {
  presentation.active = false; presentation.spotlight = false;
  document.body.classList.remove('presentation-mode');
  document.body.classList.remove('spotlight-on');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  document.removeEventListener('keydown', handlePresentationKey);
  document.removeEventListener('mousemove', handleSpotlightMove);
  showToast('👋', t('action.close'));
}
function updatePresentPageInfo() {
  const el = document.getElementById('presentPageInfo');
  if (el) el.textContent = `${state.currentPage} / ${state.numPages}`;
}
function handlePresentationKey(e) {
  if (!presentation.active) return;
  if (e.target.isContentEditable || e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case ' ': e.preventDefault(); gotoPage(state.currentPage + 1); break;
    case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); gotoPage(state.currentPage - 1); break;
    case '+': case '=': e.preventDefault(); state.zoom = Math.min(3, state.zoom + 0.2); applyZoom(); break;
    case '-': case '_': e.preventDefault(); state.zoom = Math.max(0.4, state.zoom - 0.2); applyZoom(); break;
    case 's': case 'S': e.preventDefault(); toggleSpotlight(); break;
    case 'Escape': exitPresentation(); break;
  }
}
function handleSpotlightMove(e) {
  if (!presentation.spotlight) return;
  const spot = document.getElementById('spotlight');
  if (spot) { spot.style.left = e.clientX + 'px'; spot.style.top = e.clientY + 'px'; }
}
function toggleSpotlight() {
  presentation.spotlight = !presentation.spotlight;
  document.body.classList.toggle('spotlight-on', presentation.spotlight);
  document.getElementById('presentSpotlight').classList.toggle('active', presentation.spotlight);
}

/* ═══════════════════════════════════════════════════════════
   28. PWA
   ═══════════════════════════════════════════════════════════ */
let deferredPrompt = null;
function isPwaInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
/* ═══════════════════════════════════════════════════════════
   28. PWA — Service Worker + Installation
   Version robuste : gère readyState, scope explicite,
   fallback, mises à jour, et installation manuelle iOS/Firefox.
   ═══════════════════════════════════════════════════════════ */



function isPwaInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
      || document.referrer.includes('android-app://');
}

/* Détecte le sous-répertoire de l'app (ex: /cna/ ou /cahier-achim/)
   Permet au SW de s'enregistrer correctement quel que soit le déploiement. */
function getAppBasePath() {
  // Si l'URL contient /cna/, on prend /cna/, sinon on prend le répertoire du script
  const path = location.pathname;
  if (path.includes('/cna/')) return '/cna/';
  if (path.includes('/cahier-achim/')) return '/cahier-achim/';
  // Fallback : répertoire courant (avec slash final)
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  return dir || '/';
}

function initPWA() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] ❌ Service Worker non supporté par ce navigateur');
    return;
  }

  const basePath = getAppBasePath();
  const swUrl = basePath + 'sw.js';
  console.log('[PWA] Base path :', basePath);
  console.log('[PWA] SW URL    :', swUrl);

  /* ─────────────────────────────────────────────
     Enregistrement du Service Worker
     ───────────────────────────────────────────── */
  const registerSW = async () => {
    try {
      const reg = await navigator.serviceWorker.register(swUrl, {
        scope: basePath,
        updateViaCache: 'none'
      });
      console.log('[PWA] ✅ SW enregistré :', reg.scope);

      // Suivi du cycle de vie
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        console.log('[PWA] 🔄 Nouveau SW détecté');
        newWorker?.addEventListener('statechange', () => {
          console.log('[PWA]    state :', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Une mise à jour est prête
            if (typeof showToast === 'function') {
              showToast('🔄', 'Mise à jour disponible — recharge la page');
            }
          }
        });
      });
    } catch (err) {
      console.error('[PWA] ❌ Échec enregistrement SW :', err);
      console.error('     name    :', err.name);
      console.error('     message :', err.message);
      // Fallback : essayer avec chemin relatif
      try {
        const reg2 = await navigator.serviceWorker.register('./sw.js', { scope: basePath });
        console.log('[PWA] ✅ SW enregistré (fallback relatif) :', reg2.scope);
      } catch (err2) {
        console.error('[PWA] ❌ Fallback aussi échoué :', err2);
      }
    }
  };

  // ⚠️ CRUCIAL : si readyState est déjà 'complete', le 'load' ne se déclenchera jamais
  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW, { once: true });
  }

  /* ─────────────────────────────────────────────
     Écoute des messages du SW
     ───────────────────────────────────────────── */
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'SW_ACTIVATED') {
      console.log('[PWA] ✅ SW actif, version', data.version);
      // Si la page n'est pas encore contrôlée, on recharge une seule fois
      if (!navigator.serviceWorker.controller) {
        console.log('[PWA] 🔄 Rechargement pour obtenir le contrôle...');
        // Éviter une boucle infinie
        const reloaded = sessionStorage.getItem('pwa-reloaded-for-control');
        if (!reloaded) {
          sessionStorage.setItem('pwa-reloaded-for-control', '1');
          setTimeout(() => location.reload(), 500);
        }
      }
    }
  });

  /* ─────────────────────────────────────────────
     Changement de contrôleur (mise à jour appliquée)
     ───────────────────────────────────────────── */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] 🔄 controllerchange — nouveau contrôleur :',
      navigator.serviceWorker.controller?.scriptURL);
    // Nettoyer le flag de reload pour les prochaines mises à jour
    sessionStorage.removeItem('pwa-reloaded-for-control');
  });

  /* ─────────────────────────────────────────────
     beforeinstallprompt — bouton d'installation
     ───────────────────────────────────────────── */
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] 🎉 beforeinstallprompt reçu');
    if (isPwaInstalled()) {
      console.log('[PWA] Déjà installé, on ignore');
      return;
    }
    e.preventDefault();
    deferredPrompt = e;
    // Attendre que le DOM soit prêt avant d'afficher le bouton
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showInstallButton, { once: true });
    } else {
      showInstallButton();
    }
  });

  /* ─────────────────────────────────────────────
     Installation effectuée
     ───────────────────────────────────────────── */
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ✅ Application installée');
    const btn = document.getElementById('btnInstallPwa');
    if (btn) btn.remove();
    deferredPrompt = null;
    if (typeof showToast === 'function') showToast('📱', 'Application installée !');
  });

  /* ─────────────────────────────────────────────
     Statut en ligne / hors ligne
     ───────────────────────────────────────────── */
  window.addEventListener('online', () => {
    console.log('[PWA] 📡 En ligne');
    document.getElementById('offlineBadge')?.classList.remove('show');
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] 📡 Hors ligne');
    document.getElementById('offlineBadge')?.classList.add('show');
  });

  if (!navigator.onLine) {
    document.getElementById('offlineBadge')?.classList.add('show');
  }

  /* ─────────────────────────────────────────────
     Affichage du bouton d'installation
     (gère Chrome/Edge natif + fallback iOS/Firefox/Safari)
     ───────────────────────────────────────────── */
  function showInstallButton() {
    if (document.getElementById('btnInstallPwa')) return;
    if (isPwaInstalled()) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    const btn = document.createElement('button');
    btn.id = 'btnInstallPwa';
    btn.setAttribute('aria-label', "Installer l'application");
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      padding: 12px 20px;
      background: #1A3E62;
      color: #fff;
      border: none;
      border-radius: 50px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: system-ui, sans-serif;
    `;

    if (isIOS) {
      btn.innerHTML = '⬇️ Installer (iOS)';
      btn.onclick = () => {
        alert(
          'Sur iPhone / iPad :\n\n' +
          '1. Touche le bouton Partager ⎋\n' +
          '2. Choisis « Sur l\'écran d\'accueil »\n' +
          '3. Touche « Ajouter »\n\n' +
          'L\'application apparaîtra comme une icône sur ton écran.'
        );
      };
    } else if (isFirefox || isSafari || !deferredPrompt) {
      // Fallback : navigateur sans beforeinstallprompt
      btn.innerHTML = '⬇️ Installer';
      btn.onclick = () => {
        alert(
          'Pour installer l\'application :\n\n' +
          '• Sur Chrome / Edge : menu ⋮ → « Installer l\'application »\n' +
          '• Sur Safari (Mac) : Fichier → « Ajouter au Dock »\n' +
          '• Sur Firefox : n\'est pas supporté — utilise Chrome ou Edge'
        );
      };
    } else {
      // Chrome / Edge : prompt natif
      btn.innerHTML = '⬇️ Installer';
      btn.onclick = async () => {
        if (!deferredPrompt) {
          console.warn('[PWA] Plus de prompt disponible');
          return;
        }
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] Choix utilisateur :', outcome);
          if (outcome === 'accepted') {
            if (typeof showToast === 'function') showToast('📱', 'Installation en cours…');
            btn.remove();
          } else {
            console.log('[PWA] Installation refusée');
          }
        } catch (err) {
          console.error('[PWA] Erreur prompt :', err);
        } finally {
          deferredPrompt = null;
        }
      };
    }

    document.body.appendChild(btn);
  }
}

window.addEventListener('offline', () => { console.log('📡 Offline'); });
/* ═══════════════════════════════════════════════════════════
   29. RACCOURCIS CLAVIER
   ═══════════════════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.isContentEditable || ['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (presentation.active) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undoGlobal(); return; }
    if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redoGlobal(); return; }
    if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); saveToHistory(); return; }
    if (ctrl && e.key.toLowerCase() === 'e') { e.preventDefault(); exportFinishedPDF(); return; }
    if (ctrl && e.key.toLowerCase() === 'f') { e.preventDefault(); togglePdfSearch(); return; }
    if (ctrl && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleThumbnailSidebar(); return; }
    if (ctrl && e.key.toLowerCase() === 'o') { e.preventDefault(); document.getElementById('fileInput').click(); return; }
    const tools = { 'b': 'pen', 'p': 'pen', 'e': 'eraser', 'h': 'highlighter', 't': 'text', 'l': 'line', 'c': 'circle', 'r': 'rect', 's': 'sticker' };
    if (tools[e.key.toLowerCase()] && !ctrl) {
      const tool = tools[e.key.toLowerCase()];
      if (toolButtons[tool]) toolButtons[tool].click();
      return;
    }
    const swatches = document.querySelectorAll('.color-swatch');
    const num = parseInt(e.key);
    if (num >= 1 && num <= swatches.length && !ctrl) { swatches[num - 1].click(); return; }
    if (e.key === 'PageDown') { e.preventDefault(); gotoPage(state.currentPage + 1); }
    if (e.key === 'PageUp') { e.preventDefault(); gotoPage(state.currentPage - 1); }
  });
}

/* ═══════════════════════════════════════════════════════════
   30. NAVIGATION PAGES
   ═══════════════════════════════════════════════════════════ */
function initPageNavigation() {
  document.getElementById('btnPrev').onclick = () => gotoPage(state.currentPage - 1);
  document.getElementById('btnNext').onclick = () => gotoPage(state.currentPage + 1);
  const pageJumpInput = document.getElementById('pageJumpInput');
  function jumpToTypedPage() {
    if (!pageJumpInput) return;
    const n = parseInt(pageJumpInput.value, 10);
    if (isNaN(n)) { pageJumpInput.value = state.currentPage; return; }
    const clamped = Math.max(1, Math.min(state.numPages, n));
    if (clamped !== n) pageJumpInput.value = clamped;
    gotoPage(clamped);
  }
  if (pageJumpInput) {
    pageJumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); pageJumpInput.blur(); jumpToTypedPage(); }
      if (e.key === 'Escape') { pageJumpInput.value = state.currentPage; pageJumpInput.blur(); }
    });
    pageJumpInput.addEventListener('blur', jumpToTypedPage);
    pageJumpInput.addEventListener('focus', () => pageJumpInput.select());
  }
  document.getElementById('btnTwoPages').onclick = () => {
    if (window.innerWidth < 700 && window.innerHeight > window.innerWidth) {
      showToast('📱', t('toolbar.twoPages'));
      return;
    }
    state.twoPages = !state.twoPages;
    const viewer = document.getElementById('viewer');
    viewer.classList.toggle('two-pages', state.twoPages);
    document.getElementById('btnTwoPages').classList.toggle('active', state.twoPages);
    try { localStorage.setItem('cahier-twoPages', state.twoPages); } catch {}
    if (state.twoPages) {
      const maxZoom = Math.min(1, (window.innerWidth - 80) / (2 * 900));
      state.zoom = Math.max(0.35, maxZoom);
    } else { state.zoom = 1; }
    applyZoom();
    showToast(state.twoPages ? '📖' : '📄', t('toolbar.twoPages'));
  };
  document.getElementById('zoomIn').onclick = () => { state.zoom = Math.min(3, state.zoom + 0.2); applyZoom(); };
  document.getElementById('zoomOut').onclick = () => { state.zoom = Math.max(0.4, state.zoom - 0.2); applyZoom(); };
  document.getElementById('zoomReset').onclick = () => { state.zoom = 1; applyZoom(); };
  window.addEventListener('scroll', () => {
    if (!state.numPages) return;
    const containers = document.getElementById('viewer').querySelectorAll('.page-container');
    let best = state.currentPage, bestDist = Infinity;
    containers.forEach(c => {
      const d = Math.abs(c.getBoundingClientRect().top - 170);
      if (d < bestDist) { bestDist = d; best = +c.dataset.page; }
    });
    if (best !== state.currentPage) { state.currentPage = best; updatePageInfo(); updatePresentPageInfo(); }
  });
}

/* ═══════════════════════════════════════════════════════════
   31. LOGO
   ═══════════════════════════════════════════════════════════ */
const LOGO_KEY = 'cahier-achim-logo';
function loadLogo() {
  try {
    const saved = localStorage.getItem(LOGO_KEY);
    if (saved) { state.schoolLogo = saved; applyLogo(); }
  } catch {}
}
function saveLogo(dataURL) {
  state.schoolLogo = dataURL;
  try { localStorage.setItem(LOGO_KEY, dataURL); } catch {}
  applyLogo();
}
function applyLogo() {
  const box = document.getElementById('schoolLogo');
  const emptyBox = document.getElementById('emptyLogo');
  if (box) {
    box.innerHTML = state.schoolLogo ? `<img src="${state.schoolLogo}" alt="Logo">` : '<span class="fallback">CNA</span>';
  }
  if (emptyBox) {
    emptyBox.innerHTML = state.schoolLogo ? `<img src="${state.schoolLogo}" alt="Logo">` : '<span>CNA</span>';
  }
}
function initLogo() {
  loadLogo();
  document.getElementById('schoolLogo').onclick = () => document.getElementById('logoInput').click();
  document.getElementById('logoInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dataURL = await readAsDataURL(f);
      const compressed = await compressPNG(dataURL, 256);
      saveLogo(compressed);
      showToast('🎓', t('message.saved'));
    } catch (err) { alert(t('message.error') + ' : ' + err.message); }
    e.target.value = '';
  });
}

/* ═══════════════════════════════════════════════════════════
   32. INITIALISATION
   ═══════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    SplashScreen.update(5, 'Initialisation...');  // ← texte neutre, PAS de t()
    await I18N.init();
    SplashScreen.update(10, t('splash.theme'));    // ← maintenant t() fonctionne

    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.onclick = () => I18N.openPicker();
      let pressTimer;
      langToggle.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => I18N.next(), 800);
      });
      langToggle.addEventListener('mouseup', () => clearTimeout(pressTimer));
      langToggle.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    }

    initTheme();
    document.getElementById('themeToggle').onclick = toggleTheme;

    SplashScreen.update(15, t('splash.theme'));

    const currentLevel = getCurrentLevel();
    applyLevel(currentLevel);
    document.getElementById('btnLevel').onclick = () => openLevelPicker(true);

    SplashScreen.update(25, t('splash.levels'));

    initToolButtons();
    initDrawColorsAndSizes();
    renderStickers();

    SplashScreen.update(40, t('splash.tools'));

    loadProfile();
    document.getElementById('profileBtn').onclick = openProfileModal;
    initLogo();

    updateSubjectBadge();
    document.getElementById('subjectBadge').onclick = openSubjectPicker;
    document.getElementById('btnSubject').onclick = openSubjectPicker;

    SplashScreen.update(50, t('splash.profile'));

    initTextSelection();
    initPdfLoader();
    initImageLoaders();

    SplashScreen.update(65, t('splash.pdf'));

    initClips();
    document.getElementById('scissorsFileInput').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const dataURL = await readAsDataURL(f);
      launchScissors({ src: dataURL, name: f.name.replace(/\.[^.]+$/, '') });
      e.target.value = '';
    });

    initTools();
    SplashScreen.update(80, t('splash.pedago'));

    initPdfSearch();
    initThumbnails();
    initHistory();

    SplashScreen.update(90, t('splash.history'));

    document.getElementById('btnMailQuick').onclick = () => sendByEmail();
    document.getElementById('btnUrl').onclick = openUrlModal;
    document.getElementById('btnUrlHome').onclick = openUrlModal;
    document.getElementById('btnLibrary').onclick = openLibraryModal;
    document.getElementById('btnLibraryHome').onclick = openLibraryModal;

    initShare();
    initCustomBg();
    initParentalLock();

    document.getElementById('btnSmartScan').onclick = startSmartScan;
    initPresentation();
    initPageNavigation();

    document.getElementById('btnUndo').onclick = undoGlobal;
    document.getElementById('btnRedo').onclick = redoGlobal;
    document.getElementById('btnClear').onclick = () => {
      if (!confirm(t('message.confirmClearPage'))) return;
      const data = state.drawData[state.currentPage];
      if (!data || !data.strokes?.length) return;
      const prevStrokes = [...data.strokes];
      state.drawData[state.currentPage] = { strokes: [], clips: data.clips || [] };
      pushGlobalAction({ type: 'clear', page: state.currentPage, prevStrokes, newStrokes: [] });
      redrawPage(state.currentPage, getCanvasByPage(state.currentPage));
      scheduleSave();
    };

    initPWA();
    initKeyboardShortcuts();

    SplashScreen.update(95, t('splash.final'));
    applyAria();

    document.getElementById('footerTitle').textContent = ACHIM.produit;
    document.getElementById('footerVersion').textContent = 'v' + ACHIM.version;
    document.getElementById('footerEmail').textContent = ACHIM.email;
    document.getElementById('footerEmail').href = 'mailto:' + ACHIM.email;
    document.title = ACHIM.produit;

    try {
      const saved = localStorage.getItem('cahier-twoPages') === 'true';
      if (saved && window.innerWidth >= 700) {
        state.twoPages = true;
        document.getElementById('viewer').classList.add('two-pages');
        document.getElementById('btnTwoPages').classList.add('active');
      }
    } catch {}

    SplashScreen.update(100, t('splash.ready'));
    await SplashScreen.hide();

    setTimeout(() => {
      const autosave = loadAutoSave();
      if (autosave && autosave.savedAt && (autosave.numPages || 0) > 0) {
        const age = Math.round((Date.now() - autosave.savedAt) / 60000);
        const ageTxt = age < 60 ? `il y a ${age} min` : `il y a ${Math.round(age/60)} h`;
        if (confirm(t('message.restored') + ` (${ageTxt}).`)) {
          restoreAutoSave(autosave);
        } else {
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      }
    }, 400);

    setTimeout(tryLoadSharedLink, 500);
    setTimeout(() => openLevelPicker(false), 600);

    initAccueil();
  } catch (err) {
    console.error('❌ Erreur au démarrage :', err);
    SplashScreen.showError(t('splash.error'), () => location.reload());
  }
});

/* Fond personnalisé */
const CUSTOM_BG_KEY = 'cahier-achim-custom-bg';
let customBgImage = null;
function initCustomBg() {
  try {
    const saved = localStorage.getItem(CUSTOM_BG_KEY);
    if (saved) {
      customBgImage = saved;
      setTimeout(() => applyCustomBg(saved.startsWith('data:') ? 'image' : 'color', saved), 500);
    }
  } catch {}
  document.getElementById('btnCustomBg').onclick = () => { document.getElementById('customBgModal').style.display = 'flex'; };
  document.getElementById('customBgClose').onclick = () => { document.getElementById('customBgModal').style.display = 'none'; };
  document.getElementById('customBgFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const dataURL = await readAsDataURL(f);
    customBgImage = await compressImage(dataURL, 1400, 0.7);
  });
  document.getElementById('customBgApply').onclick = () => {
    if (customBgImage && document.getElementById('customBgFile').files.length > 0) applyCustomBg('image', customBgImage);
    else applyCustomBg('color', document.getElementById('customBgColor').value);
    document.getElementById('customBgModal').style.display = 'none';
  };
  document.getElementById('customBgRemove').onclick = () => {
    customBgImage = null;
    localStorage.removeItem(CUSTOM_BG_KEY);
    document.getElementById('viewer').querySelectorAll('.bg-canvas').forEach(c => {
      c.style.background = '';
      c.style.backgroundImage = '';
      const page = c.parentElement.dataset.page;
      if (state.bgData[page]) drawBackground(c, state.bgData[page]);
    });
    document.getElementById('customBgModal').style.display = 'none';
    showToast('🗑️', t('customBg.removed'));
  };
}
function applyCustomBg(type, value) {
  try { localStorage.setItem(CUSTOM_BG_KEY, value); } catch {}
  document.getElementById('viewer').querySelectorAll('.bg-canvas').forEach(c => {
    if (type === 'color') { c.style.background = value; c.style.backgroundImage = ''; }
    else { c.style.backgroundImage = `url(${value})`; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center'; }
  });
  showToast('🎨', t('customBg.applied'));
}

window.addEventListener('beforeunload', () => {
  if (Object.keys(state.drawData).length > 0) saveLocalAuto();
});

/* ACCORDÉONS */
const ACC_OPEN_KEY = 'cahier-achim-acc-open';
function initAccordions() {
  const accordions = document.querySelectorAll('#accueilAccordions .accordeon');
  if (accordions.length === 0) return;
  try {
    const saved = JSON.parse(localStorage.getItem(ACC_OPEN_KEY) || '[]');
    accordions.forEach(acc => {
      if (saved.includes(acc.dataset.acc)) acc.open = true;
    });
  } catch {}
  accordions.forEach(acc => {
    acc.addEventListener('toggle', () => {
      if (acc.open) {
        accordions.forEach(other => {
          if (other !== acc) other.open = false;
        });
      }
    });
  });
  accordions.forEach(acc => {
    acc.addEventListener('toggle', () => {
      try {
        const open = Array.from(accordions).filter(a => a.open).map(a => a.dataset.acc);
        localStorage.setItem(ACC_OPEN_KEY, JSON.stringify(open));
      } catch {}
    });
  });
}

window.addEventListener('offline', () => { console.log('📡 Offline'); });

window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'SCRIPT') {
    console.warn('⚠️ Script error:', e.target.src);
    if (e.target.src.includes('pdf.js') || e.target.src.includes('jspdf')) {
      SplashScreen.showError(t('splash.error'), () => location.reload());
    }
  }
}, true);

setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash && !splash.classList.contains('hidden')) {
    console.warn('⚠️ Splash forcé');
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }
}, 15000);

function openAccGuide(accKey) {
  const acc = document.querySelector(`.accordeon[data-acc="${accKey}"]`);
  if (acc) {
    acc.open = true;
    acc.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function initAccueil() {
  initAccordions();
}

function applyAria() {
  const ariaMap = {
    'toolPentagon': 'toolbar.pentagon',
    'toolHexagon': 'toolbar.hexagon',
    'toolHeart': 'toolbar.heart',
    'toolArrow': 'toolbar.arrow',
    'toolSpeech': 'toolbar.speech',
    'toolMusic': 'toolbar.music',
    'btnTextSelect': 'toolbar.listen',
    'penMagic': 'toolbar.magic',
    'penNeon': 'toolbar.neon',
    'btnLevel': 'toolbar.level',
    'btnHistory': 'toolbar.history',
    'btnMailQuick': 'toolbar.send',
    'btnPresent': 'toolbar.present',
    'profileBtn': 'toolbar.profile',
    'themeToggle': 'toolbar.theme',
    'btnUrl': 'toolbar.url',
    'btnLibrary': 'toolbar.library',
    'btnShareLink': 'toolbar.share',
    'btnSmartScan': 'toolbar.scan',
    'btnCustomBg': 'toolbar.customBg',
    'btnParentalLock': 'toolbar.parental',
    'btnGuideLetter': 'pedago.letters',
    'btnGuideNumber': 'pedago.numbers',
    'btnRuler': 'pedago.ruler',
    'btnProtractor': 'pedago.protractor',
    'btnTimer': 'pedago.timer',
    'btnRecognize': 'pedago.recognize',
    'btnSubject': 'toolbar.subject',
    'btnPdfSearch': 'toolbar.search',
    'zoomIn': 'toolbar.zoomIn',
    'zoomOut': 'toolbar.zoomOut',
    'zoomReset': 'toolbar.zoomReset'
  };
  Object.entries(ariaMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && !el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', t(key));
    }
  });
  const viewer = document.getElementById('viewer');
  if (viewer && !viewer.hasAttribute('tabindex')) viewer.setAttribute('tabindex', '-1');
  console.log('✅ ARIA appliqué');
}
