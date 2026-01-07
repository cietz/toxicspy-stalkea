// ============================================
// 📸 Instagram API Custom - Substituição do instagram-api.obf.js
// ============================================
// Este script substitui o instagram-api.obf.js para garantir que
// os dados da API sejam salvos corretamente no localStorage

// Detectar ambiente: localhost usa mock-server, produção usa API externa
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocalhost
  ? "http://localhost:3000/api/"
  : window.INSTAGRAM_API_BASE_URL || "https://in-stalker.site/api/";
const REQUEST_TIMEOUT = 30000;

console.log("🔧 [API Custom] Hostname:", window.location.hostname);
console.log("🔧 [API Custom] isLocalhost:", isLocalhost);
console.log("🔧 [API Custom] API_BASE_URL:", API_BASE_URL);

console.log(
  "🔧 [API Custom] Ambiente:",
  isLocalhost ? "localhost (mock-server)" : "produção"
);
console.log("🔧 [API Custom] Usando API:", API_BASE_URL);

// ============================================
// 🔧 Utilities
// ============================================

function getProxyImageUrl(url) {
  if (!url || url.trim() === "") {
    return "../assets/images/avatars/perfil-sem-foto.jpeg";
  }
  if (url.includes("proxt-insta.projetinho-solo.workers.dev")) return url;
  return `https://proxt-insta.projetinho-solo.workers.dev/?url=${encodeURIComponent(
    url
  )}`;
}

function getProxyImageUrlLight(url) {
  // Versão "leve" - retorna a URL original sem proxy se vazia
  // Usada para preview rápido na modal
  if (!url || url.trim() === "") {
    return "../assets/images/avatars/perfil-sem-foto.jpeg";
  }
  return url;
}

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// ============================================
// 📊 API Methods
// ============================================

