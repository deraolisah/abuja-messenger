import { CircleCheck, Clock3, Info } from "lucide-react";

const iconMap = {
  ready: CircleCheck,
  pending: Clock3,
  info: Info,
} as const;

export function StatusPill({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: keyof typeof iconMap;
}) {
  const Icon = iconMap[tone];
  return (
    <span className={`status-pill status-pill-${tone}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {children}
    </span>
  );
}
