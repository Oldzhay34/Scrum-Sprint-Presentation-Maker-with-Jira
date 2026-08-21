import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ensureTeamMember,
  fetchCompanyWideLeaves,
  fetchMemberLeaves,
  createLeavePeriod,
  deleteLeavePeriod,
} from "../../lib/apiClient";
import { periodDays, sumFractionsInWindow } from "../../lib/leaveDays";

function formatRange(p) {
  const fmt = (iso) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}`;
  };
  return p.startDate === p.endDate ? fmt(p.startDate) : `${fmt(p.startDate)}–${fmt(p.endDate)}`;
}

/**
 * Bir kişinin izin günü kaydini yonetir - hem MANUEL (serbest tarih araligi)
 * hem de ŞİRKET TAKVİMİNDEN (bkz. LeaveCalendarSeeder, sadece SIRKET_TATILI -
 * resmi bayramlar HARİÇ, bkz. kullanici bildirimi) secilerek eklenebilir.
 * Kisi henuz gercek (persisted) bir team_members satirina sahip degilse
 * (manuel/Excel akislarindaki gecici kisiler) ilk ekleme aninda
 * ensureTeamMember ile ad'a gore bulunur/olusturulur - bkz. apiClient.js.
 * PersonMappingTable (Excel) VE MemberCard (manuel) TARAFINDAN ORTAK kullanilir.
 */
export default function LeaveDaysField({ teamId, fullName, role, onTotalChange, reportDate = null, periodEnd = null }) {
  const [open, setOpen] = useState(false);
  const [teamMemberId, setTeamMemberId] = useState(null);
  const [leaves, setLeaves] = useState(null); // null = henuz yuklenmedi
  const [companyLeaves, setCompanyLeaves] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualFraction, setManualFraction] = useState("1");
  const [openUp, setOpenUp] = useState(false);
  const boxRef = useRef(null);
  const popoverRef = useRef(null);
  // .pmrow/.bar (bu alanin bulundugu satir) "backdrop-filter" (frosted-glass
  // gorunum) tasidigi icin KENDI stacking context'ini olusturuyor (isolation
  // property'sinden BAGIMSIZ, sadece backdrop-filter varligi yeterli) - bu
  // yuzden popover satirin disina tassa bile, DOM'da SONRAKI satirlar kendi
  // context'lerini TEK PARCA halinde bunun UZERINE boyuyor, popover "aciliyor
  // ama hemen kayboluyor" gibi gorunuyordu (bkz. kullanici bildirimi - Excel
  // yukleme tablosunda alt satirlarin arkasinda kalıyordu). Kalici cozum:
  // popover'i document.body'ye PORTAL ile tasimak (satirin/backdrop-filter'in
  // stacking context'inden tamamen kacar) ve konumunu butonun ekran
  // koordinatlarina gore fixed olarak hesaplamak - TopBar.jsx'teki
  // settings-menu-panel'in ayni sebeple position:fixed kullanmasiyla ayni desen.
  const anchorRectRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const insideBox = boxRef.current && boxRef.current.contains(e.target);
      const insidePopover = popoverRef.current && popoverRef.current.contains(e.target);
      if (!insideBox && !insidePopover) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // "Önce ad soyad girin." hatasi, kullanici İzin Ekle'yi ad HENUZ bosken
  // actiginda (ensureMemberId) gosteriliyor. Isim SONRADAN yazildiginda bu
  // eski hata KENDILIGINDEN kalkmiyordu - kullanici bildirimi 2026-08-20:
  // "izin eklemede de ... isim girdim halde lütfen ad soyad giriniz diyor"
  // (useManualDashboard.js'teki AYNI sinif hatanin - "En az bir isim
  // girmelisiniz" - AYNI cozumu: gecerli hale gelince otomatik temizle).
  useEffect(() => {
    if (fullName?.trim() && error === "Önce ad soyad girin.") setError(null);
  }, [fullName, error]);

  // Her yeni acilista asagi-varsayimiyla basla; asil tasma kontrolu asagidaki
  // efekt icerigi (loading/leaves/companyLeaves) render edildikce yapilir.
  useEffect(() => {
    if (open) setOpenUp(false);
  }, [open]);

  useEffect(() => {
    if (!open || !popoverRef.current || !anchorRectRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const overflowsBottom = rect.bottom > window.innerHeight - 8;
    const fitsAbove = anchorRectRef.current.top - rect.height - 6 > 8;
    setOpenUp(overflowsBottom && fitsAbove);
  }, [open, loading, leaves, companyLeaves]);

  // SADECE rapor tarihinden SONRAYA dusen izin gunleri kapasiteden dusulur -
  // gecmis izinler zaten "Geçen İş Günü" icinde sayiliyor (bkz. leaveDays.js
  // sumFractionsInWindow ve kullanici bildirimi 2026-08-20: izin gunu gectikten
  // sonra kisi eski kapasite seviyesine geri donmeli).
  const total = leaves ? sumFractionsInWindow(leaves, reportDate, periodEnd) : 0;

  useEffect(() => {
    onTotalChange?.(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Sirket takvimi (companyLeaves) ad soyad'dan BAGIMSIZ, tum takim icin
  // ortak bir liste - ad henuz girilmemis olsa BILE otomatik yuklenmeli
  // (bkz. kullanici bildirimi: manuel girişte ad yazilmadan takvim ac
  // ilinca "Şirket Takviminden Ekle" bolumu hic gorunmuyordu). Kisiye ozel
  // izin gunleri (leaves) ise ancak ad girildiginde/team member
  // olusturulabildiginde yuklenebilir.
  const ensureLoaded = async () => {
    const needCompany = companyLeaves === null;
    const needMemberLeaves = leaves === null && teamId && fullName?.trim();
    if (!needCompany && !needMemberLeaves) return;
    setLoading(true);
    setError(null);
    try {
      if (needCompany) {
        const company = await fetchCompanyWideLeaves();
        setCompanyLeaves(company.filter((c) => c.type === "SIRKET_TATILI"));
      }
      if (needMemberLeaves) {
        const member = await ensureTeamMember(teamId, fullName, role);
        setTeamMemberId(member.id);
        const memberLeaves = await fetchMemberLeaves(member.id);
        setLeaves(memberLeaves);
      }
    } catch (err) {
      setError(err?.message || "İzin bilgisi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!open && boxRef.current) {
      anchorRectRef.current = boxRef.current.getBoundingClientRect();
    }
    setOpen((o) => !o);
    if (!open) await ensureLoaded();
  };

  const reload = async (id) => {
    const memberId = id || teamMemberId;
    if (!memberId) return;
    const memberLeaves = await fetchMemberLeaves(memberId);
    setLeaves(memberLeaves);
  };

  // Takvimden/elle ekleme aninda henuz teamMemberId yoksa (ad soyad,
  // "İzin Ekle" acildiktan SONRA girildiyse) burada lazy olarak olusturulur.
  const ensureMemberId = async () => {
    if (teamMemberId) return teamMemberId;
    if (!teamId || !fullName?.trim()) {
      setError("Önce ad soyad girin.");
      return null;
    }
    const member = await ensureTeamMember(teamId, fullName, role);
    setTeamMemberId(member.id);
    return member.id;
  };

  const addFromCompany = async (c) => {
    setLoading(true);
    setError(null);
    try {
      const memberId = await ensureMemberId();
      if (!memberId) return;
      await createLeavePeriod({
        name: c.name, type: "YILLIK_IZIN", scope: "TEAM_MEMBER", teamMemberId: memberId,
        startDate: c.startDate, endDate: c.endDate, dayFraction: c.dayFraction,
        description: "Şirket takviminden eklendi",
      });
      await reload(memberId);
    } catch (err) {
      setError(err?.message || "Eklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const addManual = async () => {
    if (!manualStart || !manualEnd) return;
    setLoading(true);
    setError(null);
    try {
      const memberId = await ensureMemberId();
      if (!memberId) return;
      await createLeavePeriod({
        name: manualName.trim() || "Yıllık izin", type: "YILLIK_IZIN", scope: "TEAM_MEMBER", teamMemberId: memberId,
        startDate: manualStart, endDate: manualEnd, dayFraction: Number(manualFraction) || 1,
        description: null,
      });
      setManualName("");
      setManualStart("");
      setManualEnd("");
      setManualFraction("1");
      await reload(memberId);
    } catch (err) {
      setError(err?.message || "Eklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);
    try {
      await deleteLeavePeriod(id);
      await reload();
    } catch (err) {
      setError(err?.message || "Silinemedi.");
    } finally {
      setLoading(false);
    }
  };

  const addedCompanyIds = new Set((leaves || []).map((l) => `${l.startDate}_${l.endDate}`));

  return (
    <div className="leave-days-field" ref={boxRef}>
      <button type="button" className="leave-days-btn" onClick={handleOpen} title="İzin günlerini yönet">
        📅 İzin{total > 0 ? `: ${total}g` : " Ekle"}
      </button>
      {open && anchorRectRef.current && createPortal(
        <div
          className="leave-days-popover"
          ref={popoverRef}
          style={{
            position: "fixed",
            right: Math.max(8, window.innerWidth - anchorRectRef.current.right),
            top: openUp ? "auto" : anchorRectRef.current.bottom + 6,
            bottom: openUp ? window.innerHeight - anchorRectRef.current.top + 6 : "auto",
          }}
        >
          <div className="leave-days-popover-title">İzin Günleri — {fullName || "—"}</div>
          {loading && <div className="mhint">Yükleniyor…</div>}
          {error && <div className="login-error" style={{ margin: "4px 0" }}>{error}</div>}

          {leaves && leaves.length > 0 && (
            <div className="leave-days-list">
              {leaves.map((l) => (
                <div className="leave-days-row" key={l.id}>
                  <span className="leave-days-row-name" title={l.name}>{l.name}</span>
                  <span className="leave-days-row-range">{formatRange(l)}</span>
                  <span className="leave-days-row-fraction">{periodDays(l)}g</span>
                  <button type="button" className="leave-days-row-del" onClick={() => remove(l.id)} title="Sil">×</button>
                </div>
              ))}
            </div>
          )}

          {companyLeaves && companyLeaves.length > 0 && (
            <>
              <div className="leave-days-popover-subtitle">Şirket Takviminden Ekle</div>
              <div className="leave-days-calendar-list">
                {companyLeaves.map((c) => {
                  const added = addedCompanyIds.has(`${c.startDate}_${c.endDate}`);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={`leave-days-calendar-item${added ? " added" : ""}`}
                      disabled={added}
                      onClick={() => addFromCompany(c)}
                    >
                      <span>{c.name}</span>
                      <span className="leave-days-calendar-item-meta">{formatRange(c)} · {periodDays(c)}g</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="leave-days-popover-subtitle">Elle Ekle</div>
          <div className="leave-days-manual-form">
            <input placeholder="Açıklama (ops.)" value={manualName} onChange={(e) => setManualName(e.target.value)} />
            <div className="leave-days-manual-dates">
              <input type="date" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
              <input type="date" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
              <select value={manualFraction} onChange={(e) => setManualFraction(e.target.value)}>
                <option value="1">Tam gün</option>
                <option value="0.5">Yarım gün</option>
              </select>
            </div>
            <button type="button" className="addbar" onClick={addManual} disabled={!manualStart || !manualEnd}>
              + Ekle
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
