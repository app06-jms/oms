import { Construction } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import type { NavGroup, NavItem } from '@/config/navigation';

interface PlaceholderPageProps {
  group: NavGroup;
  item: NavItem;
}

export function PlaceholderPage({ group, item }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading groupTitle={group.title} title={item.title} />

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-primary">
          <Construction className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-base font-medium text-foreground">Trang đang được xây dựng</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nội dung của {item.title.toLowerCase()} sẽ được bổ sung trong bước tiếp theo.
        </p>
      </div>
    </div>
  );
}
