export type RenoveStatusView = "total" | "renovado" | "pendiente" | "rechazado";
export type RenoveStatusGroup = Exclude<RenoveStatusView, "total">;

export interface RenoveRecord {
  location: string;
  rawStatus: string;
  normalizedStatus: string;
  statusGroup: RenoveStatusGroup;
  date: string | null;
  year: number | null;
  month: number | null;
  monthLabel: string | null;
  week: number | null;
  weekYear: number | null;
  weekLabel: string | null;
}

export interface RenoveSummary {
  total: number;
  renovado: number;
  pendiente: number;
  rechazado: number;
  pendienteUsuario: number;
  undated: number;
}

export interface RenoveData {
  records: RenoveRecord[];
  availableLocations: string[];
  availableStatuses: string[];
  minDate: string | null;
  maxDate: string | null;
  summary: RenoveSummary;
  uploadedAt?: string;
}
