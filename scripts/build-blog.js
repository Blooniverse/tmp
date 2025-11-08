const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'public', 'blog', 'posts'); // expect subfolders de/ and en/
const OUT_DIR_BASE = path.join(ROOT, 'public', 'blog'); // will write into public/blog/de/ and public/blog/en/
const SITE_URL = process.env.SITE_URL || 'https://365cloud.ai';
const LANGS = ['de','en'];

// Simple slug helper
function slugify(input){
  return String(input).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\\s-]/g,'').trim().replace(/[\\s-]+/g,'-');
}
function escapeXml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function stripHtml(html){ return String(html).replace(/<[^>]*>/g,''); }

// Labels for nav and small UI elements
const LABELS = {
  de: {
    lang: 'de',
    htmlLang: 'de',
    siteName: '365cloud.ai ─ Engineering Digital Transformations',
    home: 'Startseite',
    projectPower: 'Projekt Power',
    blog: 'Blog',
    imprint: 'Impressum',
    lightMode: 'Helles Design',
    description: 'Consulting für Microsoft 365, Power Platform, Azure Cloud und Azure AI.'
  },
  en: {
    lang: 'en',
    htmlLang: 'en',
    siteName: '365cloud.ai ─ Engineering Digital Transformations',
    home: 'Home',
    projectPower: 'Project Power',
    blog: 'Blog',
    imprint: 'Imprint',
    lightMode: 'Light mode',
    description: 'Consulting for Microsoft 365, Power Platform, Azure Cloud and Azure AI.'
  }
};

function pageHeader({ title, pageUrl, description, lang = 'en' }){
  const L = LABELS[lang] || LABELS.en;
  const webPageLd = {
    "@context":"https://schema.org",
    "@type":"WebPage",
    "url": pageUrl,
    "name": title,
    "description": description || '',
    "isPartOf": {"@type":"WebSite","url": SITE_URL + "/", "name": "365cloud.ai"}
  };
  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeXml(description||'')}" />
  <link rel="alternate" type="application/rss+xml" href="/blog/${lang}/feed.xml" title="365cloud.ai Blog RSS (${lang})" />
  <link rel="stylesheet" href="/assets/site.css" />
  <script src="/assets/site.js" defer></script>
  <script src="/assets/structured-data.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(webPageLd)}</script>
</head>
<body itemscope itemtype="http://schema.org/WebSite" typeof="schema:WebSite">
  <header class="container">
    <button id="menuBtn" aria-controls="drawer" aria-expanded="false" aria-label="Open menu">☰</button>
    <span class="pill">${escapeXml(L.siteName)}</span>
    <h1>${escapeXml(title)}</h1>
    ${description? `<h2 style="margin:.25rem 0 0; font-weight:500; color:var(--muted);">${escapeXml(description)}</h2>`: ''}
  </header>
  <div id="scrim" class="scrim" hidden></div>
  <aside id="drawer" class="drawer" aria-hidden="true" aria-label="Site menu">
    <nav class="menu" role="navigation">
      <a href="/${lang}/">${L.home}</a>
      <a href="/${lang}/project-power/"> ${L.projectPower}</a>
      <a href="/${lang}/blog/"> ${L.blog}</a>
      <a href="/${lang}/imprint/"> ${L.imprint}</a>
      <hr style="border:1px solid var(--line);border-width:0 0 1px;margin:.5rem 0" />
      <label class="switch"><input id="themeToggle" type="checkbox"/> ${L.lightMode}</label>
      <div style="margin-top:.5rem;">
        <strong>Language</strong>
        <div class="lang-switch">
          <button data-lang="de" class="lang-btn">DE</button>
          <button data-lang="en" class="lang-btn">EN</button>
        </div>
      </div>
    </nav>
  </aside>
  <main class="container" style="padding:1.5rem 0;">`;}

function pageFooter(){
  return `
  </main>
  <footer class="container">
    <span>© 2025 365cloud.ai</span>
  </footer>
