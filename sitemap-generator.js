// sitemap-generator.js
// Génère sitemap.xml à partir de games.json
// Exécution : node sitemap-generator.js

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://croissantgames.fr'; // ⚠️ remplace par ton vrai domaine une fois acheté

const gamesPath = path.join(__dirname, 'games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf-8'));

const categories = [...new Set(games.map(g => g.categorie))];

const today = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD

function urlEntry(loc, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}

const entries = [];

// Page d'accueil
entries.push(urlEntry(`${SITE_URL}/index.html`, '1.0'));

// Pages catégories
categories.forEach(cat => {
  entries.push(urlEntry(`${SITE_URL}/categorie.html?cat=${encodeURIComponent(cat)}`, '0.8'));
});

// Pages jeux
games.forEach(jeu => {
  const url = `${SITE_URL}/jeu.html?id=${encodeURIComponent(jeu.id)}&nom=${encodeURIComponent(jeu.nom)}`;
  entries.push(urlEntry(url, '0.6'));
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`✅ sitemap.xml généré avec ${entries.length} URLs.`);
