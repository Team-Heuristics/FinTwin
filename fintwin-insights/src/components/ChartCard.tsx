interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, children }: ChartCardProps) => {
  return (
    <div className="chart-card animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-6">{title}</h3>
      {children}
    </div>
  );
};

export default ChartCard;
