import type { CategoryChartPoint, TendenciasViewMode } from '@/lib/tendenciasAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

const COLORS = ['#1e40af', '#3b82f6', '#ea580c', '#f97316', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280', '#06b6d4', '#ec4899'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface CategoryBreakdownProps {
  data: CategoryChartPoint[];
  viewMode: TendenciasViewMode;
  selectedWeek: number;
  selectedMonth: number;
  selectedType: string;
}

export default function CategoryBreakdown({
  data,
  viewMode,
  selectedWeek,
  selectedMonth,
  selectedType,
}: CategoryBreakdownProps) {
  const periodLabel =
    viewMode === 'Semanal'
      ? `S${selectedWeek}`
      : viewMode === 'Mensual'
        ? MESES_CORTOS[selectedMonth - 1]
        : `Acum. hasta ${MESES_CORTOS[selectedMonth - 1]}`;
  const emptyStateText =
    viewMode === 'Semanal'
      ? 'Sin datos de categorías para esta semana'
      : viewMode === 'Mensual'
        ? 'Sin datos de categorías para este mes'
        : 'Sin datos de categorías para el acumulado seleccionado';

  if (data.length === 0) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers size={20} className="text-primary" />
            Categorías — {periodLabel}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{emptyStateText}</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Top Categorías — {periodLabel}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">{selectedType}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Bar dataKey="value" name="Soportes" radius={[4, 4, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
