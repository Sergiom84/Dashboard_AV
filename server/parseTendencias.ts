import * as XLSX from 'xlsx';

// === TYPES ===

export type SupportType = 'Remotos' | 'Programados' | 'Presenciales' | 'Incidencias' | 'Correctivos';

export const SUPPORT_TYPES: SupportType[] = ['Remotos', 'Programados', 'Presenciales', 'Incidencias', 'Correctivos'];

export interface WeeklyPoint {
  week: number;
  value2026: number;
  value2025: number;
}

export interface LocationData {
  name: string;
  weeklyValues: number[];
  ytd: number;
}

export interface CategoryData {
  group: string;
  resolution: string;
  weeklyValues: number[];
}

export interface MonthlyPoint {
  month: number;
  monthName: string;
  value2026: number;
  value2025: number;
  value2024: number | null;
}

export interface SheetData {
  sheetType: SupportType;
  weeklyTotals: WeeklyPoint[];
  locations: LocationData[];
  categories: CategoryData[];
  monthly: MonthlyPoint[];
  hasMonthly2024Data: boolean;
  latestWeek: number;
}

export interface TendenciasData {
  sheets: Record<SupportType, SheetData>;
  latestWeek: number;
  hasMonthly2024Data: boolean;
}

// === SHEET CONFIG ===

interface SheetConfig {
  sheetName: string;
  categoriesRowStart: number;
  categoriesRowEnd: number;
  weekly2026Row: number;
  weekly2025Row: number;
  locationsRowStart: number | null;
  locationsRowEnd: number | null;
  monthlyRowStart: number;
  monthlyRowEnd: number;
  monthly2026Col: number;
  monthly2025Col: number;
  monthly2024RowStart: number | null;
  monthly2024RowEnd: number | null;
  monthly2024Col: number | null;
}

const SHEET_CONFIGS: Record<SupportType, SheetConfig> = {
  Remotos: {
    sheetName: 'Remotos',
    categoriesRowStart: 13, categoriesRowEnd: 17,
    weekly2026Row: 6, weekly2025Row: 9,
    locationsRowStart: null, locationsRowEnd: null,
    monthlyRowStart: 21, monthlyRowEnd: 32,
    monthly2026Col: 2,
    monthly2025Col: 24,
    monthly2024RowStart: null, monthly2024RowEnd: null, monthly2024Col: null,
  },
  Programados: {
    sheetName: 'Programados',
    categoriesRowStart: 5, categoriesRowEnd: 12,
    weekly2026Row: 20, weekly2025Row: 23,
    locationsRowStart: 27, locationsRowEnd: 32,
    monthlyRowStart: 36, monthlyRowEnd: 47,
    monthly2026Col: 2,
    monthly2025Col: 17,
    monthly2024RowStart: 50, monthly2024RowEnd: 61,
    monthly2024Col: 17,
  },
  Presenciales: {
    sheetName: 'Presenciales',
    categoriesRowStart: 5, categoriesRowEnd: 14,
    weekly2026Row: 22, weekly2025Row: 25,
    locationsRowStart: 29, locationsRowEnd: 34,
    monthlyRowStart: 37, monthlyRowEnd: 48,
    monthly2026Col: 2,
    monthly2025Col: 16,
    monthly2024RowStart: 51, monthly2024RowEnd: 62,
    monthly2024Col: 16,
  },
  Incidencias: {
    sheetName: 'Incidencias',
    categoriesRowStart: 5, categoriesRowEnd: 33,
    weekly2026Row: 42, weekly2025Row: 45,
    locationsRowStart: 49, locationsRowEnd: 54,
    monthlyRowStart: 58, monthlyRowEnd: 69,
    monthly2026Col: 2,
    monthly2025Col: 16,
    monthly2024RowStart: 72, monthly2024RowEnd: 83,
    monthly2024Col: 16,
  },
  Correctivos: {
    sheetName: 'Correctivos',
    categoriesRowStart: 5, categoriesRowEnd: 30,
    weekly2026Row: 38, weekly2025Row: 41,
    locationsRowStart: 45, locationsRowEnd: 50,
    monthlyRowStart: 54, monthlyRowEnd: 65,
    monthly2026Col: 2,
    monthly2025Col: 16,
    monthly2024RowStart: 69, monthly2024RowEnd: 80,
    monthly2024Col: 16,
  },
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// === CELL ACCESS HELPERS ===

function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): number {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const cell = sheet[addr];
  if (!cell) return 0;
  if (typeof cell.v === 'number') return cell.v;
  const parsed = parseFloat(String(cell.v));
  return isNaN(parsed) ? 0 : parsed;
}

function getCellString(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const cell = sheet[addr];
  if (!cell) return '';
  return String(cell.v || '').trim();
}

function getRowValues(sheet: XLSX.WorkSheet, row: number, colStart: number, colEnd: number): number[] {
  const values: number[] = [];
  for (let c = colStart; c <= colEnd; c++) {
    values.push(getCellValue(sheet, row, c));
  }
  return values;
}

