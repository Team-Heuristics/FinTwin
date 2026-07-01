interface Subscription {
  id?: number;
  serviceName: string;
  monthlyAmount: number;
  occurrenceCount: number;
  active: boolean;
  usageLevel: 'Low' | 'Medium' | 'High';
}

const serviceIcon = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes('amazon')) return '🛒';
  if (value.includes('netflix')) return '🎬';
  if (value.includes('spotify')) return '🎵';
  if (value.includes('youtube')) return '📺';
  return '🔁';
};

interface SubscriptionTableProps {
  subscriptions: Subscription[];
}

const SubscriptionTable = ({ subscriptions }: SubscriptionTableProps) => {
  const total = subscriptions.reduce((sum, s) => sum + Number(s.monthlyAmount || 0), 0);
  const yearly = total * 12;

  const usageBadge = (level: 'Low' | 'Medium' | 'High') => {
    if (level === 'Low') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (level === 'Medium') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-success/10 text-success border-success/20';
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-[0_10px_30px_hsl(220_30%_10%/0.05)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="table-header text-left px-6 py-4">Service</th>
            <th className="table-header text-center px-6 py-4">Usage Level</th>
            <th className="table-header text-center px-6 py-4">Status</th>
            <th className="table-header text-center px-6 py-4">Occurrences</th>
            <th className="table-header text-right px-6 py-4">Monthly Cost</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id ?? sub.serviceName} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-foreground">
                <span className="mr-2">{serviceIcon(sub.serviceName)}</span>
                {sub.serviceName}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${usageBadge(sub.usageLevel)}`}>
                  {sub.usageLevel}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${sub.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {sub.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-center text-muted-foreground">{sub.occurrenceCount}</td>
              <td className="px-6 py-4 text-sm text-right text-foreground">₹{Math.round(Number(sub.monthlyAmount || 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-accent/30">
            <td className="px-6 py-4 text-sm font-semibold text-foreground">Total</td>
            <td className="px-6 py-4" />
            <td className="px-6 py-4" />
            <td className="px-6 py-4" />
            <td className="px-6 py-4 text-sm font-semibold text-right text-foreground">₹{Math.round(total)}/month</td>
          </tr>
          <tr className="bg-accent/20 border-t border-border">
            <td className="px-6 py-3 text-xs text-muted-foreground">Yearly Subscription Cost</td>
            <td className="px-6 py-3" />
            <td className="px-6 py-3" />
            <td className="px-6 py-3" />
            <td className="px-6 py-3 text-xs font-semibold text-right text-foreground">₹{Math.round(yearly).toLocaleString('en-IN')}/year</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SubscriptionTable;
