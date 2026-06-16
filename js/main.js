// =========================================
// Données des jeux (vrais Game IDs GameDistribution)
// ⚠️ Remplace "nom" par le vrai titre de chaque jeu (visible sur ton dashboard GD)
//    et "categorie" par la bonne catégorie. width/height = dimensions recommandées par GD.
// =========================================
const jeux = [
  { id: "5d8d11e9919245939a57378a02b8fc8b", nom: "Jeu 1 (à renommer)", categorie: "Action",   image: "", emoji: "🎮", width: 800,  height: 600 },
  { id: "42bfa359db1e405f8cc84b181c206f7c", nom: "Jeu 2 (à renommer)", categorie: "Puzzle",   image: "", emoji: "🎮", width: 800,  height: 600 },
  { id: "b9ad7cca160e4be386d5f62da00ada7e", nom: "Jeu 3 (à renommer)", categorie: "Action",   image: "", emoji: "🎮", width: 800,  height: 600 },
  { id: "63dd731e83704e13b300deff8109f39a", nom: "Jeu 4 (à renommer)", categorie: "Aventure", image: "", emoji: "🎮", width: 1200, height: 1600 },
  { id: "381bb01b67a14e7ea30b5623eb36855e", nom: "Jeu 5 (à renommer)", categorie: "Course",   image: "", emoji: "🎮", width: 1280, height: 720 },
  { id: "665328d407a547f2a003ed3723dedf16", nom: "Jeu 6 (à renommer)", categorie: "Puzzle",   image: "", emoji: "🎮", width: 480,  height: 800 },
  { id: "c4853541e0434d19a5bfdd8c75887cb5", nom: "Jeu 7 (à renommer)", categorie: "Puzzle",   image: "", emoji: "🎮", width: 450,  height: 800 },
  { id: "a9964948ad434acfb106811d323e6464", nom: "Jeu 8 (à renommer)", categorie: "Sport",    image: "", emoji: "🎮", width: 800,  height: 600 },
  { id: "b4ddb7628afc4a6fbd87b775ccf6f45e", nom: "Jeu 9 (à renommer)", categorie: "Course",   image: "", emoji: "🎮", width: 1280, height: 720 },
  { id: "88d7078602364cfd845f7c2796c456c7", nom: "Jeu 10 (à renommer)", categorie: "Sport",   image: "", emoji: "🎮", width: 800,  height: 600 }
];

const grid = document.getElementById('games-grid');
const favorisSection = document.getElementById('favoris-section');
const favorisGrid = document.getElementById('favoris-grid');
const recentsSection = document.getElementById('recents-section');
const recentsGrid = document.getElementById('recents-grid');
const searchInput = document.getElementById('search-input');

// =========================================
// Favoris (localStorage)
// =========================================
function getFavoris() {
  return JSON.parse(localStorage.getItem('favoris') || '[]');
}
function toggleFavori(gameId) {
  let favs = getFavoris();
  if (favs.includes(gameId)) {
    favs = favs.filter(id => id !== gameId);
  } else {
    favs.push(gameId);
  }
  localStorage.setItem('favoris', JSON.stringify(favs));
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
    thumb.replaceWith(img);
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
      return;
    }
    resultats.forEach(jeu => grid.appendChild(createCard(jeu)));
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
// Uniquement sur l'accueil (categorie.html gère son propre rendu après ce script)
// =========================================
const isAccueil = document.getElementById('favoris-section') !== null;
if (grid && isAccueil) {
  generateCards(jeux);
  renderAll();
}
