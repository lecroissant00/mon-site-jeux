// =========================================
// Connexion à Supabase — statistiques partagées entre TOUS les visiteurs
// (clics totaux, notes moyennes par étoiles)
// =========================================

const SUPABASE_URL = 'https://cpkoeeluffenzmlsispq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pX5s3ol4an30qdUJEq14kQ_p2N_2DUZ';
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// =========================================
// Récupère les stats de TOUS les jeux en un seul appel
// Retourne un objet { gameId: { total_plays, rating_sum, rating_count } }
// =========================================
async function fetchAllGameStats() {
  try {
    const res = await fetch(`${SUPABASE_REST}/game_stats?select=*`, {
      headers: supabaseHeaders
    });
    if (!res.ok) throw new Error('Erreur fetch game_stats');
    const data = await res.json();
    const map = {};
    data.forEach(row => { map[row.game_id] = row; });
    return map;
  } catch (err) {
    console.error('Supabase fetchAllGameStats:', err);
    return {};
  }
}

// =========================================
// Incrémente le compteur de clics global pour un jeu (appelé une fois par visite sur jeu.html)
// Utilise une fonction RPC pour incrémenter de façon atomique (évite les conflits si plusieurs
// visiteurs cliquent en même temps).
// =========================================
async function incrementGlobalPlayCount(gameId) {
  try {
    await fetch(`${SUPABASE_REST}/rpc/increment_play_count`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({ p_game_id: gameId })
    });
  } catch (err) {
    console.error('Supabase incrementGlobalPlayCount:', err);
  }
}

// =========================================
// Enregistre une note (1 à 5 étoiles) pour un jeu, partagée globalement.
// Utilise une fonction RPC pour ajouter la note à la somme/compteur de façon atomique.
// =========================================
async function submitGlobalRating(gameId, note) {
  try {
    await fetch(`${SUPABASE_REST}/rpc/add_rating`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({ p_game_id: gameId, p_rating: note })
    });
  } catch (err) {
    console.error('Supabase submitGlobalRating:', err);
  }
}

// =========================================
// Calcule la moyenne d'un jeu à partir de ses stats brutes
// =========================================
function getAverageRating(stats) {
  if (!stats || !stats.rating_count) return 0;
  return stats.rating_sum / stats.rating_count;
}
