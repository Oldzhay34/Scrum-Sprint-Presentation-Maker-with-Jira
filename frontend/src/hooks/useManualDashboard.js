import { useMemo, useState } from "react";
import { computeStatelessDashboard } from "../lib/apiClient";
import { riskLevelToLabel } from "../lib/format";

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
export function useManualDashboard(fallbackTeamName) {
  const [team, setTeam] = useState("");
  const [sprintNo, setSprintNo] = useState("");
  const [period, setPeriod] = useState(defaultPeriod);
  const [previousSnapshotDate, setPreviousSnapshotDate] = useState("");
  const [maintenanceAllocationPercent, setMaintenanceAllocationPercent] = useState("0.2");

  const [members, setMembers] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const addStatus = () => setStatuses((prev) => [...prev, { code: "", label: "", countsAsCompleted: false }]);
  const updateStatus = (index, patch) => setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const removeStatus = (index) => setStatuses((prev) => prev.filter((_, i) => i !== index));

  const workItemsByMember = useMemo(() => {
    const map = {};
    workItems.forEach((wi) => {
      if (!map[wi.memberClientId]) map[wi.memberClientId] = [];
      map[wi.memberClientId].push(wi);
    });
    return map;
  }, [workItems]);

  const compute = async () => {
    setLoading(true);
    setError(null);
    try {
      if (members.length === 0) {
        throw { message: "En az bir ekip üyesi eklemelisiniz." };
      }
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
      setDashData(toDashData(result, team || fallbackTeamName, sprintNo, period, previousSnapshotDate));
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
    members, addMember, updateMember, removeMember,
    workItems, workItemsByMember, addWorkItem, updateWorkItem, removeWorkItem,
    statuses, addStatus, updateStatus, removeStatus,
    dashData, loading, error, compute,
  };
}

/** Backend'in CapacityDashboardDto'sunu DashboardSlideCanvas'ın beklediği dashData şekline çevirir. */
function toDashData(dto, team, sprintNo, period, previousSnapshotDate) {
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
    })),
    delta: previousSnapshotDate
      ? { kapanan: dto.periodClosedEffort, eklenen: dto.newlyAddedEffort, fte: "", net: dto.netChange, range: `${formatTr(previousSnapshotDate)} – ${formatTr(period.reportDate)}` }
      : null,
  };
}

function formatTr(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}
