// sitemap-generator.js
// Génère sitemap.xml depuis Supabase
// Exécution : node sitemap-generator.js

const fs = require('fs');
const https = require('https');

const SITE_URL = 'https://croissantgames.fr';
const SUPABASE_URL = 'https://cpkoeeluffenzmlsispq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pX5s3ol4an30qdUJEq14kQ_p2N_2DUZ';

const today = new Date().toISOString().split('T')[0];

function urlEntry(loc, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}

function fetchGames() {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/games?actif=eq.true&select=id,nom,categorie,slug`;
    const options = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function generate() {
  const games = await fetchGames();
  const categories = [...new Set(games.map(g => g.categorie))];
  const entries = [];

  // Pages principales
  entries.push(urlEntry(`${SITE_URL}/`, '1.0'));
  entries.push(urlEntry(`${SITE_URL}/mentions-legales`, '0.3'));

  // Pages catégories
  categories.forEach(cat => {
    const slug = cat.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    entries.push(urlEntry(`${SITE_URL}/categorie/${slug}`, '0.8'));
  });

  // Pages jeux (URLs propres avec slug)
  games.forEach(jeu => {
    if (jeu.slug) {
      entries.push(urlEntry(`${SITE_URL}/jeux/${jeu.slug}`, '0.7'));
    }
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  fs.writeFileSync('sitemap.xml', sitemap, 'utf-8');
  console.log(`✅ sitemap.xml généré avec ${entries.length} URLs.`);
}

generate().catch(console.error);
