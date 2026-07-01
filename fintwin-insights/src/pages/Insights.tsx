import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { analyticsService, DashboardOverviewPayload, SubscriptionPayload, transactionService, TransactionPayload } from '@/services/api';
import { toast } from 'sonner';
import FinancialAdvisorCard from '@/components/FinancialAdvisorCard';
import FinancialHealthScoreCard from '@/components/FinancialHealthScoreCard';

type Trend = 'up' | 'down' | 'neutral';
type SimulatorState = Record<number, { removed: boolean; usage: number }>;

type InsightItem = { label: string; value: string; description: string; trend: Trend };

const ASSUMED_MONTHLY_INCOME = 50000;

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  if (trend === 'up') return <TrendingUp className="w-5 h-5 text-success" />;
  if (trend === 'down') return <TrendingDown className="w-5 h-5 text-destructive" />;
  return <Minus className="w-5 h-5 text-warning" />;
};

const getStabilityLabel = (stabilityPercent: number) => {
  if (stabilityPercent >= 70) return 'High';
  if (stabilityPercent >= 45) return 'Moderate';
  return 'Low';
};

const getSavingsTrend = (savingsPercent: number): Trend => {
  if (savingsPercent >= 20) return 'up';
  if (savingsPercent >= 10) return 'neutral';
  return 'down';
};

const getStabilityTrend = (stabilityPercent: number): Trend => {
  if (stabilityPercent >= 70) return 'up';
  if (stabilityPercent >= 45) return 'neutral';
  return 'down';
};

