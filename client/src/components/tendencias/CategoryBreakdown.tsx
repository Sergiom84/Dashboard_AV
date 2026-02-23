import type { CategoryChartPoint } from '@/lib/tendenciasAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

const COLORS = ['#1e40af', '#3b82f6', '#ea580c', '#f97316', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280', '#06b6d4', '#ec4899'];

interface CategoryBreakdownProps {
  data: CategoryChartPoint[];
  selectedWeek: number;
  selectedType: string;
}

export default function CategoryBreakdown({ data, selectedWeek, selectedType }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers size={20} className="text-primary" />
            Categorías — S{selectedWeek}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Sin datos de categorías para esta semana</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Top Categorías — S{selectedWeek}
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
