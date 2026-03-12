import { useRef, useState } from "react";
import type { RenoveData, RenoveStatusView } from "@shared/renove";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, Filter, Upload, X } from "lucide-react";
import { formatLocationLabel, formatUploadedAt } from "@/lib/renoveAnalytics";

interface RenoveFiltersProps {
  data: RenoveData | null;
  selectedView: RenoveStatusView;
  selectedLocation: string;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  onViewChange: (view: RenoveStatusView) => void;
  onLocationChange: (location: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
  onFileUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
}

const VIEW_OPTIONS: Array<{ value: RenoveStatusView; label: string }> = [
  { value: "total", label: "Total" },
  { value: "renovado", label: "Renovado" },
  { value: "pendiente", label: "Pendiente" },
  { value: "rechazado", label: "Rechazado" },
];

export default function RenoveFilters({
  data,
  selectedView,
  selectedLocation,
  startDate,
  endDate,
  isLoading,
  onViewChange,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onFileUpload,
}: RenoveFiltersProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadMsg(null);

    try {
      const result = await onFileUpload(file);

      if (result.success) {
        setUploadMsg({ type: "success", text: `Archivo "${file.name}" cargado` });
      } else {
        setUploadMsg({ type: "error", text: result.error || `No se pudo cargar "${file.name}"` });
      }
    } catch (err) {
      setUploadMsg({
        type: "error",
        text: err instanceof Error ? err.message : `No se pudo cargar "${file.name}"`,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasActiveFilters = selectedView !== "total" || selectedLocation !== "all" || !!startDate || !!endDate;

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="shadow-sm border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Cargar Renove
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />

          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full">
            {isLoading ? "Procesando..." : "Seleccionar Excel Renove"}
          </Button>

          {uploadMsg && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md text-sm ${
                uploadMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {uploadMsg.type === "success" ? (
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{uploadMsg.text}</span>
            </div>
          )}

          <p className="text-xs text-blue-700 dark:text-blue-300">
            Excel con hoja <strong>Onboarding y averías</strong> y columnas: Ubicación, ESTADO y Fecha.
          </p>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Vista
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIEW_OPTIONS.map((option) => (
                    <Badge
                      key={option.value}
                      variant={selectedView === option.value ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => onViewChange(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Edificio
                </label>
                <Select value={selectedLocation} onValueChange={onLocationChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {data.availableLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {formatLocationLabel(location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Fecha desde
                </label>
                <Input
                  type="date"
                  value={startDate}
                  min={data.minDate ?? undefined}
                  max={endDate || data.maxDate || undefined}
                  onChange={(event) => onStartDateChange(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Fecha hasta
                </label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || data.minDate || undefined}
                  max={data.maxDate ?? undefined}
                  onChange={(event) => onEndDateChange(event.target.value)}
                />
              </div>

              {hasActiveFilters && (
                <Button variant="outline" className="w-full" onClick={onClearFilters}>
                  <X size={14} className="mr-2" />
                  Limpiar filtros
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                El rango de fechas afecta a los registros con fecha. Los estados sin fecha siguen visibles.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Información del dataset</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Registros:</strong> {data.summary.total}
              </p>
              <p>
                <strong>Con fecha:</strong> {data.summary.total - data.summary.undated}
              </p>
              <p>
                <strong>Sin fecha:</strong> {data.summary.undated}
              </p>
              <p>
                <strong>Edificios:</strong> {data.availableLocations.length}
              </p>
              <p>
                <strong>Última carga:</strong> {formatUploadedAt(data.uploadedAt)}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
