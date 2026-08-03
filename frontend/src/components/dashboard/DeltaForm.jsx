export default function DeltaForm({ dKapanan, setDKapanan, dEklenen, setDEklenen, dFte, setDFte, dNet, setDNet }) {
  return (
    <>
      <p className="panelttl">Son 2 Hafta</p>
      <div className="bandpanel">
        <div className="deltagrid">
          <div className="field">
            <label>
              Dönem Kapanan İş Yükü <span className="req">zorunlu</span>
            </label>
            <input value={dKapanan} onChange={(e) => setDKapanan(e.target.value)} placeholder="örn: 37" />
          </div>
          <div className="field">
            <label>
              Yeni Eklenen İş Yükü <span className="req">zorunlu</span>
            </label>
            <input value={dEklenen} onChange={(e) => setDEklenen(e.target.value)} placeholder="örn: 62" />
          </div>
          <div className="field">
            <label>
              Canlıya Alınan FTE <span className="opt">opsiyonel · RPA</span>
            </label>
            <input value={dFte} onChange={(e) => setDFte(e.target.value)} placeholder="örn: 0,05 — yoksa boş bırak" />
          </div>
          <div className="field">
            <label>
              Net İş Yükü Değişimi <span className="opt">opsiyonel · boşsa = Tamamlanan × −1</span>
            </label>
            <input value={dNet} onChange={(e) => setDNet(e.target.value)} placeholder="otomatik" />
          </div>
        </div>
        <div className="mhint">
          Kapanan ve Eklenen elle girilir (önceki dönem kıyası Excel'de tutulmaz). Tarih aralığı Rapor Tarihi'nden otomatik hesaplanır (son 14 gün).{" "}
          <b>Canlıya Alınan FTE</b> yalnızca RPA'da; doldurursanız kart eklenir, boşsa hiç görünmez. <b>Net</b> boşsa toplam Tamamlanan'ın eksisi, doluysa girdiğiniz değer.
        </div>
      </div>
    </>
  );
}