</body>
</html>`;
}

async function readPostsForLang(lang){
  const dir = path.join(POSTS_DIR, lang);
  let files = [];
  try {
    files = await fsp.readdir(dir);
  } catch(e){
    // directory doesn't exist; return empty list
    return [];
  }
  const posts = [];
  for(const file of files){
    if(!file.endsWith('.md')) continue;
    const raw = await fsp.readFile(path.join(dir, file), 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data || {};
    const title = fm.Title || fm.title || path.basename(file, '.md');
    const date = fm.Date || fm.date || '';
    const description = fm.Description || fm.description || '';
    const slug = fm.Slug || fm.slug || slugify(title);
    const html = marked.parse(parsed.content);
    const text = stripHtml(html);
    posts.push({ title, date, description, slug, html, text });
  }
  posts.sort((a,b)=> (a.date < b.date ? 1 : -1));
  return posts;
}

function renderPostPage(p, lang){
  const url = `${SITE_URL}/blog/${lang}/${p.slug}/`;
  const blogPostingLd = {
    "@context":"https://schema.org",
    "@type":"BlogPosting",
    "headline": p.title,
    "datePublished": p.date || undefined,
    "description": p.description || undefined,
    "mainEntityOfPage": {"@type":"WebPage","@id": url},
    "author": {"@type":"Organization","name":"365cloud.ai"},
    "publisher": {"@type":"Organization","name":"365cloud.ai"},
    "url": url
  };
  const h2 = [p.date, p.description].filter(Boolean).join(' ─ ');
  const bodyHTML = `<article class="post">${p.html}</article>`; // main > article
  return pageHeader({ title: `${p.title} ─ 365cloud.ai`, pageUrl: url, description: h2, lang }) +
         `<script type="application/ld+json">${JSON.stringify(blogPostingLd)}</script>` +
         bodyHTML + pageFooter();
}

function renderIndexPage(posts, lang){
  const url = `${SITE_URL}/blog/${lang}/`;
  const L = LABELS[lang] || LABELS.en;
  const body = posts.map(p=>{
    const meta = [p.date, p.description].filter(Boolean).join(' ─ ');
    return `<a href="/${lang}/${['blog', p.slug, ''].join('/')}" class="item"><strong>${p.title}</strong><br><span class="muted">${meta}</span></a>`;
  }).join('\n');
  const bodyHTML = `<div class="list">${body || '<p>No posts yet.</p>'}</div>`;
  return pageHeader({ title: `${L.blog} ─ 365cloud.ai`, pageUrl: url, description: L.description || '' , lang }) + bodyHTML + pageFooter();
}

function buildRss(posts, lang){
  const now = new Date().toUTCString();
  const channelTitle = `365cloud.ai ─ Blog (${lang})`;
  const channelLink = `${SITE_URL}/blog/${lang}/`;
  const channelDesc = 'Insights on Microsoft 365, Power Platform, Azure Cloud & Azure AI.';
  const itemsXml = posts.map(p=>{
    const link = `${SITE_URL}/blog/${lang}/${p.slug}/`;
    const pubDate = p.date ? new Date(p.date).toUTCString() : now;
    const desc = escapeXml(p.description || (p.text || '').slice(0, 200));
    return `\n    <item>\n       <title>${escapeXml(p.title)}</title>\n       <link>${escapeXml(link)}</link>\n       <guid isPermaLink="true">${escapeXml(link)}</guid>\n       <pubDate>${pubDate}</pubDate>\n       <description><![CDATA[${desc}]]></description>\n    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(channelTitle)}</title>\n    <link>${escapeXml(channelLink)}</link>\n    <description>${escapeXml(channelDesc)}</description>\n    <language>${lang}</language>\n    <lastBuildDate>${now}</lastBuildDate>\n    <generator>365cloud.ai static generator</generator>${itemsXml}\n  </channel>\n</rss>\n`;
}

async function build(){
  await fsp.mkdir(OUT_DIR_BASE, { recursive: true });

  for(const lang of LANGS){
    const posts = await readPostsForLang(lang);
    const OUT_DIR = path.join(OUT_DIR_BASE, lang);
    await fsp.mkdir(OUT_DIR, { recursive: true });

    for(const p of posts){
      const dest = path.join(OUT_DIR, p.slug);
      await fsp.mkdir(dest, { recursive: true });
      await fsp.writeFile(path.join(dest, 'index.html'), renderPostPage(p, lang), 'utf8');
    }

    await fsp.writeFile(path.join(OUT_DIR, 'index.html'), renderIndexPage(posts, lang), 'utf8');

    const rss = buildRss(posts, lang);
    await fsp.writeFile(path.join(OUT_DIR, 'feed.xml'), rss, 'utf8');

    console.log(`Built ${posts.length} post(s) and RSS feed for ${lang}.`);
  }
}

build().catch(err=>{ console.error(err); process.exit(1); });