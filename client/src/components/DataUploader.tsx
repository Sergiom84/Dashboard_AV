import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface DataUploaderProps {
  onDataLoaded: () => void;
}

export default function DataUploader({ onDataLoaded }: DataUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/soportes/upload', {
        method: 'POST',
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || 'Error al procesar el archivo');
      }

      onDataLoaded();
      setMessage({
        type: 'success',
        text: `Se cargaron ${body.count} registros correctamente`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al procesar el archivo',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="shadow-sm border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload size={18} className="text-primary" />
          Cargar Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? 'Procesando...' : 'Seleccionar archivo Excel'}
        </Button>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Formato esperado:</strong> Archivo Excel con hoja "Datos_PBI" y columnas: Fecha, Año, Mes, Mes_Num, Tipo, Soportes
        </p>
      </CardContent>
    </Card>
  );
}
