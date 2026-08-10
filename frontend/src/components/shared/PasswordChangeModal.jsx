import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { IconLock } from "./icons";
import { changePassword } from "../../lib/apiClient";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Profil ekranindaki "Şifre Değiştir" butonuyla acilan sifre guncelleme
 * ekrani. Kendi cagrisini kendisi yapar (changePassword) - ProfilePage
 * sadece acip kapatir, sifre akisiyla ilgili hicbir state tasimaz.
 *
 * Sifre KURALLARI (uzunluk, harf/rakam zorunlulugu) bilerek burada TEKRAR
 * KODLANMADI - tek dogruluk kaynagi backend'deki PasswordPolicy'dir; kural
 * ihlalinde donen Turkce mesaj oldugu gibi gosterilir, boylece kural
 * degistiginde iki yeri birden guncelleme (ve uyumsuz kalma) riski olmaz.
 * Burada sadece backend'in BILEMEYECEGI dogrulama yapilir: iki yeni sifre
 * alaninin birbiriyle ayni olmasi ve alanlarin bos birakilmamasi.
 *
 * Pressman - Error Information Handling: hata mesaji forma bitisik ve
 * anlasilir; basarili sonucta modal kendini kapatmadan once net bir onay
 * mesaji gosterir.
 */
export default function PasswordChangeModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Modal her acilista temiz baslar - onceki denemenin sifreleri veya hata
  // mesaji ekranda kalmasin.
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setShowPasswords(false);
      setError("");
      setDone(false);
      setSaving(false);
    }
  }, [open]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Yeni şifreler birbiriyle aynı değil.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY_FORM);
      setDone(true);
    } catch (err) {
      setError(err?.message || "Şifre değiştirilemedi.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} boxClassName="box password-modal-box">
      <div className="password-modal-head">
        <span className="password-modal-icon">
          <IconLock style={{ width: 20, height: 20 }} />
        </span>
        <h3 className="password-modal-title">Şifre Değiştir</h3>
      </div>

      {done ? (
        <>
          <p className="password-modal-desc">
            Şifreniz güncellendi. Diğer cihazlardaki oturumlarınız güvenlik için kapatıldı;
            bu ekrandaki oturumunuz açık kalmaya devam ediyor.
          </p>
          <div className="password-modal-actions">
            <Button variant="primary" onClick={handleClose}>
              Tamam, Kapat
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="password-modal-desc">
            Güvenliğiniz için önce mevcut şifrenizi girin. Yeni şifreniz en az 8 karakter olmalı,
            en az bir harf ve bir rakam içermeli, boşluk içermemelidir.
          </p>

          <label className="profile-field">
            <span className="profile-detail-label">Mevcut Şifre</span>
            <input
              className="profile-input"
              type={showPasswords ? "text" : "password"}
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={update("currentPassword")}
              disabled={saving}
            />
          </label>

          <label className="profile-field">
            <span className="profile-detail-label">Yeni Şifre</span>
            <input
              className="profile-input"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={update("newPassword")}
              disabled={saving}
            />
          </label>

          <label className="profile-field">
            <span className="profile-detail-label">Yeni Şifre (Tekrar)</span>
            <input
              className="profile-input"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              disabled={saving}
            />
          </label>

          <label className="password-modal-reveal">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              disabled={saving}
            />
            Şifreleri göster
          </label>

          {error && <div className="login-error">{error}</div>}

          <div className="password-modal-actions">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary" loading={saving} loadingLabel="Kaydediliyor…">
              Şifreyi Güncelle
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