// === PARSING ===

function detectLatestWeek(sheet: XLSX.WorkSheet, row: number, colStart: number, colEnd: number): number {
  for (let c = Math.min(colEnd, 55); c >= colStart; c--) {
    const val = getCellValue(sheet, row, c);
    if (val > 0) return c - colStart + 1;
  }
  return 1;
}

function parseSheet(workbook: XLSX.WorkBook, type: SupportType): SheetData {
  const config = SHEET_CONFIGS[type];
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) throw new Error(`No se encontró la hoja "${config.sheetName}"`);

  const headerRow = config.weekly2026Row - 1;
  let weekColStart = 0;
  let weekColEnd = 0;

  for (let c = 2; c <= 55; c++) {
    const val = getCellValue(sheet, headerRow, c);
    if (val === 1) { weekColStart = c; break; }
  }
  for (let c = Math.min(55, weekColStart + 51); c >= weekColStart; c--) {
    const val = getCellValue(sheet, headerRow, c);
    if (val > 0) { weekColEnd = c; break; }
  }

  if (weekColStart === 0) {
    weekColStart = 4;
    weekColEnd = 55;
  }

  // Weekly totals
  const values2026 = getRowValues(sheet, config.weekly2026Row, weekColStart, weekColEnd);
  const values2025 = getRowValues(sheet, config.weekly2025Row, weekColStart, weekColEnd);

  const weeklyTotals: WeeklyPoint[] = [];
  for (let i = 0; i < values2026.length; i++) {
    weeklyTotals.push({
      week: i + 1,
      value2026: values2026[i],
      value2025: values2025[i],
    });
  }

  const latestWeek = detectLatestWeek(sheet, config.weekly2026Row, weekColStart, weekColEnd);

  // Locations
  const locations: LocationData[] = [];
  if (config.locationsRowStart !== null && config.locationsRowEnd !== null) {
    for (let r = config.locationsRowStart; r <= config.locationsRowEnd; r++) {
      const name = getCellString(sheet, r, 3);
      if (!name) continue;
      const weeklyVals = getRowValues(sheet, r, weekColStart, weekColEnd);
      const ytd = weeklyVals.reduce((a, b) => a + b, 0);
      locations.push({ name, weeklyValues: weeklyVals, ytd });
    }
  }

  // Categories
  const categories: CategoryData[] = [];
  for (let r = config.categoriesRowStart; r <= config.categoriesRowEnd; r++) {
    const group = getCellString(sheet, r, 2);
    const resolution = getCellString(sheet, r, 3);
    if (!group && !resolution) continue;
    if (group === 'TOTAL' || resolution === 'TOTAL') continue;
    const weeklyVals = getRowValues(sheet, r, weekColStart, weekColEnd);
    const hasData = weeklyVals.some(v => v > 0);
    if (!hasData) continue;
    categories.push({
      group: group || '',
      resolution: resolution || group || '',
      weeklyValues: weeklyVals,
    });
  }

  // Monthly data
  let monthly2024Values: number[] = [];
  if (config.monthly2024RowStart !== null && config.monthly2024Col !== null) {
    monthly2024Values = Array.from({ length: 12 }, (_, i) =>
      getCellValue(sheet, config.monthly2024RowStart! + i, config.monthly2024Col!)
    );
  }
  const hasMonthly2024Data = monthly2024Values.some((v) => v > 0);

  const monthly: MonthlyPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const row2026 = config.monthlyRowStart + i;
    const val2026 = getCellValue(sheet, row2026, config.monthly2026Col);
    const val2025 = getCellValue(sheet, row2026, config.monthly2025Col);
    const val2024 = hasMonthly2024Data ? (monthly2024Values[i] || 0) : null;
    monthly.push({
      month: i + 1,
      monthName: MONTH_NAMES[i],
      value2026: val2026,
      value2025: val2025,
      value2024: val2024,
    });
  }

  return {
    sheetType: type,
    weeklyTotals,
    locations,
    categories,
    monthly,
    hasMonthly2024Data,
    latestWeek,
  };
}

export function parseTendenciasWorkbook(workbook: XLSX.WorkBook): TendenciasData {
  const sheets: Partial<Record<SupportType, SheetData>> = {};
  let maxLatestWeek = 1;
  let hasMonthly2024Data = false;

  for (const type of SUPPORT_TYPES) {
    const sheetData = parseSheet(workbook, type);
    sheets[type] = sheetData;
    if (sheetData.hasMonthly2024Data) {
      hasMonthly2024Data = true;
    }
    if (sheetData.latestWeek > maxLatestWeek) {
      maxLatestWeek = sheetData.latestWeek;
    }
  }

  return {
    sheets: sheets as Record<SupportType, SheetData>,
    latestWeek: maxLatestWeek,
    hasMonthly2024Data,
  };
}
