import type { TendenciasData, SupportType, SheetData, WeeklyPoint, MonthlyPoint } from '@/hooks/useTendenciasData';
import { SUPPORT_TYPES } from '@/hooks/useTendenciasData';
import type { KPI } from '@/lib/analytics';

// === CHART DATA TYPES ===

export interface LocationChartPoint {
  name: string;
  value: number;
}

export interface CategoryChartPoint {
  name: string;
  value: number;
}

export interface MonthlyComparisonPoint {
  mes: string;
  '2024': number | null;
  '2025': number;
  '2026': number;
}

// === KPIs ===

export function calculateTendenciasKPIs(
  data: TendenciasData,
  selectedType: SupportType | 'Todos',
  selectedWeek: number
): KPI[] {
  const sheets = selectedType === 'Todos' ? SUPPORT_TYPES : [selectedType];

  let total2026 = 0;
  let total2025 = 0;
  let topLocation = { name: '-', value: 0 };
  let topCategory = { name: '-', value: 0 };

  for (const type of sheets) {
    const sheet = data.sheets[type];
    const wp = sheet.weeklyTotals[selectedWeek - 1];
    if (wp) {
      total2026 += wp.value2026;
      total2025 += wp.value2025;
    }

    // Top location for this week
    for (const loc of sheet.locations) {
      const val = loc.weeklyValues[selectedWeek - 1] || 0;
      if (val > topLocation.value) {
        topLocation = { name: loc.name, value: val };
      }
    }

    // Top category for this week
    for (const cat of sheet.categories) {
      const val = cat.weeklyValues[selectedWeek - 1] || 0;
      if (val > topCategory.value) {
        topCategory = { name: cat.resolution || cat.group, value: val };
      }
    }
  }

  const diff = total2026 - total2025;
  const porcent = total2025 > 0 ? (diff / total2025) * 100 : 0;

  return [
    {
      label: 'Total Semana',
      value: total2026,
      change: porcent,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      subtitle: `Semana ${selectedWeek}`,
    },
    {
      label: 'vs 2025',
      value: total2025,
      change: porcent,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      subtitle: `Dif: ${diff > 0 ? '+' : ''}${diff}`,
    },
    {
      label: 'Top Ubicación',
      value: topLocation.value,
      change: 0,
      trend: 'neutral',
      subtitle: topLocation.name,
    },
    {
      label: 'Top Categoría',
      value: topCategory.value,
      change: 0,
      trend: 'neutral',
      subtitle: topCategory.name,
    },
  ];
}

// === WEEKLY EVOLUTION ===

export function getWeeklyEvolution(
  data: TendenciasData,
  selectedType: SupportType | 'Todos'
): WeeklyPoint[] {
  const sheets = selectedType === 'Todos' ? SUPPORT_TYPES : [selectedType];

  // Get max weeks from any sheet
  const maxWeeks = Math.max(...SUPPORT_TYPES.map(t => data.sheets[t].weeklyTotals.length));
  const result: WeeklyPoint[] = [];

  for (let i = 0; i < maxWeeks; i++) {
    let v2026 = 0;
    let v2025 = 0;
    for (const type of sheets) {
      const wp = data.sheets[type].weeklyTotals[i];
      if (wp) {
        v2026 += wp.value2026;
        v2025 += wp.value2025;
      }
    }
    result.push({ week: i + 1, value2026: v2026, value2025: v2025 });
  }

  return result;
}

// === LOCATION BREAKDOWN ===

