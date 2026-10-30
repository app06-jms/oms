import { CalendarCheck, CalendarDays, Wallet, type LucideIcon } from 'lucide-react';
import type { LeaveKpis } from '@/features/leave/leaveRules';

interface LeaveKpiCardsProps {
  kpis: LeaveKpis;
  isLoading: boolean;
}

interface KpiCard {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}

function formatDays(value: number): string {
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ngày`;
}

export function LeaveKpiCards({ kpis, isLoading }: LeaveKpiCardsProps) {
  const cards: KpiCard[] = [
    { label: 'Tổng quỹ phép', value: kpis.totalDays, icon: Wallet, tone: 'bg-[#4F7284]/10 text-[#4F7284]' },
    { label: 'Đã sử dụng (Ca P)', value: kpis.usedDays, icon: CalendarDays, tone: 'bg-pending/10 text-pending' },
    { label: 'Quỹ phép còn lại', value: kpis.remainingDays, icon: CalendarCheck, tone: 'bg-success/10 text-success' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#5C6670]">{card.label}</span>
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-[#1F2A30]">
                {isLoading ? '--' : formatDays(card.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
