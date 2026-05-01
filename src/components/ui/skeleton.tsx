import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[color:var(--color-muted)]/55 dark:bg-white/10', className)}
      {...props}
    />
  );
}

export { Skeleton };