const getSubscriptionTrend = (wasteRatioPercent: number): Trend => {
  if (wasteRatioPercent <= 8) return 'up';
  if (wasteRatioPercent <= 15) return 'neutral';
  return 'down';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const computeHabitScore = (savingsRatio: number, spendingStability: number, subscriptionWaste: number, totalSpending: number) => {
  const savingsScore = Math.min(savingsRatio * 1.5, 1) * 40;
  const stabilityScore = spendingStability * 30;
  const subRatio = totalSpending > 0 ? subscriptionWaste / totalSpending : 0;
  const subScore = Math.max(0, 1 - subRatio * 3) * 20;
  return Math.round(clamp(savingsScore + stabilityScore + subScore + 10, 0, 100));
};

const computeCreditEstimate = (habitScore: number, savingsRatio: number, totalSpending: number) => {
  const base = 300 + (habitScore / 100) * 600;
  const savingsBonus = savingsRatio * 60;
  const activityBonus = 18; // Kept constant in simulation.
  const spendRatio = totalSpending / ASSUMED_MONTHLY_INCOME;
  const spendingPenalty = spendRatio > 0.8 ? (spendRatio - 0.8) * 100 : 0;
  return Math.round(clamp(base + savingsBonus + activityBonus - spendingPenalty, 300, 900));
};

const Insights = () => {
  const [overview, setOverview] = useState<DashboardOverviewPayload | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPayload[]>([]);
  const [transactions, setTransactions] = useState<TransactionPayload[]>([]);
  const [simulatorDraft, setSimulatorDraft] = useState<SimulatorState>({});
  const [appliedSimulator, setAppliedSimulator] = useState<SimulatorState>({});
  const [loading, setLoading] = useState(true);
  const [previousHealthScore, setPreviousHealthScore] = useState<number | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const [dashboardResp, subscriptionsResp, transactionsResp] = await Promise.all([
          analyticsService.getDashboard(),
          analyticsService.getSubscriptions(),
          transactionService.getTransactions(),
        ]);

        setOverview(dashboardResp.data.data);
        setSubscriptions(subscriptionsResp.data.data || []);
        setTransactions(transactionsResp.data.data || []);

        const initialSimulator: SimulatorState = {};
        (subscriptionsResp.data.data || []).forEach((item) => {
          initialSimulator[item.id] = { removed: false, usage: 30 };
        });
        setSimulatorDraft(initialSimulator);
        setAppliedSimulator(initialSimulator);
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Failed to load insights.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  const spendingTrendData = useMemo(() => {
    const grouped = transactions.reduce<Record<string, number>>((acc, tx) => {
      const key = tx.transactionDate;
      acc[key] = (acc[key] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([label, value]) => ({ label, value }));
  }, [transactions]);

  const financialHealthScore = useMemo(() => {
    const savingsPercent = Math.round(Number(overview?.savingsRatio ?? 0) * 100);
    const stabilityPercent = Math.round(Number(overview?.spendingStability ?? 0) * 100);
    const habit = Number(overview?.financialHabitScore ?? 0);
    const spending = Number(overview?.monthlySpending ?? 0);
    const subWaste = Number(overview?.subscriptionWaste ?? 0);
    const subscriptionHealth = spending > 0
      ? Math.max(0, 100 - Math.round((subWaste / spending) * 100 * 2))
      : 100;

    const weighted =
      savingsPercent * 0.25 +
      subscriptionHealth * 0.2 +
      stabilityPercent * 0.2 +
      habit * 0.35;

    return Math.round(clamp(weighted, 0, 100));
  }, [overview]);

  useEffect(() => {
    const stored = localStorage.getItem('fintwin_prev_financial_health_score');
    const parsed = stored ? Number(stored) : NaN;
    if (!Number.isNaN(parsed)) {
      setPreviousHealthScore(parsed);
    }

    localStorage.setItem('fintwin_prev_financial_health_score', String(financialHealthScore));
  }, [financialHealthScore]);

  const healthStatus = useMemo(() => {
    if (previousHealthScore === null) return 'Improving';
    if (financialHealthScore > previousHealthScore) return 'Improving';
    if (financialHealthScore === previousHealthScore) return 'Stable';
    return 'Needs Attention';
  }, [financialHealthScore, previousHealthScore]);

  const overallSignals = useMemo(() => {
    const savingsPercent = Math.round(Number(overview?.savingsRatio ?? 0) * 100);
    const stabilityPercent = Math.round(Number(overview?.spendingStability ?? 0) * 100);
    const spending = Number(overview?.monthlySpending ?? 0);
    const subWaste = Number(overview?.subscriptionWaste ?? 0);
    const wasteRatioPercent = spending > 0 ? Math.round((subWaste / spending) * 100) : 0;
    const creditScore = Number(overview?.creditScore ?? 0);

    return [
      {
        label: 'Savings',
        value: savingsPercent >= 20 ? 'Good' : 'Needs Improvement',
        ok: savingsPercent >= 20,
      },
      {
        label: 'Subscriptions',
        value: wasteRatioPercent > 12 ? 'High' : 'Controlled',
        ok: wasteRatioPercent <= 12,
      },
      {
        label: 'Expenses',
        value: stabilityPercent >= 50 ? 'Stable' : 'Volatile',
        ok: stabilityPercent >= 50,
      },
      {
        label: 'Credit Risk',
        value: creditScore >= 650 ? 'Low' : 'Medium',
        ok: creditScore >= 650,
      },
    ];
  }, [overview]);

  const loanEligibility = useMemo(() => {
    const creditScore = Number(overview?.creditScore ?? 0);
    const habit = Number(overview?.financialHabitScore ?? 0);
    const savingsRatio = Number(overview?.savingsRatio ?? 0);
    const spending = Number(overview?.monthlySpending ?? 0);
    const affordability = clamp(1 - spending / ASSUMED_MONTHLY_INCOME, 0, 1);

    const eligibilityFactor =
      (creditScore / 900) * 0.45 +
      (habit / 100) * 0.25 +
      savingsRatio * 0.2 +
      affordability * 0.1;

    const eligibleLoan = Math.round(20000 + eligibilityFactor * 80000);
    const interestRate = Number((8.2 + (1 - eligibilityFactor) * 4.5).toFixed(1));
    const riskLevel = eligibilityFactor >= 0.7 ? 'Low' : eligibilityFactor >= 0.45 ? 'Medium' : 'High';

    return { eligibleLoan, interestRate, riskLevel };
  }, [overview]);

  const computeProjectedForState = (state: SimulatorState) => {
    const baselineSpending = Number(overview?.monthlySpending ?? 0);
    const baselineWaste = Number(overview?.subscriptionWaste ?? 0);
    const stability = Number(overview?.spendingStability ?? 0);

    if (!subscriptions.length) {
      const savingsRatio = clamp((ASSUMED_MONTHLY_INCOME - baselineSpending) / ASSUMED_MONTHLY_INCOME, 0, 1);
      const habitScore = computeHabitScore(savingsRatio, stability, baselineWaste, baselineSpending);
      return {
        monthlySavings: 0,
        projectedWaste: baselineWaste,
        projectedSpending: baselineSpending,
        projectedSavingsRatio: savingsRatio,
        projectedHabitScore: habitScore,
        projectedCreditScore: computeCreditEstimate(habitScore, savingsRatio, baselineSpending),
      };
    }

    const projectedWaste = subscriptions.reduce((sum, sub) => {
      const simulated = state[sub.id] || { removed: false, usage: 30 };
      if (simulated.removed) return sum;
      const utilization = clamp(simulated.usage, 0, 100) / 100;
      return sum + Number(sub.monthlyAmount || 0) * (1 - utilization);
    }, 0);

    const monthlySavings = clamp(baselineWaste - projectedWaste, 0, baselineSpending);
    const projectedSpending = Math.max(0, baselineSpending - monthlySavings);
    const projectedSavingsRatio = clamp((ASSUMED_MONTHLY_INCOME - projectedSpending) / ASSUMED_MONTHLY_INCOME, 0, 1);
    const projectedHabitScore = computeHabitScore(projectedSavingsRatio, stability, projectedWaste, projectedSpending);
    const projectedCreditScore = computeCreditEstimate(projectedHabitScore, projectedSavingsRatio, projectedSpending);

    return {
      monthlySavings,
      projectedWaste,
      projectedSpending,
      projectedSavingsRatio,
      projectedHabitScore,
      projectedCreditScore,
    };
  };

  const draftProjected = useMemo(
    () => computeProjectedForState(simulatorDraft),
    [overview, subscriptions, simulatorDraft]
  );

  const projected = useMemo(
    () => computeProjectedForState(appliedSimulator),
    [overview, subscriptions, appliedSimulator]
  );

  const hasPendingChanges = useMemo(() => {
    return subscriptions.some((sub) => {
      const draft = simulatorDraft[sub.id] || { removed: false, usage: 30 };
      const applied = appliedSimulator[sub.id] || { removed: false, usage: 30 };
      return draft.removed !== applied.removed || draft.usage !== applied.usage;
    });
  }, [subscriptions, simulatorDraft, appliedSimulator]);

  const updateUsage = (id: number, usage: number) => {
    setSimulatorDraft((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { removed: false, usage: 30 }), usage },
    }));
  };

  const toggleRemove = (id: number) => {
    setSimulatorDraft((prev) => {
      const current = prev[id] || { removed: false, usage: 30 };
      return {
        ...prev,
        [id]: { ...current, removed: !current.removed },
      };
    });
  };

  const applyScenario = () => {
    if (!hasPendingChanges) return;
    setAppliedSimulator(simulatorDraft);
    toast.success('Scenario applied. Projected results updated.');
  };

  const resetScenario = () => {
    setSimulatorDraft(appliedSimulator);
  };

  const insights = useMemo<InsightItem[]>(() => {
    const savingsPercent = Math.round(Number(overview?.savingsRatio ?? 0) * 100);
    const stabilityPercent = Math.round(Number(overview?.spendingStability ?? 0) * 100);
    const monthlySpending = Number(overview?.monthlySpending ?? 0);
    const subscriptionWaste = Number(overview?.subscriptionWaste ?? 0);
    const wasteRatioPercent = monthlySpending > 0
      ? Math.round((subscriptionWaste / monthlySpending) * 100)
      : 0;

    return [
      {
        label: 'Savings Ratio',
        value: `${savingsPercent}%`,
        description:
          savingsPercent >= 20
            ? `You save ${savingsPercent}% of monthly income, which is above the healthy 20% benchmark.`
            : `You save ${savingsPercent}% of monthly income. Aim for 20%+ to improve resilience.`,
        trend: getSavingsTrend(savingsPercent),
      },
      {
        label: 'Expense Stability',
        value: getStabilityLabel(stabilityPercent),
        description:
          stabilityPercent >= 70
            ? `Your spending pattern is stable (${stabilityPercent}%), which improves financial predictability.`
            : `Spending stability is ${stabilityPercent}%. Try reducing erratic spikes to improve control.`,
        trend: getStabilityTrend(stabilityPercent),
      },
      {
        label: 'Subscription Pressure',
        value: `${wasteRatioPercent}%`,
        description:
          wasteRatioPercent <= 8
            ? `Subscription waste is only ${wasteRatioPercent}% of monthly spending. This is efficient.`
            : `Subscriptions consume ${wasteRatioPercent}% of monthly spending. Review recurring plans to optimize.`,
        trend: getSubscriptionTrend(wasteRatioPercent),
      },
    ];
  }, [overview]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Financial Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered analysis of your financial health</p>
      </div>

      <div className="chart-card mb-6">
        <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold">Overall Financial Health</p>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-2 mb-4">
          <p className="text-4xl font-extrabold text-foreground">{financialHealthScore} <span className="text-lg text-muted-foreground">/ 100</span></p>
          <p className="text-sm text-primary font-semibold">Status: {healthStatus}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {overallSignals.map((signal) => (
            <div key={signal.label} className="rounded-lg border border-border/70 bg-card px-3 py-2 flex items-center justify-between">
              <span className="text-sm text-foreground">{signal.label}</span>
              <span className={`text-sm inline-flex items-center gap-1 ${signal.ok ? 'text-success' : 'text-warning'}`}>
                {signal.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {signal.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mb-6">
        <FinancialHealthScoreCard score={financialHealthScore} status={healthStatus} />
      </div>

      <div className="chart-card mb-6 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold mb-2">Loan Eligibility Predictor</p>
        <h3 className="text-lg font-semibold text-foreground">Loan Eligibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Eligible Loan</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹{loanEligibility.eligibleLoan.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Interest Rate</p>
            <p className="text-2xl font-bold text-foreground mt-1">{loanEligibility.interestRate}%</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Risk Level</p>
            <p className="text-2xl font-bold text-foreground mt-1">{loanEligibility.riskLevel}</p>
          </div>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-primary/20 bg-[linear-gradient(125deg,hsl(239_84%_67%/.08),hsl(160_84%_39%/.06))] p-4 md:p-6">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold">Dedicated Section</p>
          <h2 className="text-xl font-bold text-foreground mt-1">AI Financial Advisor</h2>
          <p className="text-sm text-muted-foreground mt-1">Actionable recommendations, opportunities, confidence score, and live trend guidance in one place.</p>
        </div>

        <FinancialAdvisorCard
          savingsRatio={Math.round(Number(overview?.savingsRatio ?? 0) * 100)}
          subscriptionWaste={Number(overview?.subscriptionWaste ?? 0)}
          monthlySpending={Number(overview?.monthlySpending ?? 0)}
          financialHabitScore={Number(overview?.financialHabitScore ?? 0)}
          creditScore={Number(overview?.creditScore ?? 0)}
          subscriptions={subscriptions}
          analyzedTransactions={transactions.length}
          spendingTrend={spendingTrendData}
        />
      </section>

      <div className="max-w-2xl space-y-4">
        {loading && (
          <div className="stat-card text-sm text-muted-foreground">Loading insights...</div>
        )}

        {!loading && insights.length === 0 && (
          <div className="stat-card text-sm text-muted-foreground">No analytics data yet. Upload transactions to generate insights.</div>
        )}

        {insights.map((item) => (
          <div key={item.label} className="stat-card flex items-start gap-4 animate-fade-in">
            <div className="mt-0.5">
              <TrendIcon trend={item.trend} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                <span className={`text-lg font-bold ${
                  item.trend === 'up' ? 'text-success' : item.trend === 'down' ? 'text-destructive' : 'text-warning'
                }`}>
                  {item.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 chart-card">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Score Simulator</h3>
            <p className="text-sm text-muted-foreground">Scroll horizontally, adjust each service usage, or remove services to estimate score impact.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estimated model</span>
            <button
              onClick={resetScenario}
              disabled={!hasPendingChanges}
              className="text-xs px-2.5 py-1 rounded-md border border-border/70 text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={applyScenario}
              disabled={!hasPendingChanges}
              className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              Apply Scenario
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card px-3 py-2 mb-4">
          <p className="text-xs text-muted-foreground">
            {hasPendingChanges
              ? 'You have pending changes. Click Apply Scenario to update projected results.'
              : 'Projected results below reflect the currently applied scenario.'}
          </p>
          {hasPendingChanges && (
            <p className="text-xs text-primary mt-1">
              Pending preview: Habit {draftProjected.projectedHabitScore} | Credit {draftProjected.projectedCreditScore} | Savings ratio {Math.round(draftProjected.projectedSavingsRatio * 100)}%
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Projected Habit Score</p>
            <p className="text-2xl font-bold text-foreground mt-1">{projected.projectedHabitScore} / 100</p>
            <p className="text-xs text-success mt-1">Current: {overview?.financialHabitScore ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Projected Credit Score</p>
            <p className="text-2xl font-bold text-foreground mt-1">{projected.projectedCreditScore}</p>
            <p className="text-xs text-success mt-1">Current: {overview?.creditScore ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Potential Monthly Saving</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹{Math.round(projected.monthlySavings)}</p>
            <p className="text-xs text-muted-foreground mt-1">Savings ratio: {Math.round(projected.projectedSavingsRatio * 100)}%</p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
            No subscriptions detected yet. Upload recurring transactions to use the simulator.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {subscriptions.map((sub) => {
                const state = simulatorDraft[sub.id] || { removed: false, usage: 30 };
                return (
                  <div key={sub.id} className="w-[290px] rounded-xl border border-border/70 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{sub.serviceName}</p>
                        <p className="text-xs text-muted-foreground mt-1">₹{Math.round(Number(sub.monthlyAmount || 0))}/month</p>
                      </div>
                      <button
                        onClick={() => toggleRemove(sub.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${state.removed ? 'border-success/30 bg-success/10 text-success' : 'border-border text-muted-foreground'}`}
                      >
                        {state.removed ? 'Removed' : 'Keep'}
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Low value</span>
                        <span>Usage: {state.usage}%</span>
                        <span>High value</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={state.usage}
                        onChange={(e) => updateUsage(sub.id, Number(e.target.value))}
                        disabled={state.removed}
                        className="w-full accent-primary disabled:opacity-40"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Insights;
