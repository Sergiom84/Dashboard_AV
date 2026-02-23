import type { LocationChartPoint } from '@/lib/tendenciasAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

interface LocationBreakdownProps {
  data: LocationChartPoint[];
  selectedWeek: number;
  selectedType: string;
}

export default function LocationBreakdown({ data, selectedWeek, selectedType }: LocationBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Desglose por Ubicación — S{selectedWeek}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedType === 'Remotos'
              ? 'El soporte remoto no tiene desglose por ubicación'
              : 'Sin datos de ubicación para esta semana'}
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
          Desglose por Ubicación — S{selectedWeek}
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
