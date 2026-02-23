import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import { YearComparisonPoint } from '@/lib/analytics';

const YEAR_COLORS = ['#1e40af', '#ea580c', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

interface YearComparisonProps {
  data: YearComparisonPoint[];
  years: number[];
}

export default function YearComparison({ data, years }: YearComparisonProps) {
  if (years.length < 2) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompareArrows size={20} className="text-primary" />
            Comparativa Interanual
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Selecciona al menos 2 años en los filtros de "Comparar Años" para ver la comparativa
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompareArrows size={20} className="text-primary" />
          Comparativa Interanual
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Mismos meses, diferentes años — {years.join(' vs ')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {years.map((year, idx) => (
              <Line
                key={year}
                type="monotone"
                dataKey={year.toString()}
                stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                strokeWidth={2}
                name={year.toString()}
                dot={{ fill: YEAR_COLORS[idx % YEAR_COLORS.length], r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
