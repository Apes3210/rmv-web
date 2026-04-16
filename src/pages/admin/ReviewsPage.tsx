import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { extractItems } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/lib/types';
import { CollectionToolbar } from '@/components/shared/CollectionToolbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageError } from '@/components/shared/PageError';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  // Fetch completed projects which usually have reviews
  const { data, isLoading, error, refetch } = useProjects({ status: 'completed', limit: '1000' });

  const projectList = extractItems<Project>(data);

  // Filter projects that actually have a customer review with a rating
  const reviewsList = projectList.filter(
    (p) => p.customerReview && p.customerReview.rating && p.customerReview.rating > 0
  );

  // Simple client-side search filtering
  const filteredReviews = reviewsList.filter((p) => {
    // text search
    if (search) {
      const s = search.toLowerCase();
      const customer = typeof p.customerId === 'object' ? `${p.customerId.firstName} ${p.customerId.lastName}` : '';
      if (!p.title.toLowerCase().includes(s) && !customer.toLowerCase().includes(s) && !(p.customerReview?.comment || '').toLowerCase().includes(s)) {
        return false;
      }
    }
    
    // category filter
    if (filter === 'with_comments' && !p.customerReview?.comment) return false;

    return true;
  });

  if (error) return <PageError message="Failed to load reviews" onRetry={refetch} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171b21] dark:text-slate-100">Customer Reviews</h1>
          <p className="mt-1 text-sm text-[#616a74] dark:text-slate-400">
            View feedback and ratings from customers on completed projects.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <CollectionToolbar
        title="Find specific reviews"
        description="Search by project name, customer, or keywords in the comment."
        searchPlaceholder="Search reviews"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { value: 'all', label: 'All Reviews' },
          { value: 'with_comments', label: 'With Comments' },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Reviews List */}
      {isLoading ? (
        <div className="metal-panel hidden overflow-hidden rounded-[1.5rem] md:block p-4 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No reviews found"
          description="There are currently no reviews matching your search criteria."
        />
      ) : (
        <div className="metal-panel overflow-hidden rounded-[1.5rem]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#e1e6ec] dark:border-slate-700">
                <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-[#68727d]">Project / Customer</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Rating</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Comment</TableHead>
                <TableHead className="py-5 pr-5 text-xs font-semibold uppercase tracking-wider text-[#68727d] text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((project) => {
                const customer = typeof project.customerId === 'object'
                  ? `${project.customerId.firstName} ${project.customerId.lastName}`
                  : 'Customer';
                
                return (
                  <TableRow
                    key={project._id}
                    className="group border-b border-[#e1e6ec] dark:border-slate-700 transition-colors hover:bg-white/45 dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="pl-5 py-5 max-w-[200px]">
                      <p className="truncate text-[15px] font-medium text-[#171b21] dark:text-slate-100">
                        {project.title}
                      </p>
                      <p className="truncate text-xs text-[#68727d] dark:text-slate-400 mt-0.5">
                        {customer}
                      </p>
                    </TableCell>

                    <TableCell className="py-5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (project.customerReview?.rating || 0)
                                ? 'fill-[#FFD700] text-[#FFD700]'
                                : 'fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-5">
                      {project.customerReview?.comment ? (
                        <p className="text-sm text-[#414a54] dark:text-slate-300 italic line-clamp-3">
                          {project.customerReview.comment}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-slate-500 italic">No comment provided</span>
                      )}
                    </TableCell>

                    <TableCell className="py-5 pr-5 text-right whitespace-nowrap">
                      {project.customerReview?.submittedAt ? (
                        <span className="text-sm text-[#616a74] dark:text-slate-400">
                          {new Date(project.customerReview.submittedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="border-t border-[#dde3ea] dark:border-slate-700 bg-white/25 dark:bg-slate-800/80 px-5 py-3">
            <p className="text-xs text-[#68727d] dark:text-slate-400">
              {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
