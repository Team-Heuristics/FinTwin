import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ChartCard from '@/components/ChartCard';
import { analyticsService, DashboardOverviewPayload, emailReportService } from '@/services/api';
import FinancialHealthScoreCard from '@/components/FinancialHealthScoreCard';
import AIAssistantWidget from '@/components/AIAssistantWidget';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const piePalette = [
  'hsl(350, 89%, 60%)',
  'hsl(239, 84%, 67%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 67%, 55%)',
  'hsl(220, 9%, 46%)',
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: 'hsl(220, 9%, 46%)', font: { size: 12, family: 'Inter' } } },
    y: { grid: { color: 'hsl(220, 13%, 91%)' }, ticks: { color: 'hsl(220, 9%, 46%)', font: { size: 12, family: 'Inter' } } },
  },
  animation: { duration: 1100, easing: 'easeOutQuart' as const },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12, family: 'Inter' } },
    },
  },
  animation: { duration: 1100, easing: 'easeOutQuart' as const },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

type MetricCard = {
  label: string;
  value: number;
  target: number;
  targetLabel: string;
  inverse?: boolean;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [assistantOpenSignal, setAssistantOpenSignal] = useState(0);
  const [sendingReport, setSendingReport] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState<{ habit: number } | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await analyticsService.getDashboard();
      setOverview(response.data.data);
      setLastUpdatedAt(new Date());
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load dashboard data.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('fintwin_dashboard_snapshot');
    if (stored) {
      try {
        setPreviousSnapshot(JSON.parse(stored));
      } catch {
        // Ignore malformed local snapshot.
      }
    }

    if (overview) {
      localStorage.setItem(
        'fintwin_dashboard_snapshot',
        JSON.stringify({ habit: Number(overview.financialHabitScore || 0) })
      );
    }
  }, [overview]);

  const spendingBreakdownEntries = useMemo(
    () => Object.entries(overview?.categoryBreakdown || {}),
    [overview]
  );

  const totalSpending = Number(overview?.monthlySpending || 0);
  const savingsRatioPercent = Math.round(Number(overview?.savingsRatio || 0) * 100);
  const stabilityPercent = Math.round(Number(overview?.spendingStability || 0) * 100);
  const subscriptionWaste = Number(overview?.subscriptionWaste || 0);
  const subscriptionSpending = useMemo(
    () => (overview?.subscriptions || []).reduce((sum, sub) => sum + Number(sub.monthlyAmount || 0), 0),
    [overview]
  );

  const healthScore = useMemo(() => {
    const subscriptionHealth = totalSpending > 0 ? Math.max(0, 100 - ((subscriptionWaste / totalSpending) * 100 * 2)) : 100;
    const weighted =
      Number(overview?.financialHabitScore || 0) * 0.42 +
      savingsRatioPercent * 0.25 +
      stabilityPercent * 0.18 +
      subscriptionHealth * 0.15;
    return Math.round(Math.max(0, Math.min(100, weighted)));
  }, [overview, savingsRatioPercent, stabilityPercent, subscriptionWaste, totalSpending]);

  const healthRecommendation = healthScore >= 70
    ? 'Healthy momentum. Maintain savings discipline and keep recurring costs optimized.'
    : healthScore >= 40
      ? 'Improve savings and reduce subscriptions to increase your score.'
      : 'Needs attention: cut high recurring costs and reduce category concentration this month.';

  const biggestCategory = useMemo(() => {
    if (!spendingBreakdownEntries.length) return null;
    const [key, value] = spendingBreakdownEntries
      .map(([label, amount]) => [label, Number(amount)] as const)
      .sort((a, b) => b[1] - a[1])[0];

    const percent = totalSpending > 0 ? Math.round((value / totalSpending) * 100) : 0;
    return { key, value, percent };
  }, [spendingBreakdownEntries, totalSpending]);

  const topSubscription = useMemo(() => {
    const subs = overview?.subscriptions || [];
    if (!subs.length) return null;
    return [...subs].sort((a, b) => Number(b.monthlyAmount || 0) - Number(a.monthlyAmount || 0))[0];
  }, [overview]);

  const habitDelta = previousSnapshot ? Number(overview?.financialHabitScore || 0) - previousSnapshot.habit : 0;

  const metricCards: MetricCard[] = [
    {
      label: 'Savings Ratio',
      value: savingsRatioPercent,
      target: 20,
      targetLabel: 'Target 20%',
    },
    {
      label: 'Spending Stability',
      value: stabilityPercent,
      target: 65,
      targetLabel: 'Target 65%',
    },
    {
      label: 'Subscription Burden',
      value: totalSpending > 0 ? Math.round((subscriptionWaste / totalSpending) * 100) : 0,
      target: 12,
      targetLabel: 'Target <12%',
      inverse: true,
    },
  ];

  const getMetricTone = (item: MetricCard) => {
    if (!item.inverse) {
      if (item.value >= item.target) return 'success';
      if (item.value >= item.target * 0.7) return 'warning';
      return 'destructive';
    }

    if (item.value <= item.target) return 'success';
    if (item.value <= item.target + 8) return 'warning';
    return 'destructive';
  };

  const getProgress = (item: MetricCard) => {
    if (!item.inverse) {
      return Math.max(6, Math.min(100, Math.round((item.value / item.target) * 100)));
    }

    if (item.value <= item.target) return 100;
    return Math.max(6, Math.min(100, 100 - (item.value - item.target) * 5));
  };

  const trendPoints = useMemo(() => {
    const tx = [...(overview?.topTransactions || [])]
      .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

    return {
      labels: tx.map((item) => item.transactionDate),
      data: tx.map((item) => Number(item.amount)),
    };
  }, [overview]);

  const trendData = useMemo(
    () => ({
      labels: trendPoints.labels,
      datasets: [
        {
          label: 'Amount',
          data: trendPoints.data,
          borderColor: 'hsl(239, 84%, 67%)',
          backgroundColor: 'hsla(239, 84%, 67%, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: 'hsl(239, 84%, 67%)',
          pointBorderColor: 'hsl(0, 0%, 100%)',
          pointBorderWidth: 2,
        },
      ],
    }),
    [trendPoints]
  );

  const spendingData = useMemo(
    () => ({
      labels: spendingBreakdownEntries.map(([label]) => label),
      datasets: [
        {
          data: spendingBreakdownEntries.map(([, amount]) => Number(amount)),
          backgroundColor: spendingBreakdownEntries.map((_, idx) => piePalette[idx % piePalette.length]),
          borderWidth: 0,
        },
      ],
    }),
    [spendingBreakdownEntries]
  );

  const hasTrendData = trendPoints.data.length > 0;
  const hasPieData = spendingBreakdownEntries.length > 0;

  const minutesAgo = useMemo(() => {
    if (!lastUpdatedAt) return null;
    const minutes = Math.max(0, Math.floor((nowTick - lastUpdatedAt.getTime()) / 60000));
    return minutes;
  }, [lastUpdatedAt, nowTick]);

  const freshnessLabel = minutesAgo === null ? 'Syncing...' : minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`;

  const handleSendFinancialReport = async () => {
    if (sendingReport) return;

    setSendingReport(true);
    try {
      const response = await emailReportService.sendFinancialReport();
      toast.success(response.data.message || 'Financial report sent to your email.');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to send financial report right now.';
      toast.error(message);
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Modern analytics view of your financial health and next actions.</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/90 px-4 py-2 shadow-[0_10px_30px_hsl(220_30%_10%/0.05)]">
          <p className="text-xs text-muted-foreground">Last updated: <span className="font-semibold text-foreground">{freshnessLabel}</span></p>
          <p className="text-xs text-muted-foreground mt-1">Transactions analyzed: <span className="font-semibold text-foreground">{overview?.topTransactions?.length ?? 0}</span></p>
        </div>
      </div>

      <div className="mb-8">
        <FinancialHealthScoreCard score={healthScore} recommendation={healthRecommendation} />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSendFinancialReport}
            disabled={sendingReport}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-[linear-gradient(120deg,hsl(239_84%_67%/.12),hsl(160_84%_39%/.10))] px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_10px_26px_hsl(239_84%_67%/0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_hsl(239_84%_67%/0.18)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 text-primary ${sendingReport ? 'animate-pulse' : ''}`} />
            {sendingReport ? 'Sending Report...' : 'Email My Financial Report'}
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((item) => {
          const tone = getMetricTone(item);
          const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-destructive';
          const barClass = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-destructive';
          const progress = getProgress(item);

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_hsl(220_30%_10%/0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_hsl(239_84%_67%/0.12)]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <span className="text-[11px] font-medium text-muted-foreground">{item.targetLabel}</span>
              </div>
              <p className={`text-3xl font-bold mt-3 ${toneClass}`}>{item.value}%</p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${progress}%`, transition: 'width 800ms ease' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8 rounded-2xl border border-border/70 bg-card p-4 shadow-[0_10px_30px_hsl(220_30%_10%/0.05)]">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mt-1">Take action on your insights in one click.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => navigate('/upload')}
            className="group rounded-xl border border-border/70 bg-[linear-gradient(120deg,hsl(239_84%_67%/.10),transparent)] px-4 py-3 text-left shadow-[0_8px_24px_hsl(239_84%_67%/0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_hsl(239_84%_67%/0.16)]"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Upload className="w-4 h-4 text-primary" /> Upload Transactions
            </span>
            <p className="text-xs text-muted-foreground mt-1">Add latest statement to refresh analytics.</p>
          </button>
          <button
            onClick={() => navigate('/subscriptions')}
            className="group rounded-xl border border-border/70 bg-[linear-gradient(120deg,hsl(160_84%_39%/.10),transparent)] px-4 py-3 text-left shadow-[0_8px_24px_hsl(160_84%_39%/0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_hsl(160_84%_39%/0.16)]"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wallet className="w-4 h-4 text-success" /> Optimize Subscriptions
            </span>
            <p className="text-xs text-muted-foreground mt-1">Reduce recurring costs and waste score.</p>
          </button>
          <button
            onClick={() => setAssistantOpenSignal((signal) => signal + 1)}
            className="group rounded-xl border border-border/70 bg-[linear-gradient(120deg,hsl(38_92%_50%/.10),transparent)] px-4 py-3 text-left shadow-[0_8px_24px_hsl(38_92%_50%/0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_hsl(38_92%_50%/0.16)]"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-warning" /> Ask FinTwin AI
            </span>
            <p className="text-xs text-muted-foreground mt-1">Get personalized score and spending guidance.</p>
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Top Insights</h3>
          <span className="text-xs text-muted-foreground">Actionable alerts from current data</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-warning/25 bg-warning/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_hsl(38_92%_50%/0.14)]">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> Spending Concentration
              </span>
              <span className="text-[11px] font-semibold text-warning">High</span>
            </div>
            <p className="text-sm text-foreground mt-3">
              {biggestCategory
                ? `${biggestCategory.percent}% of spending is in ${biggestCategory.key}.`
                : 'Not enough spending data to detect concentration.'}
            </p>
            <button
              onClick={() => navigate('/insights')}
              className="mt-4 inline-flex items-center gap-1 rounded-lg border border-warning/35 bg-white/80 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/10"
            >
              View Transactions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_hsl(350_89%_60%/0.14)]">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                <CircleDollarSign className="w-3.5 h-3.5" /> Subscription Risk
              </span>
              <span className="text-[11px] font-semibold text-destructive">Medium</span>
            </div>
            <p className="text-sm text-foreground mt-3">
              {topSubscription
                ? `${topSubscription.serviceName} ${formatCurrency(Number(topSubscription.monthlyAmount || 0))}/month is your top recurring charge.`
                : 'No major recurring charge risk detected right now.'}
            </p>
            <button
              onClick={() => navigate('/subscriptions')}
              className="mt-4 inline-flex items-center gap-1 rounded-lg border border-destructive/35 bg-white/80 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              Optimize Subscriptions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-success/25 bg-success/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_hsl(160_84%_39%/0.14)]">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
                <TrendingUp className="w-3.5 h-3.5" /> Score Momentum
              </span>
              <span className="text-[11px] font-semibold text-success">Live</span>
            </div>
            <p className="text-sm text-foreground mt-3">{habitDelta >= 0 ? `+${habitDelta}` : habitDelta} points this month.</p>
            <button
              onClick={() => setAssistantOpenSignal((signal) => signal + 1)}
              className="mt-4 inline-flex items-center gap-1 rounded-lg border border-success/35 bg-white/80 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/10"
            >
              Improve Score <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_hsl(220_30%_10%/0.05)]">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Financial Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-background border border-border/70 px-3 py-3">
            <p className="text-xs text-muted-foreground">Total Spending</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(totalSpending)}</p>
          </div>
          <div className="rounded-xl bg-background border border-border/70 px-3 py-3">
            <p className="text-xs text-muted-foreground">Subscription Spending</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(subscriptionSpending)}</p>
          </div>
          <div className="rounded-xl bg-background border border-border/70 px-3 py-3">
            <p className="text-xs text-muted-foreground">Top Category</p>
            <p className="text-lg font-bold text-foreground mt-1">{biggestCategory?.key || 'N/A'}</p>
          </div>
          <div className="rounded-xl bg-background border border-border/70 px-3 py-3">
            <p className="text-xs text-muted-foreground">Savings Ratio</p>
            <p className="text-lg font-bold text-foreground mt-1">{savingsRatioPercent}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Transactions Trend">
          <div className="h-[300px]">
            {hasTrendData ? (
              <Line data={trendData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Upload transactions to see trend data
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Spending Distribution">
          <div className="h-[300px]">
            {hasPieData ? (
              <Pie data={spendingData} options={pieOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Upload transactions to see category distribution
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <AIAssistantWidget overview={overview} loading={loading} openSignal={assistantOpenSignal} />
    </DashboardLayout>
  );
};

export default Dashboard;
