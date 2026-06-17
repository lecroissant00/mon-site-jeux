// =========================================
// Google Analytics 4 — chargement conditionné au consentement cookies
// À inclure sur TOUTES les pages via <script src="js/analytics.js"></script>
// ⚠️ Remplace GA_MEASUREMENT_ID par ton vrai ID de mesure (format G-XXXXXXXXXX)
// =========================================

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

(function () {

  function hasConsent() {
    return localStorage.getItem('cookies_accepted') === 'true';
  }

  // =========================================
  // Chargement du script GA4 (uniquement si consentement donné)
  // =========================================
  function loadGoogleAnalytics() {
    if (!hasConsent()) return;
    if (document.getElementById('ga4-script')) return; // déjà chargé, évite les doublons

    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  // =========================================
  // Envoi d'un event personnalisé (no-op silencieux si pas de consentement)
  // Utilisable partout via : trackEvent('game_start', { game_id: '...', game_name: '...' })
  // =========================================
  window.trackEvent = function (eventName, params) {
    if (!hasConsent()) return; // pas de consentement = aucun tracking, silencieusement
    if (typeof window.gtag !== 'function') return; // GA pas encore chargé
    window.gtag('event', eventName, params || {});
  };

  // =========================================
  // Initialisation
  // Si le consentement est déjà accepté au chargement de la page, on charge GA tout de suite.
  // Si l'utilisateur clique "Accepter" sur le bandeau cookies plus tard dans la même session,
  // on écoute aussi un événement custom pour charger GA à ce moment précis.
  // =========================================
  document.addEventListener('DOMContentLoaded', loadGoogleAnalytics);

  // Le bandeau cookies (cookie-banner.js) peut déclencher cet événement après acceptation
  document.addEventListener('cookiesAccepted', loadGoogleAnalytics);

})();
