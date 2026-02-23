import type { WeeklyPoint } from '@/hooks/useTendenciasData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface WeeklyChartProps {
  data: WeeklyPoint[];
  selectedWeek: number;
  latestWeek: number;
  selectedType: string;
}

export default function WeeklyChart({ data, selectedWeek, latestWeek, selectedType }: WeeklyChartProps) {
  // Only show up to latestWeek + a few more for context
  const visibleData = data.slice(0, Math.min(latestWeek + 4, data.length)).map(p => ({
    semana: `S${p.week}`,
    week: p.week,
    '2026': p.value2026,
    '2025': p.value2025,
  }));

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          Evolución Semanal — {selectedType}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          2026 vs 2025, semana a semana
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semana" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <ReferenceLine x={`S${selectedWeek}`} stroke="#ea580c" strokeDasharray="3 3" label={{ value: `S${selectedWeek}`, position: 'top', fill: '#ea580c' }} />
            <Line type="monotone" dataKey="2026" stroke="#1e40af" strokeWidth={2.5} name="2026" dot={{ fill: '#1e40af', r: 3 }} />
            <Line type="monotone" dataKey="2025" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" name="2025" dot={{ fill: '#6b7280', r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
