// =========================================
// Thème clair/sombre — la pose initiale de data-theme se fait via un script
// inline tout en haut du <head> de chaque page (avant le rendu), pour éviter
// le flash visuel. Ici on gère seulement le bouton de bascule.
// =========================================
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function updateIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  updateIcon();

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcon();
  });
}

// =========================================
// Données des jeux : chargées depuis games.json (source unique)
// Pour ajouter un jeu : modifie UNIQUEMENT games.json, rien d'autre.
// =========================================
let jeux = []; // rempli après le fetch, avant ça reste vide

async function chargerJeux() {
  try {
    // Charge les jeux depuis Supabase (table "games") au lieu du fichier games.json.
    // chargerJeuxDepuisSupabase() est définie dans js/supabase-stats.js
    const data = await chargerJeuxDepuisSupabase();
    jeux = data;
  } catch (err) {
    console.error('Erreur chargement des jeux depuis Supabase :', err);
    jeux = [];
  }
}

const grid = document.getElementById('games-grid');
const favorisSection = document.getElementById('favoris-section');
const favorisGrid = document.getElementById('favoris-grid');
const recentsSection = document.getElementById('recents-section');
const recentsGrid = document.getElementById('recents-grid');
const searchInput = document.getElementById('search-input');

// =========================================
// Statistiques globales (Supabase) — partagées entre TOUS les visiteurs.
// Chargées une fois au démarrage de la page dans statsGlobales,
// puis utilisées pour le tri par popularité et l'affichage des notes moyennes.
// =========================================
let statsGlobales = {};

// =========================================
// URL propre vers un jeu — utilise le slug si disponible (SEO)
// Ex: /jeux/football-rush-3d au lieu de jeu.html?id=xxx
// =========================================
function getJeuUrl(jeu) {
  if (jeu.slug) return `/jeux/${jeu.slug}`;
  return `jeu.html?id=${encodeURIComponent(jeu.id)}&nom=${encodeURIComponent(jeu.nom)}&w=${jeu.width || 800}&h=${jeu.height || 600}`;
}

function getPlayCount(gameId) {
  const stats = statsGlobales[gameId];
  return stats ? stats.total_plays : 0;
}

function getNoteMoyenne(gameId) {
  const stats = statsGlobales[gameId];
  if (!stats || !stats.rating_count) return 0;
  return stats.rating_sum / stats.rating_count;
}

function getNombreVotes(gameId) {
  const stats = statsGlobales[gameId];
  return stats ? stats.rating_count : 0;
}

function trierParPopularite(liste) {
  return [...liste].sort((a, b) => getPlayCount(b.id) - getPlayCount(a.id));
}

// =========================================
// Badge "Nouveau" — vrai si le jeu a été ajouté il y a moins de 14 jours
// =========================================
function estNouveau(jeu) {
  if (!jeu.dateAjout) return false;
  const diffJours = (Date.now() - new Date(jeu.dateAjout).getTime()) / (1000 * 60 * 60 * 24);
  return diffJours <= 14;
}

