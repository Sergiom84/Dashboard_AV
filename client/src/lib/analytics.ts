import { SoporteData } from '@/hooks/useExcelData';

export interface KPI {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export interface TrendPoint {
  mes: string;
  mesNum: number;
  valor: number;
  promedio: number;
}

export interface PainPoint {
  tipo: string;
  totalSoportes: number;
  promedio: number;
  variancia: number;
  puntuacion: number;
}

export interface YearComparisonPoint {
  mes: string;
  mesNum: number;
  [year: string]: string | number; // dynamic year keys like "2023", "2024"
}

export interface MonthComparisonPoint {
  tipo: string;
  [monthKey: string]: string | number; // dynamic month keys
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Calcular KPIs principales con medias global y del año seleccionado
export function calculateKPIs(
  data: SoporteData[],
  selectedYear?: number,
  selectedType?: string
): KPI[] {
  let filtered = data;

  if (selectedYear) {
    filtered = filtered.filter((d) => d.año === selectedYear);
  }
  if (selectedType) {
    filtered = filtered.filter((d) => d.tipo === selectedType);
  }

  const total = filtered.reduce((sum, d) => sum + d.soportes, 0);
  const promedio = filtered.length > 0 ? total / filtered.length : 0;

  // Comparar con período anterior
  // Si hay año seleccionado, comparar contra el anterior.
  // Si no hay filtro, usar el último año con datos vs el anterior para que sea siempre coherente.
  const allYearsInData = Array.from(new Set(data.map((d) => d.año))).sort();
  const lastYearInData = allYearsInData[allYearsInData.length - 1];
  const currentYear = selectedYear || lastYearInData;
  const previousYear = currentYear - 1;

  const currentYearData = data.filter((d) => d.año === currentYear && (!selectedType || d.tipo === selectedType));
  const previousYearData = data.filter((d) => d.año === previousYear && (!selectedType || d.tipo === selectedType));

  const currentTotal = currentYearData.reduce((sum, d) => sum + d.soportes, 0);
  const previousTotal = previousYearData.reduce((sum, d) => sum + d.soportes, 0);

  const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  // Máximo y mínimo con su mes
  const max = filtered.length > 0 ? Math.max(...filtered.map((d) => d.soportes)) : 0;
  const min = filtered.length > 0 ? Math.min(...filtered.map((d) => d.soportes)) : 0;
  const maxRecord = filtered.find((d) => d.soportes === max);
  const minRecord = filtered.find((d) => d.soportes === min);
  const maxMes = maxRecord ? maxRecord.mes : '';
  const minMes = minRecord ? minRecord.mes : '';

  // Media global (todos los años)
  const globalData = selectedType ? data.filter((d) => d.tipo === selectedType) : data;
  const años = Array.from(new Set(globalData.map((d) => d.año)));
  const totalsByYear = años.map((año) => {
    const yearData = globalData.filter((d) => d.año === año);
    return yearData.reduce((sum, d) => sum + d.soportes, 0);
  });
  const mediaAnualGlobal = totalsByYear.length > 0 ? totalsByYear.reduce((a, b) => a + b, 0) / totalsByYear.length : 0;

  // Media del año seleccionado (mensual)
  const mediaSeleccionada = selectedYear
    ? promedio
    : filtered.length > 0
      ? total / filtered.length
      : 0;

  return [
    {
      label: 'Total Soportes',
      value: Math.round(total),
      change: changePercent,
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
      subtitle: previousTotal > 0
        ? `vs ${previousYear}: ${previousTotal.toLocaleString('es-ES')}`
        : `Año ${currentYear}`,
    },
    {
      label: 'Promedio Mensual',
      value: Math.round(mediaSeleccionada),
      change: 0,
      trend: 'neutral',
      subtitle: selectedYear ? `Año ${selectedYear}` : 'Global',
    },
    {
      label: 'Media Anual Global',
      value: Math.round(mediaAnualGlobal),
      change: selectedYear && mediaAnualGlobal > 0
        ? ((currentTotal - mediaAnualGlobal) / mediaAnualGlobal) * 100
        : 0,
      trend: selectedYear && currentTotal > mediaAnualGlobal ? 'up' : selectedYear && currentTotal < mediaAnualGlobal ? 'down' : 'neutral',
      subtitle: `Promedio de ${años.length} años`,
    },
    {
      label: 'Máximo Registrado',
      value: Math.round(max),
      change: 0,
      trend: 'neutral',
      subtitle: [
        maxMes ? `Máx en ${maxMes}` : '',
        minMes ? `Mín: ${Math.round(min)} (${minMes})` : `Mín: ${Math.round(min)}`,
      ].filter(Boolean).join(' · '),
    },
  ];
}

// Calcular tendencias mensuales
export function calculateTrends(
  data: SoporteData[],
  selectedYear?: number,
  selectedType?: string
): TrendPoint[] {
  let filtered = data;

  if (selectedYear) {
    filtered = filtered.filter((d) => d.año === selectedYear);
  }
  if (selectedType) {
    filtered = filtered.filter((d) => d.tipo === selectedType);
  }

  const byMonth: { [key: number]: number[] } = {};
  filtered.forEach((d) => {
    if (!byMonth[d.mesNum]) byMonth[d.mesNum] = [];
    byMonth[d.mesNum].push(d.soportes);
  });

  // Calcular promedio global (sin filtro de año) para referencia
  const globalFiltered = selectedType ? data.filter((d) => d.tipo === selectedType) : data;
  const globalByMonth: { [key: number]: number[] } = {};
  globalFiltered.forEach((d) => {
    if (!globalByMonth[d.mesNum]) globalByMonth[d.mesNum] = [];
    globalByMonth[d.mesNum].push(d.soportes);
  });

  const trends: TrendPoint[] = [];

  for (let i = 1; i <= 12; i++) {
    const valores = byMonth[i] || [];
    const globalValores = globalByMonth[i] || [];
    const promedio = globalValores.length > 0 ? globalValores.reduce((a, b) => a + b, 0) / globalValores.length : 0;
    const valor = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) : 0;

    trends.push({
      mes: MESES_CORTOS[i - 1],
      mesNum: i,
      valor,
      promedio: Math.round(promedio),
    });
  }

