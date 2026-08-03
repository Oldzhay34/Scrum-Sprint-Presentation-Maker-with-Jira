const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
    response = await fetch(`${API_BASE_URL}/api/capacity-dashboard/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
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
