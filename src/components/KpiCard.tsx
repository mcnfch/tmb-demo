type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function KpiCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="text-sm text-black/60 dark:text-white/60">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle && (
        <div className="text-xs mt-1 text-black/50 dark:text-white/50">{subtitle}</div>
      )}
    </div>
  );
}

