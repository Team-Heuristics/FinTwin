interface FinancialHealthScoreCardProps {
  score: number;
  recommendation: string;
}

const FinancialHealthScoreCard = ({ score, recommendation }: FinancialHealthScoreCardProps) => {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const scoreTone = normalized <= 40 ? 'poor' : normalized < 70 ? 'moderate' : 'healthy';
  const strokeColor = scoreTone === 'poor'
    ? 'hsl(350 89% 60%)'
    : scoreTone === 'moderate'
      ? 'hsl(38 92% 50%)'
      : 'hsl(160 84% 39%)';

  const statusColorClass = scoreTone === 'poor'
    ? 'text-destructive'
    : scoreTone === 'moderate'
      ? 'text-warning'
      : 'text-success';
  const statusText = scoreTone === 'poor' ? 'Needs Attention' : scoreTone === 'moderate' ? 'Moderate' : 'Healthy';

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border/70 p-6 bg-[linear-gradient(135deg,hsl(239_84%_67%/.10),hsl(160_84%_39%/.06),hsl(0_0%_100%))] shadow-[0_16px_45px_hsl(220_30%_10%/0.08)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-primary font-semibold">Financial Health Score</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">Your Money Health Index</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">A blended score from savings, subscription pressure, expense stability, and spending behavior.</p>
          <p className="text-sm mt-4">
            <span className="text-muted-foreground">Status:</span>{' '}
            <span className={`font-semibold ${statusColorClass}`}>{statusText}</span>
          </p>
          <p className="text-sm text-foreground/90 mt-2">{recommendation}</p>
        </div>

        <div className="relative w-40 h-40 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140" role="img" aria-label="Financial health score">
            <circle cx="70" cy="70" r={radius} stroke="hsl(220 13% 91%)" strokeWidth="12" fill="none" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={strokeColor}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 900ms ease, stroke 350ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground leading-none">{normalized}</span>
            <span className="text-xs text-muted-foreground mt-1">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScoreCard;
