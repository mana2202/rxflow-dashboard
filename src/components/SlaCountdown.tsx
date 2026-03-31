export function SlaCountdown({ hours }: { hours: number }) {
  if (hours <= 0) {
    return <span className="text-xs font-mono font-semibold text-danger">BREACHED</span>;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const urgent = hours <= 4;
  const warn = hours <= 12;
  return (
    <span className={`text-xs font-mono font-semibold ${urgent ? 'text-danger' : warn ? 'text-warning' : 'text-muted-foreground'}`}>
      {h}h {m}m
    </span>
  );
}
