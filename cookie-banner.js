// =========================================
// Bandeau de consentement cookies (RGPD)
// À inclure sur TOUTES les pages via <script src="js/cookie-banner.js"></script>
// =========================================

(function () {
  const STORAGE_KEY = 'cookies_accepted';

  function getConsent() {
    return localStorage.getItem(STORAGE_KEY); // "true" | "false" | null
  }

  function setConsent(value) {
    localStorage.setItem(STORAGE_KEY, value);
  }

  // =========================================
  // Création du bandeau (injecté dans le DOM)
  // =========================================
  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <p>Nous utilisons des cookies publicitaires (Google AdSense) pour financer ce site gratuit.</p>
      <div class="cookie-actions">
        <button id="cookie-refuse">✗ Refuser</button>
        <button id="cookie-accept">✓ Accepter</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', () => {
      setConsent('true');
      banner.remove();
      loadAdSenseIfConsented();
      document.dispatchEvent(new CustomEvent('cookiesAccepted'));
    });

    document.getElementById('cookie-refuse').addEventListener('click', () => {
      setConsent('false');
      banner.remove();
    });
  }

  // =========================================
  // Styles du bandeau (injectés en JS pour rester autonome,
  // pas besoin de toucher style.css)
  // =========================================
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #cookie-banner {
        position: fixed;
        bottom: 16px;
        left: 16px;
        right: 16px;
        max-width: 600px;
        margin: 0 auto;
        background: rgba(26, 26, 46, 0.95);
        color: #fff;
        padding: 16px 20px;
        border-radius: 10px;
        font-size: 0.85rem;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
      }
      #cookie-banner p { margin: 0; flex: 1 1 240px; }
      .cookie-actions { display: flex; gap: 8px; flex-shrink: 0; }
      .cookie-actions button {
        border: none;
        border-radius: 6px;
        padding: 8px 14px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }
      #cookie-accept { background: #4ade80; color: #1a1a2e; }
      #cookie-accept:hover { background: #3fce72; }
      #cookie-refuse { background: #555; color: #fff; }
      #cookie-refuse:hover { background: #666; }
    `;
    document.head.appendChild(style);
  }

  // =========================================
  // Chargement conditionnel de Google AdSense
  // N'appelle cette fonction QUE si le consentement est "true"
  // =========================================
  function loadAdSenseIfConsented() {
    if (getConsent() !== 'true') return;
    if (document.getElementById('adsense-script')) return; // déjà chargé, évite les doublons

    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX'; // ⚠️ remplace par ton vrai ID client AdSense
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  // =========================================
  // Initialisation au chargement de la page
  // =========================================
  function init() {
    injectStyles();
    const consent = getConsent();

    if (consent === null) {
      // Pas encore de choix : afficher le bandeau
      createBanner();
    } else if (consent === 'true') {
      // Déjà accepté lors d'une visite précédente : charger AdSense directement
      loadAdSenseIfConsented();
    }
    // Si consent === 'false', on ne fait rien : pas de bandeau, pas d'AdSense
  }

  document.addEventListener('DOMContentLoaded', init);
})();
