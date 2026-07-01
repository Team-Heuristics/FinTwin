import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Sparkles, RefreshCcw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import SubscriptionTable from '@/components/SubscriptionTable';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { analyticsService, SubscriptionPayload, transactionService, TransactionPayload } from '@/services/api';
import { toast } from 'sonner';

const ASSUMED_MONTHLY_INCOME = 50000;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const subscriptionGroup = (service: string) => {
  const name = service.toLowerCase();
  if (name.includes('netflix') || name.includes('youtube') || name.includes('prime video')) return 'Entertainment';
  if (name.includes('spotify') || name.includes('music')) return 'Music';
  if (name.includes('amazon') || name.includes('flipkart')) return 'Shopping';
  return 'Other';
};

const usageFromOccurrences = (count: number): 'Low' | 'Medium' | 'High' => {
  if (count <= 2) return 'Low';
  if (count === 3) return 'Medium';
  return 'High';
};

const serviceIcon = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes('amazon')) return '🛒';
  if (value.includes('netflix')) return '🎬';
  if (value.includes('spotify')) return '🎵';
  if (value.includes('youtube')) return '📺';
  return '🔁';
};

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionPayload[]>([]);
  const [transactions, setTransactions] = useState<TransactionPayload[]>([]);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [savingsRatio, setSavingsRatio] = useState(0);
  const [financialHabitScore, setFinancialHabitScore] = useState(0);
  const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const [subsResp, dashboardResp, txResp] = await Promise.all([
        analyticsService.getSubscriptions(),
        analyticsService.getDashboard(),
        transactionService.getTransactions(),
      ]);

      setSubscriptions(subsResp.data.data || []);
      setTransactions(txResp.data.data || []);
      setMonthlySpending(Number(dashboardResp.data.data?.monthlySpending || 0));
      setSavingsRatio(Number(dashboardResp.data.data?.savingsRatio || 0));
      setFinancialHabitScore(Number(dashboardResp.data.data?.financialHabitScore || 0));
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load subscriptions.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const displaySubscriptions = useMemo(
    () => subscriptions.map((s) => ({ ...s, usageLevel: usageFromOccurrences(s.occurrenceCount) })),
    [subscriptions]
  );

  const inactiveSubscriptions = useMemo(
    () => subscriptions.filter((s) => !s.active),
    [subscriptions]
  );

  const lowUsageSubscriptions = useMemo(
    () => displaySubscriptions.filter((s) => s.usageLevel === 'Low'),
    [displaySubscriptions]
  );

  const potentialSavings = useMemo(
    () => (inactiveSubscriptions.length > 0 ? inactiveSubscriptions : lowUsageSubscriptions)
      .reduce((sum, item) => sum + Number(item.monthlyAmount || 0), 0),
    [inactiveSubscriptions, lowUsageSubscriptions]
  );

  const yearlyTotal = useMemo(
    () => subscriptions.reduce((sum, s) => sum + Number(s.monthlyAmount || 0), 0) * 12,
    [subscriptions]
  );

  const totalMonthlyCost = useMemo(
    () => subscriptions.reduce((sum, s) => sum + Number(s.monthlyAmount || 0), 0),
    [subscriptions]
  );

  const wasteRatioPercent = monthlySpending > 0 ? (potentialSavings / monthlySpending) * 100 : 0;
  const subscriptionWasteScore = Math.max(0, Math.min(100, Math.round(100 - wasteRatioPercent * 2.2)));

  const subscriptionSpendRatioPercent = monthlySpending > 0 ? (totalMonthlyCost / monthlySpending) * 100 : 0;
  const riskLevel = subscriptionSpendRatioPercent > 25 ? 'High Risk' : subscriptionSpendRatioPercent > 12 ? 'Medium Risk' : 'Low Risk';
  const riskClass = riskLevel === 'High Risk'
    ? 'text-destructive bg-destructive/10 border-destructive/30'
    : riskLevel === 'Medium Risk'
      ? 'text-warning bg-warning/10 border-warning/30'
      : 'text-success bg-success/10 border-success/30';

  const groupedSubscriptions = useMemo(() => {
    const grouped = new Map<string, SubscriptionPayload[]>();
    subscriptions.forEach((s) => {
      const group = subscriptionGroup(s.serviceName);
      const list = grouped.get(group) || [];
      list.push(s);
      grouped.set(group, list);
    });
    return Array.from(grouped.entries());
  }, [subscriptions]);

  const cancelTarget = useMemo(() => {
    if (subscriptions.length === 0) return null;
    const byId = subscriptions.find((s) => s.id === selectedCancelId);
    if (byId) return byId;
    return lowUsageSubscriptions[0] || subscriptions[0];
  }, [subscriptions, selectedCancelId, lowUsageSubscriptions]);

  const cancelImpact = useMemo(() => {
    if (!cancelTarget) return null;
    const monthlySave = Number(cancelTarget.monthlyAmount || 0);
    const newSavingsRatioPercent = Math.round((savingsRatio + monthlySave / ASSUMED_MONTHLY_INCOME) * 100);
    const habitIncrease = Math.max(2, Math.min(12, Math.round(monthlySave / 120)));
    return {
      monthlySave,
      newSavingsRatioPercent,
      habitIncrease,
    };
  }, [cancelTarget, savingsRatio]);

  const subscriptionTrend = useMemo(() => {
    const monthlyMap = new Map<string, number>();

    transactions
      .filter((t) => t.subscription)
      .forEach((t) => {
        const monthKey = t.transactionDate.slice(0, 7);
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(t.amount || 0));
      });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => {
        const [year, m] = month.split('-');
        const label = new Date(Number(year), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short' });
        return { month: label, amount: Math.round(amount) };
      });
  }, [transactions]);

  const hiddenSubscription = useMemo(() => {
    const knownServices = new Set(subscriptions.map((s) => normalize(s.serviceName)));
    const recurringCandidates = new Map<string, { description: string; count: number; total: number }>();
    const triggerPattern = /(google play|play store|icloud|membership|premium|subscription|auto debit|recurring)/i;

    transactions
      .filter((t) => !t.subscription)
      .forEach((t) => {
        const key = normalize(t.description);
        const existing = recurringCandidates.get(key) || { description: t.description, count: 0, total: 0 };
        existing.count += 1;
        existing.total += Number(t.amount || 0);
        recurringCandidates.set(key, existing);
      });

    const candidates = Array.from(recurringCandidates.values())
      .filter((c) => c.count >= 2 && triggerPattern.test(c.description) && !knownServices.has(normalize(c.description)))
      .sort((a, b) => b.total / b.count - a.total / a.count);

    if (!candidates.length) return null;
    const top = candidates[0];
    return {
      description: top.description,
      monthly: Math.round(top.total / top.count),
    };
  }, [transactions, subscriptions]);

  const lowUsageHighlight = lowUsageSubscriptions.find((s) => s.serviceName.toLowerCase().includes('netflix')) || lowUsageSubscriptions[0] || null;

  const biggestWaste = useMemo(() => {
    if (!subscriptions.length) return null;
    return [...subscriptions].sort((a, b) => Number(b.monthlyAmount || 0) - Number(a.monthlyAmount || 0))[0];
  }, [subscriptions]);

  const aiRecommendation = useMemo(() => {
    if (!subscriptions.length) {
      return {
        headline: 'No subscriptions detected yet.',
        detail: 'Upload a richer transaction history to unlock smarter subscription optimization recommendations.',
      };
    }

    if (cancelTarget && cancelImpact) {
      return {
        headline: `You spend ₹${Math.round(totalMonthlyCost).toLocaleString('en-IN')}/month on subscriptions.`,
        detail: `Cancelling ${cancelTarget.serviceName} alone could improve Financial Habit Score by +${cancelImpact.habitIncrease} and increase Savings Ratio to ${cancelImpact.newSavingsRatioPercent}%.`,
      };
    }

    return {
      headline: `Your subscription efficiency is ${subscriptionWasteScore}/100.`,
      detail: 'Focus on low-usage subscriptions first to improve savings without impacting important services.',
    };
  }, [subscriptions, cancelTarget, cancelImpact, totalMonthlyCost, subscriptionWasteScore]);

  return (
    <DashboardLayout>
      <div className="mb-8 rounded-2xl border border-primary/20 p-6 bg-[linear-gradient(120deg,hsl(239_84%_67%/.14),hsl(160_84%_39%/.10))] shadow-[0_14px_40px_hsl(239_84%_67%/0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Subscriptions Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Detected recurring subscriptions from your live transactions</p>
          </div>
          <button
            onClick={loadSubscriptions}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-card/80 px-3 py-2 text-sm font-medium text-foreground hover:bg-card transition-colors"
            disabled={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground border border-border/70">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {loading ? 'Loading...' : `${subscriptions.length} subscriptions detected`}
          </span>
          <span className="inline-flex items-center rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground border border-border/70">
            Potential savings: ₹{Math.round(potentialSavings)}/month
          </span>
          <span className="inline-flex items-center rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground border border-border/70">
            ₹{Math.round(yearlyTotal).toLocaleString('en-IN')}/year
          </span>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="chart-card border-primary/20 bg-[linear-gradient(125deg,hsl(239_84%_67%/.10),hsl(160_84%_39%/.06))]">
          <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold">AI Recommendation</p>
          <p className="text-sm text-foreground font-semibold mt-2">{aiRecommendation.headline}</p>
          <p className="text-sm text-muted-foreground mt-1">{aiRecommendation.detail}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="chart-card">
            <h3 className="text-sm font-semibold text-foreground">Subscription Risk Level</h3>
            <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${riskClass}`}>
              {riskLevel}
            </span>
            <p className="text-xs text-muted-foreground mt-2">
              Based on subscription spending as {subscriptionSpendRatioPercent.toFixed(1)}% of total monthly spending.
            </p>
          </div>

          <div className="chart-card">
            <h3 className="text-sm font-semibold text-foreground">Biggest Cost Driver</h3>
            {biggestWaste ? (
              <>
                <p className="text-base font-semibold text-foreground mt-2">{serviceIcon(biggestWaste.serviceName)} {biggestWaste.serviceName}</p>
                <p className="text-2xl font-bold text-foreground mt-1">₹{Math.round(Number(biggestWaste.monthlyAmount || 0)).toLocaleString('en-IN')}/month</p>
                <p className="text-xs text-muted-foreground mt-1">₹{Math.round(Number(biggestWaste.monthlyAmount || 0) * 12).toLocaleString('en-IN')}/year</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No subscription data available.</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground">Subscription Efficiency Score</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{subscriptionWasteScore} / 100</p>
          <p className="text-sm text-muted-foreground mt-1">{subscriptionWasteScore >= 75 ? 'Low waste detected' : subscriptionWasteScore >= 50 ? 'Moderate waste detected' : 'High waste detected'}</p>
        </div>

        {lowUsageHighlight && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm font-semibold text-warning">⚠ {lowUsageHighlight.serviceName} detected but low usage</p>
            <p className="text-sm text-foreground mt-1">Potential saving: ₹{Math.round(Number(lowUsageHighlight.monthlyAmount || 0))}/month</p>
            <button
              onClick={() => setSelectedCancelId(lowUsageHighlight.id)}
              className="mt-3 rounded-md border border-warning/30 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Cancel Suggestion
            </button>
          </div>
        )}

        {loading ? (
          <div className="stat-card text-sm text-muted-foreground">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="stat-card text-sm text-muted-foreground">
            No subscriptions detected yet. Upload more recurring transaction history to improve detection.
          </div>
        ) : (
          <SubscriptionTable subscriptions={displaySubscriptions} />
        )}

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Smart Subscription Grouping</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {groupedSubscriptions.map(([group, items]) => (
              <div key={group} className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{group}</p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id} className="text-sm text-foreground">{item.serviceName}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Cancel Impact Simulator</h3>
          {cancelTarget && cancelImpact ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <label className="text-xs text-muted-foreground">If you cancel:</label>
                <select
                  value={cancelTarget.id}
                  onChange={(e) => setSelectedCancelId(Number(e.target.value))}
                  className="text-sm rounded-md border border-border bg-card px-2 py-1"
                >
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.serviceName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className="text-xl font-bold text-foreground mt-1">₹{Math.round(cancelImpact.monthlySave)}/month</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <p className="text-xs text-muted-foreground">New savings ratio</p>
                  <p className="text-xl font-bold text-foreground mt-1">{cancelImpact.newSavingsRatioPercent}%</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <p className="text-xs text-muted-foreground">Financial habit score</p>
                  <p className="text-xl font-bold text-success mt-1">+{cancelImpact.habitIncrease}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current: {financialHabitScore}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No subscriptions available for simulation.</p>
          )}
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Subscription spending last 6 months</h3>
          {subscriptionTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription trend data yet.</p>
          ) : (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subscriptionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spending']} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(239 84% 67%)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                {subscriptionTrend.map((t) => (
                  <div key={t.month} className="rounded-md bg-accent/40 px-2 py-1 text-center">
                    <p className="text-[11px] text-muted-foreground">{t.month}</p>
                    <p className="text-xs font-semibold text-foreground">₹{t.amount}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {hiddenSubscription && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">⚠ Hidden Subscription Detected</p>
            <p className="text-sm text-foreground mt-1">{hiddenSubscription.description}</p>
            <p className="text-sm text-muted-foreground mt-1">₹{hiddenSubscription.monthly}/month</p>
          </div>
        )}

        <div className="stat-card flex items-start gap-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {inactiveSubscriptions.length > 0
                ? `Cancel or pause ${inactiveSubscriptions.length} inactive subscription${inactiveSubscriptions.length > 1 ? 's' : ''} to save up to `
                : 'All detected subscriptions are currently marked active. Continue monitoring usage each month; you can still optimize by reviewing high-cost plans.'}
              {inactiveSubscriptions.length > 0 && (
                <span className="font-semibold text-success">₹{Math.round(potentialSavings)}/month</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscriptions;
