import { useCallback, useEffect, useState } from "react";
import type { RenoveData } from "@shared/renove";

export interface LoadRenoveResult {
  success: boolean;
  error?: string;
}

export function useRenoveData() {
  const [data, setData] = useState<RenoveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await fetch("/api/renove");

        if (!res.ok) {
          return;
        }

        const json = await res.json();

        if (json) {
          setData(json);
        }
      } catch {
        // No persisted Renove data yet.
      } finally {
        setLoading(false);
      }
    };

    loadExisting();
  }, []);

  const loadFromFile = useCallback(async (file: File): Promise<LoadRenoveResult> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/renove/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al subir el archivo");
      }

      const dataRes = await fetch("/api/renove");
      const json = await dataRes.json();

      if (json) {
        setData(json);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al procesar el archivo";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadFromFile };
}