async function fetchProfileByUsername(username) {
  console.log("🔍 [API Custom] Buscando perfil:", username);

  const cleanUsername = username.replace(/^@+/, "").trim();
  if (!cleanUsername) {
    throw new Error("Username inválido");
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}instagram.php?tipo=perfil&username=${encodeURIComponent(
        cleanUsername
      )}`
    );

    if (!response || response.error) {
      throw new Error(response?.error || "Erro ao buscar perfil");
    }

    const profile = response.perfil || response;

    if (profile && profile.username) {
      const normalized = {
        pk: profile.user_id || profile.pk || null,
        username: profile.username || cleanUsername,
        full_name: profile.full_name || "",
        biography: profile.biography || "",
        profile_pic_url: getProxyImageUrl(profile.profile_pic_url),
        is_verified: profile.is_verified || false,
        is_private: profile.is_private || false,
        is_business: profile.is_business || false,
        media_count: profile.media_count || 0,
        follower_count: profile.follower_count || 0,
        following_count: profile.following_count || 0,
      };

      // Salvar perfil no localStorage
      localStorage.setItem("instagram_profile", JSON.stringify(normalized));
      localStorage.setItem("username", cleanUsername);

      console.log("✅ [API Custom] Perfil salvo:", normalized.username);
      return normalized;
    }

    throw new Error("Perfil não encontrado");
  } catch (error) {
    console.error("❌ [API Custom] Erro ao buscar perfil:", error);
    throw error;
  }
}

async function fetchCompleteData(username, isPrivate = null) {
  console.log(
    "🔍 [API Custom] Buscando dados completos:",
    username,
    "(private:",
    isPrivate,
    ")"
  );

  const cleanUsername = username.replace(/^@+/, "").trim();
  if (!cleanUsername) {
    throw new Error("Username inválido");
  }

  try {
    // Construir URL
    let url = `${API_BASE_URL}instagram.php?tipo=busca_completa&username=${encodeURIComponent(
      cleanUsername
    )}`;
    if (isPrivate !== null) {
      url += `&is_private=${isPrivate}`;
    }

    const response = await fetchWithTimeout(url);

    if (!response || response.error) {
      throw new Error(response?.error || "Erro ao buscar dados completos");
    }

    console.log("📦 [API Custom] Resposta recebida:", {
      perfis: response.lista_perfis_publicos?.length || 0,
      posts: response.posts?.length || 0,
      perfil_buscado: response.perfil_buscado?.username || "N/A",
    });

    // DEBUG: Mostrar estrutura do primeiro perfil
    if (
      response.lista_perfis_publicos &&
      response.lista_perfis_publicos.length > 0
    ) {
      console.log(
        "👤 [DEBUG] Primeiro perfil da lista:",
        response.lista_perfis_publicos[0]
      );
    }

    // ============================================
    // 💾 SALVAR FOLLOWERS/FOLLOWING NO LOCALSTORAGE
    // ============================================
    if (
      response.lista_perfis_publicos &&
      response.lista_perfis_publicos.length > 0
    ) {
      const followers = response.lista_perfis_publicos.map((perfil) => ({
        username: perfil.username || "",
        full_name: perfil.full_name || "",
        profile_pic_url: getProxyImageUrl(perfil.profile_pic_url),
        is_verified: perfil.is_verified || false,
        is_private: perfil.is_private || false,
      }));

      // Salvar em 3 chaves diferentes para compatibilidade
      localStorage.setItem("followers", JSON.stringify(followers));
      localStorage.setItem("instagram_followers", JSON.stringify(followers));
      localStorage.setItem("chaining_results", JSON.stringify(followers));

      console.log(
        `✅ [API Custom] ${followers.length} followers salvos no localStorage`
      );
      console.log(
        "   📋 Primeiros 3:",
        followers
          .slice(0, 3)
          .map((f) => `@${f.username}`)
          .join(", ")
      );
    } else {
      console.warn(
        "⚠️  [API Custom] Nenhum follower encontrado em lista_perfis_publicos"
      );
    }

    // ============================================
    // 💾 SALVAR POSTS NO LOCALSTORAGE
    // ============================================
    if (response.posts && response.posts.length > 0) {
      console.log(
        "🔍 [DEBUG POSTS] Estrutura do primeiro post da API:",
        JSON.stringify(response.posts[0]).substring(0, 500)
      );

      const posts = response.posts.map((item, index) => {
        // Estrutura: { post: {...}, username, full_name, profile_pic_url }
        // OU: { de_usuario: {...}, post: {...} }

        let postData, userData;

        if (item.de_usuario) {
          // Formato novo: de_usuario + post
          userData = item.de_usuario;
          postData = item.post;
        } else {
          // Formato antigo: direto
          userData = {
            username: item.username,
            full_name: item.full_name,
            profile_pic_url: item.profile_pic_url,
          };
          postData = item.post;
        }

        if (index === 0) {
          console.log(
            "🔍 [DEBUG POSTS] postData.image_url:",
            postData.image_url
          );
          console.log(
            "🔍 [DEBUG POSTS] userData.profile_pic_url:",
            userData.profile_pic_url
          );
          console.log("🔍 [DEBUG POSTS] userData.username:", userData.username);
        }

        return {
          post: {
            id: postData.id || "",
            shortcode: postData.shortcode || "",
            image_url: getProxyImageUrl(postData.image_url),
            video_url: postData.video_url
              ? getProxyImageUrl(postData.video_url)
              : null,
            is_video: postData.is_video || false,
            caption: postData.caption || "",
            like_count: postData.like_count || 0,
            comment_count: postData.comment_count || 0,
            taken_at: postData.taken_at || Date.now() / 1000,
          },
          // ⚡ ESTRUTURA DO SITE ORIGINAL: username, full_name, profile_pic_url NA RAIZ
          username: userData.username || "",
          full_name: userData.full_name || "",
          profile_pic_url: getProxyImageUrl(userData.profile_pic_url),
        };
      });

      // Salvar em 2 chaves diferentes para compatibilidade
      localStorage.setItem("feed_real_posts", JSON.stringify(posts));
      localStorage.setItem("instagram_posts", JSON.stringify(posts));

      console.log(
        `✅ [API Custom] ${posts.length} posts salvos no localStorage`
      );
      console.log(
        "   📸 Primeiros 2 de:",
        posts
          .slice(0, 2)
          .map((p) => `@${p.username}`)
          .join(", ")
      );
    } else {
      console.warn("⚠️  [API Custom] Nenhum post encontrado");
    }

    // Salvar perfil buscado
    if (response.perfil_buscado) {
      const profile = {
        username: response.perfil_buscado.username || cleanUsername,
        full_name: response.perfil_buscado.full_name || "",
        profile_pic_url: getProxyImageUrl(
          response.perfil_buscado.profile_pic_url
        ),
        is_private: response.perfil_buscado.is_private || false,
        is_verified: response.perfil_buscado.is_verified || false,
      };

      localStorage.setItem("instagram_profile", JSON.stringify(profile));
      localStorage.setItem("username", cleanUsername);

      console.log("✅ [API Custom] Perfil buscado salvo:", profile.username);
    }

    console.log("🎉 [API Custom] Todos os dados salvos com sucesso!");

    // ⚡ REMOVER FLAG DE FALLBACK pois temos dados reais!
    localStorage.removeItem("is_fallback_data");
    console.log("✅ [API Custom] Flag is_fallback_data removida!");

    return response;
  } catch (error) {
    console.error("❌ [API Custom] Erro ao buscar dados completos:", error);
    throw error;
  }
}

async function fetchPrivateProfile(username) {
  console.log("🔒 [API Custom] Buscando perfil privado:", username);
  return await fetchCompleteData(username, true);
}

// ============================================
// 💾 Storage Helper (para compatibilidade)
// ============================================

function saveProfileToStorage(profile) {
  if (!profile) return;

  localStorage.setItem("instagram_profile", JSON.stringify(profile));
  if (profile.username) {
    localStorage.setItem("username", profile.username);
  }
  console.log("✅ [API Custom] Perfil salvo manualmente:", profile.username);
}

// ============================================
// 🌍 Export para uso global
// ============================================

window.InstagramAPI = {
  fetchProfileByUsername,
  fetchCompleteData,
  fetchPrivateProfile,
  getProxyImageUrl,
  saveProfileToStorage,
};

// Exportar funções de imagem globalmente (compatibilidade com código antigo)
window.getProxyImageUrl = getProxyImageUrl;
window.getProxyImageUrlLight = getProxyImageUrlLight;

console.log("✅ [API Custom] Instagram API inicializado");
console.log(
  "📦 Métodos disponíveis: InstagramAPI.fetchProfileByUsername(), InstagramAPI.fetchCompleteData()"
);
