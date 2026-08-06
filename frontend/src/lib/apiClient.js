const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Auth cookie'leri (access_token/refresh_token) httpOnly oldugu icin JS'ten
 * okunamaz - backend'in Set-Cookie ile yazdigi cookie'ler "credentials: include"
 * ile otomatik gonderilir/alinir. XSRF-TOKEN cookie'si ise bilerek httpOnly
 * DEGIL: CSRF korumasi icin degerini okuyup X-CSRF-Token header'ina yansitiyoruz
 * (double-submit deseni, bkz. backend CsrfCookieFilter).
 */
function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function csrfHeaders() {
  const token = readCookie("XSRF-TOKEN");
  return token ? { "X-CSRF-Token": token } : {};
}

// access_token'in omru kisa (backend JwtProperties.accessTokenTtlMinutes=15) -
// refresh_token cookie'si (7 gun) hala gecerliyken kullanici 15 dakikadan
// uzun surdugu her oturumda sessizce "401"lere dusuyordu (bkz. kullanici
// bildirimi: Profil sayfasinda "Profil bilgileri alınamadı (HTTP 401)" ve
// konsolda tekrarlanan /api/auth/profile 401'leri) - backend'te calisan bir
// POST /api/auth/refresh ucu vardi ama frontend hicbir yerde cagirmiyordu.
// Asagidaki sarmalayici, authFetch ile atilan HER istekte 401 aldiginda
// BIR KEZ refresh dener, basariliysa istegi TEKRAR eder; refresh de
// basarisizsa (refresh_token da suresi dolmus/gecersiz) orijinal 401 yaniti
// aynen doner - cagiran taraf (App.jsx) bunu normal login-gerekli 401'i gibi
// isler. Ayni anda birden fazla istek 401 alirsa (orn. sayfa acilirken
// paralel /me + /profile) tek bir refresh cagrisinda birlesir (refreshPromise).
let refreshPromise = null;

function isAuthEndpoint(path) {
  return path.startsWith("/api/auth/login") || path.startsWith("/api/auth/refresh");
}

async function tryRefreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: csrfHeaders(),
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * fetch() sarmalayici: 401 aldiginda (login/refresh'in kendisi haric) bir kez
 * refresh dener ve basariliysa istegi tekrar eder. `path`, API_BASE_URL'e
 * gore GORECELI olmali (orn. "/api/auth/profile") - isAuthEndpoint kontrolu
 * icin. Mutasyon istekleri (POST/PUT/DELETE) icin `buildInit` bir fonksiyon
 * olarak verilir ki tekrar denemede X-CSRF-Token TAZE cookie degerinden
 * yeniden okunsun (refresh, XSRF-TOKEN cookie'sini rotate edebilir).
 */
async function authFetch(path, buildInit) {
  let response = await fetch(`${API_BASE_URL}${path}`, buildInit());
  if (response.status === 401 && !isAuthEndpoint(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, buildInit());
    }
  }
  return response;
}

async function parseErrorBody(response, fallbackMessage) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // gövde JSON değilse yut
  }
  throw body || { status: response.status, message: fallbackMessage };
}

/**
 * Giris (sicil/sifre) endpoint'ini cagirir. Basarili girişte backend
 * access_token/refresh_token/XSRF-TOKEN cookie'lerini Set-Cookie ile yazar,
 * govdede {sicil, fullName, role, teamId} doner.
 */
export async function login(sicil, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sicil, password }),
    });
  } catch (networkErr) {
    throw { message: "Backend'e ulaşılamadı. Sunucunun çalıştığından ve " + API_BASE_URL + " adresinden erişilebilir olduğundan emin olun." };
  }

  if (!response.ok) {
    await parseErrorBody(response, response.status === 401 ? "Sicil no veya şifre hatalı." : "Sunucu hatası (HTTP " + response.status + ")");
  }

  return response.json();
}

/**
 * Sayfa yenilendiğinde mevcut oturumu (access_token cookie geçerliyse)
 * geri kurmak için kullanılır. Oturum yoksa/geçersizse null döner (hata
 * fırlatmaz - bu durum LoginPage'e düşmek için normal bir akış).
 */
export async function fetchCurrentUser() {
  const response = await authFetch("/api/auth/me", () => ({ credentials: "include" }));
  if (!response.ok) return null;
  return response.json();
}

/**
 * Profil sayfasindaki "Profil Bilgileri" butonu tiklandiginda cagirilir.
 * AD/personel servisiyle birebir ayni alan adlarini (company/department/
 * title/ExtensionAttribute4/6/8) tasiyan, salt-okunur genisletilmis bilgiyi
 * doner - /api/auth/me'nin hafif govdesinden farkli olarak burada tek seferlik,
 * istege bagli cekilir.
 */
export async function fetchUserProfile() {
  const response = await authFetch("/api/auth/profile", () => ({ credentials: "include" }));
  if (!response.ok) {
    await parseErrorBody(response, "Profil bilgileri alınamadı (HTTP " + response.status + ")");
  }
  return response.json();
}

