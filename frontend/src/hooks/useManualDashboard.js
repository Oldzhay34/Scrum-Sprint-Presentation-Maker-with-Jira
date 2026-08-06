import { useMemo, useState } from "react";
import { computeStatelessDashboard } from "../lib/apiClient";
import { riskLevelToLabel } from "../lib/format";
import { validateDateOrder } from "../lib/dateValidation";
import { hasFteTracking } from "../lib/teamTypes";

let clientIdSeq = 1;
const nextClientId = () => clientIdSeq++;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriod() {
  const year = new Date().getFullYear();
  return { periodStart: `${year}-06-01`, periodEnd: `${year}-12-31`, reportDate: todayIso() };
}

const DEFAULT_STATUSES = [
  { code: "OPEN", label: "Açık", countsAsCompleted: false },
  { code: "DONE", label: "Tamamlandı", countsAsCompleted: true },
];

/**
 * Kapasite Dashboard'un "Manuel Gir" veri kaynagi: Excel yerine, ekip uyesi ve
 * is kalemi formlariyla girilen veriyi backend'in stateless
 * /api/capacity-dashboard/compute endpoint'ine gonderir. Hicbir sey kaydedilmez;
 * her hesaplama isteginde girilen veri oldugu gibi backend'e tasinir, sonuc aninda
 * doner. addedDate/closedDate girilirse Donem Kapanan/Yeni Eklenen/Net Degisim
 * backend tarafindan otomatik hesaplanir (elle girilmez).
 */
