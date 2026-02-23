import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets['Datos_PBI'];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Procesar datos
        const processedData: SoporteData[] = jsonData
          .map((row: any) => ({
            fecha: row.Fecha,
            año: row.Año,
            mes: row.Mes,
            mesNum: row.Mes_Num,
            tipo: row.Tipo,
            soportes: row.Soportes || 0,
          }))
          .filter((item) => item.soportes > 0); // Filtrar datos vacíos

        // Extraer valores únicos
        const tipos = Array.from(new Set(processedData.map((d) => d.tipo))).sort();
        const años = Array.from(new Set(processedData.map((d) => d.año))).sort();
        const meses = Array.from(new Set(processedData.map((d) => d.mes)));

        setData({
          data: processedData,
          tipos,
          años,
          meses,
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
}
