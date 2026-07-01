import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard = ({ title, value, subtitle, icon: Icon, highlight, trend }: StatCardProps) => {
  return (
    <div className={`${highlight ? 'stat-card-highlight' : 'stat-card'} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 rounded-lg bg-primary/5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className={`text-sm mt-1 ${
          trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
