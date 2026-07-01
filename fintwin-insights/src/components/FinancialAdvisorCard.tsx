import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, CircleCheck, TrendingUp, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { SubscriptionPayload } from '@/services/api';

interface FinancialAdvisorCardProps {
  savingsRatio: number;
  subscriptionWaste: number;
  monthlySpending: number;
  financialHabitScore: number;
  creditScore: number;
  subscriptions: SubscriptionPayload[];
  analyzedTransactions: number;
  spendingTrend: Array<{ label: string; value: number }>;
}

type AdvisorTone = 'warning' | 'risk' | 'positive' | 'improvement';

interface AdvisorInsight {
  tone: AdvisorTone;
  title: string;
  description: string;
  actions: Array<{ label: string; route: string }>;
}

const PREV_SPENDING_STORAGE_KEY = 'fintwin_prev_monthly_spending';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const toneStyles: Record<AdvisorTone, string> = {
  warning: 'bg-warning/10 border-warning/30 text-warning',
  risk: 'bg-destructive/10 border-destructive/30 text-destructive',
  positive: 'bg-success/10 border-success/30 text-success',
  improvement: 'bg-primary/10 border-primary/30 text-primary',
};

const toneIcon: Record<AdvisorTone, LucideIcon> = {
  warning: AlertTriangle,
  risk: ShieldAlert,
  positive: CircleCheck,
  improvement: TrendingUp,
};

const FinancialAdvisorCard = ({
  savingsRatio,
  subscriptionWaste,
  monthlySpending,
  financialHabitScore,
  creditScore,
  subscriptions,
  analyzedTransactions,
  spendingTrend,
}: FinancialAdvisorCardProps) => {
  const navigate = useNavigate();
  const [previousSpending, setPreviousSpending] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PREV_SPENDING_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;

    if (!Number.isNaN(parsed) && parsed > 0) {
      setPreviousSpending(parsed);
    }

    if (monthlySpending > 0) {
      localStorage.setItem(PREV_SPENDING_STORAGE_KEY, String(monthlySpending));
    }
  }, [monthlySpending]);

  const recommendations = useMemo(() => {
    const items: AdvisorInsight[] = [];

    if (savingsRatio < 20) {
      items.push({
        tone: 'warning',
        title: 'Savings Ratio Below Target',
        description: `Your savings ratio is ${Math.round(savingsRatio)}%. Try to move toward at least 20% monthly savings.`,
        actions: [
          { label: 'Improve Savings', route: '/upload' },
          { label: 'Optimize Spending', route: '/insights' },
        ],
      });
    }

    if (subscriptionWaste > 500) {
      items.push({
        tone: 'risk',
        title: 'High Subscription Waste',
        description: 'Subscription spending is elevated. Review and cancel low-value recurring services.',
        actions: [
          { label: 'View Subscriptions', route: '/subscriptions' },
          { label: 'Optimize Spending', route: '/insights' },
        ],
      });
      const recoverable = Math.min(300, Math.round(subscriptionWaste * 0.4));
      items.push({
        tone: 'improvement',
        title: 'Quick Improvement Opportunity',
        description: `Reducing subscriptions by about ${formatCurrency(recoverable)}/month could improve your savings trajectory.`,
        actions: [{ label: 'View Subscriptions', route: '/subscriptions' }],
      });
    }

    if (previousSpending !== null && monthlySpending > previousSpending) {
      items.push({
        tone: 'warning',
        title: 'Overspending Alert',
        description: `Monthly spending increased from ${formatCurrency(previousSpending)} to ${formatCurrency(monthlySpending)}.`,
        actions: [
          { label: 'Optimize Spending', route: '/insights' },
          { label: 'Improve Savings', route: '/upload' },
        ],
      });
    }

    if (financialHabitScore < 50) {
      items.push({
        tone: 'risk',
        title: 'Low Financial Habit Score',
        description: 'Your habit score is below 50. Improve consistency with weekly budgets and spending caps.',
        actions: [{ label: 'Improve Savings', route: '/upload' }],
      });
    }

    if (creditScore < 650) {
      items.push({
        tone: 'improvement',
        title: 'Credit Profile Needs Boost',
        description: 'Consistent savings and reduced recurring waste can gradually improve your credit score.',
        actions: [{ label: 'Optimize Spending', route: '/insights' }],
      });
    }

    if (items.length < 3) {
      items.push({
        tone: 'positive',
        title: 'Healthy Momentum',
        description: 'Your finances are on a stable path. Keep reviewing recurring expenses each month.',
        actions: [{ label: 'View Dashboard', route: '/dashboard' }],
      });
    }

    if (items.length < 3) {
      items.push({
        tone: 'improvement',
        title: 'Automate Better Habits',
        description: 'Set an automatic monthly transfer to savings to strengthen long-term discipline.',
        actions: [{ label: 'Improve Savings', route: '/upload' }],
      });
    }

    return items.slice(0, 4);
  }, [creditScore, financialHabitScore, monthlySpending, previousSpending, savingsRatio, subscriptionWaste]);

  const potentialSavings = useMemo(() => {
    const contributors = [...subscriptions]
      .sort((a, b) => Number(b.monthlyAmount || 0) - Number(a.monthlyAmount || 0))
      .slice(0, 3);

    const monthly = contributors.reduce((sum, item) => sum + Number(item.monthlyAmount || 0), 0);

    return {
      monthly,
      yearly: monthly * 12,
      contributors,
    };
  }, [subscriptions]);

  const confidence = useMemo(() => {
    const value = Math.max(60, Math.min(95, Math.round(55 + analyzedTransactions * 0.35)));
    return value;
  }, [analyzedTransactions]);

  return (
    <div className="chart-card">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">AI Financial Advisor</h3>
        </div>

        <div className="w-full sm:w-[220px] rounded-xl border border-border/70 bg-card p-3">
          <p className="text-xs text-muted-foreground mb-2">Your spending trend</p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingTrend}>
                <Line type="monotone" dataKey="value" stroke="hsl(239 84% 67%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-3 mb-3">
        <p className="text-xs text-muted-foreground">AI Confidence: <span className="font-semibold text-foreground">{confidence}%</span></p>
        <p className="text-xs text-muted-foreground mt-1">Based on {analyzedTransactions} analyzed transactions</p>
      </div>

      <div className="space-y-3">
        {recommendations.map((item, idx) => {
          const Icon = toneIcon[item.tone];
          return (
            <div key={idx} className={`rounded-xl border p-3 ${toneStyles[item.tone]}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs leading-relaxed mt-1 text-foreground/80">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.route)}
                        className="text-xs px-2.5 py-1 rounded-md border border-border/70 bg-card text-foreground hover:bg-accent transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-success/30 bg-success/10 p-4 mt-4">
        <p className="text-xs uppercase tracking-wide text-success font-semibold">Potential Savings Opportunity</p>
        <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(potentialSavings.monthly)}</p>
        <p className="text-xs text-muted-foreground">Estimated yearly saving: {formatCurrency(potentialSavings.yearly)}</p>

        <div className="mt-3">
          <p className="text-xs font-medium text-foreground mb-1">By cancelling or downgrading:</p>
          {potentialSavings.contributors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No subscription contributors detected yet.</p>
          ) : (
            <ul className="space-y-1">
              {potentialSavings.contributors.map((item) => (
                <li key={item.id} className="text-xs text-muted-foreground">• {item.serviceName}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAdvisorCard;