export function getLocationBreakdown(
  data: TendenciasData,
  selectedType: SupportType | 'Todos',
  week: number
): LocationChartPoint[] {
  const sheets = selectedType === 'Todos' ? SUPPORT_TYPES : [selectedType];
  const locMap = new Map<string, number>();

  for (const type of sheets) {
    for (const loc of data.sheets[type].locations) {
      const val = loc.weeklyValues[week - 1] || 0;
      locMap.set(loc.name, (locMap.get(loc.name) || 0) + val);
    }
  }

  return Array.from(locMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
}

// === CATEGORY BREAKDOWN ===

export function getCategoryBreakdown(
  data: TendenciasData,
  selectedType: SupportType | 'Todos',
  week: number
): CategoryChartPoint[] {
  const sheets = selectedType === 'Todos' ? SUPPORT_TYPES : [selectedType];
  const catMap = new Map<string, number>();

  for (const type of sheets) {
    for (const cat of data.sheets[type].categories) {
      const val = cat.weeklyValues[week - 1] || 0;
      if (val > 0) {
        const key = cat.resolution || cat.group;
        catMap.set(key, (catMap.get(key) || 0) + val);
      }
    }
  }

  return Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// === MONTHLY COMPARISON ===

export function getMonthlyComparison(
  data: TendenciasData,
  selectedType: SupportType | 'Todos'
): MonthlyComparisonPoint[] {
  const sheets = selectedType === 'Todos' ? SUPPORT_TYPES : [selectedType];
  const result: MonthlyComparisonPoint[] = [];

  for (let i = 0; i < 12; i++) {
    let v2024 = 0;
    let v2025 = 0;
    let v2026 = 0;
    let has2024Value = false;
    for (const type of sheets) {
      const mp = data.sheets[type].monthly[i];
      if (mp) {
        if (mp.value2024 !== null) {
          v2024 += mp.value2024;
          has2024Value = true;
        }
        v2025 += mp.value2025;
        v2026 += mp.value2026;
      }
    }
    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    result.push({ mes: MESES[i], '2024': has2024Value ? v2024 : null, '2025': v2025, '2026': v2026 });
  }

  return result;
}

// === SPEECH GENERATOR ===

function getSheetWeekData(sheet: SheetData, week: number) {
  const wp = sheet.weeklyTotals[week - 1];
  const total = wp?.value2026 || 0;
  const pasado = wp?.value2025 || 0;
  const diff = total - pasado;
  const porc = pasado > 0 ? (diff / pasado) * 100 : 0;

  const locs = sheet.locations
    .map(l => ({ name: l.name, value: l.weeklyValues[week - 1] || 0 }))
    .filter(l => l.value > 0)
    .sort((a, b) => b.value - a.value);

  const cats = sheet.categories
    .map(c => ({ name: c.resolution || c.group, value: c.weeklyValues[week - 1] || 0 }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  return { total, pasado, diff, porc, locs, cats };
}

function diffText(diff: number): string {
  return `${Math.abs(diff)} ${diff < 0 ? 'menos' : 'más'}`;
}

export function generateWeeklySpeech(
  data: TendenciasData,
  week: number,
  format: 'Sergio' | 'Carlos'
): string {
  const sections: string[] = [];

  // 1. REMOTOS
  const rem = getSheetWeekData(data.sheets.Remotos, week);
  if (rem.total > 0) {
    const errores = rem.cats.find(c => c.name === 'ERRORES')?.value || 0;
    const conexion = rem.cats.find(c => c.name === 'CONEXION')?.value || 0;
    const operativa = rem.cats.find(c => c.name === 'OPERATIVA')?.value || 0;

    if (format === 'Sergio') {
      sections.push(
        `Comenzamos con soporte remoto. Se han resuelto ${errores} incidencias en remoto, ` +
        `gestionado ${conexion} conexiones y se ha guiado al usuario en ${operativa} ocasiones. ` +
        `Dando un total de ${rem.total} soportes remotos. ` +
        `Son ${diffText(rem.diff)} que la misma semana del año pasado.`
      );
    } else {
      sections.push(
        `Comenzamos con el soporte remoto que realizan los dispatchers.\n` +
        `En la semana pasada se han realizado ${rem.total} soportes en total\n` +
        `de los cuales se han resuelto ${errores} incidencias en remoto,\n` +
        `gestionado ${conexion} conexiones de salas y ${operativa} asistencias guiando al usuario.\n` +
        `Son ${diffText(rem.diff)} que la misma semana del año pasado.`
      );
    }
  }

  // 2. PROGRAMADOS
  const prog = getSheetWeekData(data.sheets.Programados, week);
  if (prog.total > 0) {
    const locsText = prog.locs.map(l => `${l.value} en ${l.name}`).join(', ');
    const top2 = prog.cats.slice(0, 2);
    const tiposText = top2.length >= 2
      ? `${top2[0].value} en ${top2[0].name.toLowerCase()} y ${top2[1].value} en ${top2[1].name.toLowerCase()}`
      : top2.length === 1 ? `${top2[0].value} en ${top2[0].name.toLowerCase()}` : '';

    if (format === 'Sergio') {
      sections.push(
        `En Soporte programados, ${locsText}, sumando ${prog.total}. ` +
        `Son ${diffText(prog.diff)} que el año pasado (${prog.pasado}), ` +
        `lo que supone un ${Math.abs(prog.porc).toFixed(1)}% ${prog.diff < 0 ? 'menos' : 'más'}.\n\n` +
        `Dentro del tipo de resolución: ${tiposText}.`
      );
    } else {
      const locsCarlos = prog.locs.map(l => `\n${l.value} en ${l.name}`).join('');
      const catsCarlos = prog.cats.slice(0, 3).map(c => `\n${c.value} ${c.name.toUpperCase()}`).join('');
      sections.push(
        `Pasamos a los soportes programados, se han dado ${prog.total} soportes en salas VIP y a usuarios críticos ` +
        `lo que significa ${diffText(prog.diff)} que la misma semana del año anterior, ` +
        `de los cuales por ubicación observamos que ${locsText}.\n\n` +
        `De estos soportes programados, destacan las siguientes categorías:${catsCarlos}`
      );
    }
  }

  // 3. PRESENCIALES
  const pres = getSheetWeekData(data.sheets.Presenciales, week);
  if (pres.total > 0) {
    const locsText = pres.locs.map(l => `${l.value} en ${l.name}`).join(', ');
    const top2 = pres.cats.slice(0, 2);
    const tiposText = top2.length >= 2
      ? `Ha habido ${top2[0].value} ${top2[0].name.toLowerCase()} y ${top2[1].value} ${top2[1].name.toLowerCase()}`
      : top2.length === 1 ? `Ha habido ${top2[0].value} ${top2[0].name.toLowerCase()}` : '';

    if (format === 'Sergio') {
      sections.push(
        `Para los soportes presenciales de la semana, el equipo ha intervenido en: ${locsText}. ` +
        `Esto hace un total de ${pres.total} intervenciones. ` +
        `Son ${diffText(pres.diff)} que el año pasado, ` +
        `lo que supone un ${Math.abs(pres.porc).toFixed(2)}% ${pres.diff < 0 ? 'menos' : 'más'}.\n\n` +
        `Dentro del tipo de resolución: ${tiposText}.`
      );
    } else {
      const locsCarlos = pres.locs.map(l => `\n${l.value} en ${l.name}`).join('');
      const catsCarlos = pres.cats.slice(0, 3).map(c => `\n${c.value} ${c.name.toUpperCase()}`).join('');
      sections.push(
        `En cuanto a los trabajos y soportes presenciales, en la semana pasada se han realizado ${pres.total}. ` +
        `Son ${diffText(pres.diff)} que la misma semana del año anterior.\n` +
        `Donde destacamos por ubicación:${locsCarlos}\n\n` +
        `De estos soportes presenciales los más relevantes por categoría son:${catsCarlos}`
      );
    }
  }

  // 4. INCIDENCIAS
  const inc = getSheetWeekData(data.sheets.Incidencias, week);
  if (inc.total > 0) {
    const locsText = inc.locs.map(l => `${l.value} en ${l.name}`).join(', ');
    const top2 = inc.cats.slice(0, 2);
    const tiposText = top2.length >= 2
      ? `Ha habido ${top2[0].value} ${top2[0].name.toLowerCase()} y ${top2[1].value} ${top2[1].name.toLowerCase()}`
      : top2.length === 1 ? `Ha habido ${top2[0].value} ${top2[0].name.toLowerCase()}` : '';
    const compText = inc.diff < 0
      ? `${Math.abs(inc.diff)} menos que el año pasado (${inc.pasado}), lo que ha supuesto una reducción de incidencias en un ${Math.abs(inc.porc).toFixed(0)}%.`
      : `${Math.abs(inc.diff)} más que el año pasado (${inc.pasado}), lo que supone un aumento del ${Math.abs(inc.porc).toFixed(0)}%.`;

    if (format === 'Sergio') {
      sections.push(
        `Incidencias, ${locsText}, ${inc.total} en total. Son ${compText}\n\n` +
        `Dentro del tipo de resolución: ${tiposText}.`
      );
    } else {
      const locsCarlos = inc.locs.map(l => `\n${l.value} en ${l.name}`).join('');
      const catsCarlos = inc.cats.slice(0, 3).map(c => `\n${c.value} ${c.name.toUpperCase()}`).join('');
      sections.push(
        `En cuanto a las incidencias, se han registrado ${inc.total} en total. ` +
        `Son ${compText}\nPor ubicación:${locsCarlos}\n\n` +
        `Las categorías más relevantes son:${catsCarlos}`
      );
    }
  }

  // 5. CORRECTIVOS
  const cor = getSheetWeekData(data.sheets.Correctivos, week);
  if (cor.total > 0) {
    const locsText = cor.locs.map(l => `${l.value} en ${l.name}`).join(', ');
    const top2 = cor.cats.slice(0, 2);
    const tiposText = top2.length >= 2
      ? `${top2[0].value} ${top2[0].name.toLowerCase()} y ${top2[1].value} ${top2[1].name.toLowerCase()}`
      : top2.length === 1 ? `${top2[0].value} ${top2[0].name.toLowerCase()}` : '';
    const compText = cor.diff < 0
      ? `${Math.abs(cor.diff)} menos que en el año pasado (${cor.pasado}). Siendo un descenso del ${Math.abs(cor.porc).toFixed(0)}%.`
      : `${Math.abs(cor.diff)} más que en el año pasado (${cor.pasado}). Siendo un aumento del ${Math.abs(cor.porc).toFixed(0)}%.`;

    if (format === 'Sergio') {
      sections.push(
        `Y finalizamos con los soportes correctivos. ${locsText}, sumando ${cor.total} soportes. ${compText}\n\n` +
        `Dentro del tipo de resolución, destacan: ${tiposText}.`
      );
    } else {
      const locsCarlos = cor.locs.map(l => `\n${l.value} en ${l.name}`).join('');
      const catsCarlos = cor.cats.slice(0, 3).map(c => `\n${c.value} ${c.name.toUpperCase()}`).join('');
      sections.push(
        `Finalizamos con los mantenimientos correctivos, se han realizado ${cor.total} soportes en total. ` +
        `Son ${compText}\nPor ubicación:${locsCarlos}\n\n` +
        `Las categorías más relevantes son:${catsCarlos}`
      );
    }
  }

  return sections.join('\n\n---\n\n');
}
