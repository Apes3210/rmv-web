import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, Pencil, XCircle, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { extractErrorMessage, extractItems } from '@/lib/utils';
import { resolveBlockedAction, type BlockedActionInfo } from '@/lib/blocked-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageError } from '@/components/shared/PageError';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CollectionToolbar } from '@/components/shared/CollectionToolbar';
import { BlockedActionPrompt } from '@/components/shared/BlockedActionPrompt';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useMyRefundRequests,
  useUpdateMyRefundRequest,
  useCancelMyRefundRequest,
} from '@/hooks/useRefunds';
import type { RefundRequest } from '@/lib/types';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function MyRefundsPage() {
  const { data, isLoading, isError, refetch } = useMyRefundRequests(true);
  const updateMutation = useUpdateMyRefundRequest();
  const cancelMutation = useCancelMyRefundRequest();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editing, setEditing] = useState<RefundRequest | null>(null);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'gcash' | 'bank_transfer'>('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [blockedAction, setBlockedAction] = useState<BlockedActionInfo | null>(null);

  const requests = extractItems<RefundRequest>(data);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [
        r.reason,
        r.accountName,
        r.accountNumber,
        r.bankName,
        r.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [requests, statusFilter, searchQuery]);

  const startEdit = (refund: RefundRequest) => {
    setBlockedAction(null);
    setEditing(refund);
    setReason(refund.reason);
    setRefundMethod(refund.refundMethod);
    setAccountName(refund.accountName);
    setAccountNumber(refund.accountNumber);
    setBankName(refund.bankName || '');
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        id: editing._id,
        reason: reason.trim(),
        refundMethod,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ...(refundMethod === 'bank_transfer' ? { bankName: bankName.trim() } : {}),
      });
      toast.success('Refund request updated');
      setEditing(null);
    } catch (err) {
      setBlockedAction(resolveBlockedAction(err));
      toast.error(extractErrorMessage(err, 'Failed to update refund request'));
    }
  };

  const submitCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id: cancelDialog.id, reason: cancelReason.trim() || undefined });
      toast.success('Refund request cancelled');
      setCancelDialog({ open: false, id: '' });
      setCancelReason('');
    } catch (err) {
      setBlockedAction(resolveBlockedAction(err));
      toast.error(extractErrorMessage(err, 'Failed to cancel refund request'));
    }
  };

  if (isError) return <PageError onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="metal-panel-strong rounded-[1.75rem] p-5">
        <div className="flex items-start gap-4">
          <div className="silver-sheen flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#2b3138] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_24px_rgba(0,0,0,0.18)]">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-slate-50">My Refund Requests</h1>
            <p className="mt-1 text-sm text-[#616a74] dark:text-slate-300">Track status, update pending details, or cancel before finance review.</p>
          </div>
        </div>
      </div>

      <CollectionToolbar
        title="Find your request quickly"
        description="Filter by status or search your reason/account details."
        searchPlaceholder="Search reason or account..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {blockedAction && (
        <BlockedActionPrompt
          title={blockedAction.title}
          reason={blockedAction.reason}
          actionLabel={blockedAction.actionLabel}
          actionPath={blockedAction.actionPath}
        />
      )}

      {isLoading ? (
        <Card className="metal-panel rounded-xl">
          <CardContent className="p-6 text-sm text-[#616a74] dark:text-slate-300">Loading refund requests...</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-8 w-8" />}
          title="No refund requests found"
          description="You can request refunds from appointment details when eligible."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const apptId = typeof r.appointmentId === 'string' ? r.appointmentId : r.appointmentId._id;
            return (
              <Card key={r._id} className="metal-panel rounded-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base text-[#1d1d1f] dark:text-slate-100">{formatCurrency(r.amount)}</CardTitle>
                    <StatusBadge status={r.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <p className="text-[#3a3a3e] dark:text-slate-200"><span className="text-[#6e6e73] dark:text-slate-300">Method:</span> {r.refundMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
                    <p className="text-[#3a3a3e] dark:text-slate-200"><span className="text-[#6e6e73] dark:text-slate-300">Account:</span> {r.accountName} - {r.accountNumber}</p>
                    {r.bankName && <p className="text-[#3a3a3e] dark:text-slate-200"><span className="text-[#6e6e73] dark:text-slate-300">Bank:</span> {r.bankName}</p>}
                    <p className="text-[#3a3a3e] dark:text-slate-200"><span className="text-[#6e6e73] dark:text-slate-300">Requested:</span> {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>

                  <p className="text-[#3a3a3e] dark:text-slate-200"><span className="text-[#6e6e73] dark:text-slate-300">Reason:</span> {r.reason}</p>

                  {r.timeline && r.timeline.length > 0 && (
                    <div className="rounded-xl border border-[#e5e7eb] p-3 dark:border-slate-700">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6e6e73] dark:text-slate-300">Timeline</p>
                      <div className="space-y-2">
                        {r.timeline.map((item) => (
                          <div key={`${r._id}-${item.key}`} className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-3.5 w-3.5 text-[#86868b]" />
                            <div>
                              <p className="text-xs font-medium text-[#1d1d1f] dark:text-slate-100">{item.label}</p>
                              <p className="text-xs text-[#86868b] dark:text-slate-400">{format(new Date(item.at), 'MMM d, yyyy h:mm a')}</p>
                              {item.note && <p className="text-xs text-[#6e6e73] dark:text-slate-300">{item.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(r.status === 'denied' && r.denialReason) && (
                    <p className="rounded-lg border border-[#cb8b86] bg-[linear-gradient(180deg,#fbefed_0%,#efd7d4_100%)] p-2 text-xs text-[#87544f] dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
                      Denial reason: {r.denialReason}
                    </p>
                  )}

                  {(r.status === 'cancelled' && r.cancelledReason) && (
                    <p className="rounded-lg border border-[#c8ccd3] bg-[linear-gradient(180deg,#f5f7f9_0%,#e7ebef_100%)] p-2 text-xs text-[#5b6470] dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      Cancellation note: {r.cancelledReason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f0f2] pt-2 dark:border-slate-700">
                    <Link to={`/appointments/${apptId}`} className="text-xs text-blue-600 hover:underline dark:text-blue-300">
                      View Appointment
                    </Link>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => startEdit(r)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl border-[#cb8b86] text-[#87544f] hover:bg-[linear-gradient(180deg,#fbefed_0%,#efd7d4_100%)] dark:border-red-700/50 dark:text-red-200 dark:hover:bg-red-900/40"
                          onClick={() => setCancelDialog({ open: true, id: r._id })}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Cancel Request
                        </Button>
                      </div>
                    )}
                  </div>

                  {r.status !== 'pending' && (
                    <BlockedActionPrompt
                      className="mt-1"
                      title="Action unavailable"
                      reason={`This request is currently ${r.status}. Only pending requests can be edited or cancelled.`}
                      actionLabel="View refund help"
                      actionPath="/help/payments-refunds/refunds#checklist"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="metal-panel max-w-xl rounded-2xl dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-[#1d1d1f] dark:text-slate-100">Edit Refund Request</DialogTitle>
            <DialogDescription className="text-[#6e6e73] dark:text-slate-300">
              Update account details while this request is still pending.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="my-refund-reason">Reason</Label>
              <Textarea id="my-refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="metal-input min-h-[80px] rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={refundMethod === 'gcash' ? 'default' : 'outline'} className="rounded-lg" onClick={() => setRefundMethod('gcash')}>
                GCash
              </Button>
              <Button type="button" size="sm" variant={refundMethod === 'bank_transfer' ? 'default' : 'outline'} className="rounded-lg" onClick={() => setRefundMethod('bank_transfer')}>
                Bank Transfer
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="my-refund-account-name">Account Name</Label>
                <Input id="my-refund-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="metal-input rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="my-refund-account-number">{refundMethod === 'gcash' ? 'GCash Number' : 'Account Number'}</Label>
                <Input id="my-refund-account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="metal-input rounded-xl" />
              </div>
            </div>
            {refundMethod === 'bank_transfer' && (
              <div className="space-y-1.5">
                <Label htmlFor="my-refund-bank-name">Bank Name</Label>
                <Input id="my-refund-bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="metal-input rounded-xl" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">Cancel</Button>
            <Button
              variant="prominent"
              onClick={submitEdit}
              className="rounded-xl"
              disabled={
                updateMutation.isPending
                || !reason.trim()
                || !accountName.trim()
                || !accountNumber.trim()
                || (refundMethod === 'bank_transfer' && !bankName.trim())
              }
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialog({ open: false, id: '' });
            setCancelReason('');
          }
        }}
      >
        <DialogContent className="metal-panel max-w-md rounded-2xl dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-[#1d1d1f] dark:text-slate-100">Cancel Refund Request</DialogTitle>
            <DialogDescription className="text-[#6e6e73] dark:text-slate-300">
              This will remove it from cashier pending review. You can add an optional note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="my-refund-cancel-reason">Optional note</Label>
            <Textarea
              id="my-refund-cancel-reason"
              placeholder="Tell us why you are cancelling this request"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="metal-input min-h-[80px] rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, id: '' })} className="rounded-xl">Back</Button>
            <Button variant="destructive" onClick={submitCancel} className="rounded-xl" disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
