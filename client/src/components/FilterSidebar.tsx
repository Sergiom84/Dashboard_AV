import { ProcessedData } from '@/hooks/useExcelData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

const MESES = [
  { num: 1, name: 'Enero' },
  { num: 2, name: 'Febrero' },
  { num: 3, name: 'Marzo' },
  { num: 4, name: 'Abril' },
  { num: 5, name: 'Mayo' },
  { num: 6, name: 'Junio' },
  { num: 7, name: 'Julio' },
  { num: 8, name: 'Agosto' },
  { num: 9, name: 'Septiembre' },
  { num: 10, name: 'Octubre' },
  { num: 11, name: 'Noviembre' },
  { num: 12, name: 'Diciembre' },
];

interface FilterSidebarProps {
  data: ProcessedData;
  selectedYear?: number;
  selectedType?: string;
  selectedYears: number[];
  selectedMonths: number[];
  onYearChange: (year?: number) => void;
  onTypeChange: (type?: string) => void;
  onYearsChange: (years: number[]) => void;
  onMonthsChange: (months: number[]) => void;
}

export default function FilterSidebar({
  data,
  selectedYear,
  selectedType,
  selectedYears,
  selectedMonths,
  onYearChange,
  onTypeChange,
  onYearsChange,
  onMonthsChange,
}: FilterSidebarProps) {
  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter((y) => y !== year));
    } else {
      onYearsChange([...selectedYears, year]);
    }
  };

  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      onMonthsChange(selectedMonths.filter((m) => m !== month));
    } else {
      onMonthsChange([...selectedMonths, month]);
    }
  };

  const clearAll = () => {
    onYearChange(undefined);
    onTypeChange(undefined);
    onYearsChange([]);
    onMonthsChange([]);
  };

  const hasFilters = selectedYear || selectedType || selectedYears.length > 0 || selectedMonths.length > 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de Año principal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Año
            </label>
            <Select value={selectedYear?.toString() || 'all'} onValueChange={(val) => onYearChange(val === 'all' ? undefined : parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {data.años.map((año) => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Tipo de Soporte
            </label>
            <Select value={selectedType || 'all'} onValueChange={(val) => onTypeChange(val === 'all' ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {data.tipos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comparar Años (multi-select) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Comparar Años
            </label>
            <div className="flex flex-wrap gap-2">
              {data.años.map((año) => (
                <Badge
                  key={año}
                  variant={selectedYears.includes(año) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleYear(año)}
                >
                  {año}
                </Badge>
              ))}
            </div>
            {selectedYears.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedYears.length} año(s) seleccionado(s)
              </p>
            )}
          </div>

          {/* Comparar Meses (multi-select) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Comparar Meses
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MESES.map((mes) => (
                <Badge
                  key={mes.num}
                  variant={selectedMonths.includes(mes.num) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors text-xs"
                  onClick={() => toggleMonth(mes.num)}
                >
                  {mes.name.substring(0, 3)}
                </Badge>
              ))}
            </div>
            {selectedMonths.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedMonths.length} mes(es) seleccionado(s)
              </p>
            )}
          </div>

          {/* Botón Limpiar */}
          {hasFilters && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={clearAll}
            >
              <X size={14} className="mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Información del dataset */}
      <Card className="shadow-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>Período:</strong> {Math.min(...data.años)} - {Math.max(...data.años)}
          </p>
          <p>
            <strong>Tipos:</strong> {data.tipos.length} categorías
          </p>
          <p>
            <strong>Total registros:</strong> {data.data.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