export function useManualDashboard(team, setTeam, sprintNo, setSprintNo, teamType) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [previousSnapshotDate, setPreviousSnapshotDate] = useState("");
  const [maintenanceAllocationPercent, setMaintenanceAllocationPercent] = useState("0.2");

  const [members, setMembers] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  // Takima ozgu, backend'in genel formulune girmeyen ek gostergeler (orn. RPA'da
  // "FTE Hedef", "Hedef Sürec Sayisi") - tamamen istemci tarafinda, sadece onizlemede
  // ekstra kart olarak gosterilir, hesaplamaya karismaz.
  const [customKpis, setCustomKpis] = useState([]);

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertTitle, setAlertTitle] = useState("Uyarı");

  const addMember = () =>
    setMembers((prev) => [...prev, { clientId: nextClientId(), fullName: "", role: "", startDate: period.periodStart, statusCode: "OPEN" }]);
  const updateMember = (clientId, patch) =>
    setMembers((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, ...patch } : m)));
  const removeMember = (clientId) => {
    setMembers((prev) => prev.filter((m) => m.clientId !== clientId));
    setWorkItems((prev) => prev.filter((wi) => wi.memberClientId !== clientId));
  };

  const addWorkItem = (memberClientId) =>
    setWorkItems((prev) => [...prev, { clientId: nextClientId(), memberClientId, title: "", plannedEffortDays: "", statusCode: "OPEN", addedDate: "", closedDate: "" }]);
  const updateWorkItem = (clientId, patch) =>
    setWorkItems((prev) => prev.map((wi) => (wi.clientId === clientId ? { ...wi, ...patch } : wi)));
  const removeWorkItem = (clientId) => setWorkItems((prev) => prev.filter((wi) => wi.clientId !== clientId));
  // Yeni bir Excel yuklendiginde daha once elle girilmis uye/is kalemi
  // verisini temizlemek icin - bkz. App.jsx handleExcelFile.
  const clearEntries = () => {
    setMembers([]);
    setWorkItems([]);
  };

  const addStatus = () => setStatuses((prev) => [...prev, { code: "", label: "", countsAsCompleted: false }]);
  const updateStatus = (index, patch) => setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const removeStatus = (index) => setStatuses((prev) => prev.filter((_, i) => i !== index));

  const addCustomKpi = () => setCustomKpis((prev) => [...prev, { label: "", value: "", unit: "" }]);
  const updateCustomKpi = (index, patch) => setCustomKpis((prev) => prev.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  const removeCustomKpi = (index) => setCustomKpis((prev) => prev.filter((_, i) => i !== index));

  const workItemsByMember = useMemo(() => {
    const map = {};
    workItems.forEach((wi) => {
      if (!map[wi.memberClientId]) map[wi.memberClientId] = [];
      map[wi.memberClientId].push(wi);
    });
    return map;
  }, [workItems]);

  const compute = async () => {
    const hasAnyName = members.some((m) => m.fullName.trim());
    if (members.length === 0 || !hasAnyName) {
      setAlertTitle("Eksik bilgi");
      setAlertMessage("En az bir isim girmelisiniz.");
      return;
    }
    const blankNameMember = members.find((m) => !m.fullName.trim());
    if (blankNameMember) {
      setAlertTitle("Eksik bilgi");
      setAlertMessage("İsim alanı boş bırakılamaz. Lütfen tüm ekip üyeleri için isim girin.");
      return;
    }

    const dateIssue = validateDateOrder({ periodStart: period.periodStart, periodEnd: period.periodEnd, members, workItems });
    if (dateIssue) {
      setAlertTitle("Tarih hatası");
      setAlertMessage(dateIssue);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = {
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        reportDate: period.reportDate,
        previousSnapshotDate: previousSnapshotDate || null,
        maintenanceAllocationPercent: Number(String(maintenanceAllocationPercent).replace(",", ".")) || 0,
        members: members.map((m) => ({
          clientId: m.clientId,
          fullName: m.fullName,
          role: m.role,
          startDate: m.startDate || null,
          statusCode: m.statusCode || null,
          targetWorkDays: m.targetWorkDays ? Number(m.targetWorkDays) : null,
          maintenanceAllocationPercent: m.maintenanceAllocationPercent
            ? Number(String(m.maintenanceAllocationPercent).replace(",", "."))
            : null,
        })),
        workItems: workItems
          .filter((wi) => wi.title.trim())
          .map((wi) => ({
            memberClientId: wi.memberClientId,
            title: wi.title,
            plannedEffortDays: Number(String(wi.plannedEffortDays).replace(",", ".")) || 0,
            statusCode: wi.statusCode || null,
            addedDate: wi.addedDate || null,
            closedDate: wi.closedDate || null,
          })),
        statuses: statuses.filter((s) => s.code.trim()),
      };

      const result = await computeStatelessDashboard(request);
      setDashData(toDashData(result, team, sprintNo, period, previousSnapshotDate, customKpis));
    } catch (err) {
      setError(err);
      setDashData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    team, setTeam, sprintNo, setSprintNo,
    period, setPeriod, previousSnapshotDate, setPreviousSnapshotDate,
    maintenanceAllocationPercent, setMaintenanceAllocationPercent,
    alertMessage, alertTitle, clearAlert: () => setAlertMessage(null),
    members, addMember, updateMember, removeMember,
    workItems, workItemsByMember, addWorkItem, updateWorkItem, removeWorkItem, clearEntries,
    statuses, addStatus, updateStatus, removeStatus,
    customKpis, addCustomKpi, updateCustomKpi, removeCustomKpi,
    dashData, loading, error, compute,
    hasFte: hasFteTracking(teamType),
  };
}

/** Backend'in CapacityDashboardDto'sunu DashboardSlideCanvas'ın beklediği dashData şekline çevirir. */
function toDashData(dto, team, sprintNo, period, previousSnapshotDate, customKpis = []) {
  const durum = riskLevelToLabel(dto.overallRiskLevel);
  return {
    team: team || "Ekip",
    sprintNo,
    dateRange: `${formatTr(period.periodStart)} – ${formatTr(period.periodEnd)}`,
    reportDate: formatTr(period.reportDate),
    kpis: {
      toplam: dto.totalPlannedEffort,
      tamamlanan: dto.completedEffort,
      acik: dto.remainingEffort,
      kapasite: dto.remainingCapacity,
      doluluk: (dto.maintainedOccupancyPercent || 0) / 100,
      acikFazla: dto.capacityGap,
      durum,
    },
    persons: (dto.memberMetrics || []).map((m) => ({
      name: m.fullName,
      role: m.role || "",
      initials: (m.fullName || "").slice(0, 2).toUpperCase(),
      toplam: m.totalPlannedEffort,
      tamamlanan: m.completedEffort,
      acik: m.remainingEffort,
      kapasite: m.rawRemainingCapacity,
      doluluk: (m.occupancyPercent || 0) / 100,
      durum: riskLevelToLabel(m.riskLevel),
      bakimOrani: m.maintenanceAllocationPercent,
    })),
    delta: previousSnapshotDate
      ? { kapanan: dto.periodClosedEffort, eklenen: dto.newlyAddedEffort, fte: "", net: dto.netChange, range: `${formatTr(previousSnapshotDate)} – ${formatTr(period.reportDate)}` }
      : null,
    customKpis: (customKpis || []).filter((k) => k.label.trim() && k.value !== ""),
  };
}

function formatTr(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}
