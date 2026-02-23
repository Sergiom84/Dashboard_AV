import { useState, useRef, useCallback } from 'react';
import { useExcelData, SoporteData } from '@/hooks/useExcelData';
import {
  calculateKPIs,
  calculateTrends,
  identifyPainPoints,
  calculateTypeComparison,
  calculateYearComparison,
  calculateMonthComparison,
} from '@/lib/analytics';
import FilterSidebar from '@/components/FilterSidebar';
import DataUploader from '@/components/DataUploader';
import KPICard from '@/components/KPICard';
import YearComparison from '@/components/YearComparison';
import MonthComparison from '@/components/MonthComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { AlertCircle, TrendingUp, AlertTriangle, FileDown, Loader2 } from 'lucide-react';
import MainNav from '@/components/MainNav';

export default function Home() {
  const { data: initialData, loading, error } = useExcelData();
  const [dynamicData, setDynamicData] = useState<SoporteData[] | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const currentData = dynamicData || initialData?.data || [];
  const isInitialLoading = loading && !dynamicData;

  const tipos = Array.from(new Set(currentData.map((d) => d.tipo))).sort();
  const años = Array.from(new Set(currentData.map((d) => d.año))).sort();

  const handleExportPDF = useCallback(() => {
    // Build a summary of active filters
    const filters: string[] = [];
    if (selectedYear) filters.push(`Año: ${selectedYear}`);
    if (selectedType) filters.push(`Tipo: ${selectedType}`);
    if (selectedYears.length > 0) filters.push(`Comparando años: ${selectedYears.join(', ')}`);
    if (selectedMonths.length > 0) {
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      filters.push(`Comparando meses: ${selectedMonths.map(m => meses[m-1]).join(', ')}`);
    }

    // Add a temporary print header with filter info
    const printHeader = document.createElement('div');
    printHeader.id = 'print-header';
    printHeader.innerHTML = `
      <div style="padding: 20px 0; border-bottom: 2px solid #1e40af; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1e40af; margin: 0;">Dashboard de Soporte - Informe</h1>
        <p style="color: #6b7280; margin: 4px 0 0 0;">Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        ${filters.length > 0 ? `<p style="color: #374151; margin: 8px 0 0 0; font-size: 14px;"><strong>Filtros aplicados:</strong> ${filters.join(' | ')}</p>` : ''}
      </div>
    `;

    const dashboard = dashboardRef.current;
    if (dashboard) {
      dashboard.prepend(printHeader);
    }

    window.print();

    // Remove the temp header after print dialog closes
    setTimeout(() => {
      const el = document.getElementById('print-header');
      if (el) el.remove();
    }, 500);
  }, [selectedYear, selectedType, selectedYears, selectedMonths]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error && !dynamicData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle size={20} />
              Error al cargar datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300">{error || 'No se pudo cargar el archivo de datos.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle size={20} />
              Sin datos disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">Por favor, carga un archivo Excel para comenzar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analytics
  const kpis = calculateKPIs(currentData, selectedYear, selectedType);
  const trends = calculateTrends(currentData, selectedYear, selectedType);
  const painPoints = identifyPainPoints(currentData);
  const typeComparison = calculateTypeComparison(currentData, selectedYear);
  const yearComparison = calculateYearComparison(currentData, selectedYears, selectedType);
  const monthComparison = selectedMonths.length >= 2
    ? calculateMonthComparison(currentData, selectedMonths, selectedYear)
    : [];

  const chartColors = ['#1e40af', '#3b82f6', '#ea580c', '#f97316', '#6b7280', '#10b981'];

  // Filter data for table
  let tableData = currentData;
  if (selectedYear) tableData = tableData.filter((d) => d.año === selectedYear);
  if (selectedType) tableData = tableData.filter((d) => d.tipo === selectedType);

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        rightSlot={
          <>
            <Button onClick={handleExportPDF} variant="outline">
              <FileDown size={16} className="mr-2" />
              Exportar PDF
            </Button>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Registros</p>
              <p className="text-sm font-medium text-foreground">{currentData.length} datos</p>
            </div>
          </>
        }
      />

      {/* Main Content */}
      <main className="container py-8" ref={dashboardRef}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 print:hidden">
            <div className="sticky top-24 flex flex-col gap-4">
              <DataUploader onDataLoaded={setDynamicData} />
              <FilterSidebar
                data={{
                  data: currentData,
                  tipos,
                  años,
                  meses: Array.from(new Set(currentData.map((d) => d.mes))),
                }}
                selectedYear={selectedYear}
                selectedType={selectedType}
                selectedYears={selectedYears}
                selectedMonths={selectedMonths}
                onYearChange={setSelectedYear}
                onTypeChange={setSelectedType}
                onYearsChange={setSelectedYears}
                onMonthsChange={setSelectedMonths}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* KPIs */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Indicadores Clave</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                  <KPICard key={idx} kpi={kpi} />
                ))}
              </div>
            </section>

            {/* Tendencias */}
            <section>
              <Card className="chart-container">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Tendencia Mensual
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Evolución de soportes por mes
                    {selectedYear ? ` (${selectedYear})` : ' (todos los años)'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
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
                      <Line type="monotone" dataKey="valor" stroke="#1e40af" strokeWidth={2} name="Soportes" dot={{ fill: '#1e40af' }} />
                      <Line type="monotone" dataKey="promedio" stroke="#ea580c" strokeWidth={2} strokeDasharray="5 5" name="Media Global" dot={{ fill: '#ea580c' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Comparativa Interanual */}
            <section>
              <YearComparison data={yearComparison.data} years={yearComparison.years} />
            </section>

            {/* Comparativa entre Meses */}
            <section>
              <MonthComparison data={monthComparison} selectedMonths={selectedMonths} />
            </section>

            {/* Comparativa por Tipo */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="chart-container">
                <CardHeader>
                  <CardTitle>Soportes por Tipo</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Distribución total</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeComparison}>
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
                      <Bar dataKey="total" fill="#1e40af" name="Total" />
                      <Bar dataKey="promedio" fill="#3b82f6" name="Promedio" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="chart-container">
                <CardHeader>
                  <CardTitle>Proporción por Tipo</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Porcentaje del total</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeComparison}
                        dataKey="total"
                        nameKey="tipo"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {typeComparison.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Puntos de Dolor */}
            <section>
              <Card className="chart-container border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle size={20} />
                    Puntos de Dolor Identificados
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Tipos con mayor variabilidad e inconsistencia</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {painPoints.slice(0, 5).map((point, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{point.tipo}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total: {point.totalSoportes} | Promedio: {point.promedio} | Variancia: {point.variancia}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{point.puntuacion}</div>
                          <p className="text-xs text-muted-foreground">Puntuación</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Tabla de Datos */}
            <section>
              <Card className="chart-container">
                <CardHeader>
                  <CardTitle>Datos Detallados</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tableData.length} registros
                    {selectedYear ? ` del año ${selectedYear}` : ''}
                    {selectedType ? ` — ${selectedType}` : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide">Año</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide">Mes</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                          <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide">Soportes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData
                          .slice()
                          .sort((a, b) => b.año - a.año || b.mesNum - a.mesNum)
                          .slice(0, 20)
                          .map((row, idx) => (
                            <tr key={idx} className="border-b border-border hover:bg-card transition-colors">
                              <td className="py-3 px-4 text-foreground font-mono">{row.año}</td>
                              <td className="py-3 px-4 text-foreground">{row.mes}</td>
                              <td className="py-3 px-4 text-foreground">{row.tipo}</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-primary">{row.soportes}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12 print:hidden">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Dashboard de Soporte Técnico &copy; 2026 | Datos actualizados al {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </footer>
    </div>
  );
}
