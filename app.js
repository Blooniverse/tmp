const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Serve static files from public (both /de and /en live here)
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Health check
app.get('/healthz', (_req, res) => res.type('text').send('ok'));

// Redirect root to German (default)
// app.get('/', (_req, res) => res.redirect(302, '/de/'));
// SPA-like fallback: prefer German index as default fallback
// app.use((_req, res) => res.sendFile(path.join(__dirname, 'public', 'de', 'index.html')));

app.listen(PORT, () => console.log(`✅ 365cloud.ai running at http://localhost:${PORT}`));
