import { useState, useEffect } from 'react';
import { useTendenciasData } from '@/hooks/useTendenciasData';
import type { SupportType } from '@/hooks/useTendenciasData';
import {
  calculateTendenciasKPIs,
  getWeeklyEvolution,
  getLocationBreakdown,
  getCategoryBreakdown,
  getMonthlyComparison,
  getLatestMonthWith2026Data,
} from '@/lib/tendenciasAnalytics';
import MainNav from '@/components/MainNav';
import KPICard from '@/components/KPICard';
import TendenciasFilters from '@/components/tendencias/TendenciasFilters';
import WeeklyChart from '@/components/tendencias/WeeklyChart';
import LocationBreakdown from '@/components/tendencias/LocationBreakdown';
import CategoryBreakdown from '@/components/tendencias/CategoryBreakdown';
import SpeechGenerator from '@/components/tendencias/SpeechGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Upload, Calendar } from 'lucide-react';

export default function Tendencias() {
  const { data, loading, error, loadFromFile } = useTendenciasData();
  const [selectedType, setSelectedType] = useState<SupportType | 'Todos'>('Todos');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [viewMode, setViewMode] = useState<'Semanal' | 'Mensual' | 'Anual'>('Semanal');

  useEffect(() => {
    if (!data) {
      return;
    }

    setSelectedWeek(data.latestWeek);
    setSelectedMonth(getLatestMonthWith2026Data(data));
  }, [data]);

  const handleFileUpload = async (file: File) => loadFromFile(file);

  // Compute analytics when data available
  const kpis = data ? calculateTendenciasKPIs(data, selectedType, selectedWeek, selectedMonth, viewMode) : [];
  const weeklyEvolution = data ? getWeeklyEvolution(data, selectedType) : [];
  const locationData = data ? getLocationBreakdown(data, selectedType, viewMode, selectedWeek, selectedMonth) : [];
  const categoryData = data ? getCategoryBreakdown(data, selectedType, viewMode, selectedWeek, selectedMonth) : [];
  const monthlyData = data ? getMonthlyComparison(data, selectedType) : [];
  const hasMonthly2024Data = data?.hasMonthly2024Data || false;
  const cumulativeMonthlyData = monthlyData.map((m, idx) => {
    const prev = monthlyData.slice(0, idx);
    const cumulative = {
      mes: m.mes,
      '2026': prev.reduce((s, p) => s + p['2026'], 0) + m['2026'],
      '2025': prev.reduce((s, p) => s + p['2025'], 0) + m['2025'],
    } as { mes: string; '2026': number; '2025': number; '2024'?: number };

    if (hasMonthly2024Data) {
      cumulative['2024'] = prev.reduce((s, p) => s + (p['2024'] ?? 0), 0) + (m['2024'] ?? 0);
    }

    return cumulative;
  });

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-20 flex flex-col gap-4">
              <TendenciasFilters
                selectedType={selectedType}
                selectedWeek={selectedWeek}
                selectedMonth={selectedMonth}
                viewMode={viewMode}
                latestWeek={data?.latestWeek || 1}
                hasData={!!data}
                onTypeChange={setSelectedType}
                onWeekChange={setSelectedWeek}
                onMonthChange={setSelectedMonth}
                onViewModeChange={setViewMode}
                onFileUpload={handleFileUpload}
                isLoading={loading}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Error state */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* No data state */}
            {!data && !loading && !error && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Upload size={20} />
                    Carga el Excel de Tendencias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600">
                    Selecciona el archivo Excel con las hojas: Remotos, Programados, Presenciales, Incidencias y Correctivos
                    para visualizar los datos y generar el speech semanal.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Data loaded */}
            {data && (
              <>
                {/* KPIs */}
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {viewMode === 'Semanal' && `Semana ${selectedWeek}`}
                    {viewMode === 'Mensual' && 'Resumen Mensual'}
                    {viewMode === 'Anual' && 'Resumen Anual'}
                    {' — '}{selectedType}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((kpi, idx) => (
                      <KPICard key={idx} kpi={kpi} />
                    ))}
                  </div>
                </section>

                {/* SEMANAL VIEW */}
                {viewMode === 'Semanal' && (
                  <>
                    <section>
                      <WeeklyChart
                        data={weeklyEvolution}
                        selectedWeek={selectedWeek}
                        latestWeek={data.latestWeek}
                        selectedType={selectedType}
                      />
                    </section>

                  </>
                )}

                {/* MENSUAL VIEW */}
                {viewMode === 'Mensual' && (
                  <section>
                    <Card className="chart-container">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar size={20} className="text-primary" />
                          Comparativa Mensual — {selectedType}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {hasMonthly2024Data ? '2024 vs 2025 vs 2026' : '2025 vs 2026'}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="mes" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="2026" stroke="#1e40af" strokeWidth={2.5} name="2026" dot={{ fill: '#1e40af', r: 4 }} />
                            <Line type="monotone" dataKey="2025" stroke="#ea580c" strokeWidth={2} name="2025" dot={{ fill: '#ea580c', r: 3 }} />
                            {hasMonthly2024Data && (
                              <Line type="monotone" dataKey="2024" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" name="2024" dot={{ fill: '#6b7280', r: 2 }} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </section>
                )}

                {/* ANUAL VIEW */}
                {viewMode === 'Anual' && (
                  <section>
                    <Card className="chart-container">
                      <CardHeader>
                        <CardTitle>Resumen Anual — {selectedType}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {hasMonthly2024Data ? 'Acumulado mensual 2024 vs 2025 vs 2026' : 'Acumulado mensual 2025 vs 2026'}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {/* Cumulative chart */}
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={cumulativeMonthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="mes" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="2026" stroke="#1e40af" strokeWidth={2.5} name="2026 acum." dot={{ fill: '#1e40af', r: 4 }} />
                            <Line type="monotone" dataKey="2025" stroke="#ea580c" strokeWidth={2} name="2025 acum." dot={{ fill: '#ea580c', r: 3 }} />
                            {hasMonthly2024Data && (
                              <Line type="monotone" dataKey="2024" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" name="2024 acum." dot={{ fill: '#6b7280', r: 2 }} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Annual summary table */}
                    <Card className="chart-container mt-8">
                      <CardHeader>
                        <CardTitle>Detalle Mensual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Mes</th>
                                {hasMonthly2024Data && (
                                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">2024</th>
                                )}
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">2025</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">2026</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">% vs 2025</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyData.map((m) => {
                                const diff = m['2025'] > 0 ? ((m['2026'] - m['2025']) / m['2025']) * 100 : 0;
                                return (
                                  <tr key={m.mes} className="border-b border-border hover:bg-card transition-colors">
                                    <td className="py-3 px-4 font-medium">{m.mes}</td>
                                    {hasMonthly2024Data && (
                                      <td className="py-3 px-4 text-right font-mono">{m['2024'] ?? '-'}</td>
                                    )}
                                    <td className="py-3 px-4 text-right font-mono">{m['2025'] || '-'}</td>
                                    <td className="py-3 px-4 text-right font-mono font-semibold text-primary">{m['2026'] || '-'}</td>
                                    <td className={`py-3 px-4 text-right font-mono ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>
                                      {m['2025'] > 0 && m['2026'] > 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                )}

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <LocationBreakdown
                    data={locationData}
                    viewMode={viewMode}
                    selectedWeek={selectedWeek}
                    selectedMonth={selectedMonth}
                    selectedType={selectedType}
                  />
                  <CategoryBreakdown
                    data={categoryData}
                    viewMode={viewMode}
                    selectedWeek={selectedWeek}
                    selectedMonth={selectedMonth}
                    selectedType={selectedType}
                  />
                </section>

                {viewMode === 'Semanal' && (
                  <section>
                    <SpeechGenerator data={data} selectedWeek={selectedWeek} />
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