// =========================================
// Menu déroulant des genres — construit dynamiquement depuis games.json.
// Ajoute un nouveau genre dans games.json et il apparaît automatiquement ici,
// triés par ordre alphabétique, sans rien modifier dans le HTML/CSS.
// =========================================
function buildGenreMenu() {
  const menu = document.getElementById('genre-menu');
  const toggle = document.getElementById('genre-toggle');
  if (!menu || !toggle) return;

  const genresUniques = [...new Set(jeux.map(j => j.categorie))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );

  menu.innerHTML = '';
  menu.style.gridTemplateColumns = genresUniques.length > 6 ? '1fr 1fr' : '1fr';

  genresUniques.forEach(genre => {
    const count = jeux.filter(j => j.categorie === genre).length;
    const a = document.createElement('a');
    a.href = `/categorie.html?cat=${encodeURIComponent(genre)}`;
    a.innerHTML = `${genre} <span class="genre-count">${count}</span>`;
    menu.appendChild(a);
  });

  // Évite d'attacher plusieurs fois le même listener si buildGenreMenu()
  // est appelée plus d'une fois sur la même page.
  if (toggle.dataset.bound === 'true') return;
  toggle.dataset.bound = 'true';

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Ferme le menu si on clique ailleurs sur la page
  document.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

// =========================================
// Favoris (localStorage)
// =========================================
function getFavoris() {
  return JSON.parse(localStorage.getItem('favoris') || '[]');
}
function toggleFavori(gameId) {
  let favs = getFavoris();
  const estAjout = !favs.includes(gameId);
  if (favs.includes(gameId)) {
    favs = favs.filter(id => id !== gameId);
  } else {
    favs.push(gameId);
  }
  localStorage.setItem('favoris', JSON.stringify(favs));
  if (estAjout && typeof trackEvent === 'function') {
    trackEvent('game_favorite', { game_id: gameId });
  }
  renderAll();
}

// =========================================
// Récemment joués (localStorage)
// =========================================
function getRecents() {
  return JSON.parse(localStorage.getItem('recents') || '[]');
}

// =========================================
// Création d'une carte de jeu (DOM element)
// taille : "normal" (par défaut), "big" (2x2), "wide" (2x1), "tall" (1x2)
// =========================================
function createCard(jeu, taille = 'normal') {
  const favs = getFavoris();
  const isFav = favs.includes(jeu.id);
  const isBig = taille !== 'normal';

  const card = document.createElement('div');
  // Ajoute une classe de catégorie pour les couleurs de placeholder (cat-football, cat-action, etc.)
  const catClass = 'cat-' + (jeu.categorie || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  card.className = 'game-card ' + catClass + (taille !== 'normal' ? ` featured-${taille}` : '');

  const link = document.createElement('a');
  link.href = getJeuUrl(jeu);
  link.style.display = 'block';
  link.style.height = '100%';

  // Vignette : image réelle si fournie, sinon emoji en placeholder coloré par catégorie
  const thumb = document.createElement('div');
  thumb.className = 'card-thumb';
  thumb.style.display = 'flex';
  thumb.style.alignItems = 'center';
  thumb.style.justifyContent = 'center';
  thumb.style.fontSize = isBig ? '4rem' : '2.5rem';
  // Retire le style inline background — la couleur vient maintenant du CSS par catégorie
  if (!isBig) {
    thumb.style.width = '100%';
    thumb.style.aspectRatio = '1';
  }

  if (jeu.image) {
    const img = document.createElement('img');
    img.src = jeu.image;
    img.alt = jeu.nom;
    img.loading = 'lazy';
    // Si la thumbnail GameDistribution ne charge pas, on bascule sur l'emoji
    img.onerror = function () {
      this.replaceWith(thumb);
      thumb.textContent = jeu.emoji || '🎮';
    };
    link.appendChild(img);
  } else {
    thumb.textContent = jeu.emoji || '🎮';
    link.appendChild(thumb);
  }

  // Badge "Nouveau" si ajouté il y a moins de 14 jours
  if (estNouveau(jeu)) {
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'Nouveau';
    card.appendChild(badge);
  }

  const info = document.createElement('div');
  info.className = 'game-info';
  info.innerHTML = `<h3>${jeu.nom}</h3><span>${jeu.categorie}</span>`;

  // Étoiles de notation (moyenne globale, lecture seule sur les cartes)
  const moyenne = getNoteMoyenne(jeu.id);
  const nbVotes = getNombreVotes(jeu.id);
  if (nbVotes > 0) {
    const noteRondie = Math.round(moyenne);
    const stars = document.createElement('div');
    stars.className = 'card-stars';
    stars.innerHTML = '★'.repeat(noteRondie) + '☆'.repeat(5 - noteRondie) +
      ` <span class="card-stars-count">(${nbVotes})</span>`;
    info.appendChild(stars);
  }

  link.appendChild(info);
  card.appendChild(link);

  // Bouton favori
  const favBtn = document.createElement('button');
  favBtn.className = 'fav-btn' + (isFav ? ' active' : '');
  favBtn.innerHTML = isFav ? '♥' : '♡';
  favBtn.setAttribute('aria-label', 'Ajouter aux favoris');
  favBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavori(jeu.id);
  };
  card.appendChild(favBtn);

  return card;
}

// =========================================
// Skeleton loaders
// =========================================
function renderSkeletons(container, count = 8) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    sk.innerHTML = `<div class="skeleton-thumb"></div><div class="skeleton-text"></div>`;
    container.appendChild(sk);
  }
}

// =========================================
// Génération de la grille principale avec pagination
// Affiche 24 jeux par page, bouton "Voir plus" pour charger la suite.
// =========================================
const PAGE_SIZE = 24;
let pageActuelle = 1;
let listeComplete = [];

function generateCards(liste) {
  listeComplete = liste;
  pageActuelle = 1;
  renderSkeletons(grid);
  setTimeout(() => {
    grid.innerHTML = '';
    afficherPage();
  }, 300);
}

function afficherPage() {
  if (listeComplete.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);">Aucun jeu trouvé.</p>';
    supprimerBoutonVoirPlus();
    return;
  }

  const debut = 0;
  const fin = pageActuelle * PAGE_SIZE;
  const visible = listeComplete.slice(debut, fin);

  // Efface seulement les cartes (pas le bouton "Voir plus" s'il existe)
  const boutonExistant = document.getElementById('voir-plus-btn');
  grid.innerHTML = '';
  if (boutonExistant) boutonExistant.remove();

  visible.forEach((jeu, index) => {
    const taille = (index > 0 && index % 7 === 0) ? 'big' : 'normal';
    const card = createCard(jeu, taille);
    // Délai progressif pour une apparition en cascade (max 0.5s)
    card.style.animationDelay = `${Math.min(index * 0.04, 0.5)}s`;
    grid.appendChild(card);
  });

  // Affiche le bouton "Voir plus" s'il reste des jeux à charger
  if (fin < listeComplete.length) {
    afficherBoutonVoirPlus(listeComplete.length - fin);
  } else {
    supprimerBoutonVoirPlus();
  }
}

