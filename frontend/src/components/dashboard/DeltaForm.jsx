import { sanitizeDecimalInput, sanitizeIntegerInput } from "../../lib/format";

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
            <input inputMode="numeric" value={dKapanan} onChange={(e) => setDKapanan(sanitizeIntegerInput(e.target.value))} placeholder="örn: 37" />
          </div>
          <div className="field">
            <label>
              Yeni Eklenen İş Yükü <span className="req">zorunlu</span>
            </label>
            <input inputMode="numeric" value={dEklenen} onChange={(e) => setDEklenen(sanitizeIntegerInput(e.target.value))} placeholder="örn: 62" />
          </div>
          <div className="field">
            <label>
              Canlıya Alınan FTE <span className="opt">opsiyonel · RPA</span>
            </label>
            <input inputMode="decimal" value={dFte} onChange={(e) => setDFte(sanitizeDecimalInput(e.target.value))} placeholder="örn: 0,05 — yoksa boş bırak" />
          </div>
          <div className="field">
            <label>
              Net İş Yükü Değişimi <span className="opt">opsiyonel · boşsa = Kapanan − Eklenen</span>
            </label>
            <input inputMode="decimal" value={dNet} onChange={(e) => setDNet(sanitizeDecimalInput(e.target.value, true))} placeholder="otomatik" />
          </div>
        </div>
        <div className="mhint">
          Kapanan ve Eklenen elle girilir (önceki dönem kıyası Excel'de tutulmaz). Tarih aralığı Rapor Tarihi'nden otomatik hesaplanır (son 14 gün).{" "}
          <b>Canlıya Alınan FTE</b> yalnızca RPA'da; doldurursanız kart eklenir, boşsa hiç görünmez. <b>Net</b> boşsa Dönem Kapanan İş Yükü − Yeni Eklenen İş Yükü, doluysa girdiğiniz değer.
        </div>
      </div>
    </>
  );
}
