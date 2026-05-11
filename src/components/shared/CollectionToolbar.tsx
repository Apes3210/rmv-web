import { Filter, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CollectionToolbarFilter {
  label: string;
  value: string;
}

interface CollectionToolbarProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: CollectionToolbarFilter[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  filterGroupLabel?: string;
  className?: string;
  searchWidthClassName?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export function CollectionToolbar({
  title,
  description,
  searchPlaceholder,
  searchAriaLabel,
  searchValue,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  filterGroupLabel = 'List filters',
  className,
  searchWidthClassName,
  action,
  footer,
}: CollectionToolbarProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[2rem] border border-[#cfd6df]/80 bg-[radial-gradient(circle_at_16%_0%,rgba(96,165,250,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,247,251,0.98)_48%,rgba(229,235,243,0.96)_100%)] p-6 shadow-[0_24px_60px_rgba(71,85,105,0.14)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(7,10,15,0.98)_0%,rgba(17,23,33,0.98)_45%,rgba(41,51,68,0.96)_100%)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-7',
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="silver-sheen flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[#2b3138] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_24px_rgba(0,0,0,0.18)]">
              <Filter className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-[26px] font-semibold tracking-tight text-[#171b21] dark:text-[#f4f7fb] sm:text-[28px]">{title}</p>
              <p className="max-w-2xl text-sm leading-6 text-[#53606d] dark:text-[#b8c1cc] sm:text-[14px]">{description}</p>
            </div>
          </div>
          {action}
        </div>

        <div className={cn('relative w-full', searchWidthClassName)}>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#586173]" />
          <input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={searchAriaLabel ?? searchPlaceholder}
            className="h-14 w-full rounded-2xl border border-[#cbd5e1] bg-white pl-14 pr-5 text-[15px] font-medium text-[#1b2230] outline-none transition-shadow placeholder:text-[#7b8796] focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(132,168,255,0.16)] dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:placeholder:text-slate-500"
          />
        </div>

        <div
          className="flex flex-wrap gap-3"
          role="group"
          aria-label={filterGroupLabel}
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.value || '__all'}
              onClick={() => onFilterChange(filter.value)}
              aria-pressed={activeFilter === filter.value}
              className={cn(
                'inline-flex h-14 cursor-pointer items-center gap-3 whitespace-nowrap rounded-2xl border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
                activeFilter === filter.value
                  ? 'border-[#dbe8ff] bg-[#f4f7ff] text-[#17315d] shadow-[inset_0_-2px_0_rgba(84,128,219,0.35)] dark:border-slate-500 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-[#cfd6df] bg-white/60 text-[#4c5968] hover:border-blue-300 hover:bg-white hover:text-[#172033] dark:border-white/10 dark:bg-white/5 dark:text-[#d8e0ea] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {footer}
      </div>
    </div>
  );
}