export async function logout() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
  });
}

/**
 * Backend'in stateless (kalici olmayan) kapasite dashboard endpoint'ini cagirir.
 * Hicbir sey veritabanina kaydedilmez - istek suresince yasar, aninda sonuc doner.
 *
 * Hata durumunda backend'in ApiErrorResponse'unu (status/error/message) oldugu
 * gibi firlatir; cagiran taraf ErrorBanner ile normalize edip gosterir.
 */
export async function computeStatelessDashboard(request) {
  let response;
  try {
    response = await authFetch("/api/capacity-dashboard/compute", () => ({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify(request),
    }));
  } catch (networkErr) {
    throw { message: "Backend'e ulaşılamadı. Sunucunun çalıştığından ve " + API_BASE_URL + " adresinden erişilebilir olduğundan emin olun." };
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      // gövde JSON değilse yut, asagida generic mesaj kullanilir
    }
    throw body || { status: response.status, message: "Sunucu hatası (HTTP " + response.status + ")" };
  }

  return response.json();
}

/**
 * Auth/CSRF header'larini ekleyip JSON gövdeli bir istek atan ortak yardimci -
 * team/presentation endpoint'lerinin hepsi ayni desende (credentials+CSRF+hata
 * normalize etme) oldugu icin tekrarlanmiyor.
 */
async function requestJson(path, options = {}) {
  let response;
  try {
    response = await authFetch(path, () => ({
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders(), ...(options.headers || {}) },
      ...options,
    }));
  } catch (networkErr) {
    throw { message: "Backend'e ulaşılamadı. Sunucunun çalıştığından ve " + API_BASE_URL + " adresinden erişilebilir olduğundan emin olun." };
  }

  if (!response.ok) {
    await parseErrorBody(response, "Sunucu hatası (HTTP " + response.status + ")");
  }
  if (response.status === 204) return null;
  return response.json();
}

/** Takım seçici (admin split-screen sol panel) için mevcut takımları döner. */
export async function fetchTeams() {
  return requestJson("/api/teams");
}

/** Bir takıma ait kayıtlı sprint sunumlarının özet listesini döner. */
export async function fetchPresentations(teamId) {
  return requestJson(`/api/presentations?teamId=${teamId}`);
}

/** Tek bir sunumun tam içeriğini (editörü hidratlamak için) döner. */
export async function fetchPresentation(id) {
  return requestJson(`/api/presentations/${id}`);
}

/**
 * Sunumu kaydeder - yoksa oluşturur (version=1), varsa yeni bir versiyon
 * olarak günceller (bkz. backend PresentationService.upsert). Yetkisiz
 * takıma yazma denemesi 403 fırlatır (backend PresentationFacade).
 */
export async function savePresentation({ teamId, sprintNo, dateRange, content }) {
  return requestJson("/api/presentations", {
    method: "PUT",
    body: JSON.stringify({ teamId, sprintNo, dateRange, content }),
  });
}

/** Bir sunumun versiyon (audit log) geçmişini döner. */
export async function fetchPresentationVersions(id) {
  return requestJson(`/api/presentations/${id}/versions`);
}

/** Belirtilen versiyonu YENİ bir versiyon olarak head'e geri kopyalar (geçmiş silinmez). */
export async function rollbackPresentation(id, version) {
  return requestJson(`/api/presentations/${id}/versions/${version}/rollback`, { method: "POST" });
}

/** Monitoring sayfasi ust bilgi seridi (bugunku islem sayisi, aktif kullanici vb.) - admin-only. */
export async function fetchAuditSummary() {
  return requestJson("/api/monitoring/summary");
}

/** Filtre dropdown'lari icin kullanicilar/eylem turleri/takimlar - admin-only. */
export async function fetchAuditFilterOptions() {
  return requestJson("/api/monitoring/filters");
}

/** Sayfalanmis aktivite log listesi - filters: {actorSicil, actionCode, entityType, teamId, success, from, to, page, size}. */
export async function fetchAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") params.set(key, value);
  });
  const qs = params.toString();
  return requestJson(`/api/monitoring/audit-logs${qs ? `?${qs}` : ""}`);
}

/**
 * Kapak gorseli MinIO'ya yuklenir ve erisim URL'i geri doner. Tek kullanimlik
 * bir ozellik oldugu icin bu istek best-effort'tur - cagiran taraf (useCoverImage)
 * hata durumunda kullaniciyi engellemez, gorseli zaten kendi tarafinda (base64)
 * kullanmaya devam eder.
 */
export async function uploadCoverImage(file) {
  const form = new FormData();
  form.append("file", file);

  const response = await authFetch("/api/assets/cover-image", () => ({
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: form,
  }));

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      // gövde JSON değilse yut
    }
    throw body || { status: response.status, message: "Görsel yüklenemedi (HTTP " + response.status + ")" };
  }

  return response.json();
}