  return trends;
}

// Comparativa interanual: mismos meses superpuestos por año
export function calculateYearComparison(
  data: SoporteData[],
  selectedYears?: number[],
  selectedType?: string
): { data: YearComparisonPoint[]; years: number[] } {
  let filtered = selectedType ? data.filter((d) => d.tipo === selectedType) : data;

  const allYears = Array.from(new Set(filtered.map((d) => d.año))).sort();
  const years = selectedYears && selectedYears.length > 0 ? selectedYears : allYears;

  filtered = filtered.filter((d) => years.includes(d.año));

  const points: YearComparisonPoint[] = [];

  for (let i = 1; i <= 12; i++) {
    const point: YearComparisonPoint = {
      mes: MESES_CORTOS[i - 1],
      mesNum: i,
    };

    years.forEach((year) => {
      const monthData = filtered.filter((d) => d.año === year && d.mesNum === i);
      const total = monthData.reduce((sum, d) => sum + d.soportes, 0);
      point[year.toString()] = total || 0;
    });

    points.push(point);
  }

  return { data: points, years };
}

// Comparativa entre meses seleccionados
export function calculateMonthComparison(
  data: SoporteData[],
  selectedMonths: number[],
  selectedYear?: number
): MonthComparisonPoint[] {
  let filtered = selectedYear ? data.filter((d) => d.año === selectedYear) : data;
  filtered = filtered.filter((d) => selectedMonths.includes(d.mesNum));

  const tipos = Array.from(new Set(filtered.map((d) => d.tipo))).sort();

  return tipos.map((tipo) => {
    const point: MonthComparisonPoint = { tipo };

    selectedMonths.forEach((mesNum) => {
      const monthData = filtered.filter((d) => d.tipo === tipo && d.mesNum === mesNum);
      const total = monthData.reduce((sum, d) => sum + d.soportes, 0);
      point[MESES_CORTOS[mesNum - 1]] = total;
    });

    return point;
  });
}

// Identificar puntos de dolor
export function identifyPainPoints(data: SoporteData[]): PainPoint[] {
  const byType: { [key: string]: number[] } = {};

  data.forEach((d) => {
    if (!byType[d.tipo]) byType[d.tipo] = [];
    byType[d.tipo].push(d.soportes);
  });

  const painPoints: PainPoint[] = Object.entries(byType).map(([tipo, valores]) => {
    const total = valores.reduce((a, b) => a + b, 0);
    const promedio = total / valores.length;
    const variancia =
      valores.reduce((sum, v) => sum + Math.pow(v - promedio, 2), 0) / valores.length;
    const desviacion = Math.sqrt(variancia);

    const varianciaScore = Math.min(desviacion / promedio, 1) * 60;
    const lowValueScore = Math.max(0, 40 - (promedio / 100) * 40);

    return {
      tipo,
      totalSoportes: Math.round(total),
      promedio: Math.round(promedio),
      variancia: Math.round(desviacion),
      puntuacion: Math.round(varianciaScore + lowValueScore),
    };
  });

  return painPoints.sort((a, b) => b.puntuacion - a.puntuacion);
}

// Calcular comparativa por tipo
export function calculateTypeComparison(
  data: SoporteData[],
  selectedYear?: number
): Array<{ tipo: string; total: number; promedio: number }> {
  let filtered = data;

  if (selectedYear) {
    filtered = filtered.filter((d) => d.año === selectedYear);
  }

  const byType: { [key: string]: number[] } = {};

  filtered.forEach((d) => {
    if (!byType[d.tipo]) byType[d.tipo] = [];
    byType[d.tipo].push(d.soportes);
  });

  return Object.entries(byType)
    .map(([tipo, valores]) => ({
      tipo,
      total: Math.round(valores.reduce((a, b) => a + b, 0)),
      promedio: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length),
    }))
    .sort((a, b) => b.total - a.total);
}
