import type { LocationChartPoint, TendenciasViewMode } from '@/lib/tendenciasAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface LocationBreakdownProps {
  data: LocationChartPoint[];
  viewMode: TendenciasViewMode;
  selectedWeek: number;
  selectedMonth: number;
  selectedType: string;
}

export default function LocationBreakdown({
  data,
  viewMode,
  selectedWeek,
  selectedMonth,
  selectedType,
}: LocationBreakdownProps) {
  const periodLabel =
    viewMode === 'Semanal'
      ? `S${selectedWeek}`
      : viewMode === 'Mensual'
        ? MESES_CORTOS[selectedMonth - 1]
        : `Acum. hasta ${MESES_CORTOS[selectedMonth - 1]}`;
  const emptyStateText =
    viewMode === 'Semanal'
      ? 'Sin datos de ubicación para esta semana'
      : viewMode === 'Mensual'
        ? 'Sin datos de ubicación para este mes'
        : 'Sin datos de ubicación para el acumulado seleccionado';

  if (data.length === 0) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Desglose por Ubicación — {periodLabel}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedType === 'Remotos'
              ? 'El soporte remoto no tiene desglose por ubicación'
              : emptyStateText}
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          Desglose por Ubicación — {periodLabel}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">{selectedType}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" />
            <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Bar dataKey="value" fill="#1e40af" name="Soportes" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
