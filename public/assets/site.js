(function(){
  const qs = (s)=>document.querySelector(s);
  const drawer = qs('#drawer');
  const scrim = qs('#scrim');
  const btn = qs('#menuBtn');
  const themeToggle = qs('#themeToggle');

  function open(){ drawer.classList.add('open'); scrim.classList.add('open'); btn.setAttribute('aria-expanded','true'); drawer.setAttribute('aria-hidden','false'); }
  function close(){ drawer.classList.remove('open'); scrim.classList.remove('open'); btn.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); }
  btn && btn.addEventListener('click', ()=> drawer.classList.contains('open') ? close() : open());
  scrim && scrim.addEventListener('click', close);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  const STORAGE_THEME = 'theme';
  const STORAGE_LANG = 'lang';

  function applyTheme(t){ if(!t){ document.documentElement.removeAttribute('data-theme'); return; } document.documentElement.setAttribute('data-theme', t); }
  function currentPref(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
  const saved = localStorage.getItem(STORAGE_THEME);
  applyTheme(saved || '');
  if(themeToggle){
    const active = (saved ? saved : '').toLowerCase() || '';
    const effective = active || currentPref();
    themeToggle.checked = (effective === 'light');
    themeToggle.addEventListener('change', ()=>{
      const t = themeToggle.checked ? 'light' : 'dark';
      localStorage.setItem(STORAGE_THEME, t);
      applyTheme(t);
    });
  }

  // Language handling: simple buttons with data-lang attribute inside drawer
  function currentLangDefault(){
    // do not default to 'de' if no saved value — return only explicit saved preference
    return localStorage.getItem(STORAGE_LANG);
  }
  function setLang(lang){
    if(!lang) return;
    localStorage.setItem(STORAGE_LANG, lang);
  }

  // Wire buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = btn.getAttribute('data-lang');
      if(!lang) return;
      setLang(lang);

      // Attempt to preserve the rest of the path. Replace leading /de/ or /en/ with the new lang.
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean); // removes leading/trailing slashes
      // If first segment is a language code, replace it; otherwise prefix with new lang
      if(parts[0] === 'de' || parts[0] === 'en'){
        parts[0] = lang;
      } else {
        parts.unshift(lang);
      }
      const newPath = '/' + parts.join('/') + (path.endsWith('/') ? '/' : '');
      window.location.href = newPath;
    });
  });

  // On load, if saved lang differs from path, navigate (but avoid redirect loops)
  (function syncOnLoad(){
    const saved = currentLangDefault();
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const pathLang = parts[0] === 'de' || parts[0] === 'en' ? parts[0] : null;
    if(!pathLang && saved){
      // prefix path with saved
      const newPath = '/' + [saved].concat(parts).join('/') + (path.endsWith('/') ? '/' : '');
      if(newPath !== path) window.location.replace(newPath);
    } else if(pathLang && saved && pathLang !== saved){
      // prefer explicit path language over saved; keep saved but don't auto-redirect away from explicit path
      // (no action)
    }
  })();
})();