function afficherBoutonVoirPlus(restants) {
  let btn = document.getElementById('voir-plus-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'voir-plus-btn';
    btn.className = 'voir-plus-btn';
    grid.parentElement.appendChild(btn);
  }
  btn.textContent = `Voir plus (${restants} jeux restants)`;
  btn.onclick = () => {
    pageActuelle++;
    afficherPage();
    // Scroll doux vers les nouvelles cartes
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
}

function supprimerBoutonVoirPlus() {
  const btn = document.getElementById('voir-plus-btn');
  if (btn) btn.remove();
}

// =========================================
// Rendu des favoris
// =========================================
function renderFavoris() {
  const favIds = getFavoris();
  if (favIds.length === 0) {
    favorisSection.hidden = true;
    return;
  }
  favorisSection.hidden = false;
  favorisGrid.innerHTML = '';
  const favGames = jeux.filter(j => favIds.includes(j.id));
  favGames.forEach(jeu => favorisGrid.appendChild(createCard(jeu)));
}

// =========================================
// Rendu des récents
// =========================================
function renderRecents() {
  const recentIds = getRecents();
  if (recentIds.length === 0) {
    recentsSection.hidden = true;
    return;
  }
  recentsSection.hidden = false;
  recentsGrid.innerHTML = '';
  recentIds.forEach(id => {
    const jeu = jeux.find(j => j.id === id);
    if (jeu) recentsGrid.appendChild(createCard(jeu));
  });
}

function renderAll() {
  renderFavoris();
  renderRecents();
}

// =========================================
// Filtrage par catégorie (utilisé sur categorie.html, mais fonction réutilisable)
// =========================================
function filtrerParCategorie(cat) {
  return jeux.filter(j => j.categorie.toLowerCase() === cat.toLowerCase());
}

// =========================================
// Recherche en temps réel
// =========================================
// =========================================
// Recherche avec suggestions en temps réel
// Affiche un dropdown avec les jeux correspondants, cliquable directement.
// Sur index.html, filtre aussi la grille principale.
// =========================================
const searchSuggestions = document.getElementById('search-suggestions');

function ouvrirSuggestions(terme) {
  if (!searchSuggestions) return;
  if (!terme) {
    fermerSuggestions();
    return;
  }
  const resultats = jeux
    .filter(j => j.nom.toLowerCase().includes(terme.toLowerCase()))
    .slice(0, 8); // max 8 suggestions

  searchSuggestions.innerHTML = '';

  if (resultats.length === 0) {
    searchSuggestions.innerHTML = `<div class="search-suggestion-none">Aucun jeu trouvé pour "${terme}"</div>`;
  } else {
    resultats.forEach(jeu => {
      const a = document.createElement('a');
      a.className = 'search-suggestion-item';
      a.href = getJeuUrl(jeu);

      const thumb = jeu.image
        ? `<img src="${jeu.image}" alt="${jeu.nom}" onerror="this.style.display='none'">`
        : `<div class="suggestion-emoji">🎮</div>`;

      a.innerHTML = `
        ${thumb}
        <div class="search-suggestion-info">
          <div class="suggestion-name">${jeu.nom}</div>
          <div class="suggestion-cat">${jeu.categorie}</div>
        </div>
      `;
      searchSuggestions.appendChild(a);
    });
  }

  searchSuggestions.classList.add('open');
}

function fermerSuggestions() {
  if (!searchSuggestions) return;
  searchSuggestions.classList.remove('open');
  searchSuggestions.innerHTML = '';
}

if (searchInput) {
  let searchTrackTimeout = null;

  searchInput.addEventListener('input', (e) => {
    const terme = e.target.value.trim();

    // Suggestions dropdown — fonctionne sur toutes les pages
    ouvrirSuggestions(terme);

    // Filtrage de la grille principale — uniquement sur index.html
    if (grid && isAccueil) {
      if (terme === '') {
        generateCards(trierParPopularite(jeux));
      } else {
        const resultats = jeux.filter(j => j.nom.toLowerCase().includes(terme.toLowerCase()));
        grid.innerHTML = '';
        supprimerBoutonVoirPlus();
        if (resultats.length === 0) {
          grid.innerHTML = '<p style="color:var(--text-muted);">Aucun résultat.</p>';
        } else {
          resultats.forEach((jeu, index) => {
            grid.appendChild(createCard(jeu, index % 7 === 0 && index > 0 ? 'big' : 'normal'));
          });
        }
      }
    }

    // Tracking GA (debounced 800ms)
    clearTimeout(searchTrackTimeout);
    searchTrackTimeout = setTimeout(() => {
      if (typeof trackEvent === 'function' && terme) {
        trackEvent('search', { search_term: terme });
      }
    }, 800);
  });

  // Ferme les suggestions en cliquant ailleurs
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) {
      fermerSuggestions();
    }
  });

  // Navigation clavier dans les suggestions
  searchInput.addEventListener('keydown', (e) => {
    const items = searchSuggestions ? searchSuggestions.querySelectorAll('.search-suggestion-item') : [];
    const current = searchSuggestions ? searchSuggestions.querySelector('.search-suggestion-item.focused') : null;
    if (e.key === 'Escape') {
      fermerSuggestions();
      searchInput.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!current && items.length) {
        items[0].classList.add('focused');
        items[0].focus();
      }
    } else if (e.key === 'Enter' && !current) {
      // Entrée sans sélection → va au premier résultat
      const premier = searchSuggestions ? searchSuggestions.querySelector('.search-suggestion-item') : null;
      if (premier) premier.click();
    }
  });

  // Navigation clavier dans la liste de suggestions
  if (searchSuggestions) {
    searchSuggestions.addEventListener('keydown', (e) => {
      const items = searchSuggestions.querySelectorAll('.search-suggestion-item');
      const focused = searchSuggestions.querySelector('.search-suggestion-item.focused');
      const idx = [...items].indexOf(focused);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) {
          focused && focused.classList.remove('focused');
          items[idx + 1].classList.add('focused');
          items[idx + 1].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) {
          focused && focused.classList.remove('focused');
          items[idx - 1].classList.add('focused');
          items[idx - 1].focus();
        } else {
          focused && focused.classList.remove('focused');
          searchInput.focus();
        }
      } else if (e.key === 'Escape') {
        fermerSuggestions();
        searchInput.focus();
      }
    });
  }
}

