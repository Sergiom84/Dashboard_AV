import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { MonthComparisonPoint } from '@/lib/analytics';

const MONTH_COLORS = ['#1e40af', '#ea580c', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface MonthComparisonProps {
  data: MonthComparisonPoint[];
  selectedMonths: number[];
}

export default function MonthComparison({ data, selectedMonths }: MonthComparisonProps) {
  if (selectedMonths.length < 2) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" />
            Comparativa entre Meses
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Selecciona al menos 2 meses en los filtros de "Comparar Meses" para ver la comparativa
          </p>
        </CardHeader>
      </Card>
    );
  }

  const monthNames = selectedMonths.map((m) => MESES_CORTOS[m - 1]);

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays size={20} className="text-primary" />
          Comparativa entre Meses
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {monthNames.join(' vs ')} — por tipo de soporte
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="tipo" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {monthNames.map((name, idx) => (
              <Bar
                key={name}
                dataKey={name}
                fill={MONTH_COLORS[selectedMonths[idx] - 1]}
                name={name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
