import { Link, useLocation } from 'wouter';
import { BarChart3, TrendingUp } from 'lucide-react';

interface MainNavProps {
  rightSlot?: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard AV', icon: BarChart3 },
  { path: '/tendencias', label: 'Tendencias', icon: TrendingUp },
];

export default function MainNav({ rightSlot }: MainNavProps) {
  const [location] = useLocation();

  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50 print:static print:shadow-none">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-foreground hidden sm:block">Soporte AV</h1>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {rightSlot && (
            <div className="flex items-center gap-4 print:hidden">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