// =========================================
// Bouton retour en haut
// =========================================
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =========================================
// Bouton "Jeu aléatoire"
// =========================================
function jouerAuHasard() {
  if (jeux.length === 0) return;
  const jeuAleatoire = jeux[Math.floor(Math.random() * jeux.length)];
  window.location.href = getJeuUrl(jeuAleatoire);
}

function initRandomButton() {
  const btn = document.getElementById('random-game-btn');
  if (btn) btn.addEventListener('click', jouerAuHasard);
}

// =========================================
// Section "À la une" — met en avant les jeux les plus populaires.
// Mosaïque de tailles variées façon Poki : 1 grande (2x2), 1 large (2x1),
// 1 haute (1x2), le reste en format normal.
// =========================================
function renderAlaUne() {
  const section = document.getElementById('alaune-section');
  const alaUneGrid = document.getElementById('alaune-grid');
  const sideAd = document.querySelector('.featured-side-ad');
  if (!section || !alaUneGrid) return;

  const top = trierParPopularite(jeux).slice(0, 8);
  // N'affiche la section que si au moins un jeu a déjà été joué (sinon le tri n'a pas de sens)
  const aDejaDesStats = top.some(j => getPlayCount(j.id) > 0);

  if (!aDejaDesStats || top.length === 0) {
    section.hidden = true;
    if (sideAd) sideAd.hidden = true;
    return;
  }

  section.hidden = false;
  if (sideAd) sideAd.hidden = false;
  alaUneGrid.innerHTML = '';
  alaUneGrid.className = 'games-grid featured-grid';

  // Seule la première carte (la plus jouée) est en grand format (2x2),
  // toutes les autres restent en format normal (1x1) — même logique que la grille standard.
  top.forEach((jeu, index) => {
    alaUneGrid.appendChild(createCard(jeu, index === 0 ? 'big' : 'normal'));
  });
}

// =========================================
// Initialisation
// On charge d'abord games.json, puis on rend les cartes.
// Le menu des genres est construit sur TOUTES les pages (index, jeu, categorie...).
// Sur categorie.html, on dispatch un événement pour que son propre script
// sache quand "jeux" est prêt à être filtré.
// =========================================
const isAccueil = document.getElementById('favoris-section') !== null;

Promise.all([chargerJeux(), fetchAllGameStats()]).then(([_, stats]) => {
  statsGlobales = stats;
  buildGenreMenu();
  initRandomButton();
  setupThemeToggle();
  if (grid && isAccueil) {
    renderAlaUne();
    generateCards(trierParPopularite(jeux));
    renderAll();
  }
  // Prévient les autres scripts (ex: categorie.html) que les jeux sont chargés
  document.dispatchEvent(new CustomEvent('jeuxPrets'));
});
