-- =========================================
-- Fonction pour incrémenter le compteur de clics d'un jeu de façon atomique.
-- Crée la ligne si elle n'existe pas encore (upsert), sinon incrémente.
-- =========================================
create or replace function increment_play_count(p_game_id text)
returns void as $$
begin
  insert into game_stats (game_id, total_plays)
  values (p_game_id, 1)
  on conflict (game_id)
  do update set total_plays = game_stats.total_plays + 1;
end;
$$ language plpgsql;

-- =========================================
-- Fonction pour ajouter une note (1-5) à un jeu de façon atomique.
-- Incrémente rating_sum et rating_count en même temps.
-- =========================================
create or replace function add_rating(p_game_id text, p_rating int)
returns void as $$
begin
  insert into game_stats (game_id, rating_sum, rating_count)
  values (p_game_id, p_rating, 1)
  on conflict (game_id)
  do update set
    rating_sum = game_stats.rating_sum + p_rating,
    rating_count = game_stats.rating_count + 1;
end;
$$ language plpgsql;
