export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-felt p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-steel">{label}</p>
      <p className="mt-2 text-2xl font-black text-limebet">{value}</p>
      {detail ? <p className="mt-1 text-xs text-steel">{detail}</p> : null}
    </div>
  );
}
