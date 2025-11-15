(function(){
  const $ = (id) => document.getElementById(id);
  const CHF = new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF',maximumFractionDigits:2});
  const fmt = (n) => CHF.format(n);

  // Determine language from path or saved preference; default to 'de' as requested.
  function detectLang(){
    const parts = location.pathname.split('/').filter(Boolean);
    if(parts[0] === 'de' || parts[0] === 'en') return parts[0];
    const saved = localStorage.getItem('lang');
    return saved || 'de';
  }
  const LANG = detectLang();

  // Translations for JS-driven messages and dynamic labels
  const T = {
    en: {
      licenseLabels: {
        'microsoft365_license_e5': 'Microsoft 365 E5',
        'microsoft365_license_bp': 'Microsoft 365 BP',
        default: 'Microsoft 365 E3'
      },
      copyLink: 'Copy shareable link',
      copySuccess: 'Link copied to clipboard',
      copyFail: 'Copy failed — copy the URL manually',
      fillForm: 'Please complete all fields.',
      submitBtn: 'Submit & prepare email',
      askQuote: 'Ask for quote',
      quoteSubject: (ppl, license) => `Quote request — ${ppl} ppl — ${license}`,
      noteEmail: 'Your email app will open with all details prefilled. No data is stored server-side.'
    },
    de: {
      licenseLabels: {
        'microsoft365_license_e5': 'Microsoft 365 E5',
        'microsoft365_license_bp': 'Microsoft 365 BP',
        default: 'Microsoft 365 E3'
      },
      copyLink: 'Link kopieren',
      copySuccess: 'Link in Zwischenablage kopiert',
      copyFail: 'Kopieren fehlgeschlagen — URL bitte manuell kopieren',
      fillForm: 'Bitte alle Felder ausfüllen.',
      submitBtn: 'Absenden & E‑Mail vorbereiten',
      askQuote: 'Angebot anfragen',
      quoteSubject: (ppl, license) => `Angebotsanfrage — ${ppl} Pers. — ${license}`,
      noteEmail: 'Ihr E‑Mail-Programm öffnet sich mit allen Details. Es werden keine Daten serverseitig gespeichert.'
    }
  };

  const tr = T[LANG] || T.en;

  // Map license token to numeric price (CHF/user/mo)
  function getLicensePrice(token){
    switch(String(token)){ 
      case 'microsoft365_license_e5': return 57.00;
      case 'microsoft365_license_bp': return 23.00;
      default: return 36.00; // e3
    }
  }

  // Bind toggles (enable/disable paired input)
  function bindToggle(chkId, inputId){
    const chk = $(chkId), input = $(inputId);
    if(!chk || !input) return;
    function sync(){ input.disabled = !chk.checked; }
    chk.addEventListener('change', ()=>{ sync(); compute(); saveToUrl(); });
    sync();
  }

  function applyScenario(val){
    if(val==='microsoft_m365'){
      $("azAll").value = (10.00).toFixed(2);
      $("co365_chk").checked = true;  $("co365").value = (30.00).toFixed(2);
      $("pp_chk").checked = false;    $("pp").value = (18.00).toFixed(2);
      $("aoai_chk").checked = false;  $("aoai").value = (8.00).toFixed(2);
      $("on_tenant_chk").checked = true; $("on_tenant").value = (4500.00).toFixed(2);
      $("on_lz_chk").checked = false; $("on_lz").value = (6500.00).toFixed(2);
      $("on_coe_chk").checked = false; $("on_coe").value = (4000.00).toFixed(2);
      $("on_adopt_chk").checked = true; $("on_adopt").value = (3000.00).toFixed(2);
    }
    if(val==='microsoft_powerplatform'){
      $("azAll").value = (20.00).toFixed(2);
      $("co365_chk").checked = true;  $("co365").value = (30.00).toFixed(2);
      $("pp_chk").checked = true;     $("pp").value = (18.00).toFixed(2);
      $("aoai_chk").checked = false;  $("aoai").value = (10.00).toFixed(2);
      $("on_tenant_chk").checked = true; $("on_tenant").value = (4500.00).toFixed(2);
      $("on_lz_chk").checked = false; $("on_lz").value = (6500.00).toFixed(2);
      $("on_coe_chk").checked = true;  $("on_coe").value = (4000.00).toFixed(2);
      $("on_adopt_chk").checked = true; $("on_adopt").value = (3500.00).toFixed(2);
    }
    if(val==='microsoft_azure'){
      $("azAll").value = (30.00).toFixed(2);
      $("co365_chk").checked = true;  $("co365").value = (30.00).toFixed(2);
      $("pp_chk").checked = false;    $("pp").value = (18.00).toFixed(2);
      $("aoai_chk").checked = true;   $("aoai").value = (12.00).toFixed(2);
      $("on_tenant_chk").checked = true; $("on_tenant").value = (4500.00).toFixed(2);
      $("on_lz_chk").checked = true;  $("on_lz").value = (6500.00).toFixed(2);
      $("on_coe_chk").checked = false; $("on_coe").value = (4000.00).toFixed(2);
      $("on_adopt_chk").checked = true; $("on_adopt").value = (4000.00).toFixed(2);
    }

    ['co365_chk','pp_chk','aoai_chk','on_tenant_chk','on_lz_chk','on_coe_chk','on_adopt_chk'].forEach(chk=>{
      const map = {co365_chk:'co365', pp_chk:'pp', aoai_chk:'aoai', on_tenant_chk:'on_tenant', on_lz_chk:'on_lz', on_coe_chk:'on_coe', on_adopt_chk:'on_adopt'};
      const inp = $(map[chk]);
      if(inp) inp.disabled = !($(chk) && $(chk).checked);
    });
    compute();
    saveToUrl();
  }

  function getState(){
    return {
      s: $("scenario").value,
      ppl: Number($("people").value),
      lic: $("license").value,
      az: Number($("azAll").value),
      co: Number($("co365").value), coe: Number($("co365_chk").checked),
      ppv: Number($("pp").value), ppe: Number($("pp_chk").checked),
      aov: Number($("aoai").value), aoe: Number($("aoai_chk").checked),
      ot: Number($("on_tenant").value), ote: Number($("on_tenant_chk").checked),
      lz: Number($("on_lz").value), lze: Number($("on_lz_chk").checked),
      coe1: Number($("on_coe").value), coe1e: Number($("on_coe_chk").checked),
      ad: Number($("on_adopt").value), ade: Number($("on_adopt_chk").checked)
    };
  }

  function setState(st){
    if(!st) return;
    if(st.s) $("scenario").value = st.s;
    if(st.ppl) $("people").value = st.ppl; else $("people").value = 1;
    if(st.lic) $("license").value = st.lic;
    $("m365").value = getLicensePrice($("license").value).toFixed(2);
    if(st.az!=null) $("azAll").value = st.az.toFixed(2);
    if(st.co!=null) $("co365").value = st.co.toFixed(2);
    if(st.coe!=null) $("co365_chk").checked = !!Number(st.coe);
    if(st.ppv!=null) $("pp").value = st.ppv.toFixed(2);
    if(st.ppe!=null) $("pp_chk").checked = !!Number(st.ppe);
    if(st.aov!=null) $("aoai").value = st.aov.toFixed(2);
    if(st.aoe!=null) $("aoai_chk").checked = !!Number(st.aoe);
    if(st.ot!=null) $("on_tenant").value = st.ot.toFixed(2);
    if(st.ote!=null) $("on_tenant_chk").checked = !!Number(st.ote);
    if(st.lz!=null) $("on_lz").value = st.lz.toFixed(2);
    if(st.lze!=null) $("on_lz_chk").checked = !!Number(st.lze);
    if(st.coe1!=null) $("on_coe").value = st.coe1.toFixed(2);
    if(st.coe1e!=null) $("on_coe_chk").checked = !!Number(st.coe1e);
    if(st.ad!=null) $("on_adopt").value = st.ad.toFixed(2);
    if(st.ade!=null) $("on_adopt_chk").checked = !!Number(st.ade);
    const map = {co365_chk:'co365', pp_chk:'pp', aoai_chk:'aoai', on_tenant_chk:'on_tenant', on_lz_chk:'on_lz', on_coe_chk:'on_coe', on_adopt_chk:'on_adopt'};
    Object.keys(map).forEach(chk=>{ const el = $(map[chk]); if(el) el.disabled = !($(chk) && $(chk).checked); });
  }

  function saveToUrl(){
    const st = getState();
    const qs = new URLSearchParams();
    Object.entries(st).forEach(([k,v])=>{ if(v!==undefined && v!==null) qs.set(k, String(v)); });
    const url = `${location.pathname}?${qs.toString()}`;
    history.replaceState(null, '', url);
  }

  function loadFromUrl(){
    const q = new URLSearchParams(location.search);
    if(q && [...q.keys()].length){
      const st = {};
      q.forEach((v,k)=>{ st[k]=isNaN(Number(v))? v: Number(v); });
      setState(st);
    } else {
      $("people").value = 1; applyScenario('microsoft_m365');
    }
    compute();
    saveToUrl();
  }

  function compute(){
    const people = Number($("people").value);
    $("peopleLabel").textContent = people;
    const m365 = getLicensePrice($("license").value);
    $("m365").value = m365.toFixed(2);
    const azAll = Number($("azAll").value);

    const baseM365 = people * m365;
    const baseAzure = people * azAll;
    const co365 = $("co365_chk").checked ? people * Number($("co365").value) : 0;
    const pp    = $("pp_chk").checked ? people * Number($("pp").value) : 0;
    const aoai  = $("aoai_chk").checked ? people * Number($("aoai").value) : 0;
    const addonsMonthly = co365 + pp + aoai;

    const totalMonthly = baseM365 + baseAzure + addonsMonthly;
    const totalYearly = totalMonthly * 12;
    const perUser = totalMonthly / Math.max(people,1);

    const oneTenant = $("on_tenant_chk").checked ? Number($("on_tenant").value) : 0;
    const oneLz     = $("on_lz_chk").checked ? Number($("on_lz").value) : 0;
    const oneCoe    = $("on_coe_chk").checked ? Number($("on_coe").value) : 0;
    const oneAdopt  = $("on_adopt_chk").checked ? Number($("on_adopt").value) : 0;
    const oneTimeTotal = oneTenant + oneLz + oneCoe + oneAdopt;

    $("onetimeTotal").textContent = fmt(oneTimeTotal);
    $("totalYearly").textContent = fmt(totalYearly);

    return { oneTimeTotal, totalYearly };
  }

  // setup toggles and inputs
  ['co365_chk','pp_chk','aoai_chk','on_tenant_chk','on_lz_chk','on_coe_chk','on_adopt_chk'].forEach(chk=>{
    const map = {co365_chk:'co365', pp_chk:'pp', aoai_chk:'aoai', on_tenant_chk:'on_tenant', on_lz_chk:'on_lz', on_coe_chk:'on_coe', on_adopt_chk:'on_adopt'};
    bindToggle(chk, map[chk]);
  });

  ['people','license','azAll','co365','pp','aoai','on_tenant','on_lz','on_coe','on_adopt'].forEach(id=>{
    const el = $(id);
    if(!el) return;
    el.addEventListener('input', ()=>{ compute(); saveToUrl(); });
    el.addEventListener('change', ()=>{ compute(); saveToUrl(); });
  });

  const scenarioEl = $("scenario");
  if(scenarioEl) scenarioEl.addEventListener('change', (e)=> applyScenario(e.target.value));

  // Copy link
  const copyBtn = $("copyLink");
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try { await navigator.clipboard.writeText(location.href); $("toast").textContent = tr.copySuccess; setTimeout(()=> $("toast").textContent='', 2000); }
      catch(err){ $("toast").textContent = tr.copyFail; setTimeout(()=> $("toast").textContent='', 3000); }
    });
  }

  // Ask quote panel
  const askBtn = $("askQuote");
  if(askBtn){
    askBtn.addEventListener('click', ()=>{
      const p = $("quotePanel"); if(!p) return;
      p.classList.toggle('open'); if(p.classList.contains('open')){ p.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  }

  function getLicenseLabel(v){
    if(String(v)==='microsoft365_license_e5') return tr.licenseLabels['microsoft365_license_e5'];
    if(String(v)==='microsoft365_license_bp') return tr.licenseLabels['microsoft365_license_bp'];
    return tr.licenseLabels.default;
  }

  const quoteForm = $("quoteForm");
  if(quoteForm){
    quoteForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const first = $("q_first").value.trim();
      const last = $("q_last").value.trim();
      const email = $("q_email").value.trim();
      if(!first || !last || !email){ $("toast").textContent = tr.fillForm; setTimeout(()=> $("toast").textContent='', 2500); return; }

      const st = getState();
      const { totalMonthly, totalYearly, perUser, oneTimeTotal } = compute();
      const licenseLabel = getLicenseLabel(st.lic);
      const licensePrice = getLicensePrice(st.lic);

      const lines = [];
      if(LANG === 'de') lines.push('Anfrage 365cloud.ai'); else lines.push('Quote 365cloud.ai');
      lines.push('');
      lines.push((LANG === 'de' ? `Kunde: ${first} ${last}` : `Client: ${first} ${last}`));
      lines.push((LANG === 'de' ? `E-Mail: ${email}` : `Email: ${email}`));
      lines.push('');
      lines.push((LANG === 'de' ? 'Konfiguration:' : 'Configuration:'));
      lines.push((LANG === 'de' ? `Szenario: ${st.s}` : `Scenario: ${st.s}`));
      lines.push((LANG === 'de' ? `Personen: ${st.ppl}` : `People: ${st.ppl}`));
      lines.push((LANG === 'de' ? `Lizenz: ${licenseLabel} (CHF ${licensePrice}/user/mo)` : `License: ${licenseLabel} (CHF ${licensePrice}/user/mo)`));
      lines.push((LANG === 'de' ? `Azure inkl. Betrieb & Security: CHF ${st.az}/user/mo` : `Azure incl. ops & security: CHF ${st.az}/user/mo`));
      lines.push((LANG === 'de' ? 'Add-ons:' : 'Add-ons:'));
      lines.push((LANG === 'de' ? `  Copilot für M365: ${st.coe? 'AN' : 'aus'} (CHF ${st.co}/user/mo)` : `  Copilot for M365: ${st.coe? 'ON' : 'off'} (CHF ${st.co}/user/mo)`));
      lines.push((LANG === 'de' ? `  Power Platform premium: ${st.ppe? 'AN' : 'aus'} (CHF ${st.ppv}/user/mo)` : `  Power Platform premium: ${st.ppe? 'ON' : 'off'} (CHF ${st.ppv}/user/mo)`));
      lines.push((LANG === 'de' ? `  Azure OpenAI Nutzung: ${st.aoe? 'AN' : 'aus'} (CHF ${st.aov}/user/mo)` : `  Azure OpenAI usage: ${st.aoe? 'ON' : 'off'} (CHF ${st.aov}/user/mo)`));
      lines.push((LANG === 'de' ? 'Einmalige Leistungen:' : 'One-time services:'));
      lines.push((LANG === 'de' ? `  Secure foundations: ${st.ote? 'AN' : 'aus'} (CHF ${st.ot})` : `  Secure foundations: ${st.ote? 'ON' : 'off'} (CHF ${st.ot})`));
      lines.push((LANG === 'de' ? `  Landing zone & IaC: ${st.lze? 'AN' : 'aus'} (CHF ${st.lz})` : `  Landing zone & IaC: ${st.lze? 'ON' : 'off'} (CHF ${st.lz})`));
      lines.push((LANG === 'de' ? `  Power Platform CoE: ${st.coe1e? 'AN' : 'aus'} (CHF ${st.coe1})` : `  Power Platform CoE: ${st.coe1e? 'ON' : 'off'} (CHF ${st.coe1})`));
      lines.push((LANG === 'de' ? `  Adoption & Training: ${st.ade? 'AN' : 'aus'} (CHF ${st.ad})` : `  Adoption & training: ${st.ade? 'ON' : 'off'} (CHF ${st.ad})`));
      lines.push('');
      lines.push((LANG === 'de' ? 'Berechnete Summen:' : 'Computed totals:'));
      lines.push(`  ${LANG === 'de' ? 'Monatlich total (laufend):' : 'Total monthly (recurring):'} ${fmt(totalMonthly)}`);
      lines.push(`  ${LANG === 'de' ? 'Jährlich total (laufend):' : 'Total yearly (recurring):'} ${fmt(totalYearly)}`);
      lines.push(`  ${LANG === 'de' ? 'Pro Benutzer monatlich:' : 'Per-user monthly (recurring):'} ${fmt(perUser)}`);
      lines.push(`  ${LANG === 'de' ? 'Einmalig total:' : 'One-time total:'} ${fmt(oneTimeTotal)}`);
      lines.push('');
      lines.push(`${LANG === 'de' ? 'Link zum Teilen:' : 'Shareable link:'} ${location.href}`);

      const subject = encodeURIComponent(tr.quoteSubject(st.ppl, licenseLabel));
      const body = encodeURIComponent(lines.join('\n'));
      window.location.href = `mailto:adm.quote@365cloud.ai?subject=${subject}&body=${body}`;
    });
  }

  // Language-pref persistence: if user pressed language buttons, site.js already sets localStorage.lang
  // but ensure scenario note is set to current lang defaults
  (function init(){
    // Ensure scenario options are presented in the language they appear in the HTML. Scenario note initialisation:
    const s = $("scenario");
    if(s) applyScenario(s.value);
    loadFromUrl();

    // Initialize accordion functionality for fieldsets
    const fieldsets = document.querySelectorAll('fieldset');
    fieldsets.forEach((fieldset, index) => {
      const legend = fieldset.querySelector('legend');
      if (legend) {
        // Start with all fieldsets collapsed
        fieldset.classList.add('collapsed');
        
        legend.addEventListener('click', (e) => {
          fieldset.classList.toggle('collapsed');
        });
      }
    });

    // Move actions div above quotePanel
    const actions = document.querySelector('.actions');
    const quotePanel = $('quotePanel');
    const outDiv = $('out');
    if (actions && quotePanel && outDiv) {
      // Remove actions from its current position
      actions.remove();
      // Insert it before quotePanel
      outDiv.insertBefore(actions, quotePanel);
    }
  })();

})();
