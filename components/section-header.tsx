import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="h-6 w-1 rounded-full bg-primary" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground ml-4">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
