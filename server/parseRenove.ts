import * as XLSX from "xlsx";
import type { RenoveData, RenoveRecord, RenoveStatusGroup } from "../shared/renove.ts";

const DATA_SHEET_NAME = "Onboarding y averías";
const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const STATUS_GROUP_MAP: Record<string, RenoveStatusGroup> = {
  RENOVADO: "renovado",
  "NO RENOVAR": "rechazado",
  RECHAZADO: "rechazado",
  RENOVAR: "pendiente",
  INSTALADO: "pendiente",
  ENVIO: "pendiente",
  RECIBIDO: "pendiente",
  "PENDIENTE USUARIO": "pendiente",
  "USUARIO EN RENOVE": "pendiente",
  "PENDIENTE ENVIO": "pendiente",
  "REVISAR / REINSTALAR": "pendiente",
};

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeStatus(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function resolveStatusGroup(normalizedStatus: string): RenoveStatusGroup {
  if (STATUS_GROUP_MAP[normalizedStatus]) {
    return STATUS_GROUP_MAP[normalizedStatus];
  }

  if (normalizedStatus.includes("RENOVAD")) {
    return "renovado";
  }

  if (normalizedStatus.includes("RECHAZ") || normalizedStatus.includes("NO RENOV")) {
    return "rechazado";
  }

  return "pendiente";
}

function parseExcelDate(value: unknown): Date | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    const excelEpoch = Date.UTC(1899, 11, 30);
    const wholeDays = Math.trunc(value);
    const fractionalDay = value - wholeDays;
    const milliseconds = Math.round(fractionalDay * 86400000);

    return new Date(excelEpoch + wholeDays * 86400000 + milliseconds);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds()
      )
    );
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function getIsoWeekParts(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

  const year = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { week, year };
}

function compareNullableDates(a: string | null, b: string | null) {
  if (a && b) {
    return a.localeCompare(b);
  }

  if (a) {
    return -1;
  }

  if (b) {
    return 1;
  }

  return 0;
}

export function parseRenoveWorkbook(workbook: XLSX.WorkBook): RenoveData {
  const worksheet = workbook.Sheets[DATA_SHEET_NAME];

  if (!worksheet) {
    throw new Error(`No se encontró la hoja "${DATA_SHEET_NAME}" en el archivo`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: true,
  });

  const records: RenoveRecord[] = rows
    .map((row) => {
      const rawStatus = toText(row.ESTADO);

      if (!rawStatus) {
        return null;
      }

      const normalizedStatus = normalizeStatus(rawStatus);
      const location = toText(row["Ubicación"] ?? row.Ubicacion) || "Sin ubicación";
      const parsedDate = parseExcelDate(row.Fecha);
      const isoDate = parsedDate ? parsedDate.toISOString().slice(0, 10) : null;
      const weekParts = parsedDate ? getIsoWeekParts(parsedDate) : null;

      return {
        location,
        rawStatus,
        normalizedStatus,
        statusGroup: resolveStatusGroup(normalizedStatus),
        date: isoDate,
        year: parsedDate ? parsedDate.getUTCFullYear() : null,
        month: parsedDate ? parsedDate.getUTCMonth() + 1 : null,
        monthLabel: parsedDate
          ? `${MONTH_LABELS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCFullYear()}`
          : null,
        week: weekParts?.week ?? null,
        weekYear: weekParts?.year ?? null,
        weekLabel: weekParts ? `${weekParts.year}-S${String(weekParts.week).padStart(2, "0")}` : null,
      } satisfies RenoveRecord;
    })
    .filter((record): record is RenoveRecord => record !== null)
    .sort((a, b) => compareNullableDates(b.date, a.date) || a.location.localeCompare(b.location, "es"));

  const availableLocations = Array.from(new Set(records.map((record) => record.location))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const availableStatuses = Array.from(new Set(records.map((record) => record.rawStatus))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const datedRecords = records.filter((record) => record.date !== null);

  return {
    records,
    availableLocations,
    availableStatuses,
    minDate: datedRecords.length > 0 ? datedRecords[datedRecords.length - 1].date : null,
    maxDate: datedRecords.length > 0 ? datedRecords[0].date : null,
    summary: {
      total: records.length,
      renovado: records.filter((record) => record.statusGroup === "renovado").length,
      pendiente: records.filter((record) => record.statusGroup === "pendiente").length,
      rechazado: records.filter((record) => record.statusGroup === "rechazado").length,
      pendienteUsuario: records.filter((record) => record.normalizedStatus === "PENDIENTE USUARIO").length,
      undated: records.filter((record) => record.date === null).length,
    },
  };
}
