import { useRef, useState } from 'react';
import type { SupportType } from '@/hooks/useTendenciasData';
import { SUPPORT_TYPES } from '@/hooks/useTendenciasData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Filter, CheckCircle, AlertCircle } from 'lucide-react';

interface TendenciasFiltersProps {
  selectedType: SupportType | 'Todos';
  selectedWeek: number;
  viewMode: 'Semanal' | 'Mensual' | 'Anual';
  latestWeek: number;
  hasData: boolean;
  onTypeChange: (type: SupportType | 'Todos') => void;
  onWeekChange: (week: number) => void;
  onViewModeChange: (mode: 'Semanal' | 'Mensual' | 'Anual') => void;
  onFileUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export default function TendenciasFilters({
  selectedType,
  selectedWeek,
  viewMode,
  latestWeek,
  hasData,
  onTypeChange,
  onWeekChange,
  onViewModeChange,
  onFileUpload,
  isLoading,
}: TendenciasFiltersProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(null);
    try {
      const result = await onFileUpload(file);
      if (result.success) {
        setUploadMsg({ type: 'success', text: `Archivo "${file.name}" cargado` });
      } else {
        setUploadMsg({ type: 'error', text: result.error || `No se pudo cargar "${file.name}"` });
      }
    } catch (err) {
      setUploadMsg({
        type: 'error',
        text: err instanceof Error ? err.message : `No se pudo cargar "${file.name}"`,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const viewModes: Array<'Semanal' | 'Mensual' | 'Anual'> = ['Semanal', 'Mensual', 'Anual'];

  // Generate week options up to latestWeek
  const weekOptions = Array.from({ length: Math.max(latestWeek, 1) }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Upload */}
      <Card className="shadow-sm border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Cargar Tendencias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full" variant="default">
            {isLoading ? 'Procesando...' : 'Seleccionar Excel Tendencias'}
          </Button>
          {uploadMsg && (
            <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
              uploadMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {uploadMsg.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
              <span>{uploadMsg.text}</span>
            </div>
          )}
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Excel con hojas: Remotos, Programados, Presenciales, Incidencias, Correctivos
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      {hasData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Vista</label>
              <div className="flex gap-2">
                {viewModes.map((mode) => (
                  <Badge
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors flex-1 justify-center py-1.5"
                    onClick={() => onViewModeChange(mode)}
                  >
                    {mode}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Support type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tipo de Soporte</label>
              <Select value={selectedType} onValueChange={(val) => onTypeChange(val as SupportType | 'Todos')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {SUPPORT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week selector (only in Semanal view) */}
            {viewMode === 'Semanal' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Semana ({selectedWeek} de {latestWeek})
                </label>
                <Select value={selectedWeek.toString()} onValueChange={(val) => onWeekChange(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((w) => (
                      <SelectItem key={w} value={w.toString()}>
                        Semana {w} {w === latestWeek ? '(última)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
