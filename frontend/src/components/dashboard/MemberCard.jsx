import { sanitizeDecimalInput, sanitizeIntegerInput } from "../../lib/format";

/**
 * Tek bir ekip uyesi karti: kisi bilgileri + o kisiye ait is kalemleri.
 * Pressman - User Help Facilities: startDate icin "1 Haziran'dan once ise
 * hedef 145 gun olur" bilgisini hint olarak veririz.
 */
export default function MemberCard({ member, statuses, items, onUpdateMember, onRemoveMember, onAddItem, onUpdateItem, onRemoveItem }) {
  return (
    <div className="bar" style={{ background: "#fff" }}>
      <div className="barrow" style={{ flexWrap: "wrap" }}>
        <input
          className="barlabel"
          style={{ flex: "1 1 160px" }}
          placeholder="Ad Soyad"
          value={member.fullName}
          onChange={(e) => onUpdateMember({ fullName: e.target.value })}
        />
        <input
          className="barlabel"
          style={{ flex: "1 1 120px" }}
          placeholder="Rol (örn: Geliştirici)"
          value={member.role}
          onChange={(e) => onUpdateMember({ role: e.target.value })}
        />
        <input
          type="date"
          className="barlabel"
          style={{ flex: "0 0 150px" }}
          title="İşe başlama tarihi — 1 Haziran'dan önceyse hedef iş günü otomatik 145 olur"
          value={member.startDate}
          onChange={(e) => onUpdateMember({ startDate: e.target.value })}
        />
        <select
          className="barlabel"
          style={{ flex: "0 0 140px" }}
          value={member.statusCode}
          onChange={(e) => onUpdateMember({ statusCode: e.target.value })}
        >
          {statuses.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label || s.code}
            </option>
          ))}
        </select>
        <input
          className="barlabel"
          style={{ flex: "0 0 130px" }}
          placeholder="Hedef gün (opsiyonel)"
          title="Boş bırakılırsa 1 Haziran kuralına göre otomatik hesaplanır, sonradan değiştirilebilir"
          inputMode="numeric"
          value={member.targetWorkDays || ""}
          onChange={(e) => onUpdateMember({ targetWorkDays: sanitizeIntegerInput(e.target.value) })}
        />
        <input
          className="barlabel"
          style={{ flex: "0 0 130px" }}
          placeholder="Kişiye özel bakım oranı"
          title="Boş bırakılırsa takım seviyesindeki genel bakım/SR oranı kullanılır (örn: 0.2 = %20)"
          inputMode="decimal"
          value={member.maintenanceAllocationPercent || ""}
          onChange={(e) => onUpdateMember({ maintenanceAllocationPercent: sanitizeDecimalInput(e.target.value) })}
        />
        <button type="button" className="delbar" onClick={onRemoveMember}>
          Kişiyi sil
        </button>
      </div>

      <div className="mhint" style={{ marginBottom: 6 }}>
        İş kalemleri
      </div>
      {items.map((item) => (
        <div className="segrow" key={item.clientId} style={{ marginBottom: 6 }}>
          <input
            style={{ flex: "1 1 180px", border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 13 }}
            placeholder="İş adı"
            value={item.title}
            onChange={(e) => onUpdateItem(item.clientId, { title: e.target.value })}
          />
          <input
            style={{ width: 90, border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 13 }}
            placeholder="Efor (AG)"
            inputMode="decimal"
            value={item.plannedEffortDays}
            onChange={(e) => onUpdateItem(item.clientId, { plannedEffortDays: sanitizeDecimalInput(e.target.value) })}
          />
          <select
            style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 13 }}
            value={item.statusCode}
            onChange={(e) => onUpdateItem(item.clientId, { statusCode: e.target.value })}
          >
            {statuses.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label || s.code}
              </option>
            ))}
          </select>
          <input
            type="date"
            title="Eklenme tarihi (opsiyonel — Yeni Eklenen Efor hesaplaması için)"
            style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 12 }}
            value={item.addedDate}
            onChange={(e) => onUpdateItem(item.clientId, { addedDate: e.target.value })}
          />
          <input
            type="date"
            title="Kapanma tarihi (opsiyonel — Dönem Kapanan Efor hesaplaması için)"
            style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 12 }}
            value={item.closedDate}
            onChange={(e) => onUpdateItem(item.clientId, { closedDate: e.target.value })}
          />
          <button type="button" className="delseg" title="İş kalemini sil" onClick={() => onRemoveItem(item.clientId)}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="addseg" onClick={onAddItem}>
        + İş kalemi ekle
      </button>
    </div>
  );
}
