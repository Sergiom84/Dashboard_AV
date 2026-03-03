import { useEffect, useState, useCallback } from 'react';

export interface SoporteData {
  fecha: string;
  año: number;
  mes: string;
  mesNum: number;
  tipo: string;
  soportes: number;
}

export interface ProcessedData {
  data: SoporteData[];
  tipos: string[];
  años: number[];
  meses: string[];
}

export function useExcelData() {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/soportes');
        if (!response.ok) throw new Error('Error al obtener datos del servidor');
        const result: ProcessedData = await response.json();
        setData(result.data.length > 0 ? result : null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  return { data, loading, error, refetch };
}
