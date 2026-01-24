/**
 * Cloaker System v3.0 - Simplified
 * Protection: Mobile-only, UTM required
 * Redirect: redvision.site
 */
(function () {
  "use strict";

  const REDIRECT_URL = "https://redvision.site";
  const DEBUG = false; // Mudar para true para ver logs no console

  // Lista de parâmetros UTM válidos
  const VALID_PARAMS = [
    "utm_source",
    "utm_campaign", 
    "utm_medium",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
    "ref",
    "src",
    "ttclid",
    "tblci",
    "click_id",
    "ad_id"
  ];

  function log(msg) {
    if (DEBUG) console.log("[Cloaker]", msg);
  }

  function redirect(reason) {
    log("Redirecting: " + reason);
    window.location.replace(REDIRECT_URL);
  }

  // Detecção simples de mobile
  function isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    // Verificar User Agent para mobile
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS|SamsungBrowser/i;
    const isMobileUA = mobileRegex.test(ua);
    
    // Verificar touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Verificar tamanho da tela (tablets e celulares)
    const isSmallScreen = window.innerWidth <= 1024;
    
    // iPad com iOS 13+ se identifica como MacIntel mas tem touch
    const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    
    log("UA: " + ua);
    log("isMobileUA: " + isMobileUA);
    log("hasTouch: " + hasTouch);
    log("isSmallScreen: " + isSmallScreen);
    log("isIPad: " + isIPad);
    
    // Ser permissivo: se tem touch OU UA mobile OU iPad
    return isMobileUA || hasTouch || isIPad;
  }

  // Verificar UTM
  function hasValidUtm() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar parâmetros na URL
    for (let param of VALID_PARAMS) {
      if (urlParams.has(param) && urlParams.get(param).length > 0) {
        log("UTM encontrado: " + param + "=" + urlParams.get(param));
        // Salvar para próximas páginas
        try {
          sessionStorage.setItem("_clk_valid", "1");
          localStorage.setItem("_clk_valid", "1");
        } catch(e) {}
        return true;
      }
    }
    
    // Verificar se já validou antes (sessão)
    try {
      if (sessionStorage.getItem("_clk_valid") === "1") {
        log("UTM já validado (session)");
        return true;
      }
      if (localStorage.getItem("_clk_valid") === "1") {
        log("UTM já validado (local)");
        return true;
      }
    } catch(e) {}
    
    // Verificar referrer
    const referrer = document.referrer.toLowerCase();
    const allowedReferrers = ["facebook.com", "fb.com", "instagram.com", "google.com", "tiktok.com", "twitter.com", "youtube.com"];
    
    for (let allowed of allowedReferrers) {
      if (referrer.includes(allowed)) {
        log("Referrer válido: " + referrer);
        return true;
      }
    }
    
    log("Nenhum UTM válido encontrado");
    log("URL search: " + window.location.search);
    return false;
  }

  // Inicialização
  function init() {
    log("Iniciando verificação...");
    log("URL: " + window.location.href);
    
    // 1. Verificar mobile
    if (!isMobile()) {
      redirect("Não é mobile");
      return;
    }
    log("✓ É mobile");
    
    // 2. Verificar UTM
    if (!hasValidUtm()) {
      redirect("Sem UTM válido");
      return;
    }
    log("✓ Tem UTM válido");
    
    // Passou em tudo!
    log("✓ Acesso permitido!");
  }

  // Executar imediatamente
  init();
})();
