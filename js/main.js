// =========================================
// Données des jeux : chargées depuis games.json (source unique)
// Pour ajouter un jeu : modifie UNIQUEMENT games.json, rien d'autre.
// =========================================
let jeux = []; // rempli après le fetch, avant ça reste vide

async function chargerJeux() {
  try {
    const reponse = await fetch('games.json');
    if (!reponse.ok) throw new Error('games.json introuvable');
    const data = await reponse.json();
    // image vient directement de games.json (laisse vide "" si tu n'as pas encore l'URL,
    // l'emoji prendra le relais automatiquement)
    jeux = data.map(j => ({
      id: j.id,
      nom: j.nom,
      categorie: j.categorie,
      image: j.image || "",
      emoji: j.emoji || "🎮",
      width: j.width || 800,
      height: j.height || 600
    }));
  } catch (err) {
    console.error('Erreur de chargement de games.json :', err);
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
    const a = document.createElement('a');
    a.href = `categorie.html?cat=${encodeURIComponent(genre)}`;
    a.textContent = genre;
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
// =========================================
function createCard(jeu) {
  const favs = getFavoris();
  const isFav = favs.includes(jeu.id);

  const card = document.createElement('div');
  card.className = 'game-card';

  const link = document.createElement('a');
  link.href = `jeu.html?id=${encodeURIComponent(jeu.id)}&nom=${encodeURIComponent(jeu.nom)}&w=${jeu.width || 800}&h=${jeu.height || 600}`;
  link.style.display = 'block';

  // Vignette : image réelle si fournie, sinon emoji en placeholder
  const thumb = document.createElement('div');
  thumb.style.width = '100%';
  thumb.style.aspectRatio = '1';
  thumb.style.display = 'flex';
  thumb.style.alignItems = 'center';
  thumb.style.justifyContent = 'center';
  thumb.style.fontSize = '2.5rem';
  thumb.style.background = '#eee';

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

  const info = document.createElement('div');
  info.className = 'game-info';
  info.innerHTML = `<h3>${jeu.nom}</h3><span>${jeu.categorie}</span>`;
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
// Génération de la grille principale (avec skeleton puis vraies cartes)
// =========================================
function generateCards(liste) {
  renderSkeletons(grid);
  setTimeout(() => {
    grid.innerHTML = '';
    if (liste.length === 0) {
      grid.innerHTML = '<p style="color:#888;">Aucun jeu trouvé.</p>';
      return;
    }
    liste.forEach(jeu => grid.appendChild(createCard(jeu)));
  }, 300);
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
if (searchInput) {
  let searchTrackTimeout = null;

  searchInput.addEventListener('input', (e) => {
    const terme = e.target.value.trim().toLowerCase();
    if (terme === '') {
      generateCards(jeux);
      return;
    }
    const resultats = jeux.filter(j => j.nom.toLowerCase().includes(terme));
    grid.innerHTML = '';
    if (resultats.length === 0) {
      grid.innerHTML = '<p style="color:#888;">Aucun résultat pour cette recherche.</p>';
    } else {
      resultats.forEach(jeu => grid.appendChild(createCard(jeu)));
    }

    // Track la recherche seulement après une pause de frappe (800ms),
    // pour éviter d'envoyer un event à chaque lettre tapée.
    clearTimeout(searchTrackTimeout);
    searchTrackTimeout = setTimeout(() => {
      if (typeof trackEvent === 'function' && terme) {
        trackEvent('search', { search_term: terme });
      }
    }, 800);
  });
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
// Initialisation
// On charge d'abord games.json, puis on rend les cartes.
// Le menu des genres est construit sur TOUTES les pages (index, jeu, categorie...).
// Sur categorie.html, on dispatch un événement pour que son propre script
// sache quand "jeux" est prêt à être filtré.
// =========================================
const isAccueil = document.getElementById('favoris-section') !== null;

chargerJeux().then(() => {
  buildGenreMenu();
  if (grid && isAccueil) {
    generateCards(jeux);
    renderAll();
  }
  // Prévient les autres scripts (ex: categorie.html) que les jeux sont chargés
  document.dispatchEvent(new CustomEvent('jeuxPrets'));
});
