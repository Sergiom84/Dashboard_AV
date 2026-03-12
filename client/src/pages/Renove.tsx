import { useState } from "react";
import type { RenoveStatusView } from "@shared/renove";
import MainNav from "@/components/MainNav";
import RenoveFilters from "@/components/renove/RenoveFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRenoveData } from "@/hooks/useRenoveData";
import {
  buildMonthlyStatusSeries,
  buildWeeklyStatusSeries,
  formatRenoveDate,
  formatUploadedAt,
  formatLocationLabel,
  getRenoveViewLabel,
  matchesRenoveDateRange,
  matchesRenoveView,
  summarizeRenoveRecords,
} from "@/lib/renoveAnalytics";
import {
  AlertCircle,
  CalendarRange,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function SummaryCard({
  label,
  value,
  subtitle,
  accentClass,
}: {
  label: string;
  value: number;
  subtitle?: string;
  accentClass?: string;
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value mt-2 ${accentClass ?? ""}`}>{value.toLocaleString("es-ES")}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Renove() {
  const { data, loading, error, loadFromFile } = useRenoveData();
  const [selectedView, setSelectedView] = useState<RenoveStatusView>("total");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const allRecords = data?.records ?? [];
  const recordsByLocation = allRecords.filter((record) => selectedLocation === "all" || record.location === selectedLocation);
  const recordsInScope = recordsByLocation.filter((record) => matchesRenoveDateRange(record, startDate, endDate));
  const visibleRecords = recordsInScope.filter((record) => matchesRenoveView(record, selectedView));
  const visibleSummary = summarizeRenoveRecords(visibleRecords);
  const weeklyStatusData = buildWeeklyStatusSeries(recordsByLocation, selectedView, startDate, endDate);
  const monthlyStatusData = buildMonthlyStatusSeries(recordsByLocation, selectedView, startDate, endDate);
  const undatedVisibleCount = visibleRecords.filter((record) => record.date === null).length;
  const datedVisibleCount = visibleRecords.length - undatedVisibleCount;
  const activeLocations = new Set(visibleRecords.map((record) => record.location)).size;
  const selectedViewLabel = getRenoveViewLabel(selectedView);

  const handleClearFilters = () => {
    setSelectedView("total");
    setSelectedLocation("all");
    setStartDate("");
    setEndDate("");
  };

  const handleFileUpload = async (file: File) => loadFromFile(file);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos de Renove...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        rightSlot={
          data ? (
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Última carga</p>
              <p className="text-sm font-medium text-foreground">{formatUploadedAt(data.uploadedAt)}</p>
            </div>
          ) : undefined
        }
      />

      <main className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-20 flex flex-col gap-4">
              <RenoveFilters
                data={data}
                selectedView={selectedView}
                selectedLocation={selectedLocation}
                startDate={startDate}
                endDate={endDate}
                isLoading={loading}
                onViewChange={setSelectedView}
                onLocationChange={setSelectedLocation}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                onFileUpload={handleFileUpload}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-8">
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

            {!data && !loading && !error && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <RefreshCw size={20} />
                    Carga el Excel de Renove
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600">
                    Sube el Excel con la hoja <strong>Onboarding y averías</strong> para generar el seguimiento de renovados,
                    pendientes y rechazados.
                  </p>
                </CardContent>
              </Card>
            )}

            {data && (
              <>
                <section>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Resumen Renove</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vista actual: <strong>{selectedViewLabel}</strong>
                        {selectedLocation !== "all" ? ` · ${formatLocationLabel(selectedLocation)}` : ""}
                        {startDate || endDate ? " con rango de fechas activo" : " sin rango de fechas"}
                      </p>
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarRange size={16} />
                        {startDate || "Inicio abierto"} - {endDate || "Fin abierto"}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <SummaryCard
                      label="Registros visibles"
                      value={visibleRecords.length}
                      subtitle={selectedView === "total" ? "Todos los estados" : `Vista ${selectedViewLabel}`}
                    />
                    <SummaryCard
                      label="Con fecha"
                      value={datedVisibleCount}
                      subtitle="Base de las gráficas"
                      accentClass="text-amber-600 dark:text-amber-400"
                    />
                    <SummaryCard
                      label="Sin fecha"
                      value={undatedVisibleCount}
                      subtitle="Siguen visibles en el detalle"
                      accentClass="text-slate-600 dark:text-slate-400"
                    />
                    <SummaryCard
                      label={selectedView === "total" ? "Pendiente usuario" : selectedViewLabel}
                      value={selectedView === "total" ? visibleSummary.pendienteUsuario : visibleRecords.length}
                      subtitle={
                        selectedView === "total"
                          ? "Avisados y a la espera"
                          : `${selectedViewLabel} dentro del filtro actual`
                      }
                      accentClass="text-green-600 dark:text-green-400"
                    />
                    <SummaryCard
                      label="Edificios"
                      value={activeLocations}
                      subtitle={selectedLocation === "all" ? "Ubicaciones con registros" : "Edificio seleccionado"}
                      accentClass="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <Card className="chart-container">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock3 size={20} className="text-primary" />
                        {selectedViewLabel} por semana
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Serie semanal basada en los registros con fecha de la vista actual.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {weeklyStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={weeklyStatusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="label" stroke="#6b7280" angle={-35} textAnchor="end" height={80} />
                            <YAxis allowDecimals={false} stroke="#6b7280" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="total" name={selectedViewLabel} fill="#1e40af" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay registros con fecha para {selectedViewLabel.toLowerCase()} en el rango seleccionado.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="chart-container">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock3 size={20} className="text-primary" />
                        {selectedViewLabel} por mes
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Evolución mensual de los registros con fecha de la vista actual.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {monthlyStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={monthlyStatusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="label" stroke="#6b7280" />
                            <YAxis allowDecimals={false} stroke="#6b7280" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total"
                              name={selectedViewLabel}
                              stroke="#ea580c"
                              strokeWidth={2.5}
                              dot={{ fill: "#ea580c", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay registros con fecha para {selectedViewLabel.toLowerCase()} en el rango seleccionado.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section>
                  <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <Card className="chart-container">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle>Detalle de registros</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {visibleRecords.length} registros en la vista actual
                              {undatedVisibleCount > 0 ? ` · ${undatedVisibleCount} sin fecha` : ""}
                            </p>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm">
                              {detailsOpen ? "Ocultar detalle" : "Ver detalle"}
                              <ChevronDown
                                size={16}
                                className={`ml-2 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          <p className="text-xs text-muted-foreground">
                            El filtro de fechas no elimina los registros sin fecha porque el Excel actual solo fecha los renovados.
                          </p>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ubicación</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead>Fecha</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleRecords.length > 0 ? (
                                visibleRecords.map((record, index) => (
                                  <TableRow key={`${record.location}-${record.rawStatus}-${record.date ?? "sin-fecha"}-${index}`}>
                                    <TableCell className="font-medium">{formatLocationLabel(record.location)}</TableCell>
                                    <TableCell>{record.rawStatus}</TableCell>
                                    <TableCell className="capitalize">{record.statusGroup}</TableCell>
                                    <TableCell>{formatRenoveDate(record.date)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No hay registros para la combinación de filtros actual.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>AV y SSCC &copy; 2026 | Seguimiento Renove</p>
        </div>
      </footer>
    </div>
  );
}
