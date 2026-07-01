import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { DashboardOverviewPayload } from '@/services/api';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

interface AIAssistantWidgetProps {
  overview: DashboardOverviewPayload | null;
  loading: boolean;
  openSignal?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const suggestedQuestions = [
  'How can I increase my financial health score?',
  'Should I cancel Netflix?',
  'Why is my credit score low?',
];

const getBiggestCategory = (overview: DashboardOverviewPayload | null) => {
  const entries = Object.entries(overview?.categoryBreakdown || {}).map(([name, amount]) => [name, Number(amount)] as const);
  if (!entries.length) return null;
  const [category, value] = entries.sort((a, b) => b[1] - a[1])[0];
  const total = Number(overview?.monthlySpending || 0);
  const share = total > 0 ? Math.round((value / total) * 100) : 0;
  return { category, value, share };
};

const getTopSubscription = (overview: DashboardOverviewPayload | null) => {
  const subscriptions = overview?.subscriptions || [];
  if (!subscriptions.length) return null;
  return [...subscriptions].sort((a, b) => Number(b.monthlyAmount || 0) - Number(a.monthlyAmount || 0))[0];
};

const getSubscriptionByName = (overview: DashboardOverviewPayload | null, name: string) => {
  return (overview?.subscriptions || []).find((subscription) =>
    subscription.serviceName.toLowerCase().includes(name.toLowerCase())
  ) || null;
};

const buildHealthScoreAdvice = (overview: DashboardOverviewPayload | null) => {
  const savingsRatio = Math.round(Number(overview?.savingsRatio || 0) * 100);
  const stability = Math.round(Number(overview?.spendingStability || 0) * 100);
  const biggestCategory = getBiggestCategory(overview);
  const topSubscription = getTopSubscription(overview);
  const totalSpending = Number(overview?.monthlySpending || 0);
  const subscriptionWaste = Number(overview?.subscriptionWaste || 0);
  const subscriptionWasteShare = totalSpending > 0 ? Math.round((subscriptionWaste / totalSpending) * 100) : 0;

  const actions = [
    savingsRatio < 20
      ? `Lift your savings ratio from ${savingsRatio}% toward 20%+. Redirect one fixed amount every month before spending starts.`
      : `Your savings ratio is already ${savingsRatio}%, so keep that discipline steady.` ,
    stability < 65
      ? `Your spending stability is ${stability}%, so smoother week-to-week spending will help. Reduce impulse-heavy categories first.`
      : `Your spending stability is ${stability}%, which is already supporting the score.` ,
    biggestCategory
      ? `Your biggest spending category is ${biggestCategory.category} at ${formatCurrency(biggestCategory.value)} (${biggestCategory.share}% of spend). Cutting that by 10-15% is the fastest lever.`
      : 'Upload more transactions to identify the biggest category dragging your score.',
    topSubscription
      ? `Your highest recurring charge is ${topSubscription.serviceName} at ${formatCurrency(Number(topSubscription.monthlyAmount))}/month. Review whether it is still worth the cost.`
      : 'You do not have a major recurring charge issue right now.',
    subscriptionWaste > 0
      ? `Estimated subscription waste is ${formatCurrency(subscriptionWaste)}/month, about ${subscriptionWasteShare}% of monthly spend. Reducing that directly improves score headroom.`
      : 'Subscription waste looks low, so category discipline matters more than cancellations right now.',
  ];

  return actions.join(' ');
};

const buildNetflixAdvice = (overview: DashboardOverviewPayload | null) => {
  const netflix = getSubscriptionByName(overview, 'netflix');
  const topSubscription = getTopSubscription(overview);
  const savingsRatio = Math.round(Number(overview?.savingsRatio || 0) * 100);
  const subscriptionWaste = Number(overview?.subscriptionWaste || 0);

  if (!netflix) {
    return topSubscription
      ? `I do not see Netflix in your detected subscriptions. Your biggest recurring charge is ${topSubscription.serviceName} at ${formatCurrency(Number(topSubscription.monthlyAmount))}/month, so review that first.`
      : 'I do not see Netflix in your detected subscriptions yet. Upload a broader transaction history if you want me to check recurring entertainment spend.';
  }

  const monthlyAmount = Number(netflix.monthlyAmount || 0);
  const shouldCancel = savingsRatio < 20 || subscriptionWaste > monthlyAmount;

  if (shouldCancel) {
    return `Netflix is costing ${formatCurrency(monthlyAmount)}/month. Given your ${savingsRatio}% savings ratio and ${formatCurrency(subscriptionWaste)}/month of subscription waste, it is a reasonable cancel-or-downgrade candidate if you are not using it weekly.`;
  }

  return `Netflix is costing ${formatCurrency(monthlyAmount)}/month. I would not make it your first cut unless usage is low. Bigger score gains will likely come from improving savings discipline and trimming larger categories first.`;
};

const buildCreditScoreAdvice = (overview: DashboardOverviewPayload | null) => {
  const savingsRatio = Math.round(Number(overview?.savingsRatio || 0) * 100);
  const stability = Math.round(Number(overview?.spendingStability || 0) * 100);
  const biggestCategory = getBiggestCategory(overview);
  const topSubscription = getTopSubscription(overview);

  return [
    `Your current FinTwin credit score is ${overview?.creditScore ?? 0} (${overview?.creditScoreRating ?? 'Unavailable'}).`,
    savingsRatio < 20
      ? `A major reason it is being held back is low savings discipline at ${savingsRatio}%.`
      : `Savings discipline is helping at ${savingsRatio}%.`,
    stability < 65
      ? `Spending stability is only ${stability}%, which signals irregular cash-flow behavior.`
      : `Spending stability is ${stability}%, so volatility is not the main drag.`,
    biggestCategory
      ? `${biggestCategory.category} makes up ${biggestCategory.share}% of your spending, which creates concentration risk.`
      : 'Category concentration cannot be measured yet because there is not enough spending data.',
    topSubscription
      ? `Your top recurring bill is ${topSubscription.serviceName} at ${formatCurrency(Number(topSubscription.monthlyAmount))}/month, which also limits score headroom.`
      : 'Recurring bills are not the main problem right now.',
  ].join(' ');
};

const generateReply = (rawQuestion: string, overview: DashboardOverviewPayload | null, loading: boolean) => {
  if (loading || !overview) {
    return 'I am syncing your dashboard right now. Ask again in a moment and I can answer with your latest FinTwin metrics.';
  }

  const question = rawQuestion.toLowerCase();
  const savingsRatio = Math.round(Number(overview.savingsRatio || 0) * 100);
  const stability = Math.round(Number(overview.spendingStability || 0) * 100);
  const biggestCategory = getBiggestCategory(overview);
  const subscriptions = overview.subscriptions || [];
  const topSubscription = getTopSubscription(overview);
  const totalSubscriptionSpend = subscriptions.reduce((sum, sub) => sum + Number(sub.monthlyAmount || 0), 0);

  if (
    question.includes('increase my financial health score') ||
    question.includes('improve my financial health score') ||
    question.includes('increase my score') ||
    question.includes('improve my score') ||
    question.includes('financial health score')
  ) {
    return buildHealthScoreAdvice(overview);
  }

  if (question.includes('netflix')) {
    return buildNetflixAdvice(overview);
  }

  if (
    question.includes('why is my credit score low') ||
    question.includes('why my credit score low') ||
    question.includes('credit score low')
  ) {
    return buildCreditScoreAdvice(overview);
  }

  if (question.includes('feature') || question.includes('what can') || question.includes('fintwin')) {
    return [
      'FinTwin gives you a complete money command center:',
      '- Live dashboard for spending, score, and trends',
      '- Credit score and financial habit score tracking',
      '- Subscription detection with waste analysis',
      '- Category spending insights and top transaction trends',
      '- AI-style rule-based recommendations from your uploaded data',
    ].join('\n');
  }

  if (question.includes('credit score') || question.includes('credit')) {
    return [
      `Your current FinTwin credit score is ${overview.creditScore} (${overview.creditScoreRating}).`,
      `In FinTwin, this score is behavior-driven and influenced by savings discipline (${savingsRatio}%), spending stability (${stability}%), and recurring cost pressure.`,
      topSubscription
        ? `Your highest recurring charge is ${topSubscription.serviceName} at ${formatCurrency(Number(topSubscription.monthlyAmount))}/month, which can affect score headroom.`
        : 'You have low recurring burden right now, which supports healthier score behavior.',
    ].join(' ');
  }

  if (question.includes('habit score') || question.includes('financial habit') || question.includes('habit')) {
    return [
      `Your financial habit score is ${overview.financialHabitScore}/100 (${overview.habitScoreRating}).`,
      `Savings ratio is ${savingsRatio}% and stability is ${stability}%.`,
      overview.financialHabitScore >= 70
        ? 'You are in a strong zone. Keep subscription waste low and maintain current spending discipline.'
        : 'To improve quickly, trim one recurring subscription and reduce your largest variable spending category by 10-15%.',
    ].join(' ');
  }

  if (question.includes('subscription') || question.includes('recurring') || question.includes('waste')) {
    if (!subscriptions.length) {
      return 'No recurring subscriptions were detected yet. Upload a broader transaction history to unlock subscription analysis and waste detection.';
    }

    return [
      `I found ${subscriptions.length} recurring subscriptions totaling ${formatCurrency(totalSubscriptionSpend)}/month.`,
      `Estimated subscription waste is ${formatCurrency(Number(overview.subscriptionWaste || 0))}/month.`,
      topSubscription
        ? `Your top cost driver is ${topSubscription.serviceName} at ${formatCurrency(Number(topSubscription.monthlyAmount))}/month.`
        : '',
    ].join(' ');
  }

  if (question.includes('spending') || question.includes('insight') || question.includes('category') || question.includes('where')) {
    if (!biggestCategory) {
      return 'I do not have category-level spending yet. Upload transactions to generate category and trend insights.';
    }

    return [
      `Monthly spending is ${formatCurrency(Number(overview.monthlySpending || 0))}.`,
      `Largest category is ${biggestCategory.category} at ${formatCurrency(biggestCategory.value)} (${biggestCategory.share}% of spend).`,
      savingsRatio >= 20
        ? `Savings ratio is ${savingsRatio}% which is healthy.`
        : `Savings ratio is ${savingsRatio}%. Target at least 20% by reducing ${biggestCategory.category.toLowerCase()} spend first.`,
    ].join(' ');
  }

  return [
    'I can help with these topics:',
    '- FinTwin features',
    '- Credit score calculation',
    '- Financial habit score',
    '- Subscription analysis',
    '- Spending insights',
    'Try asking: "How is my credit score calculated?"',
  ].join('\n');
};

const AIAssistantWidget = ({ overview, loading, openSignal }: AIAssistantWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi, I am your AI Financial Coach. Ask how to increase your score, whether to cancel Netflix, or why your credit score is low.',
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (openSignal && openSignal > 0) {
      setIsOpen(true);
    }
  }, [openSignal]);

  const sendQuestion = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setMessages((prev) => {
      const userMessage: ChatMessage = { id: prev.length + 1, role: 'user', content: trimmedQuestion };
      const assistantMessage: ChatMessage = {
        id: prev.length + 2,
        role: 'assistant',
        content: generateReply(trimmedQuestion, overview, loading),
      };

      return [...prev, userMessage, assistantMessage];
    });
    setInput('');
  };

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    sendQuestion(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      {isOpen ? (
        <div className="w-[92vw] max-w-sm h-[70vh] max-h-[560px] rounded-2xl border border-border/70 bg-[linear-gradient(160deg,hsl(0_0%_100%),hsl(220_20%_98%))] shadow-[0_24px_80px_hsl(239_84%_67%/0.28)] backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/70 bg-[linear-gradient(120deg,hsl(239_84%_67%/.16),hsl(160_84%_39%/.10))]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Financial Coach</p>
                  <p className="text-[11px] text-muted-foreground">Bottom-right money guidance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground hover:text-foreground"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[radial-gradient(circle_at_top_right,hsl(239_84%_67%/.07),transparent_45%)]">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendQuestion(question)}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-primary/10"
                >
                  {question}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border/70 text-card-foreground rounded-bl-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSend} className="p-3 border-t border-border/70 bg-background/95">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-2 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your score, Netflix, or credit profile..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-[linear-gradient(120deg,hsl(239_84%_67%),hsl(200_84%_54%))] text-white px-4 py-3 shadow-[0_16px_48px_hsl(239_84%_67%/0.38)] hover:scale-[1.02] transition-transform"
        aria-label="Open AI Financial Coach"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Coach Chat</span>
        <Sparkles className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AIAssistantWidget;