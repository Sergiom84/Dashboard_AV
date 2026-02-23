import { KPI } from '@/lib/analytics';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface KPICardProps {
  kpi: KPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  const isPositive = kpi.trend === 'up';
  const isNegative = kpi.trend === 'down';

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label">{kpi.label}</p>
          <p className="kpi-value mt-2">{kpi.value.toLocaleString('es-ES')}</p>
          {kpi.subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
          )}
        </div>
        {kpi.change !== 0 && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
              isPositive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isNegative
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {isPositive && <ArrowUp size={16} />}
            {isNegative && <ArrowDown size={16} />}
            {kpi.trend === 'neutral' && <Minus size={16} />}
            <span>{Math.abs(kpi.change).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
