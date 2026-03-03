import { useState, useCallback, useEffect } from 'react';

// === TYPES (kept for components) ===

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

// === HOOK ===

export interface LoadTendenciasResult {
  success: boolean;
  error?: string;
}

export function useTendenciasData() {
  const [data, setData] = useState<TendenciasData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data from server on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await fetch('/api/tendencias');
        if (!res.ok) return;
        const json = await res.json();
        if (json) setData(json);
      } catch {
        // Silently ignore — no persisted data yet
      }
    };
    loadExisting();
  }, []);

  const loadFromFile = useCallback(async (file: File): Promise<LoadTendenciasResult> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tendencias/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al subir el archivo');
      }

      // Fetch the freshly-stored data
      const dataRes = await fetch('/api/tendencias');
      const json = await dataRes.json();
      if (json) setData(json);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadFromFile };
}
