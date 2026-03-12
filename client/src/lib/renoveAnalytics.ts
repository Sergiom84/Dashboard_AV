import type { RenoveRecord, RenoveSummary, RenoveStatusView } from "@shared/renove";

export interface RenoveChartPoint {
  label: string;
  total: number;
  sortKey: number;
}

export function formatLocationLabel(location: string) {
  if (location === "SEDE Principal") {
    return "Sede Principal";
  }

  return location;
}

export function matchesRenoveView(record: RenoveRecord, selectedView: RenoveStatusView) {
  return selectedView === "total" || record.statusGroup === selectedView;
}

export function matchesRenoveDateRange(record: RenoveRecord, startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return true;
  }

  if (!record.date) {
    return true;
  }

  if (startDate && record.date < startDate) {
    return false;
  }

  if (endDate && record.date > endDate) {
    return false;
  }

  return true;
}

export function matchesRenoveDatedRange(record: RenoveRecord, startDate: string, endDate: string) {
  if (!record.date) {
    return false;
  }

  if (startDate && record.date < startDate) {
    return false;
  }

  if (endDate && record.date > endDate) {
    return false;
  }

  return true;
}

export function summarizeRenoveRecords(records: RenoveRecord[]): RenoveSummary {
  return {
    total: records.length,
    renovado: records.filter((record) => record.statusGroup === "renovado").length,
    pendiente: records.filter((record) => record.statusGroup === "pendiente").length,
    rechazado: records.filter((record) => record.statusGroup === "rechazado").length,
    pendienteUsuario: records.filter((record) => record.normalizedStatus === "PENDIENTE USUARIO").length,
    undated: records.filter((record) => record.date === null).length,
  };
}

function matchesSeriesView(record: RenoveRecord, selectedView: RenoveStatusView) {
  return selectedView === "total" || record.statusGroup === selectedView;
}

export function buildWeeklyStatusSeries(
  records: RenoveRecord[],
  selectedView: RenoveStatusView,
  startDate: string,
  endDate: string
) {
  const grouped = new Map<string, RenoveChartPoint>();

  records
    .filter(
      (record) => matchesSeriesView(record, selectedView) && matchesRenoveDatedRange(record, startDate, endDate)
    )
    .forEach((record) => {
      if (!record.weekLabel || record.weekYear === null || record.week === null) {
        return;
      }

      const existing = grouped.get(record.weekLabel);

      if (existing) {
        existing.total += 1;
        return;
      }

      grouped.set(record.weekLabel, {
        label: record.weekLabel,
        total: 1,
        sortKey: record.weekYear * 100 + record.week,
      });
    });

  return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function buildMonthlyStatusSeries(
  records: RenoveRecord[],
  selectedView: RenoveStatusView,
  startDate: string,
  endDate: string
) {
  const grouped = new Map<string, RenoveChartPoint>();

  records
    .filter(
      (record) => matchesSeriesView(record, selectedView) && matchesRenoveDatedRange(record, startDate, endDate)
    )
    .forEach((record) => {
      if (!record.monthLabel || record.year === null || record.month === null) {
        return;
      }

      const existing = grouped.get(record.monthLabel);

      if (existing) {
        existing.total += 1;
        return;
      }

      grouped.set(record.monthLabel, {
        label: record.monthLabel,
        total: 1,
        sortKey: record.year * 100 + record.month,
      });
    });

  return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function getRenoveViewLabel(selectedView: RenoveStatusView) {
  switch (selectedView) {
    case "renovado":
      return "Renovados";
    case "pendiente":
      return "Pendientes";
    case "rechazado":
      return "Rechazados";
    default:
      return "Total";
  }
}

export function formatRenoveDate(date: string | null) {
  if (!date) {
    return "Sin fecha";
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatUploadedAt(uploadedAt?: string) {
  if (!uploadedAt) {
    return "Sin registro";
  }

  const normalized = uploadedAt.includes("T")
    ? uploadedAt
    : `${uploadedAt.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return uploadedAt;
  }

  return parsed.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
